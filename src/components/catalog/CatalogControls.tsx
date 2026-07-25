'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState, useTransition, type ReactNode } from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface CatalogFacets {
  sizes: string[];
  colors: Array<{ name: string; hex: string }>;
  minPrice: number;
  maxPrice: number;
  categories: Array<{ slug: string; name: string }>;
}

const SORT_OPTIONS = [
  { value: 'nouveautes', label: 'Nouveautés' },
  { value: 'prix-croissant', label: 'Prix croissant' },
  { value: 'prix-decroissant', label: 'Prix décroissant' },
  { value: 'populaires', label: 'Les plus consultés' },
] as const;

/**
 * Barre de filtres du catalogue.
 *
 * L'état vit dans l'URL, pas dans le composant : un tri ou un filtre peut être
 * partagé, mis en favori et retrouvé avec le bouton « précédent ». La page reste
 * rendue côté serveur — le filtrage se fait en base, pas dans le navigateur, ce
 * qui reste rapide même avec plusieurs centaines de références.
 */
export function CatalogControls({
  facets,
  total,
  showCategories = true,
}: {
  facets: CatalogFacets;
  total: number;
  showCategories?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => ({
      sizes: params.get('taille')?.split(',').filter(Boolean) ?? [],
      colors: params.get('couleur')?.split(',').filter(Boolean) ?? [],
      categories: params.get('categorie')?.split(',').filter(Boolean) ?? [],
      max: params.get('max') ? Number(params.get('max')) : null,
      inStock: params.get('stock') === '1',
      sort: params.get('tri') ?? 'nouveautes',
    }),
    [params],
  );

  const activeCount =
    selected.sizes.length +
    selected.colors.length +
    selected.categories.length +
    (selected.max !== null ? 1 : 0) +
    (selected.inStock ? 1 : 0);

  /** Réécrit l'URL sans recharger la page ; `scroll: false` garde la position. */
  const apply = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const toggleValue = (key: string, value: string) => {
    apply((next) => {
      const current = next.get(key)?.split(',').filter(Boolean) ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length > 0) next.set(key, updated.join(','));
      else next.delete(key);
    });
  };

  const clearAll = () =>
    apply((next) => {
      for (const key of ['taille', 'couleur', 'categorie', 'max', 'stock']) next.delete(key);
    });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-y border-line py-1.5">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            // Hauteur portée à 44 px : c'est la commande principale du catalogue
            // sur mobile, elle ne peut pas être un simple texte de 17 pixels.
            className="inline-flex min-h-11 items-center gap-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink transition-opacity hover:opacity-60"
          >
            Filtrer
            {activeCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.5625rem] leading-none text-paper">
                {activeCount}
              </span>
            )}
          </button>

          <span aria-live="polite" className={cn('text-[0.75rem] text-ash transition-opacity', isPending && 'opacity-40')}>
            {total} article{total > 1 ? 's' : ''}
          </span>
        </div>

        <label className="flex min-h-11 items-center gap-3">
          <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-ash">Trier</span>
          <select
            value={selected.sort}
            onChange={(event) =>
              apply((next) => {
                if (event.target.value === 'nouveautes') next.delete('tri');
                else next.set('tri', event.target.value);
              })
            }
            aria-label="Trier les articles"
            className="min-h-11 cursor-pointer border-0 bg-transparent pr-6 text-[1rem] text-ink outline-none sm:text-[0.75rem] [&>option]:bg-paper [&>option]:text-ink"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Filtres actifs — retirables d'un clic, sans rouvrir le panneau. */}
      {activeCount > 0 && (
        <ul className="flex flex-wrap items-center gap-2 py-4">
          {[
            ...selected.categories.map((v) => ({ key: 'categorie', value: v, label: facets.categories.find((c) => c.slug === v)?.name ?? v })),
            ...selected.sizes.map((v) => ({ key: 'taille', value: v, label: `Taille ${v}` })),
            ...selected.colors.map((v) => ({ key: 'couleur', value: v, label: v })),
          ].map((chip) => (
            <li key={`${chip.key}-${chip.value}`}>
              <button
                type="button"
                onClick={() => toggleValue(chip.key, chip.value)}
                className="inline-flex items-center gap-2 border border-line px-3 py-2 text-[0.6875rem] text-graphite transition-colors hover:border-ink hover:text-ink"
              >
                {chip.label}
                <CloseIcon className="h-2.5 w-2.5" />
              </button>
            </li>
          ))}

          {selected.max !== null && (
            <li>
              <button
                type="button"
                onClick={() => apply((next) => next.delete('max'))}
                className="inline-flex items-center gap-2 border border-line px-3 py-2 text-[0.6875rem] text-graphite transition-colors hover:border-ink hover:text-ink"
              >
                Jusqu'à {formatPrice(selected.max)}
                <CloseIcon className="h-2.5 w-2.5" />
              </button>
            </li>
          )}

          {selected.inStock && (
            <li>
              <button
                type="button"
                onClick={() => apply((next) => next.delete('stock'))}
                className="inline-flex items-center gap-2 border border-line px-3 py-2 text-[0.6875rem] text-graphite transition-colors hover:border-ink hover:text-ink"
              >
                En stock
                <CloseIcon className="h-2.5 w-2.5" />
              </button>
            </li>
          )}

          <li>
            <button
              type="button"
              onClick={clearAll}
              className="link-underline px-1 text-[0.6875rem] uppercase tracking-[0.14em] text-ink"
            >
              Tout effacer
            </button>
          </li>
        </ul>
      )}

      {/* ── Panneau de filtres ────────────────────────────────────────────── */}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        title="Filtrer"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" fullWidth onClick={clearAll} disabled={activeCount === 0}>
              Réinitialiser
            </Button>
            <Button fullWidth onClick={() => setOpen(false)}>
              Voir {total} article{total > 1 ? 's' : ''}
            </Button>
          </div>
        }
      >
        <div className="space-y-10 px-6 py-8">
          {showCategories && facets.categories.length > 1 && (
            <FilterGroup title="Catégorie">
              <ul className="space-y-3">
                {facets.categories.map((category) => (
                  <li key={category.slug}>
                    <Checkbox
                      checked={selected.categories.includes(category.slug)}
                      onChange={() => toggleValue('categorie', category.slug)}
                      label={category.name}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>
          )}

          {facets.sizes.length > 0 && (
            <FilterGroup title="Taille">
              <div className="flex flex-wrap gap-2">
                {facets.sizes.map((size) => {
                  const active = selected.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleValue('taille', size)}
                      aria-pressed={active}
                      className={cn(
                        'min-w-11 border px-3 py-2.5 text-[0.8125rem] transition-colors duration-200',
                        active
                          ? 'border-ink bg-ink text-paper'
                          : 'border-line text-ink hover:border-ink',
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>
          )}

          {facets.colors.length > 0 && (
            <FilterGroup title="Couleur">
              <ul className="space-y-3">
                {facets.colors.map((color) => (
                  <li key={color.name}>
                    <Checkbox
                      checked={selected.colors.includes(color.name)}
                      onChange={() => toggleValue('couleur', color.name)}
                      label={color.name}
                      swatch={color.hex}
                    />
                  </li>
                ))}
              </ul>
            </FilterGroup>
          )}

          {facets.maxPrice > facets.minPrice && (
            <FilterGroup title="Prix maximum">
              <input
                type="range"
                min={facets.minPrice}
                max={facets.maxPrice}
                step={500}
                value={selected.max ?? facets.maxPrice}
                aria-label="Prix maximum"
                onChange={(event) =>
                  apply((next) => {
                    const value = Number(event.target.value);
                    if (value >= facets.maxPrice) next.delete('max');
                    else next.set('max', String(value));
                  })
                }
                className="w-full accent-[var(--color-ink)]"
              />
              <div className="mt-3 flex justify-between text-[0.75rem] text-ash">
                <span>{formatPrice(facets.minPrice)}</span>
                <span className="text-ink">{formatPrice(selected.max ?? facets.maxPrice)}</span>
              </div>
            </FilterGroup>
          )}

          <FilterGroup title="Disponibilité">
            <Checkbox
              checked={selected.inStock}
              onChange={() =>
                apply((next) => {
                  if (selected.inStock) next.delete('stock');
                  else next.set('stock', '1');
                })
              }
              label="Uniquement les articles en stock"
            />
          </FilterGroup>
        </div>
      </Drawer>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="eyebrow mb-5 text-ink">{title}</h3>
      {children}
    </section>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  swatch,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  swatch?: string;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-200',
          checked ? 'border-ink bg-ink text-paper' : 'border-line group-hover:border-ink',
        )}
      >
        {checked && <CheckIcon className="h-2.5 w-2.5" strokeWidth="2.4" />}
      </span>

      {swatch && (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 rounded-full border border-line"
          style={{ backgroundColor: swatch }}
        />
      )}

      <span className="text-[0.875rem] text-ink">{label}</span>
    </label>
  );
}
