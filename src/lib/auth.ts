import 'server-only';

import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

export const SESSION_COOKIE = 'deluxia_admin';

/** Durée de vie d'une session admin. */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

const KEY_LENGTH = 64;

// ─────────────────────────────────────────────────────────────────────────────
// Mots de passe — scrypt (recommandation OWASP, disponible nativement dans Node)
// ─────────────────────────────────────────────────────────────────────────────

/** Produit une empreinte au format `scrypt$<salt hex>$<clé hex>`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/**
 * Vérifie un mot de passe en temps constant.
 * Renvoie `false` — jamais d'exception — si l'empreinte stockée est illisible,
 * pour qu'un enregistrement corrompu se traduise par un refus de connexion
 * et non par une erreur 500 exploitable.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const [, saltHex, keyHex] = parts;
  if (!saltHex || !keyHex) return false;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(keyHex, 'hex');
    if (expected.length !== KEY_LENGTH) return false;

    const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH);
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le jeton n'est jamais stocké en clair : la base ne contient que son SHA-256.
 * Une fuite de la table `admin_sessions` ne permet donc pas d'usurper une session.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

/** Crée une session et pose le cookie. Renvoie la date d'expiration. */
export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ip?: string | null } = {},
): Promise<Date> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.adminSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
      ip: meta.ip ?? null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });

  return expiresAt;
}

/** Lit la session courante. Renvoie `null` si absente, expirée ou révoquée. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;

  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

/** Variante pour les pages : redirige vers la connexion si non authentifié. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/connexion');
  return user;
}

/** Détruit la session courante côté base et côté navigateur. */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    // deleteMany : ne lève pas si la session a déjà expiré ou été purgée.
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  store.delete(SESSION_COOKIE);
}

/** Purge les sessions expirées. Appelée à chaque connexion réussie. */
export async function purgeExpiredSessions(): Promise<void> {
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
