'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ProductVisual } from '@/components/ProductVisual';
import { HeartIcon } from '@/components/icons';
import { useCart } from '@/components/providers/CartProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { discountPercent, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface ProductCardItem {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  price: number;
  comparePrice: number | null;
  images: string[];
  isNew: boolean;
  category: { name: string; slug: string };
  variants: Array<{ id: string; size: string; color: string; colorHex: string; stock: number }>;
}

/**
 * Carte produit — brique centrale du catalogue.
 *
 * Deux décisions de conversion :
 *  1. Le second visuel apparaît au survol (fondu enchaîné) : le visiteur voit
 *     deux angles sans ouvrir la fiche, ce qui réduit les allers-retours.
 *  2. Une barre d'ajout rapide propose les tailles disponibles au survol sur
 *     ordinateur. Le chemin le plus court vers le panier fait une seule étape.
 *     Sur mobile, la barre est absente : le pouce ouvre la fiche produit.
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardItem;
  priority?: boolean;
  className?: string;
}) {
  const cart = useCart();
  const favorites = useFavorites();
  const [pendingSize, setPendingSize] = useState<string | null>(null);

  const isFavorite = favorites.ready && favorites.has(product.slug);
  const off = discountPercent(product.price, product.comparePrice);

  const inStock = product.variants.some((v) => v.stock > 0);
  const remaining = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Tailles distinctes, ordonnées comme en base, avec leur disponibilité.
  const sizes = [...new Map(product.variants.map((v) => [v.size, v])).values()];

  const quickAdd = (size: string) => {
    // On prend la première déclinaison en stock pour cette taille.
    const variant = product.variants.find((v) => v.size === size && v.stock > 0);
    if (!variant) return;

    cart.add({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      size: variant.size,
      color: variant.color,
      unitPrice: product.price,
      imageUrl: product.images[0] ?? null,
      categorySlug: product.category.slug,
      stock: variant.stock,
    });

    setPendingSize(size);
    window.setTimeout(() => setPendingSize(null), 1200);
  };

  return (
    <article className={cn('group/card relative', className)}>
      <Link href={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden bg-mist">
          {/* Visuel principal */}
          <div
            className={cn(
              'absolute inset-0 transition-[transform,opacity] duration-[1200ms]',
              '[transition-timing-function:var(--ease-luxe)]',
              'group-hover/card:scale-[1.045]',
              product.images.length > 1 && 'group-hover/card:opacity-0',
            )}
          >
            <ProductVisual
              name={product.name}
              slug={product.slug}
              images={product.images}
              categorySlug={product.category.slug}
              priority={priority}
            />
          </div>

          {/* Second visuel — n'existe que si le produit a plusieurs photos. */}
          {product.images.length > 1 && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-[1200ms] [transition-timing-function:var(--ease-luxe)] group-hover/card:opacity-100">
              <ProductVisual
                name={product.name}
                slug={product.slug}
                images={product.images}
                index={1}
                categorySlug={product.category.slug}
              />
            </div>
          )}

          {!inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-paper/60 backdrop-blur-[1px]">
              <span className="border border-ink px-4 py-2 text-[0.625rem] font-medium uppercase tracking-[0.2em] text-ink">
                Épuisé
              </span>
            </div>
          )}

          {/* ── Badges ─────────────────────────────────────────────────── */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {off !== null && (
              <span className="bg-ink px-2.5 py-1.5 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-paper">
                −{off} %
              </span>
            )}
            {product.isNew && off === null && (
              <span className="border border-ink bg-paper/90 px-2.5 py-1.5 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-ink">
                Nouveau
              </span>
            )}
            {inStock && remaining > 0 && remaining <= 3 && (
              <span className="bg-paper/90 px-2.5 py-1.5 text-[0.5625rem] font-medium uppercase tracking-[0.14em] text-graphite">
                Dernières pièces
              </span>
            )}
          </div>

          {/* ── Ajout rapide (ordinateur) ──────────────────────────────── */}
          {inStock && sizes.length > 0 && (
            <div
              className={cn(
                'pointer-events-none absolute inset-x-2 bottom-2 hidden translate-y-3 opacity-0 lg:block',
                'transition-[opacity,transform] duration-500 [transition-timing-function:var(--ease-luxe)]',
                'group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100',
              )}
              // Empêche la navigation vers la fiche quand on choisit une taille.
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <div className="bg-paper/95 px-2.5 py-2.5 backdrop-blur-sm">
                <p className="mb-2 text-center text-[0.5625rem] font-medium uppercase tracking-[0.16em] text-ash">
                  {pendingSize ? 'Ajouté au panier' : 'Ajout rapide'}
                </p>
                <div className="flex flex-wrap justify-center gap-1">
                  {sizes.map((variant) => {
                    const available = product.variants.some(
                      (v) => v.size === variant.size && v.stock > 0,
                    );
                    return (
                      <button
                        key={variant.size}
                        type="button"
                        disabled={!available}
                        onClick={() => quickAdd(variant.size)}
                        aria-label={
                          available
                            ? `Ajouter ${product.name} en taille ${variant.size} au panier`
                            : `Taille ${variant.size} épuisée`
                        }
                        className={cn(
                          'min-w-8 px-2 py-1.5 text-[0.6875rem] transition-colors duration-200',
                          available
                            ? 'text-ink hover:bg-ink hover:text-paper'
                            : 'cursor-not-allowed text-ash line-through',
                          pendingSize === variant.size && 'bg-ink text-paper',
                        )}
                      >
                        {variant.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Informations ─────────────────────────────────────────────── */}
        <div className="pt-4">
          <p className="text-[0.625rem] uppercase tracking-[0.16em] text-ash">{product.category.name}</p>
          <h3 className="mt-1.5 text-[0.9375rem] font-normal leading-snug text-ink">{product.name}</h3>
          {product.subtitle && (
            <p className="mt-1 line-clamp-1 text-[0.8125rem] text-graphite">{product.subtitle}</p>
          )}
          <p className="mt-2 flex items-baseline gap-2 text-[0.875rem]">
            <span className="text-ink">{formatPrice(product.price)}</span>
            {off !== null && product.comparePrice && (
              <span className="text-[0.8125rem] text-ash line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </p>
        </div>
      </Link>

      {/* Bouton favori — hors du <Link> pour rester un contrôle indépendant. */}
      <button
        type="button"
        onClick={() => favorites.toggle(product.slug)}
        aria-label={isFavorite ? `Retirer ${product.name} des favoris` : `Ajouter ${product.name} aux favoris`}
        aria-pressed={isFavorite}
        className="absolute right-1 top-1 inline-flex h-11 w-11 items-center justify-center text-ink transition-[opacity,transform] duration-300 hover:scale-110 sm:right-2 sm:top-2 sm:h-10 sm:w-10"
      >
        <HeartIcon filled={isFavorite} className="h-[1.05rem] w-[1.05rem] drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]" />
      </button>
    </article>
  );
}
