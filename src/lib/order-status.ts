import type { OrderStatus } from '@prisma/client';

/** Libellés et explications des statuts, écrits pour être lus par un client. */
export const ORDER_STATUS: Record<
  OrderStatus,
  { label: string; description: string; step: number }
> = {
  EN_ATTENTE: {
    label: 'En attente',
    description: 'Nous avons bien reçu votre commande. Un appel de confirmation va suivre.',
    step: 1,
  },
  CONFIRMEE: {
    label: 'Confirmée',
    description: 'Votre commande est confirmée et entre en préparation.',
    step: 2,
  },
  PREPARATION: {
    label: 'En préparation',
    description: 'Vos articles sont contrôlés et emballés.',
    step: 3,
  },
  EXPEDIEE: {
    label: 'Expédiée',
    description: 'Le colis est confié au transporteur. Le livreur vous contactera.',
    step: 4,
  },
  LIVREE: {
    label: 'Livrée',
    description: 'Le colis a été remis. Merci de votre confiance.',
    step: 5,
  },
  ANNULEE: {
    label: 'Annulée',
    description: 'Cette commande a été annulée. Contactez-nous pour toute question.',
    step: 0,
  },
};

/** Étapes affichées dans le suivi, dans l'ordre. L'annulation en est exclue. */
export const ORDER_STEPS: OrderStatus[] = [
  'EN_ATTENTE',
  'CONFIRMEE',
  'PREPARATION',
  'EXPEDIEE',
  'LIVREE',
];

export const DELIVERY_LABEL = {
  DOMICILE: 'Livraison à domicile',
  STOPDESK: 'Retrait en bureau',
} as const;

/** Forme renvoyée par l'API de consultation de commande. */
export interface PublicOrder {
  reference: string;
  status: OrderStatus;
  createdAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  phoneAlt: string | null;
  wilayaName: string;
  commune: string;
  address: string;
  notes: string | null;
  deliveryType: keyof typeof DELIVERY_LABEL;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: Array<{
    productName: string;
    productSlug: string;
    imageUrl: string | null;
    size: string;
    color: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
}
