import 'server-only';

import { cookies } from 'next/headers';

/**
 * Cookie « indice de session » — purement cosmétique.
 *
 * Le cookie de session réel est `httpOnly` : le navigateur ne peut pas le lire,
 * et c'est bien ainsi. Mais l'en-tête a besoin de savoir s'il doit afficher
 * « Se connecter » ou « Bonjour Amel » — une information sans valeur de sécurité.
 *
 * Interroger le serveur à chaque chargement pour cela coûterait une requête par
 * page et ferait clignoter le menu. On dépose donc, à côté du cookie de session,
 * un second cookie lisible contenant uniquement un rôle et un prénom.
 *
 * ⚠ Ce cookie n'accorde AUCUN droit. Il est modifiable par la visiteuse, et le
 * falsifier ne fait qu'afficher un mauvais prénom dans son propre navigateur :
 * chaque page protégée revérifie la session réelle côté serveur
 * (`requireAdmin`, `getSessionCustomer`). Ne jamais s'en servir pour autoriser
 * quoi que ce soit.
 */

export const PROFILE_HINT_COOKIE = 'deluxia_profile';

export type ProfileRole = 'ADMIN' | 'CUSTOMER';

export interface ProfileHint {
  role: ProfileRole;
  name: string;
}

export async function setProfileHint(hint: ProfileHint, expiresAt: Date): Promise<void> {
  const store = await cookies();

  store.set(PROFILE_HINT_COOKIE, encodeURIComponent(JSON.stringify(hint)), {
    // Volontairement lisible par le navigateur : c'est tout l'intérêt.
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearProfileHint(): Promise<void> {
  const store = await cookies();
  store.delete(PROFILE_HINT_COOKIE);
}
