/**
 * Concatène des classes CSS en ignorant les valeurs falsy.
 * Volontairement minimal : aucune dépendance, aucun coût au bundle.
 *
 *   cn('btn', isActive && 'btn-active', undefined) // → "btn btn-active"
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Borne une valeur dans un intervalle. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Hachage déterministe (FNV-1a 32 bits) d'une chaîne.
 * Utilisé pour dériver l'apparence d'un placeholder produit à partir de son slug :
 * le même produit affiche toujours exactement le même visuel, sur le serveur
 * comme sur le client (pas de décalage d'hydratation).
 */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
