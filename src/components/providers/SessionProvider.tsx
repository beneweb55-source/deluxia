'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * État d'affichage de la session, lu depuis le cookie « indice » déposé par le
 * serveur (voir `@/lib/session-hint`).
 *
 * Aucune requête réseau : la lecture est synchrone et locale. La valeur est
 * relue à chaque changement d'URL, ce qui suffit à refléter une connexion ou une
 * déconnexion — toutes deux se terminant par une navigation.
 *
 * Rappel : cette information sert uniquement à choisir ce qu'on affiche. Les
 * droits réels sont vérifiés côté serveur à chaque page protégée.
 */

const PROFILE_HINT_COOKIE = 'deluxia_profile';

export interface SessionUser {
  role: 'ADMIN' | 'CUSTOMER';
  name: string;
}

interface SessionValue {
  user: SessionUser | null;
  /** Faux tant que le cookie n'a pas été lu, pour éviter tout écart d'hydratation. */
  ready: boolean;
}

const SessionContext = createContext<SessionValue>({ user: null, ready: false });

function readHint(): SessionUser | null {
  if (typeof document === 'undefined') return null;

  const raw = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${PROFILE_HINT_COOKIE}=`))
    ?.slice(PROFILE_HINT_COOKIE.length + 1);

  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw));
    if (typeof parsed !== 'object' || parsed === null) return null;

    const { role, name } = parsed as Record<string, unknown>;
    if ((role !== 'ADMIN' && role !== 'CUSTOMER') || typeof name !== 'string') return null;

    // Le cookie est modifiable par la visiteuse : on borne la longueur pour
    // qu'un nom absurde ne puisse pas disloquer l'en-tête.
    return { role, name: name.slice(0, 40) };
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readHint());
    setReady(true);
  }, [pathname]);

  const value = useMemo<SessionValue>(() => ({ user, ready }), [user, ready]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}
