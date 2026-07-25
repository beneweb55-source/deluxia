'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword, requireAdmin, verifyPassword } from '@/lib/auth';
import { WILAYAS } from '@/data/wilayas';
import type { ActionState } from '@/app/(admin)/admin/_actions/catalogue';

/**
 * Actions de gestion — commandes, livraison, messages, paramètres.
 * Comme pour le catalogue, chaque action revérifie l'authentification.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Commandes
// ─────────────────────────────────────────────────────────────────────────────

const STATUSES = [
  'EN_ATTENTE',
  'CONFIRMEE',
  'PREPARATION',
  'EXPEDIEE',
  'LIVREE',
  'ANNULEE',
] as const;

/**
 * Change le statut d'une commande et journalise l'événement.
 *
 * Règle métier importante : annuler une commande **remet le stock en rayon**.
 * Sans cela, les articles d'une commande annulée resteraient invendables, et le
 * stock affiché finirait par diverger du stock réel.
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<void> {
  const admin = await requireAdmin();

  if (!STATUSES.includes(status)) return;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        status: true,
        customerId: true,
        total: true,
        items: { select: { productId: true, size: true, color: true, quantity: true } },
      },
    });

    if (!order || order.status === status) return;

    const now = new Date();

    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'CONFIRMEE' ? { confirmedAt: now } : {}),
        ...(status === 'EXPEDIEE' ? { shippedAt: now } : {}),
        ...(status === 'LIVREE' ? { deliveredAt: now } : {}),
      },
    });

    await tx.orderStatusEvent.create({
      data: { orderId, status, note: note?.slice(0, 300) ?? null, author: admin.name },
    });

    // Réintégration du stock et déduction totalSpent à l'annulation
    if (status === 'ANNULEE' && order.status !== 'ANNULEE') {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.productVariant.updateMany({
          where: { productId: item.productId, size: item.size, color: item.color },
          data: { stock: { increment: item.quantity } },
        });
      }
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalSpent: { decrement: order.total } },
        });
      }
    }
    // Re-déduction du stock et ré-incrémentation totalSpent si on annule l'annulation
    else if (status !== 'ANNULEE' && order.status === 'ANNULEE') {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.productVariant.updateMany({
          where: { productId: item.productId, size: item.size, color: item.color },
          data: { stock: { decrement: item.quantity } },
        });
      }
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalSpent: { increment: order.total } },
        });
      }
    }
  });

  revalidatePath('/admin/commandes');
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath('/admin');
}

/** Enchaînement normal d'une commande, hors annulation. */
const FLOW = ['EN_ATTENTE', 'CONFIRMEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'] as const;

/**
 * Fait passer une commande à l'étape suivante.
 *
 * C'est le geste le plus répété de la journée : depuis le tableau, un seul clic
 * suffit pour confirmer, puis préparer, puis expédier. Sans cela il faudrait
 * ouvrir chaque commande, ce qui multiplie par cinq le nombre de clics.
 */
export async function advanceOrderStatus(orderId: string): Promise<void> {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) return;

  const index = FLOW.indexOf(order.status as (typeof FLOW)[number]);
  // Commande annulée ou déjà livrée : il n'y a pas d'étape suivante.
  if (index === -1 || index >= FLOW.length - 1) return;

  const next = FLOW[index + 1];
  if (next) await updateOrderStatus(orderId, next, 'Étape suivante depuis la liste des commandes.');
}

/**
 * Applique un statut à plusieurs commandes d'un coup.
 *
 * Utile le matin, quand une série de commandes de la veille doit être confirmée
 * en bloc. Les commandes sont traitées une à une afin que chacune journalise son
 * événement et, en cas d'annulation, remette son propre stock en rayon.
 */
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: OrderStatus,
): Promise<{ updated: number }> {
  await requireAdmin();

  // Garde-fou : une sélection anormalement large vient forcément d'une erreur.
  const ids = orderIds.slice(0, 100);

  for (const id of ids) {
    await updateOrderStatus(id, status, 'Action groupée depuis la liste des commandes.');
  }

  revalidatePath('/admin/commandes');
  revalidatePath('/admin');

  return { updated: ids.length };
}

