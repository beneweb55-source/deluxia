'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

export const THEME_STORAGE_KEY = 'deluxia.theme';

/**
 * Script injecté dans le <head> et exécuté avant le premier rendu : il applique
 * le thème enregistré immédiatement, ce qui évite le flash blanc que subissent
 * les utilisateurs en thème sombre quand le thème est appliqué après hydratation.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}document.documentElement.classList.remove('no-js')})()`;

type Theme = 'light' | 'dark';

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'dark' : 'light');
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Stockage refusé : le thème s'applique tout de même pour la session.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center text-ink transition-opacity duration-300 hover:opacity-55',
        className,
      )}
    >
      {/* L'icône n'est rendue qu'après montage : le serveur ignore le thème
          enregistré et afficherait sinon le mauvais symbole pendant un instant.
          Le bouton conserve sa taille, il n'y a donc aucun décalage de mise en
          page — et la visibilité ne dépend d'aucune transition. */}
      {mounted &&
        (theme === 'dark' ? (
          <MoonIcon className="h-[1.15rem] w-[1.15rem]" />
        ) : (
          <SunIcon className="h-[1.15rem] w-[1.15rem]" />
        ))}
    </button>
  );
}
