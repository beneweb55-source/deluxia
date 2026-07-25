'use client';

import { useMemo, useState } from 'react';
import { SizeGuide } from '@/components/product/SizeGuide';
import { Button } from '@/components/ui/Button';
import { CheckIcon, HeartIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { useCart } from '@/components/providers/CartProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { discountPercent, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface PurchaseVariant {
  id: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
}

/** En dessous de ce seuil, la rareté est signalée au visiteur. */
const LOW_STOCK_THRESHOLD = 3;

/**
 * Panneau d'achat — couleur, taille, quantité, ajout au panier.
 *
 * Choix de conversion : la taille n'est pas présélectionnée quand il y en a
 * plusieurs. Un ajout au panier dans la mauvaise pointure se termine en retour,
 * ce qui coûte plus cher qu'une seconde d'hésitation. En revanche, s'il n'existe
 * qu'une taille disponible, elle est choisie d'office — inutile de faire cliquer
 * le visiteur sur un choix unique.
 */
export function PurchasePanel({
  productId,
  slug,
  name,
  price,
  comparePrice,
  images,
  categorySlug,
  variants,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  categorySlug: string;
  variants: PurchaseVariant[];
}) {
  const cart = useCart();
  const favorites = useFavorites();

  const colors = useMemo(() => {
    const map = new Map<string, { name: string; hex: string; stock: number }>();
    for (const variant of variants) {
      const entry = map.get(variant.color);
      if (entry) entry.stock += variant.stock;
      else map.set(variant.color, { name: variant.color, hex: variant.colorHex, stock: variant.stock });
    }
    return [...map.values()];
  }, [variants]);

  const [color, setColor] = useState(
    () => colors.find((c) => c.stock > 0)?.name ?? colors[0]?.name ?? '',
  );

  const sizesForColor = useMemo(
    () => variants.filter((variant) => variant.color === color),
    [variants, color],
  );

  const availableSizes = sizesForColor.filter((variant) => variant.stock > 0);

  const [size, setSize] = useState<string | null>(
    () => (availableSizes.length === 1 ? (availableSizes[0]?.size ?? null) : null),
  );

  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selectedVariant = sizesForColor.find((variant) => variant.size === size) ?? null;
  const inStock = variants.some((variant) => variant.stock > 0);
  const off = discountPercent(price, comparePrice);

  const chooseColor = (next: string) => {
    setColor(next);
    // La taille retenue peut ne pas exister dans le nouveau coloris.
    const sizes = variants.filter((variant) => variant.color === next && variant.stock > 0);
    setSize(sizes.length === 1 ? (sizes[0]?.size ?? null) : null);
    setQuantity(1);
    setError(null);
  };

  const chooseSize = (next: string) => {
    setSize(next);
    setQuantity(1);
    setError(null);
  };

  const submit = () => {
    if (!selectedVariant || selectedVariant.stock === 0) {
      setError('Choisissez une taille disponible pour continuer.');
      return;
    }

    cart.add({
      productId,
      variantId: selectedVariant.id,
      slug,
      name,
      size: selectedVariant.size,
      color: selectedVariant.color,
      unitPrice: price,
      imageUrl: images[0] ?? null,
      categorySlug,
      stock: selectedVariant.stock,
      quantity,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 2000);
  };

  const maxQuantity = Math.min(selectedVariant?.stock ?? 1, 10);

  return (
    <div>
      {/* ── Prix ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <span className="text-[1.5rem] font-light text-ink">{formatPrice(price)}</span>
        {off !== null && comparePrice && (
          <>
            <span className="text-[1rem] text-ash line-through">{formatPrice(comparePrice)}</span>
            <span className="bg-ink px-2.5 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.16em] text-paper">
              −{off} %
            </span>
          </>
        )}
      </div>
      <p className="mt-2 text-[0.75rem] text-ash">Prix TTC · Paiement à la livraison</p>

      {/* ── Couleur ──────────────────────────────────────────────────────── */}
      {colors.length > 1 && (
        <fieldset className="mt-9">
          <legend className="eyebrow mb-4 text-ink">
            Couleur — <span className="text-graphite">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {colors.map((entry) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => chooseColor(entry.name)}
                aria-pressed={color === entry.name}
                aria-label={`${entry.name}${entry.stock === 0 ? ' — épuisé' : ''}`}
                title={entry.name}
                className={cn(
                  // 44 px : la pastille de couleur reste discrète, mais la zone
                  // de contact respecte le minimum recommandé au doigt.
                  'relative h-11 w-11 rounded-full border transition-[border-color,transform] duration-300',
                  color === entry.name
                    ? 'border-ink scale-105'
                    : 'border-line hover:border-graphite',
                  entry.stock === 0 && 'opacity-40',
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-1.5 rounded-full"
                  style={{ backgroundColor: entry.hex }}
                />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {/* ── Taille ───────────────────────────────────────────────────────── */}
      {sizesForColor.length > 0 && (
        <fieldset className="mt-9">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <legend className="eyebrow text-ink">Taille</legend>
            <SizeGuide />
          </div>

          <div className="flex flex-wrap gap-2">
            {sizesForColor.map((variant) => {
              const soldOut = variant.stock === 0;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => chooseSize(variant.size)}
                  aria-pressed={size === variant.size}
                  aria-label={`Taille ${variant.size}${soldOut ? ' — épuisée' : ''}`}
                  className={cn(
                    'min-w-14 border px-4 py-3 text-[0.875rem] transition-colors duration-200',
                    size === variant.size
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink hover:border-ink',
                    soldOut && 'cursor-not-allowed border-line/60 text-ash line-through hover:border-line/60',
                  )}
                >
                  {variant.size}
                </button>
              );
            })}
          </div>

          {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= LOW_STOCK_THRESHOLD && (
            <p className="mt-4 text-[0.8125rem] text-ink">
              Plus que {selectedVariant.stock} pièce{selectedVariant.stock > 1 ? 's' : ''} dans cette
              taille.
            </p>
          )}
        </fieldset>
      )}

      {/* ── Quantité ─────────────────────────────────────────────────────── */}
      {inStock && (
        <div className="mt-9">
          <p className="eyebrow mb-4 text-ink">Quantité</p>
          <div className="inline-flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Diminuer la quantité"
              className="flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-55 disabled:opacity-25"
            >
              <MinusIcon className="h-3.5 w-3.5" />
            </button>
            <span aria-live="polite" className="w-12 text-center text-[0.9375rem] text-ink">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={!selectedVariant || quantity >= maxQuantity}
              aria-label="Augmenter la quantité"
              className="flex h-11 w-11 items-center justify-center text-ink transition-opacity hover:opacity-55 disabled:opacity-25"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Action ───────────────────────────────────────────────────────── */}
      <div className="mt-9 flex gap-3">
        <Button
          size="lg"
          fullWidth
          onClick={submit}
          disabled={!inStock}
          aria-describedby={error ? 'purchase-error' : undefined}
        >
          {!inStock ? (
            'Article épuisé'
          ) : added ? (
            <>
              <CheckIcon className="h-3.5 w-3.5" strokeWidth="2" />
              Ajouté au panier
            </>
          ) : (
            'Ajouter au panier'
          )}
        </Button>

        <button
          type="button"
          onClick={() => favorites.toggle(slug)}
          aria-pressed={favorites.ready && favorites.has(slug)}
          aria-label={
            favorites.ready && favorites.has(slug) ? 'Retirer des favoris' : 'Ajouter aux favoris'
          }
          className="flex h-14 w-14 shrink-0 items-center justify-center border border-line text-ink transition-colors duration-300 hover:border-ink"
        >
          <HeartIcon filled={favorites.ready && favorites.has(slug)} className="h-[1.15rem] w-[1.15rem]" />
        </button>
      </div>

      <p
        id="purchase-error"
        role={error ? 'alert' : undefined}
        className={cn(
          'mt-3 text-[0.8125rem] transition-opacity duration-300',
          error ? 'text-ink opacity-100' : 'h-0 opacity-0',
        )}
      >
        {error}
      </p>
    </div>
  );
}
