/**
 * Formatage — toutes les valeurs monétaires sont des entiers en dinars algériens.
 *
 * Le séparateur de milliers est une espace insécable fine : elle évite qu'un prix
 * soit coupé en fin de ligne ("24" / "900 DA"), ce qui casse la lecture d'un prix.
 */

const THIN_NBSP = ' ';

/** 24900 → « 24 900 DA » */
export function formatPrice(amount: number): string {
  return `${formatNumber(amount)}${THIN_NBSP}DA`;
}

/** 24900 → « 24 900 » (sans devise) */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THIN_NBSP);
}

/** Pourcentage de remise arrondi à l'entier inférieur : 30000 → 24900 donne 17 %. */
export function discountPercent(price: number, comparePrice: number | null | undefined): number | null {
  if (!comparePrice || comparePrice <= price) return null;
  return Math.floor(((comparePrice - price) / comparePrice) * 100);
}

const DATE_FMT = new Intl.DateTimeFormat('fr-DZ', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const DATETIME_FMT = new Intl.DateTimeFormat('fr-DZ', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(date: Date | string): string {
  return DATE_FMT.format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return DATETIME_FMT.format(new Date(date));
}

/**
 * Normalise un numéro algérien pour l'affichage : 0772610546 → « 07 72 61 05 46 ».
 * Les numéros non reconnus sont renvoyés tels quels plutôt que mutilés.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const local = digits.startsWith('213') ? `0${digits.slice(3)}` : digits;
  if (local.length !== 10) return phone;
  return local.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

/** Transforme un libellé en segment d'URL propre : « Sac Épaule Noir » → « sac-epaule-noir ». */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // « é » décomposé par NFD perd son accent
    .toLowerCase()
    .replace(/['’]/g, '') // apostrophes droites et typographiques
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
