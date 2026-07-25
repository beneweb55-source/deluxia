'use client';

import { useEffect, useState } from 'react';
import { ProductGrid, EmptyState } from '@/components/ProductGrid';
import { ButtonLink } from '@/components/ui/Button';
import type { ProductCardItem } from '@/components/ProductCard';
import { useFavorites } from '@/components/providers/FavoritesProvider';

/**
 * Page Favoris.
 *
 * Seuls les slugs sont conservés localement : les fiches sont rechargées depuis
 * le serveur à chaque visite. Un favori ajouté il y a un mois affiche donc son
 * prix actuel, et un article retiré de la vente disparaît de lui-même de la
 * liste plutôt que de mener à une page introuvable.
 */
export function FavoritesView() {
  const favorites = useFavorites();
  const [products, setProducts] = useState<ProductCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!favorites.ready) return;

    if (favorites.slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/produits?slugs=${encodeURIComponent(favorites.slugs.join(','))}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('indisponible'))))
      .then((data: { products: ProductCardItem[] }) => setProducts(data.products))
      .catch((error: Error) => {
        if (error.name !== 'AbortError') setProducts([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [favorites.ready, favorites.slugs]);

  if (!favorites.ready || loading) {
    return <div className="shell min-h-[40vh] pb-(--spacing-section)" aria-hidden="true" />;
  }

  if (products.length === 0) {
    return (
      <div className="shell pb-(--spacing-section)">
        <EmptyState
          title="Aucun favori pour l'instant"
          description="Touchez le cœur sur un article pour le retrouver ici, sur cet appareil, aussi longtemps que vous le souhaitez."
          action={<ButtonLink href="/boutique">Découvrir la collection</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="shell pb-(--spacing-section)">
      <div className="mb-10 flex items-center justify-between border-y border-line py-4">
        <span className="text-[0.75rem] text-ash">
          {products.length} article{products.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={favorites.clear}
          className="link-underline text-[0.6875rem] uppercase tracking-[0.14em] text-ash hover:text-ink"
        >
          Tout retirer
        </button>
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
