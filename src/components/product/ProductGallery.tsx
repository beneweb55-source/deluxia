'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ProductVisual } from '@/components/ProductVisual';
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * Galerie produit.
 *
 * ▸ Ordinateur : le survol agrandit le visuel autour du curseur (zoom loupe),
 *   le clic ouvre le plein écran.
 * ▸ Mobile : défilement horizontal avec accroche, pastilles de position.
 *
 * La galerie fonctionne avec un seul visuel comme avec dix : tant que le client
 * n'a pas fourni ses photos, elle affiche les compositions générées, et le jour
 * où il en ajoute, rien ne change dans le code appelant.
 */
export function ProductGallery({
  name,
  slug,
  images,
  categorySlug,
}: {
  name: string;
  slug: string;
  images: string[];
  categorySlug: string;
}) {
  // Sans photo réelle, on compose trois cadrages différents du visuel généré.
  const frames = images.length > 0 ? images.map((_, i) => i) : [0, 1, 2];

  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [lightbox, setLightbox] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = stageRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  const step = (delta: number) =>
    setActive((current) => (current + delta + frames.length) % frames.length);

  // Navigation clavier dans le plein écran.
  useEffect(() => {
    if (!lightbox) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightbox(false);
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };

    document.body.classList.add('scroll-locked');
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('scroll-locked');
      document.removeEventListener('keydown', onKeyDown);
    };
    // `step` est stable dans les faits (setState fonctionnel) : pas de dépendance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, frames.length]);

  return (
    <>
      <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-6">
        {/* ── Vignettes ─────────────────────────────────────────────────── */}
        {frames.length > 1 && (
          <ul className="flex gap-3 lg:w-20 lg:shrink-0 lg:flex-col">
            {frames.map((frame, index) => (
              <li key={frame} className="flex-1 lg:flex-none">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Voir le visuel ${index + 1} sur ${frames.length}`}
                  aria-current={active === index}
                  className={cn(
                    'relative block aspect-4/5 w-full overflow-hidden bg-mist transition-opacity duration-300',
                    active === index ? 'opacity-100 ring-1 ring-ink' : 'opacity-55 hover:opacity-85',
                  )}
                >
                  <ProductVisual
                    name={name}
                    slug={slug}
                    images={images}
                    index={index}
                    categorySlug={categorySlug}
                    sizes="80px"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* ── Scène principale ──────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <div
            ref={stageRef}
            onPointerMove={onPointerMove}
            onPointerEnter={() => setZoomed(true)}
            onPointerLeave={() => setZoomed(false)}
            onClick={() => setLightbox(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setLightbox(true);
              }
            }}
            aria-label={`${name} — agrandir le visuel`}
            className="relative aspect-4/5 cursor-zoom-in overflow-hidden bg-mist"
          >
            <div
              className="absolute inset-0 transition-transform duration-700 [transition-timing-function:var(--ease-luxe)] motion-reduce:transform-none"
              style={{ transform: zoomed ? 'scale(1.6)' : 'scale(1)', transformOrigin: origin }}
            >
              <ProductVisual
                name={name}
                slug={slug}
                images={images}
                index={active}
                categorySlug={categorySlug}
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>

            <span className="pointer-events-none absolute bottom-4 right-4 bg-paper/85 px-3 py-2 text-[0.5625rem] uppercase tracking-[0.16em] text-graphite">
              Cliquer pour agrandir
            </span>
          </div>

          {/* Pastilles de position (mobile). Le trait ne fait qu'un pixel de
              haut, mais la zone cliquable en fait quarante-quatre : viser un
              trait de 1 px au pouce est impossible. */}
          {frames.length > 1 && (
            <div className="mt-1 flex justify-center lg:hidden">
              {frames.map((frame, index) => (
                <button
                  key={frame}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Voir le visuel ${index + 1} sur ${frames.length}`}
                  aria-current={active === index}
                  className="group flex h-11 w-11 items-center justify-center"
                >
                  <span
                    className={cn(
                      'block h-1 w-8 transition-colors duration-300',
                      active === index ? 'bg-ink' : 'bg-line group-hover:bg-ash',
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Plein écran ─────────────────────────────────────────────────── */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — visuels`}
          className="fixed inset-0 z-[90] flex animate-fade-in flex-col bg-paper"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-graphite">
              {active + 1} / {frames.length}
            </p>
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="Fermer"
              autoFocus
              className="p-2 text-ink transition-opacity hover:opacity-55"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-10">
            <div className="relative h-full w-full max-w-3xl">
              <ProductVisual
                name={name}
                slug={slug}
                images={images}
                index={active}
                categorySlug={categorySlug}
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {frames.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Visuel précédent"
                  className="absolute left-3 top-1/2 -translate-y-1/2 border border-line bg-paper p-3 text-ink transition-colors hover:border-ink sm:left-6"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Visuel suivant"
                  className="absolute right-3 top-1/2 -translate-y-1/2 border border-line bg-paper p-3 text-ink transition-colors hover:border-ink sm:right-6"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
