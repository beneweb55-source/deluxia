'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { ProductVisual } from '@/components/ProductVisual';
import { CloseIcon, SearchIcon } from '@/components/icons';
import { discountPercent, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface SearchHit {
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  categoryName: string;
  categorySlug: string;
}

const SUGGESTIONS = ['Sneakers', 'Bottines', 'Escarpins', 'Sac à main', 'Bandoulière', 'Sac à dos'] as const;

/** Délai d'attente avant requête : assez court pour paraître instantané,
 *  assez long pour ne pas envoyer une requête par frappe. */
const DEBOUNCE_MS = 220;

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus automatique et verrouillage du défilement.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
    document.body.classList.add('scroll-locked');
    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove('scroll-locked');
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Recherche instantanée. `AbortController` annule la requête précédente pour
  // qu'une réponse lente ne vienne jamais écraser un résultat plus récent.
  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setHits([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/recherche?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Recherche indisponible');
        const data = (await response.json()) as { products: SearchHit[] };
        setHits(data.products);
        setSearched(true);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setHits([]);
          setSearched(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHits([]);
      setSearched(false);
    }
  }, [open]);

  // Accepte l'envoi du formulaire comme le clic sur « Voir tous les résultats ».
  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    onClose();
    router.push(`/recherche?q=${encodeURIComponent(term)}`);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] transition-opacity duration-500 [transition-timing-function:var(--ease-luxe)]',
        open ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-hidden={!open}
      // Retire le champ et les suggestions de l'ordre de tabulation tant que la
      // recherche est fermée : l'opacité seule les laisserait accessibles au clavier.
      inert={!open}
    >
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-[3px]" onClick={onClose} />

      <div
        role="dialog"
        aria-modal={open}
        aria-label="Rechercher"
        className={cn(
          'relative max-h-[88vh] overflow-y-auto overscroll-contain bg-paper shadow-[0_24px_80px_rgba(0,0,0,0.14)]',
          'transition-transform duration-[600ms] [transition-timing-function:var(--ease-luxe)]',
          open ? 'translate-y-0' : '-translate-y-6',
        )}
      >
        <div className="shell py-6">
          <form onSubmit={submit} className="flex items-center gap-4 border-b border-line pb-5">
            <SearchIcon className="h-5 w-5 shrink-0 text-ash" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un modèle, une couleur, une matière…"
              aria-label="Rechercher un article"
              className="w-full bg-transparent text-[1.125rem] text-ink outline-none placeholder:text-ash/70 sm:text-[1.5rem]"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer la recherche"
              className="shrink-0 p-2 text-ink transition-opacity hover:opacity-55"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </form>

          {/* ── Suggestions ─────────────────────────────────────────────── */}
          {query.trim().length < 2 && (
            <div className="py-8">
              <p className="eyebrow mb-5">Recherches fréquentes</p>
              <ul className="flex flex-wrap gap-2.5">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => setQuery(suggestion)}
                      className="border border-line px-4 py-2.5 text-[0.75rem] tracking-wide text-graphite transition-colors duration-300 hover:border-ink hover:text-ink"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Résultats ───────────────────────────────────────────────── */}
          {query.trim().length >= 2 && (
            <div className="py-8">
              {loading && hits.length === 0 && (
                <p className="animate-shimmer text-[0.8125rem] text-ash">Recherche en cours…</p>
              )}

              {!loading && searched && hits.length === 0 && (
                <div className="py-6">
                  <p className="text-[1.125rem] font-light text-ink">
                    Aucun article ne correspond à « {query.trim()} ».
                  </p>
                  <p className="mt-2 text-[0.875rem] text-graphite">
                    Essayez un terme plus court, ou{' '}
                    <Link href="/boutique" onClick={onClose} className="link-underline text-ink">
                      parcourez toute la collection
                    </Link>
                    .
                  </p>
                </div>
              )}

              {hits.length > 0 && (
                <>
                  <p className="eyebrow mb-5">
                    {hits.length} résultat{hits.length > 1 ? 's' : ''}
                  </p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
                    {hits.map((hit) => {
                      const off = discountPercent(hit.price, hit.comparePrice);
                      return (
                        <li key={hit.slug}>
                          <Link href={`/produit/${hit.slug}`} onClick={onClose} className="group block">
                            <div className="relative aspect-4/5 overflow-hidden bg-mist">
                              <ProductVisual
                                name={hit.name}
                                slug={hit.slug}
                                images={hit.images}
                                categorySlug={hit.categorySlug}
                                sizes="(max-width: 640px) 45vw, 20vw"
                                className="transition-transform duration-[1100ms] [transition-timing-function:var(--ease-luxe)] group-hover:scale-[1.04]"
                              />
                            </div>
                            <p className="mt-3 text-[0.8125rem] leading-snug text-ink">{hit.name}</p>
                            <p className="mt-1 text-[0.8125rem] text-graphite">
                              {formatPrice(hit.price)}
                              {off !== null && (
                                <span className="ml-2 text-ash line-through">
                                  {formatPrice(hit.comparePrice!)}
                                </span>
                              )}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-8 border-t border-line pt-6">
                    <button
                      type="button"
                      onClick={submit}
                      className="link-underline text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink"
                    >
                      Voir tous les résultats
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
