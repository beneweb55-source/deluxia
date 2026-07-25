import { z } from 'zod';

/**
 * Schéma de commande — partagé entre le formulaire (validation immédiate à la
 * saisie) et la route d'API (validation faisant autorité).
 *
 * Un seul schéma pour les deux côtés : il est impossible qu'une règle acceptée
 * par le formulaire soit refusée par le serveur, ou l'inverse.
 */

/**
 * Formate un numéro pendant la frappe : 0772610546 → « 07 72 61 05 46 ».
 *
 * Le groupement se fait au fur et à mesure, jamais après coup : un numéro
 * algérien fait dix chiffres, et les relire d'un bloc pour vérifier une faute
 * de frappe est pénible. Les caractères non numériques sont écartés au passage,
 * ce qui rend indolore un collage depuis un carnet d'adresses.
 */
export function formatPhoneInput(input: string): string {
  const digits = normalizePhone(input).slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/** Retire espaces, points et préfixe international pour ne garder que les chiffres. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('213')) return `0${digits.slice(3)}`;
  if (digits.startsWith('00213')) return `0${digits.slice(5)}`;
  return digits;
}

/**
 * Numéro algérien : mobile (05/06/07 + 8 chiffres) ou fixe (0 + indicatif + 6 à 7 chiffres).
 * On reste volontairement permissif sur les fixes, les indicatifs variant selon les wilayas.
 */
const phoneSchema = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((value) => /^0[1-9]\d{7,8}$/.test(value), {
    message: 'Numéro invalide. Exemple : 07 72 61 05 46.',
  });

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Au moins 2 caractères.')
  .max(60, 'Maximum 60 caractères.')
  .regex(/^[\p{L}\p{M}\s'’-]+$/u, 'Lettres, espaces et tirets uniquement.');

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const orderSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    phone: phoneSchema,
    phoneAlt: z
      .union([phoneSchema, z.literal('')])
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    wilayaCode: z.coerce
      .number()
      .int()
      .min(1, 'Choisissez votre wilaya.')
      .max(58, 'Choisissez votre wilaya.'),
    commune: z.string().trim().min(2, 'Indiquez votre commune.').max(80),
    address: z
      .string()
      .trim()
      .min(8, "Précisez l'adresse : rue, quartier, point de repère.")
      .max(300, 'Maximum 300 caractères.'),
    deliveryType: z.enum(['DOMICILE', 'STOPDESK']),
    notes: z.string().trim().max(500, 'Maximum 500 caractères.').optional(),
    items: z.array(orderItemSchema).min(1, 'Votre panier est vide.').max(30),
  });

/*
 * Ce schéma ne valide que la FORME des données. Les règles qui dépendent de la
 * grille tarifaire — la wilaya est-elle desservie, existe-t-il un bureau de
 * retrait — sont volontairement absentes : la grille est modifiable depuis
 * l'administration, et un schéma synchrone partagé avec le navigateur ne peut
 * pas la consulter. Les figer ici reviendrait à refuser une wilaya que le gérant
 * vient d'ouvrir. Ces contrôles sont faits côté serveur dans
 * `src/app/api/commande/route.ts`, à partir de la base.
 */

export type OrderInput = z.infer<typeof orderSchema>;

/** Champs du formulaire, hors panier — utilisé pour l'état du composant. */
export type OrderFormFields = Omit<OrderInput, 'items'>;
