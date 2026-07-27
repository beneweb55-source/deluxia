import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/ui/Button';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * Premier écran — volontairement dépouillé.
 *
 * Le logo est déjà posé tout en haut par l'en-tête (composant `Header`, centré) :
 * on ne le redouble donc pas ici. Ne restent que le slogan et une seule porte
 * d'entrée, « Découvrir la collection », qui mène à la page des catégories. Cette
 * sobriété est un choix de conversion — un écran à une seule action se lit en un
 * instant — et prépare l'arrivée d'une image de fond plein cadre, façon vitrine.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="shell flex min-h-[calc(100svh-9rem)] flex-col justify-center py-16 sm:min-h-[calc(100svh-10rem)] sm:py-24">
        <h1 className="text-hero font-extralight text-ink">
          <span className="enter block" style={delay(180)}>
            Where luxury
          </span>
          <span className="enter block pl-[0.08em] sm:pl-[6vw]" style={delay(300)}>
            meets you
          </span>
        </h1>

        <div className="enter mt-12 sm:mt-16" style={delay(460)}>
          <ButtonLink href="/collections" size="lg">
            Découvrir la collection
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
