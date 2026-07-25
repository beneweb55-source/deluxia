'use server';

import { redirect } from 'next/navigation';
import { destroySession } from '@/lib/auth';
import { destroyCustomerSession } from '@/lib/customerAuth';
import { clearProfileHint } from '@/lib/session-hint';

/**
 * Déconnexion depuis le panneau d'administration.
 *
 * La connexion, elle, passe par le formulaire unique de `/connexion` : la
 * gérante et les clientes utilisent le même écran, ce qui évite d'entretenir
 * deux pages de connexion et deux façons de vérifier un mot de passe.
 *
 * Les deux types de session sont détruits : la gérante consulte souvent sa
 * propre boutique en cliente, et n'en garder qu'une laisserait une session
 * fantôme dans son navigateur.
 */
export async function logout(): Promise<void> {
  await destroySession();
  await destroyCustomerSession();
  await clearProfileHint();
  redirect('/connexion');
}
