import type { CSSProperties } from 'react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * Hero section — deux rendus distincts selon le breakpoint.
 *
 * Mobile  : image plein écran, slogan superposé dans la zone claire.
 * Desktop : split éditorial — texte sur fond blanc à gauche,
 *           image haute résolution à droite, toute la hauteur du viewport.
 *
 * La version desktop utilise un CSS Grid simple, sans aucun trick w-screen
 * ou margin négatif. Elle est positionnée après le header (sticky h-24) donc
 * min-h est calculé pour remplir le reste du viewport : calc(100dvh - 6rem).
 */
export function Hero() {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          MOBILE (< lg) — plein écran avec image de fond
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative -mt-20 h-svh overflow-hidden lg:hidden"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
      >
        <Image
          src="/images/deluxia_banner.jpeg"
          alt="DELUXIA Collection"
          fill
          priority
          className="object-cover object-[60%_top]"
          sizes="100vw"
        />

        {/* Voile haut — lisibilité du header transparent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 25%)',
          }}
        />

        {/* Texte positionné dans la zone claire haute-gauche */}
        <div className="absolute inset-x-0 top-0 z-10 px-5 pt-24 sm:px-8 sm:pt-28">
          <h1 className="text-hero font-extralight text-ink">
            <span className="enter block" style={delay(180)}>Where luxury</span>
            <span className="enter block pl-[0.08em]" style={delay(300)}>meets you</span>
          </h1>
          <div className="enter mt-7" style={delay(460)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir la collection
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          DESKTOP (≥ lg) — split éditorial propre

          Pas de tricks : section normale, pleine largeur naturelle du main.
          Grille 2 colonnes : [texte | image].
          Hauteur = viewport complet moins le header sticky (h-24 = 6rem).
      ════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Collection DELUXIA"
        className="hidden lg:grid lg:grid-cols-[48%_52%] xl:grid-cols-[44%_56%]"
        style={{ minHeight: 'calc(100dvh - 6rem)' }}
      >
        {/* ── Colonne gauche : zone éditoriale ── */}
        <div className="flex flex-col justify-center bg-paper px-16 py-20 xl:px-24 2xl:px-32">

          {/* Filet décoratif + eyebrow */}
          <div className="enter flex items-center gap-4 mb-8" style={delay(60)}>
            <span className="block h-px w-8 bg-ash/40" />
            <p className="eyebrow text-ash">Nouvelle Collection</p>
          </div>

          {/* Slogan principal */}
          <h1 className="text-hero font-extralight text-ink leading-[0.95] tracking-[-0.045em]">
            <span className="enter block" style={delay(180)}>Where luxury</span>
            <span
              className="enter block"
              style={{ ...delay(320), paddingLeft: '0.06em' }}
            >
              meets you
            </span>
          </h1>

          {/* Tagline */}
          <p
            className="enter mt-7 text-[0.9375rem] font-light leading-[1.7] text-graphite"
            style={{ ...delay(440), maxWidth: '28rem' }}
          >
            Des pièces rares, pensées pour celles<br />
            qui savent ce qu&apos;elles veulent.
          </p>

          {/* Séparateur */}
          <span className="enter my-9 block h-px w-12 bg-line" style={delay(500)} />

          {/* CTA */}
          <div className="enter" style={delay(580)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir la collection
            </ButtonLink>
          </div>

          {/* Indicateur de scroll */}
          <div
            className="enter mt-auto pt-16 flex items-center gap-4"
            style={delay(720)}
            aria-hidden="true"
          >
            <span
              className="block h-px w-10 origin-left"
              style={{
                background: 'var(--color-ash)',
                opacity: 0.35,
                animation: 'scrollBar 2.2s var(--ease-luxe) infinite',
              }}
            />
            <span className="eyebrow text-[0.55rem] tracking-[0.28em] text-ash/60">
              Défiler
            </span>
          </div>
        </div>

        {/* ── Colonne droite : image ── */}
        {/*
         * La colonne occupe naturellement toute la hauteur de la grille.
         * L'image est positionnée pour centrer le sac (sujet principal).
         * object-top montre le sujet depuis le haut ; object-[40%] centre
         * horizontalement sur le sac sans couper les chaussures en bas.
         */}
        <div className="enter relative overflow-hidden bg-mist" style={delay(100)}>
          <Image
            src="/images/deluxia_banner.jpeg"
            alt="Sac et escarpins brodés DELUXIA — Collection luxe"
            fill
            priority
            className="object-cover object-[42%_8%]"
            sizes="(min-width: 1280px) 56vw, 52vw"
          />

          {/* Filet vertical gauche — séparateur subtil entre les deux colonnes */}
          <div
            className="absolute inset-y-0 left-0 w-px"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.06) 70%, transparent)',
            }}
          />
        </div>
      </section>

      {/* Animation du trait de scroll */}
      <style>{`
        @keyframes scrollBar {
          0%   { transform: scaleX(0); transform-origin: left; opacity: 0; }
          40%  { opacity: 1; }
          80%  { transform: scaleX(1); transform-origin: left; opacity: 0.6; }
          100% { transform: scaleX(1); opacity: 0; }
        }
      `}</style>
    </>
  );
}
