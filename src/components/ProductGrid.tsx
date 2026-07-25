import type { CSSProperties, ReactNode } from 'react';
import { ProductCard, type ProductCardItem } from '@/components/ProductCard';
import { cn } from '@/lib/utils';

/**
 * Grille produits. Le décalage d'apparition (`--reveal-delay`) est limité aux
 * huit premières cartes : au-delà, l'attente cumulée deviendrait perceptible
 * et donnerait une impression de lenteur.
 */
export function ProductGrid({
  products,
  columns = 4,
  priorityCount = 4,
  className,
}: {
  products: ProductCardItem[];
  columns?: 3 | 4;
  priorityCount?: number;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6',
        columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        'md:grid-cols-3',
        className,
      )}
    >
      {products.map((product, index) => (
        <li
          key={product.id}
          className="reveal"
          style={{ '--reveal-delay': `${Math.min(index, 7) * 70}ms` } as CSSProperties}
        >
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}

/** Message affiché quand une grille ne renvoie aucun résultat. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="reveal flex flex-col items-center border border-line px-8 py-20 text-center">
      <span className="h-px w-12 bg-line" />
      <p className="mt-7 text-[1.25rem] font-light text-ink">{title}</p>
      <p className="mt-3 max-w-md text-[0.875rem] leading-relaxed text-graphite">{description}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
