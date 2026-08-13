import type { CSSProperties } from 'react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * Hero pleine largeur — l'image couvre tout l'écran (100svh) sur desktop et mobile.
 * Le header sticky transparent passe au-dessus. Le slogan se place dans la zone
 * claire de l'image (gauche), avec une typographie éditoriale luxe.
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

        {/* Léger voile en haut pour que le header reste lisible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.0) 20%)',
          }}
        />

        {/* Slogan + CTA — zone haute gauche, fond clair de l'image */}
        <div className="absolute inset-x-0 top-0 z-10 px-5 pt-[6.5rem] sm:px-8 sm:pt-32">
          <h1 className="text-hero font-extralight text-ink drop-shadow-sm">
            <span className="enter block" style={delay(180)}>
              Where luxury
            </span>
            <span className="enter block pl-[0.08em]" style={delay(300)}>
              meets you
            </span>
          </h1>
          <div className="enter mt-7 sm:mt-9" style={delay(460)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir la collection
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ── Version desktop : plein écran éditorial luxe ── */}
      {/*
       * Même principe que mobile : -mt-24 (hauteur desktop du header) pour remonter
       * sous le header transparent. Image ancrée à droite pour libérer la zone
       * claire gauche où se pose le texte.
       */}
      <section
        className="relative -mt-24 hidden h-svh w-screen overflow-hidden lg:block"
        style={{ marginLeft: 'calc(-50vw + 50%)' }}
      >
        {/* Image plein écran, sujet ancré à droite */}
        <Image
          src="/images/deluxia_banner.jpeg"
          alt="DELUXIA Collection — Nouvelle collection"
          fill
          priority
          className="object-cover object-right"
          sizes="100vw"
        />

        {/* Voile gauche : gradient blanc → transparent pour renforcer la lisibilité du texte */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to right, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.20) 38%, rgba(255,255,255,0.0) 60%)',
          }}
        />

        {/* Bloc éditorial — aligné verticalement au centre, dans la zone claire */}
        <div className="absolute inset-y-0 left-0 z-10 flex w-[52%] xl:w-[46%] flex-col justify-center pl-[6vw] xl:pl-[8vw]">

          {/* Eyebrow — étiquette de collection */}
          <p
            className="enter eyebrow text-graphite tracking-[0.22em] mb-6"
            style={delay(80)}
          >
            Nouvelle Collection
          </p>

          {/* Slogan principal */}
          <h1 className="text-hero font-extralight text-ink leading-[1.05]">
            <span className="enter block" style={delay(200)}>
              Where luxury
            </span>
            <span className="enter block pl-[0.06em]" style={delay(340)}>
              meets you
            </span>
          </h1>

          {/* Tagline */}
          <p
            className="enter mt-6 max-w-xs text-[0.9rem] font-light leading-relaxed text-graphite"
            style={delay(440)}
          >
            Des pièces rares, pensées pour celles qui savent ce qu&apos;elles veulent.
          </p>

          {/* CTA */}
          <div className="enter mt-10" style={delay(560)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir la collection
            </ButtonLink>
          </div>
        </div>

        {/* Indicateur de scroll — centré en bas */}
        <div
          className="enter absolute bottom-10 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2"
          style={delay(700)}
          aria-hidden="true"
        >
          <span className="eyebrow text-[0.55rem] tracking-[0.22em] text-graphite/70">
            Défiler
          </span>
          <span
            className="block h-10 w-px origin-top"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0))',
              animation: 'scrollLine 1.8s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes scrollLine {
              0%   { transform: scaleY(0); opacity: 0; }
              30%  { opacity: 1; }
              100% { transform: scaleY(1); opacity: 0; }
            }
          `}</style>
        </div>
      </section>
    </>
  );
}
