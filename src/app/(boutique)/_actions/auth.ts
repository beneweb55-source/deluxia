'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  createSession,
  destroySession,
  getSessionUser,
  hashPassword,
  purgeExpiredSessions,
  verifyPassword,
} from '@/lib/auth';
import {
  createCustomerSession,
  destroyCustomerSession,
  getSessionCustomer,
  purgeExpiredCustomerSessions,
} from '@/lib/customerAuth';
import { normalizePhone } from '@/lib/order-schema';
import { clearProfileHint, setProfileHint } from '@/lib/session-hint';

export interface AuthState {
  error?: string;
  success?: string;
}

/**
 * Empreinte factice, de forme valide mais impossible à satisfaire.
 *
 * Elle est vérifiée quand aucun compte ne correspond, pour que la réponse prenne
 * le même temps qu'une vraie vérification. Sans cela, un échec instantané
 * trahirait qu'aucun compte n'existe avec cet identifiant, ce qui permettrait
 * d'énumérer la clientèle au chronomètre.
 */
const DUMMY_HASH = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;

/** Message unique pour tous les échecs : ne jamais dire ce qui a échoué. */
const GENERIC_LOGIN_ERROR = 'Identifiants incorrects.';

/** Destination sûre après connexion : uniquement un chemin interne. */
function safeRedirect(value: FormDataEntryValue | null, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  // Un `//` initial désignerait un autre domaine : c'est une redirection ouverte.
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Connexion
// ─────────────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifiant requis').max(180),
  password: z.string().min(1, 'Mot de passe requis').max(200),
});

/**
 * Connexion unifiée — un seul formulaire pour la gérante et pour les clientes.
 *
 * L'identifiant peut être une adresse e-mail ou un numéro de téléphone. Les
 * comptes d'administration sont cherchés en premier, uniquement sur l'e-mail ;
 * les comptes clientes acceptent les deux, le téléphone étant normalisé pour
 * qu'un numéro saisi avec des espaces ou l'indicatif +213 fonctionne.
 */
export async function loginUnified(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get('identifier'),
    password: formData.get('password'),
  });

  if (!parsed.success) return { error: GENERIC_LOGIN_ERROR };

  const { identifier, password } = parsed.data;
  const email = identifier.toLowerCase();
  const phone = normalizePhone(identifier);

  const headerList = await headers();
  const meta = {
    userAgent: headerList.get('user-agent'),
    ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  };

  // Ces deux variables portent la décision hors du bloc de vérification :
  // `redirect()` lève une exception de contrôle de flux, l'appeler à l'intérieur
  // d'un try/catch de Prisma la ferait passer pour une erreur.
  let admin: { id: string; name: string } | null = null;
  let customer: { id: string; name: string } | null = null;

  if (identifier.includes('@')) {
    const found = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, name: true, passwordHash: true, isActive: true },
    });

    if (found?.isActive && (await verifyPassword(password, found.passwordHash))) {
      admin = { id: found.id, name: found.name };
    }
  }

  if (!admin) {
    const found = await prisma.customer.findFirst({
      where: { OR: [{ email }, { phone }] },
      select: { id: true, firstName: true, passwordHash: true },
    });

    const valid = await verifyPassword(password, found?.passwordHash ?? DUMMY_HASH);

    // `passwordHash` nul = fiche créée automatiquement lors d'une commande
    // passée sans compte. Elle n'a jamais eu de mot de passe : la connexion
    // échoue, et l'inscription proposera de revendiquer le numéro.
    if (found?.passwordHash && valid) customer = { id: found.id, name: found.firstName };
  }

  if (!admin && !customer) return { error: GENERIC_LOGIN_ERROR };

  if (admin) {
    const expiresAt = await createSession(admin.id, meta);
    await setProfileHint({ role: 'ADMIN', name: admin.name }, expiresAt);
    await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
    await purgeExpiredSessions();
    redirect(safeRedirect(formData.get('suite'), '/admin'));
  }

  const expiresAt = await createCustomerSession(customer!.id, meta);
  await setProfileHint({ role: 'CUSTOMER', name: customer!.name }, expiresAt);
  await purgeExpiredCustomerSessions();
  redirect(safeRedirect(formData.get('suite'), '/mon-compte'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Inscription
// ─────────────────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom est trop court.').max(60),
  lastName: z.string().trim().min(2, 'Le nom est trop court.').max(60),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((value) => /^0[1-9]\d{7,8}$/.test(value), {
      message: 'Numéro invalide. Exemple : 07 72 61 05 46.',
    }),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(180),
  password: z
    .string()
    .min(8, 'Le mot de passe doit faire au moins 8 caractères.')
    .max(200),
});

/**
 * Création d'un compte cliente.
 *
 * Le cas important est celui d'une cliente qui a déjà commandé sans compte :
 * une fiche existe alors à son numéro, créée automatiquement au passage de la
 * commande, mais sans mot de passe. Elle peut la revendiquer en s'inscrivant
 * avec le même numéro — sinon ce numéro serait définitivement inutilisable, et
 * elle perdrait l'accès à son propre historique.
 *
 * Aucun compte d'administration ne peut être créé ici : la gérante est créée par
 * le script d'initialisation (`npm run db:seed`). Permettre à un visiteur de
 * devenir administrateur, même sous condition, serait une porte ouverte.
 */
export async function registerUnified(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Données invalides.' };
  }

  const data = parsed.data;

  const [byPhone, byEmail] = await Promise.all([
    prisma.customer.findUnique({
      where: { phone: data.phone },
      select: { id: true, passwordHash: true },
    }),
    prisma.customer.findUnique({ where: { email: data.email }, select: { id: true } }),
  ]);

  if (byEmail && byEmail.id !== byPhone?.id) {
    return { error: 'Cette adresse e-mail est déjà utilisée par un autre compte.' };
  }

  if (byPhone?.passwordHash) {
    return { error: 'Un compte existe déjà avec ce numéro. Connectez-vous.' };
  }

  const passwordHash = await hashPassword(data.password);

  const customerId = byPhone
    ? (
        await prisma.customer.update({
          where: { id: byPhone.id },
          data: {
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          },
          select: { id: true },
        })
      ).id
    : (
        await prisma.customer.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            passwordHash,
          },
          select: { id: true },
        })
      ).id;

  // Connexion immédiate : redemander de se connecter juste après avoir choisi
  // un mot de passe est une friction gratuite.
  const headerList = await headers();
  const expiresAt = await createCustomerSession(customerId, {
    userAgent: headerList.get('user-agent'),
    ip: headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  });

  await setProfileHint({ role: 'CUSTOMER', name: data.firstName }, expiresAt);

  redirect('/mon-compte');
}

// ─────────────────────────────────────────────────────────────────────────────
// Session courante
// ─────────────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  role: 'ADMIN' | 'CUSTOMER';
  name: string;
}

/** Identité de la personne connectée, ou `null`. Utilisée par l'en-tête. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const admin = await getSessionUser();
  if (admin) return { role: 'ADMIN', name: admin.name };

  const customer = await getSessionCustomer();
  if (customer) return { role: 'CUSTOMER', name: customer.firstName };

  return null;
}

/** Déconnexion, quel que soit le type de session ouverte. */
export async function logoutUnified(): Promise<void> {
  // Les deux sessions sont détruites sans condition : si les deux cookies
  // coexistent — la gérante teste sa boutique depuis son propre navigateur —
  // une déconnexion partielle laisserait une session fantôme.
  await destroySession();
  await destroyCustomerSession();
  await clearProfileHint();
  redirect('/');
}
