import type { CSSProperties } from 'react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * Hero pleine largeur — l'image couvre tout l'écran (100svh).
 *
 * Sur mobile, le header sticky est transparent (backdrop-blur) et passe
 * au-dessus de cette section. Le slogan et le CTA sont superposés à l'image
 * via un dégradé sombre en bas, garantissant la lisibilité sans masquer l'image.
 * Sur desktop, la mise en page reste en split (image à droite, texte à gauche).
 */
export function Hero() {
  return (
    <>
      {/* ── Version mobile : plein écran pleine largeur, slogan sur l'image ── */}
      {/*
       * On utilise un margin-top négatif égal à la hauteur du header pour que la
       * bannière remonte derrière lui (qui est sticky et transparent au départ).
       * La hauteur totale est 100svh pour couvrir tout l'écran visuel.
       */}
      <section
        className="relative -mt-20 h-svh w-screen overflow-hidden lg:hidden"
        style={{ marginLeft: 'calc(-50vw + 50%)' }}
      >
        {/* Image de fond pleine largeur */}
        <Image
          src="/images/deluxia_banner.jpeg"
          alt="DELUXIA Collection"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        {/* Gradient haut → transparence pour le header */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.78) 100%)',
          }}
        />

        {/* Texte et CTA ancrés en bas de l'image */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-12 sm:px-8 sm:pb-16">
          <h1 className="text-hero font-extralight text-white">
            <span className="enter block" style={delay(180)}>
              Where luxury
            </span>
            <span className="enter block pl-[0.08em] sm:pl-[2vw]" style={delay(300)}>
              meets you
            </span>
          </h1>
          <div className="enter mt-8 sm:mt-10" style={delay(460)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir la collection
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Version desktop : split layout (inchangé) ── */}
      <section className="relative overflow-hidden bg-white dark:bg-black hidden lg:block">
        <div className="shell flex min-h-[calc(100svh-9rem)] flex-row items-center py-24 gap-8">

          {/* Colonne Texte */}
          <div className="flex-1 z-10 flex flex-col justify-center">
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
          <div className="w-[45%] max-w-xl xl:max-w-2xl enter" style={delay(100)}>
            <div className="relative aspect-[3/4] sm:aspect-[4/5] w-full overflow-hidden bg-stone-50 shadow-2xl rounded-lg">
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
    </>
  );
}
