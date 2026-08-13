import type { CSSProperties } from 'react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';

const delay = (ms: number) => ({ '--enter-delay': `${ms}ms` }) as CSSProperties;

/**
 * Hero pleine largeur — l'image couvre tout l'écran (100dvh) sur desktop et mobile.
 *
 * Technique plein-bleed sans overflow-x :
 * On utilise un wrapper à hauteur 0 avec position relative, puis un enfant
 * absolute qui s'étend de left-0 à right-0, ignorant ainsi les paddings du
 * shell parent, sans jamais déborder le viewport horizontalement.
 *
 * Sur desktop : le header mesure h-24 (96px) et est sticky transparent.
 * Le -mt-24 remonte la section derrière lui ; le texte est décalé via pt-24.
 */
export function Hero() {
  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          VERSION MOBILE (< lg)
          Plein écran, image de fond, slogan en zone claire haute-gauche.
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative -mt-20 h-svh overflow-hidden lg:hidden"
        style={{
          /* Plein-bleed sans w-screen : sort du padding du shell parent */
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
        }}
      >
        <Image
          src="/images/deluxia_banner.jpeg"
          alt="DELUXIA Collection"
          fill
          priority
          className="object-cover object-[60%_top]"
          sizes="100vw"
        />

        {/* Voile léger en haut pour lisibilité du header transparent */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 22%)',
          }}
        />

        {/* Slogan dans la zone claire haute-gauche, sous le header (80px) */}
        <div className="absolute inset-x-0 top-0 z-10 px-5 pt-24 sm:px-8 sm:pt-28">
          <h1 className="text-hero font-extralight text-ink drop-shadow-sm">
            <span className="enter block" style={delay(180)}>Where luxury</span>
            <span className="enter block pl-[0.08em]" style={delay(300)}>meets you</span>
          </h1>
          <div className="enter mt-7 sm:mt-9" style={delay(460)}>
            <ButtonLink href="/collections" size="lg">
              Découvrir la collection
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          VERSION DESKTOP (≥ lg)
          Plein-bleed via wrapper 0-height + enfant absolute.
          L'image occupe tout le viewport (100dvh).
          Le header desktop est h-24 (96px) et transparent au repos.
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="relative hidden lg:block"
        style={{
          /* Le hero remonte sous le header transparent */
          marginTop: '-6rem', /* = h-24 = 96px */
          height: '100dvh',
          /* Plein-bleed : sort des marges du shell sans w-screen */
          width: '100vw',
          marginLeft: 'calc(50% - 50vw)',
        }}
      >
        {/* ── Image de fond ─────────────────────────────────────────────── */}
        <Image
          src="/images/deluxia_banner.jpeg"
          alt="DELUXIA Collection — Nouvelle collection"
          fill
          priority
          /*
           * object-position: 68% center
           * L'image est portrait (840×1400 px) affichée sur un écran 16:9.
           * À 50% (center) le sac est centré ; à 68% le sac reste visible
           * à droite tout en laissant la zone blanche à gauche pour le texte.
           */
          className="object-cover"
          style={{ objectPosition: '68% center' }}
          sizes="100vw"
        />

        {/* ── Voile gauche : renforce la lisibilité du texte ────────────── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              /* Gradient horizontal : zone texte à gauche */
              'linear-gradient(to right, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0) 55%)',
              /* Gradient vertical : lisibilité du header au sommet */
              'linear-gradient(to bottom, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 15%)',
            ].join(', '),
          }}
        />

        {/* ── Bloc éditorial — zone claire gauche ───────────────────────── */}
        {/*
         * pt-24 = compense le header (96px) pour que le texte ne passe
         * pas derrière le logo/menu. La section est déjà remontée via
         * marginTop négatif, donc la hauteur totale reste 100dvh.
         */}
        <div
          className="absolute inset-0 z-10 flex flex-col justify-center"
          style={{ paddingLeft: 'max(6vw, 3rem)', paddingRight: '55%' }}
        >
          {/* Eyebrow */}
          <p className="enter eyebrow text-graphite mb-7" style={delay(80)}>
            Nouvelle Collection
          </p>

          {/* Slogan */}
          <h1 className="text-hero font-extralight text-ink leading-[1.0]">
            <span className="enter block" style={delay(200)}>Where luxury</span>
            <span className="enter block pl-[0.06em]" style={delay(340)}>meets you</span>
          </h1>

          {/* Tagline */}
          <p
            className="enter mt-6 text-[0.875rem] font-light leading-relaxed text-graphite"
            style={{ ...delay(440), maxWidth: '26rem' }}
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

        {/* ── Indicateur de scroll ──────────────────────────────────────── */}
        <div
          className="enter absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-3"
          style={delay(700)}
          aria-hidden="true"
        >
          <span className="eyebrow text-[0.5rem] tracking-[0.28em] text-ash">
            Défiler
          </span>
          <span
            className="block h-9 w-px origin-top"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0))',
              animation: 'scrollLine 2s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes scrollLine {
              0%   { transform: scaleY(0); opacity: 0; }
              25%  { opacity: 1; }
              100% { transform: scaleY(1); opacity: 0; }
            }
          `}</style>
        </div>
      </div>
    </>
  );
}