export async function saveOrderNote(orderId: string, note: string): Promise<void> {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { adminNote: note.trim().slice(0, 2000) || null },
  });
  revalidatePath(`/admin/commandes/${orderId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Livraison
// ─────────────────────────────────────────────────────────────────────────────

const rateSchema = z.object({
  code: z.coerce.number().int().min(1).max(58),
  homeFee: z.coerce.number().int().min(0).max(100_000),
  deskFee: z.coerce.number().int().min(0).max(100_000),
  hasDesk: z.boolean(),
  isServed: z.boolean(),
});

/**
 * Met à jour le tarif d'une wilaya.
 *
 * Un tarif « bureau » à 0 signifie qu'aucun bureau n'existe : la case est donc
 * décochée automatiquement, exactement comme dans la grille du transporteur.
 * Cette règle est appliquée ici pour que la base ne puisse pas contenir un état
 * incohérent (bureau disponible à 0 DA).
 */
export async function updateDeliveryRate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = rateSchema.safeParse({
    code: formData.get('code'),
    homeFee: formData.get('homeFee'),
    deskFee: formData.get('deskFee'),
    hasDesk: formData.get('hasDesk') === 'on',
    isServed: formData.get('isServed') === 'on',
  });

  if (!parsed.success) return { error: 'Tarif invalide.' };

  const data = parsed.data;
  const hasDesk = data.hasDesk && data.deskFee > 0;

  await prisma.deliveryRate.update({
    where: { code: data.code },
    data: {
      homeFee: data.homeFee,
      deskFee: hasDesk ? data.deskFee : 0,
      hasDesk,
      isServed: data.isServed,
    },
  });

  revalidatePath('/admin/livraison');
  revalidatePath('/livraison');
  revalidatePath('/commande');
  return { success: 'Tarif enregistré.' };
}

/** Rafraîchit tout ce qui dépend de la grille tarifaire. */
function revalidateDelivery() {
  revalidatePath('/admin/livraison');
  revalidatePath('/livraison');
  // Le tunnel de commande reçoit la grille en propriété : il doit être régénéré,
  // sinon la cliente continuerait de voir l'ancien tarif jusqu'à expiration.
  revalidatePath('/commande');
}

/**
 * Modification partielle d'un tarif, enregistrée à la volée.
 *
 * Les interrupteurs « desservie » et « bureau disponible » s'appliquent
 * immédiatement, sans bouton « Enregistrer » : pour une case à cocher, demander
 * une validation supplémentaire n'apporte rien et double le nombre de clics.
 */
export async function patchDeliveryRate(
  code: number,
  patch: { homeFee?: number; deskFee?: number; hasDesk?: boolean; isServed?: boolean },
): Promise<void> {
  await requireAdmin();

  const current = await prisma.deliveryRate.findUnique({
    where: { code },
    select: { deskFee: true, hasDesk: true },
  });

  if (!current) return;

  const deskFee = patch.deskFee ?? current.deskFee;
  const wantsDesk = patch.hasDesk ?? current.hasDesk;

  // Invariant de la grille : « bureau disponible » et « tarif bureau à 0 » ne
  // peuvent pas coexister. Un zéro signifie qu'aucun bureau n'existe.
  const hasDesk = wantsDesk && deskFee > 0;

  await prisma.deliveryRate.update({
    where: { code },
    data: {
      ...(patch.homeFee !== undefined ? { homeFee: Math.max(0, Math.round(patch.homeFee)) } : {}),
      deskFee: hasDesk ? Math.max(0, Math.round(deskFee)) : 0,
      hasDesk,
      ...(patch.isServed !== undefined ? { isServed: patch.isServed } : {}),
    },
  });

  revalidateDelivery();
}

const newRateSchema = z.object({
  code: z.coerce
    .number()
    .int()
    .min(1, 'Le code doit être compris entre 1 et 58.')
    .max(58, 'Le code doit être compris entre 1 et 58.'),
  name: z.string().trim().min(2, 'Le nom de la wilaya est requis.').max(60),
  homeFee: z.coerce.number().int().min(0).max(100_000),
  deskFee: z.coerce.number().int().min(0).max(100_000),
  isServed: z.boolean(),
});

/**
 * Ajoute une wilaya à la grille.
 *
 * Sert dans deux cas : rétablir une wilaya retirée par erreur, et couvrir une
 * zone que le transporteur vient d'ouvrir. Le code fait office d'identifiant :
 * s'il existe déjà, la ligne est mise à jour plutôt que dupliquée — ajouter deux
 * fois la même wilaya n'aurait aucun sens et casserait le calcul des frais.
 *
 * Comme partout dans la grille, un tarif bureau à zéro éteint l'option bureau.
 */
export async function createDeliveryRate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = newRateSchema.safeParse({
    code: formData.get('code'),
    name: formData.get('name'),
    homeFee: formData.get('homeFee'),
    deskFee: formData.get('deskFee'),
    isServed: formData.get('isServed') === 'on',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Informations invalides.' };
  }

  const data = parsed.data;
  const hasDesk = data.deskFee > 0;
  const reference = WILAYAS.find((wilaya) => wilaya.code === data.code);

  const payload = {
    name: data.name,
    nameAr: reference?.nameAr ?? null,
    homeFee: data.homeFee,
    deskFee: hasDesk ? data.deskFee : 0,
    hasDesk,
    returnFee: reference?.returnFee ?? 0,
    isServed: data.isServed,
  };

  const existing = await prisma.deliveryRate.findUnique({
    where: { code: data.code },
    select: { code: true },
  });

  await prisma.deliveryRate.upsert({
    where: { code: data.code },
    update: payload,
    create: { code: data.code, ...payload },
  });

  revalidateDelivery();

  return {
    success: existing
      ? `${data.name} existait déjà : ses tarifs ont été mis à jour.`
      : `${data.name} a été ajoutée à la grille.`,
  };
}

/**
 * Retire une wilaya de la grille.
 *
 * La ligne peut être rétablie à tout moment depuis la grille de référence
 * ZR Express : la suppression n'est donc jamais définitive, ce qui la rend sans
 * danger.
 */
export async function deleteDeliveryRate(code: number): Promise<void> {
  await requireAdmin();
  await prisma.deliveryRate.deleteMany({ where: { code } });
  revalidateDelivery();
}

/**
 * Rétablit une ou toutes les wilayas depuis la grille de référence.
 *
 * `codes` vide = tout restaurer. Sert après une manipulation malheureuse, ou
 * lorsque le transporteur revient à ses tarifs d'origine.
 */
export async function restoreDeliveryRates(codes: number[] = []): Promise<{ restored: number }> {
  await requireAdmin();

  const wanted = codes.length > 0 ? WILAYAS.filter((w) => codes.includes(w.code)) : WILAYAS;

  for (const wilaya of wanted) {
    const payload = {
      name: wilaya.name,
      nameAr: wilaya.nameAr,
      homeFee: wilaya.homeFee,
      deskFee: wilaya.deskFee,
      hasDesk: wilaya.hasDesk,
      returnFee: wilaya.returnFee,
      isServed: wilaya.isServed,
      deliveryMin: wilaya.delay[0],
      deliveryMax: wilaya.delay[1],
    };

    await prisma.deliveryRate.upsert({
      where: { code: wilaya.code },
      update: payload,
      create: { code: wilaya.code, ...payload },
    });
  }

  revalidateDelivery();
  return { restored: wanted.length };
}

const bulkSchema = z.object({
  mode: z.enum(['percent', 'amount', 'set']),
  value: z.coerce.number().int().min(-100_000).max(100_000),
  target: z.enum(['home', 'desk', 'both']),
  /** Limiter aux wilayas desservies évite de réveiller des lignes inactives. */
  servedOnly: z.boolean(),
});

/**
 * Ajustement groupé des tarifs.
 *
 * Quand le transporteur augmente ses prix, il les augmente partout : refaire les
 * 58 lignes à la main serait une demi-heure de travail et une source d'erreurs.
 * Les montants restent bornés à zéro, et un tarif bureau ramené à zéro éteint
 * automatiquement l'option correspondante.
 */
export async function bulkAdjustDeliveryFees(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = bulkSchema.safeParse({
    mode: formData.get('mode'),
    value: formData.get('value'),
    target: formData.get('target'),
    servedOnly: formData.get('servedOnly') === 'on',
  });

  if (!parsed.success) return { error: 'Paramètres d’ajustement invalides.' };

  const { mode, value, target, servedOnly } = parsed.data;

  const rates = await prisma.deliveryRate.findMany({
    where: servedOnly ? { isServed: true } : {},
    select: { code: true, homeFee: true, deskFee: true, hasDesk: true },
  });

  const apply = (current: number): number => {
    if (mode === 'set') return Math.max(0, value);
    if (mode === 'percent') return Math.max(0, Math.round(current * (1 + value / 100)));
    return Math.max(0, current + value);
  };

  for (const rate of rates) {
    const homeFee = target === 'desk' ? rate.homeFee : apply(rate.homeFee);
    // Une wilaya sans bureau garde son zéro : l'ajuster lui inventerait un
    // bureau de retrait qui n'existe pas.
    const deskFee = target === 'home' || !rate.hasDesk ? rate.deskFee : apply(rate.deskFee);

    await prisma.deliveryRate.update({
      where: { code: rate.code },
      data: { homeFee, deskFee, hasDesk: rate.hasDesk && deskFee > 0 },
    });
  }

  revalidateDelivery();
  return { success: `${rates.length} tarif${rates.length > 1 ? 's' : ''} mis à jour.` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────

export async function markMessageRead(id: string, isRead: boolean): Promise<void> {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { isRead } });
  revalidatePath('/admin/messages');
  revalidatePath('/admin');
}

export async function deleteMessage(id: string): Promise<void> {
  await requireAdmin();
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath('/admin/messages');
}

// ─────────────────────────────────────────────────────────────────────────────
// Paramètres
// ─────────────────────────────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Mot de passe actuel requis.'),
    next: z
      .string()
      .min(10, 'Le nouveau mot de passe doit faire au moins 10 caractères.')
      .max(200),
    confirm: z.string(),
  })
  .refine((data) => data.next === data.confirm, {
    message: 'Les deux mots de passe ne correspondent pas.',
    path: ['confirm'],
  });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = passwordSchema.safeParse({
    current: formData.get('current'),
    next: formData.get('next'),
    confirm: formData.get('confirm'),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  const user = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { passwordHash: true },
  });

  if (!user || !(await verifyPassword(parsed.data.current, user.passwordHash))) {
    return { error: 'Mot de passe actuel incorrect.' };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });

  // Toutes les autres sessions sont invalidées : si le mot de passe est changé
  // parce qu'on le soupçonne compromis, un intrus déjà connecté est éjecté.
  await prisma.adminSession.deleteMany({ where: { userId: admin.id } });

  return { success: 'Mot de passe modifié. Reconnectez-vous sur vos autres appareils.' };
}

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Nom requis.').max(60),
  email: z.string().trim().toLowerCase().email('Adresse e-mail invalide.'),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  try {
    await prisma.adminUser.update({ where: { id: admin.id }, data: parsed.data });
  } catch {
    return { error: 'Cette adresse e-mail est déjà utilisée.' };
  }

  revalidatePath('/admin/parametres');
  return { success: 'Profil mis à jour.' };
}

const settingsSchema = z.object({
  announcement: z.string().trim().max(160).optional(),
  freeShippingFrom: z.coerce.number().int().min(0).max(10_000_000).optional(),
});

/** Réglages libres de la boutique, stockés en clé/valeur JSON. */
export async function updateSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    announcement: formData.get('announcement') || undefined,
    freeShippingFrom: formData.get('freeShippingFrom') || undefined,
  });

  if (!parsed.success) return { error: 'Réglages invalides.' };

  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/admin/parametres');
  return { success: 'Réglages enregistrés.' };
}
