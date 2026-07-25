/**
 * Calcul des frais de livraison — logique pure, partagée par le navigateur et le
 * serveur.
 *
 * Ce module ne touche ni à la base ni aux cookies : il peut donc être importé
 * par le formulaire de commande (recalcul instantané au changement de wilaya)
 * comme par la route d'API (revalidation qui fait autorité). Les deux côtés
 * exécutent exactement le même code, ce qui rend impossible un écart entre le
 * montant affiché et le montant enregistré.
 *
 * Les tarifs eux-mêmes proviennent de la table `delivery_rates`, modifiable
 * depuis l'administration — voir `@/lib/delivery-rates`.
 */

export type DeliveryMode = 'DOMICILE' | 'STOPDESK';

/** Tarif d'une wilaya, tel que stocké en base et transmis au formulaire. */
export interface DeliveryOption {
  code: number;
  name: string;
  /** Frais de livraison à domicile, en DA. */
  homeFee: number;
  /** Frais de livraison en bureau (stop desk), en DA. */
  deskFee: number;
  /** Faux si aucun bureau du transporteur n'existe dans la wilaya. */
  hasDesk: boolean;
  /** Faux si le transporteur ne dessert pas la wilaya. */
  isServed: boolean;
}

export interface DeliveryQuote {
  /** Frais applicables, en DA. */
  fee: number;
  /** Mode réellement retenu — corrigé si le bureau n'existe pas. */
  mode: DeliveryMode;
  /** Vrai si le mode demandé a dû être corrigé. */
  corrected: boolean;
  /** Vrai si la wilaya n'est pas desservie : la commande doit être refusée. */
  unavailable: boolean;
}

/**
 * Calcule les frais pour une wilaya et un mode donnés.
 *
 * Deux règles métier y sont appliquées, et nulle part ailleurs :
 *
 *  1. Une wilaya absente de la grille, ou marquée non desservie, rend la
 *     commande impossible (`unavailable`).
 *  2. Demander un retrait en bureau là où il n'y en a pas bascule silencieusement
 *     vers la livraison à domicile. C'est le cas des wilayas dont le tarif bureau
 *     figurait à 0 DA dans la grille du transporteur : ce zéro ne veut pas dire
 *     « gratuit », il veut dire « pas de bureau ».
 */
export function quoteDelivery(
  option: DeliveryOption | undefined | null,
  mode: DeliveryMode,
): DeliveryQuote {
  if (!option || !option.isServed) {
    return { fee: 0, mode: 'DOMICILE', corrected: false, unavailable: true };
  }

  const effectiveMode: DeliveryMode = mode === 'STOPDESK' && !option.hasDesk ? 'DOMICILE' : mode;

  return {
    fee: effectiveMode === 'STOPDESK' ? option.deskFee : option.homeFee,
    mode: effectiveMode,
    corrected: effectiveMode !== mode,
    unavailable: false,
  };
}

/** Retrouve une wilaya dans une grille. */
export function findOption(
  options: readonly DeliveryOption[],
  code: number | null | undefined,
): DeliveryOption | undefined {
  if (code == null) return undefined;
  return options.find((option) => option.code === code);
}
