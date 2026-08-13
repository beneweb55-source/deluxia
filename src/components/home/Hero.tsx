import type { CSSProperties } from 'react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * Premier écran — avec une mise en page divisée (split layout).
 * 
 * Ce design permet de mettre en valeur une image verticale (comme la bannière)
 * sans la rogner agressivement, tout en gardant une typographie élégante sur le côté.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="shell flex min-h-[calc(100svh-9rem)] flex-col lg:flex-row lg:items-center py-12 sm:min-h-[calc(100svh-10rem)] sm:py-24 gap-12 lg:gap-8">
        
        {/* Colonne Texte */}
        <div className="flex-1 z-10 flex flex-col justify-center order-2 lg:order-1 pt-8 lg:pt-0">
          <h1 className="text-hero font-extralight text-ink">
            <span className="enter block" style={delay(180)}>
              Where luxury
            </span>
            <span className="enter block pl-[0.08em] sm:pl-[2vw]" style={delay(300)}>
              meets you
            </span>
          </h1>

          <div className="enter mt-10 sm:mt-12" style={delay(460)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir la collection
            </ButtonLink>
          </div>
        </div>

        {/* Colonne Image */}
        <div className="w-full lg:w-[45%] lg:max-w-xl xl:max-w-2xl order-1 lg:order-2 enter" style={delay(100)}>
          <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden bg-stone-50 shadow-2xl rounded-sm sm:rounded-md lg:rounded-lg">
            <Image
              src="/images/deluxia_banner.jpeg"
              alt="DELUXIA Collection"
              fill
              priority
              className="object-cover object-center"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
