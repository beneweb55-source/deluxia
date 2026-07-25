'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { BRAND } from '@/lib/brand';

/**
 * Filet de sécurité de la boutique.
 *
 * `error.message` n'est jamais affiché : en production il peut contenir un
 * fragment de requête ou un chemin de fichier, sans le moindre intérêt pour la
 * visiteuse et avec un intérêt certain pour quelqu'un qui sonde le site. Seul
 * `digest`, un identifiant opaque, est montré — il permet de retrouver
 * l'incident dans les journaux si la cliente le communique.
 */
export default function BoutiqueError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[boutique] erreur de rendu', error);
  }, [error]);

  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Incident technique</p>

      <h1 className="mt-5 text-[clamp(1.5rem,5vw,2.75rem)] font-extralight leading-[1.08] tracking-[-0.03em] text-ink">
        Cette page n&rsquo;a pas pu s&rsquo;afficher
      </h1>

      <span className="mt-9 block h-px w-16 bg-line" />

      <p className="mt-9 max-w-md text-[0.9375rem] leading-relaxed text-graphite">
        L&rsquo;incident vient de chez nous, pas de vous. Réessayez : la plupart du temps, cela
        suffit.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Réessayer
        </Button>
        <ButtonLink href="/" variant="outline" size="lg">
          Retour à l&rsquo;accueil
        </ButtonLink>
      </div>

      <p className="mt-10 text-[0.8125rem] leading-relaxed text-graphite">
        Le problème persiste ? Appelez-nous au{' '}
        <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-ink">
          {BRAND.phoneDisplay}
        </a>
        .
      </p>

      {error.digest && (
        <p className="mt-6 font-mono text-[0.6875rem] text-ash">Référence incident : {error.digest}</p>
      )}
    </div>
  );
}
