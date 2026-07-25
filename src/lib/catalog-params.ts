import type { CatalogFilters, SortOption } from '@/lib/catalog';

/** Forme brute des paramètres d'URL fournis par Next.js. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

const SORTS: readonly SortOption[] = [
  'nouveautes',
  'prix-croissant',
  'prix-decroissant',
  'populaires',
];

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | string[] | undefined): string[] | undefined {
  const raw = single(value);
  if (!raw) return undefined;
  const values = raw.split(',').map((v) => v.trim()).filter(Boolean);
  return values.length > 0 ? values : undefined;
}

function positiveInt(value: string | string[] | undefined): number | undefined {
  const raw = single(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : undefined;
}

/**
 * Traduit les paramètres d'URL en filtres de catalogue.
 *
 * Toute valeur inattendue est ignorée plutôt que propagée : un paramètre
 * bricolé à la main (`?tri=<script>`) retombe silencieusement sur le tri par
 * défaut au lieu d'atteindre la couche base de données.
 */
export function parseCatalogParams(params: RawSearchParams): CatalogFilters {
  const sort = single(params.tri);

  return {
    categorySlug: single(params.categorie),
    sizes: list(params.taille),
    colors: list(params.couleur),
    minPrice: positiveInt(params.min),
    maxPrice: positiveInt(params.max),
    onlyInStock: single(params.stock) === '1',
    sort: SORTS.includes(sort as SortOption) ? (sort as SortOption) : 'nouveautes',
  };
}
