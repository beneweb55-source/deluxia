import 'server-only';

import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const CUSTOMER_SESSION_COOKIE = 'deluxia_customer';

/** Durée de vie d'une session client. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours

// ─────────────────────────────────────────────────────────────────────────────
// Sessions Client
// ─────────────────────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface SessionCustomer {
  id: string;
  phone: string;
  email: string | null;
  firstName: string;
  lastName: string;
}

/** Crée une session et pose le cookie. Renvoie la date d'expiration. */
export async function createCustomerSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<Date> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.customerSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ip: meta.ip ?? null,
    },
  });

  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Durée relative (`maxAge`, en secondes) pour résister à une horloge de
    // navigateur mal réglée, qui ferait passer une date `expires` pour périmée et
    // déconnecterait la cliente à la fermeture de l'onglet. Voir `@/lib/auth`.
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    expires: expiresAt,
  });

  return expiresAt;
}

/** Lit la session courante. Renvoie `null` si absente ou expirée. */
export async function getSessionCustomer(): Promise<SessionCustomer | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      customer: { select: { id: true, phone: true, email: true, firstName: true, lastName: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session.customer;
}

/**
 * Date d'expiration de la session cliente en cours, ou `null` si absente/expirée.
 *
 * Sert à réaligner l'indice de session (le cookie lisible qui porte le prénom)
 * sur la durée réelle de la session : après une édition de profil, on ne veut pas
 * repousser l'indice à 30 jours « à partir de maintenant » alors que la session,
 * elle, expire à sa date d'origine — sinon l'en-tête afficherait « Bonjour … »
 * pour une session déjà morte.
 */
export async function getCustomerSessionExpiry(): Promise<Date | null> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.expiresAt;
}

/** Détruit la session courante côté base et côté navigateur. */
export async function destroyCustomerSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;

  if (token) {
    await prisma.customerSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  store.delete(CUSTOMER_SESSION_COOKIE);
}

/** Purge les sessions expirées. Appelée à chaque connexion réussie. */
export async function purgeExpiredCustomerSessions(): Promise<void> {
  await prisma.customerSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

/**
 * Ferme toutes les sessions d'une cliente sauf celle en cours.
 *
 * Appelée après un changement de mot de passe : si celui-ci est modifié parce
 * qu'on le soupçonne connu de quelqu'un d'autre, les autres appareils doivent
 * perdre l'accès. La session courante est préservée pour ne pas éjecter la
 * cliente de la page où elle vient de valider son nouveau mot de passe.
 */
export async function destroyOtherCustomerSessions(customerId: string): Promise<void> {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;

  await prisma.customerSession.deleteMany({
    where: {
      userId: customerId,
      ...(token ? { NOT: { tokenHash: hashToken(token) } } : {}),
    },
  });
}
