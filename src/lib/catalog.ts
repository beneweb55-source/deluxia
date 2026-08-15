import 'server-only';

import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { prisma, withRetry } from '@/lib/prisma';

/**
 * Accès au catalogue — toutes les lectures produits passent par ce module.
 *
 * Les objets `select` sont partagés entre les requêtes et les types exposés aux
 * composants : impossible d'afficher un champ qui n'a pas été chargé, et
 * impossible de charger des colonnes inutiles (les descriptions longues ne
 * remontent jamais dans les grilles).
 */

// ─────────────────────────────────────────────────────────────────────────────
// Projections
// ─────────────────────────────────────────────────────────────────────────────

export const productCardSelect = {
  id: true,
  slug: true,
  name: true,
  subtitle: true,
  price: true,
  comparePrice: true,
  images: true,
  isNew: true,
  category: { select: { name: true, slug: true, collection: { select: { slug: true, name: true } } } },
  variants: {
    select: { id: true, size: true, color: true, colorHex: true, stock: true },
    orderBy: [{ position: 'asc' }, { size: 'asc' }],
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export const productDetailSelect = {
  ...productCardSelect,
  description: true,
  composition: true,
  care: true,
  sku: true,
  isFeatured: true,
  createdAt: true,
  category: { select: { id: true, name: true, slug: true, collection: { select: { slug: true, name: true } } } },
} satisfies Prisma.ProductSelect;

export type ProductDetailData = Prisma.ProductGetPayload<{ select: typeof productDetailSelect }>;

/** Un produit est achetable s'il reste au moins une déclinaison en stock. */
export function isInStock(product: { variants: Array<{ stock: number }> }): boolean {
  return product.variants.some((variant) => variant.stock > 0);
}

/** Stock total, utilisé pour les alertes « dernières pièces ». */
export function totalStock(product: { variants: Array<{ stock: number }> }): number {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Requêtes de mise en avant
// ─────────────────────────────────────────────────────────────────────────────

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  return withRetry(() =>
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      select: productCardSelect,
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    }),
  );
}

export async function getNewProducts(limit = 8): Promise<ProductCardData[]> {
  return withRetry(() =>
    prisma.product.findMany({
      where: { isActive: true, isNew: true },
      select: productCardSelect,
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
  );
}

/** Articles dont le prix barré est réellement supérieur au prix de vente. */
export async function getPromoProducts(limit = 24): Promise<ProductCardData[]> {
  const products = await withRetry(() =>
    prisma.product.findMany({
      where: { isActive: true, comparePrice: { not: null } },
      select: productCardSelect,
      orderBy: { createdAt: 'desc' },
      take: limit * 2,
    }),
  );

  // Le filtre « comparePrice > price » n'est pas exprimable simplement dans un
  // `where` Prisma (comparaison entre deux colonnes) : on affine en mémoire.
  return products.filter((p) => p.comparePrice !== null && p.comparePrice > p.price).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<ProductDetailData | null> {
  return withRetry(() =>
    prisma.product.findFirst({
      where: { slug, isActive: true },
      select: productDetailSelect,
    }),
  );
}

/** Produits de la même catégorie, hors produit courant. */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
): Promise<ProductCardData[]> {
  return withRetry(() =>
    prisma.product.findMany({
      where: { isActive: true, categoryId, id: { not: productId } },
      select: productCardSelect,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    }),
  );
}

export async function getProductsBySlugs(slugs: string[]): Promise<ProductCardData[]> {
  if (slugs.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: productCardSelect,
  });

  // Conserve l'ordre demandé (favoris : du plus récemment ajouté au plus ancien).
  const byslug = new Map(products.map((p) => [p.slug, p]));
  return slugs.map((slug) => byslug.get(slug)).filter((p): p is ProductCardData => p !== undefined);
}

// ─────────────────────────────────────────────────────────────────────────────
// Listing filtré (page Boutique et pages catégories)
// ─────────────────────────────────────────────────────────────────────────────

export type SortOption = 'nouveautes' | 'prix-croissant' | 'prix-decroissant' | 'populaires';

export interface CatalogFilters {
  categorySlug?: string;
  collectionSlug?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  onlyPromo?: boolean;
  onlyNew?: boolean;
  onlyInStock?: boolean;
  sort?: SortOption;
}

const ORDER_BY: Record<SortOption, Prisma.ProductOrderByWithRelationInput[]> = {
  nouveautes: [{ createdAt: 'desc' }],
  'prix-croissant': [{ price: 'asc' }],
  'prix-decroissant': [{ price: 'desc' }],
  populaires: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
};

export async function listProducts(filters: CatalogFilters = {}): Promise<ProductCardData[]> {
  const where: Prisma.ProductWhereInput = { isActive: true };

  // Catégorie et univers portent tous deux sur la relation `category` :
  // ils sont fusionnés en un seul filtre pour ne pas s'écraser l'un l'autre.
  if (filters.categorySlug || filters.collectionSlug) {
    where.category = {
      ...(filters.categorySlug ? { slug: filters.categorySlug } : {}),
      ...(filters.collectionSlug ? { collection: { slug: filters.collectionSlug } } : {}),
    };
  }
  if (filters.onlyNew) where.isNew = true;
  if (filters.onlyPromo) where.comparePrice = { not: null };

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    };
  }

  // Tailles, couleurs et disponibilité portent sur les déclinaisons :
  // un `some` unique garantit qu'une même déclinaison satisfait tous les critères
  // (une taille 42 en rupture ne rend pas le produit éligible au filtre « en stock »).
  const variantConditions: Prisma.ProductVariantWhereInput = {};
  if (filters.sizes?.length) variantConditions.size = { in: filters.sizes };
  if (filters.colors?.length) variantConditions.color = { in: filters.colors };
  if (filters.onlyInStock) variantConditions.stock = { gt: 0 };
  if (Object.keys(variantConditions).length > 0) where.variants = { some: variantConditions };

  const products = await withRetry(() =>
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy: ORDER_BY[filters.sort ?? 'nouveautes'],
      take: 96,
    }),
  );

  return filters.onlyPromo
    ? products.filter((p) => p.comparePrice !== null && p.comparePrice > p.price)
    : products;
}

