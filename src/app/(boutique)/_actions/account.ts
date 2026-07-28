'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth';
import {
  destroyOtherCustomerSessions,
  getCustomerSessionExpiry,
  getSessionCustomer,
} from '@/lib/customerAuth';
import { setProfileHint } from '@/lib/session-hint';
import { normalizePhone } from '@/lib/order-schema';

export interface AccountState {
  error?: string;
  success?: string;
}

/**
 * Actions de l'espace client.
 *
 * Chacune relit la session : une Server Action est une route HTTP à part
 * entière, et le fait que le formulaire qui l'appelle soit derrière une page
 * protégée ne protège pas l'action elle-même. Aucune ne prend d'identifiant
 * client en paramètre — il vient toujours de la session, sinon n'importe qui
 * pourrait modifier la fiche d'une autre cliente.
 */

const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom est trop court.').max(60),
  lastName: z.string().trim().min(2, 'Le nom est trop court.').max(60),
  email: z
    .union([z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(180), z.literal('')])
    .transform((value) => (value === '' ? null : value)),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^0[1-9]\d{7,8}$/.test(value), {
      message: 'Numéro invalide. Exemple : 07 72 61 05 46.',
    }),
  wilayaCode: z.coerce.number().int().min(0).max(58).optional(),
  commune: z.string().trim().max(80).optional(),
  address: z.string().trim().max(300).optional(),
});

export async function updateCustomerProfile(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const customer = await getSessionCustomer();
  if (!customer) return { error: 'Votre session a expiré. Reconnectez-vous.' };

  const parsed = profileSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email') ?? '',
    phone: formData.get('phone'),
    wilayaCode: formData.get('wilayaCode') || undefined,
    commune: formData.get('commune') || undefined,
    address: formData.get('address') || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  const data = parsed.data;

  try {
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        // 0 signifie « aucune wilaya choisie » dans le sélecteur.
        wilayaCode: data.wilayaCode && data.wilayaCode > 0 ? data.wilayaCode : null,
        commune: data.commune || null,
        address: data.address || null,
      },
    });
  } catch {
    // Seules contraintes uniques sur Customer : le téléphone et l'e-mail.
    return { error: 'Ce numéro ou cette adresse e-mail est déjà utilisé par un autre compte.' };
  }

  // Le prénom s'affiche dans l'en-tête : l'indice de session doit suivre le
  // nouveau prénom — mais sans jamais vivre plus longtemps que la session réelle.
  // On le cale donc sur l'expiration effective de la session en cours, et non sur
  // une date figée « maintenant + 30 j » qui la dépasserait.
  const expiry = await getCustomerSessionExpiry();
  if (expiry) {
    await setProfileHint({ role: 'CUSTOMER', name: data.firstName }, expiry);
  }

  revalidatePath('/mon-compte');
  return { success: 'Vos informations sont enregistrées.' };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Mot de passe actuel requis.'),
    next: z.string().min(8, 'Le nouveau mot de passe doit faire au moins 8 caractères.').max(200),
    confirm: z.string(),
  })
  .refine((data) => data.next === data.confirm, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirm'],
  });

export async function changeCustomerPassword(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const session = await getSessionCustomer();
  if (!session) return { error: 'Votre session a expiré. Reconnectez-vous.' };

  const parsed = passwordSchema.safeParse({
    current: formData.get('current'),
    next: formData.get('next'),
    confirm: formData.get('confirm'),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: { passwordHash: true },
  });

  if (!customer?.passwordHash || !(await verifyPassword(parsed.data.current, customer.passwordHash))) {
    return { error: 'Mot de passe actuel incorrect.' };
  }

  await prisma.customer.update({
    where: { id: session.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });

  await destroyOtherCustomerSessions(session.id);

  return { success: 'Mot de passe modifié. Vos autres appareils ont été déconnectés.' };
}
