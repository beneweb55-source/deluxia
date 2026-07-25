'use client';

import { useEffect, useState } from 'react';
import { ProductRail } from '@/components/ProductRail';
import { SectionHeading } from '@/components/SectionHeading';
import type { ProductCardItem } from '@/components/ProductCard';

const STORAGE_KEY = 'deluxia.recent.v1';
const MAX_ITEMS = 8;

/** Enregistre le produit consulté en tête de l'historique local. */
function remember(slug: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const previous = Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
    const next = [slug, ...previous.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [slug];
  }
}

/**
 * « Récemment consultés ».
 *
 * L'historique est local ; seuls les slugs sont conservés. Les fiches complètes
 * sont ensuite récupérées auprès du serveur, ce qui garantit des prix et des
 * stocks à jour — un produit vu il y a trois semaines ne réapparaît jamais avec
 * un prix périmé, ni après avoir été retiré de la vente.
 */
export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [products, setProducts] = useState<ProductCardItem[]>([]);

  useEffect(() => {
    const history = remember(currentSlug).filter((slug) => slug !== currentSlug);
    if (history.length === 0) return;

    const controller = new AbortController();

    fetch(`/api/produits?slugs=${encodeURIComponent(history.join(','))}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('indisponible'))))
      .then((data: { products: ProductCardItem[] }) => setProducts(data.products))
      .catch(() => {
        // Silencieux : cette section est un bonus, son absence ne doit rien casser.
      });

    return () => controller.abort();
  }, [currentSlug]);

  if (products.length === 0) return null;

  return (
    <section className="shell py-(--spacing-section)">
      <SectionHeading eyebrow="Votre visite" title="Récemment consultés" className="mb-12" />
      <ProductRail products={products} ariaLabel="Produits récemment consultés" />
    </section>
  );
}
