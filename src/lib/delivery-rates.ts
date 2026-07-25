import 'server-only';

import { prisma, withRetry } from '@/lib/prisma';
import { WILAYAS } from '@/data/wilayas';
import type { DeliveryOption } from '@/lib/delivery-quote';

/**
 * Lecture de la grille tarifaire — source unique pour tout ce qui engage de
 * l'argent : le tunnel de commande, la création de commande et la page publique
 * « Livraison ».
 *
 * La grille vit en base (`delivery_rates`) parce qu'elle doit être modifiable
 * depuis l'administration : le transporteur révise ses tarifs plusieurs fois par
 * an, et il serait absurde d'exiger un déploiement à chaque fois.
 *
 * `@/data/wilayas` reste la référence pour ce qui ne change pas — noms, communes,
 * et la grille d'origine ZR Express, qui sert de repli si la table est vide
 * (base fraîchement créée, seed non exécuté).
 */

/** Grille de repli, dérivée du fichier de référence. */
function fallbackOptions(): DeliveryOption[] {
  return WILAYAS.map((wilaya) => ({
    code: wilaya.code,
    name: wilaya.name,
    homeFee: wilaya.homeFee,
    deskFee: wilaya.deskFee,
    hasDesk: wilaya.hasDesk,
    isServed: wilaya.isServed,
  }));
}

/**
 * Renvoie la grille complète, triée par code de wilaya.
 *
 * Le repli sur la grille de référence n'est pas de la complaisance : sans lui,
 * une table vide rendrait toute commande impossible sur l'ensemble du pays, ce
 * qui est le pire échec possible pour une boutique.
 */
export async function getDeliveryOptions(): Promise<DeliveryOption[]> {
  try {
    const rates = await withRetry(() =>
      prisma.deliveryRate.findMany({
        orderBy: { code: 'asc' },
        select: {
          code: true,
          name: true,
          homeFee: true,
          deskFee: true,
          hasDesk: true,
          isServed: true,
        },
      }),
    );

    if (rates.length > 0) return rates;
  } catch (error) {
    console.error('[livraison] lecture de la grille impossible, repli sur la grille de référence', error);
  }

  return fallbackOptions();
}

/** Statistiques affichées sur la page publique « Livraison » et sur l'accueil. */
export async function getDeliverySummary() {
  const options = await getDeliveryOptions();
  const served = options.filter((option) => option.isServed);

  return {
    options,
    served,
    servedCount: served.length,
    deskCount: served.filter((option) => option.hasDesk).length,
    minHomeFee: served.length > 0 ? Math.min(...served.map((option) => option.homeFee)) : 0,
    maxHomeFee: served.length > 0 ? Math.max(...served.map((option) => option.homeFee)) : 0,
  };
}
