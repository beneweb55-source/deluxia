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
          MOBILE (< lg) — plein écran luxe, texte ancré en bas

          Image centrée sur le sac (sujet principal).
          Texte blanc sur gradient sombre en bas : lisibilité parfaite,
          approche standard des grandes maisons de mode sur mobile.
          Le haut reste clair pour que le header transparent soit lisible.
      ════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative -mt-20 h-svh overflow-hidden lg:hidden"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}
      >
        {/* Image : centrée sur le sac brodé (55% horizontal, 30% vertical) */}
        <Image
          src="/images/deluxia_banner.jpeg"
          alt="DELUXIA Collection — Sac et escarpins brodés"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: '55% 62%' }}
          sizes="100vw"
        />

        {/* Calque 1 — voile clair en haut pour le header transparent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 18%)',
          }}
        />

        {/* Calque 2 — gradient sombre en bas pour la zone texte */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(5,5,5,0.88) 0%, rgba(5,5,5,0.55) 28%, rgba(5,5,5,0) 56%)',
          }}
        />

        {/* Zone texte — ancrée en bas, marges de sécurité pour les pouces */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 sm:px-10 sm:pb-14">

          {/* Slogan */}
          <h1
            className="font-extralight text-white leading-[0.95]"
            style={{ fontSize: 'clamp(2.6rem, 13vw, 4.5rem)', letterSpacing: '-0.04em' }}
          >
            <span className="enter block" style={delay(200)}>Where luxury</span>
            <span
              className="enter block"
              style={{ ...delay(330), paddingLeft: '0.06em' }}
            >
              meets you
            </span>
          </h1>

          {/* Tagline */}
          <p
            className="enter mt-4 text-[0.85rem] font-light leading-relaxed"
            style={{ ...delay(430), color: 'rgba(255,255,255,0.62)' }}
          >
            Des pièces rares, pensées pour celles qui savent ce qu&apos;elles veulent.
          </p>

          {/* CTA + indicateur de scroll */}
          <div className="enter mt-7 flex items-center gap-6" style={delay(540)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir
            </ButtonLink>

            {/* Trait vertical animé */}
            <div className="flex flex-col items-center gap-1.5" aria-hidden="true">
              <span
                className="block w-px origin-top"
                style={{
                  height: '2.5rem',
                  background:
                    'linear-gradient(to bottom, rgba(255,255,255,0.65), rgba(255,255,255,0))',
                  animation: 'mobileScrollLine 2s var(--ease-luxe) infinite',
                }}
              />
            </div>
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
            className="object-cover object-[42%_58%]"
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

      {/* Animations keyframes */}
      <style>{`
        @keyframes scrollBar {
          0%   { transform: scaleX(0); transform-origin: left; opacity: 0; }
          40%  { opacity: 1; }
          80%  { transform: scaleX(1); transform-origin: left; opacity: 0.6; }
          100% { transform: scaleX(1); opacity: 0; }
        }
        @keyframes mobileScrollLine {
          0%   { transform: scaleY(0); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: scaleY(1); opacity: 0; }
        }
      `}</style>
    </>
  );
}
