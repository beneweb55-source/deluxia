import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/ui/Button';


const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="shell flex min-h-[calc(100svh-9rem)] flex-col justify-center py-16 sm:min-h-[calc(100svh-10rem)] sm:py-24">

        <h1 className="mt-7 text-hero font-extralight text-ink">
          <span className="enter block" style={delay(180)}>
            Where luxury
          </span>
          <span className="enter block pl-[0.08em] sm:pl-[6vw]" style={delay(300)}>
            meets you
          </span>
        </h1>

        <div className="enter mt-10 h-px w-full max-w-md bg-line sm:mt-14" style={delay(420)} />

        <div className="mt-8 flex flex-col gap-9 sm:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <p
            className="enter max-w-md text-[1rem] leading-relaxed text-graphite sm:text-[1.0625rem]"
            style={delay(500)}
          >
            Le style sans compromis. Des pièces tendances, audacieuses et élégantes, soigneusement sélectionnées pour faire la différence.
          </p>

          <div className="enter flex flex-col gap-3 sm:flex-row" style={delay(580)}>
            <ButtonLink href="/boutique" size="lg">
              Découvrir la collection
            </ButtonLink>
            <ButtonLink href="/nouveautes" variant="outline" size="lg">
              Acheter maintenant
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Indicateur de défilement — purement décoratif. */}

    </section>
  );
}