/** Valeurs de filtres réellement présentes dans le catalogue visible. */
export async function getFilterFacets(collectionSlug?: string) {
  const productScope = { isActive: true, ...(collectionSlug ? { category: { collection: { slug: collectionSlug } } } : {}) };

  const [variants, priceRange, categories] = await withRetry(() =>
    Promise.all([
      prisma.productVariant.findMany({
        where: { product: productScope },
        select: { size: true, color: true, colorHex: true },
        distinct: ['size', 'color'],
      }),
      prisma.product.aggregate({
        where: productScope,
        _min: { price: true },
        _max: { price: true },
      }),
      prisma.category.findMany({
        where: { isActive: true, ...(collectionSlug ? { collection: { slug: collectionSlug } } : {}) },
        select: { slug: true, name: true },
        orderBy: { position: 'asc' },
      }),
    ]),
  );

  const colors = new Map<string, string>();
  for (const variant of variants) colors.set(variant.color, variant.colorHex);

  return {
    // Tri numérique quand les tailles sont des pointures, alphabétique sinon.
    sizes: [...new Set(variants.map((v) => v.size))].sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b, 'fr');
    }),
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    minPrice: priceRange._min.price ?? 0,
    maxPrice: priceRange._max.price ?? 0,
    categories,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recherche
// ─────────────────────────────────────────────────────────────────────────────

export async function searchProducts(term: string, limit = 10): Promise<ProductCardData[]> {
  const query = term.trim().split(/\s+/).map(w => `${w}:*`).join(' & ');
  if (query.length < 2) return [];

  return withRetry(() =>
    prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { search: query } },
          { subtitle: { search: query } },
          { description: { search: query } },
          { category: { name: { search: query } } },
          { variants: { some: { color: { search: query } } } },
        ],
      },
      select: productCardSelect,
      orderBy: [{ isFeatured: 'desc' }, { viewCount: 'desc' }],
      take: limit,
    }),
  );
}

/**
 * Collections affichées dans la navigation.
 *
 * Cette lecture alimente l'en-tête et le pied de page, donc **toutes** les pages
 * du site : si elle échoue, plus rien ne s'affiche nulle part, et un build entier
 * peut tomber pour une base momentanément endormie. Elle est donc la lecture la
 * plus critique de l'application, et la première à devoir tolérer une reprise.
 */
// `cache()` dédoublonne l'appel au sein d'un même rendu : l'en-tête (layout) et
// la vitrine des univers (CategoryShowcase) l'invoquent tous deux pour l'accueil,
// et sans cache cela ferait deux requêtes identiques par page — répétées à chaque
// requête sur les pages dynamiques du même layout (connexion, inscription…).
export const getNavCollections = cache(
  async (): Promise<Array<{ name: string; slug: string; imageUrl: string | null }>> => {
    try {
      return await withRetry(() =>
        prisma.collection.findMany({
          orderBy: { position: 'asc' },
          select: { name: true, slug: true, imageUrl: true },
        }),
      );
    } catch (error) {
      // Dernier filet : mieux vaut une navigation réduite aux rubriques fixes
      // qu'un site entièrement indisponible.
      console.error('[navigation] collections illisibles, menu réduit', error);
      return [];
    }
  },
);

/** Collection publique par son slug, ou `null` si elle n'existe pas. */
export async function getCollectionBySlug(slug: string) {
  return withRetry(() =>
    prisma.collection.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, description: true },
    }),
  );
}

export async function getCategories() {
  return withRetry(() =>
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        collection: { select: { id: true, slug: true, name: true } },
        imageUrl: true,
        _count: { select: { products: { where: { isActive: true } } } },
      },
      orderBy: { position: 'asc' },
    }),
  );
}
