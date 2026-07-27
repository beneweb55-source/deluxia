/**
 * Utilitaire d'événements Meta Pixel (Facebook / Instagram Ads).
 *
 * `fbq` est injecté par le script de base (voir `@/components/analytics/MetaPixel`).
 * Tant que la cliente n'a pas renseigné son identifiant de Pixel, `fbq` est
 * absent : chaque appel retombe alors silencieusement en no-op. On peut donc
 * câbler les événements du tunnel dès maintenant sans rien envoyer à Meta ni
 * risquer une erreur en développement.
 *
 * La devise est le dinar algérien (`DZD`) : c'est la valeur attendue par le
 * gestionnaire d'événements de Meta pour que le chiffre d'affaires publicitaire
 * soit correctement agrégé.
 */

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export const PIXEL_CURRENCY = 'DZD';

export type PixelEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase';

/** Émet un événement Pixel si le tracking est actif, sinon ne fait rien. */
export function trackPixel(event: PixelEvent, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', event, params);
}
