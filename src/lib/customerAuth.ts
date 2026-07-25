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
