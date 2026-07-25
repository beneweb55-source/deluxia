import { ProductCard, type ProductCardItem } from '@/components/ProductCard';

/**
 * Rail horizontal — utilisé pour les nouveautés, les produits similaires et les
 * articles récemment consultés.
 *
 * Le défilement est natif (`overflow-x-auto` + `scroll-snap`) plutôt que piloté
 * par un carrousel JavaScript : le geste est celui que le visiteur connaît déjà
 * sur mobile, la molette et le clavier fonctionnent, et cela n'ajoute rien au
 * bundle.
 */
export function ProductRail({
  products,
  ariaLabel,
}: {
  products: ProductCardItem[];
  ariaLabel: string;
}) {
  if (products.length === 0) return null;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className="no-scrollbar -mx-(--spacing-gutter) overflow-x-auto overscroll-x-contain px-(--spacing-gutter) pb-2"
    >
      <ul className="flex snap-x snap-mandatory gap-4 sm:gap-6">
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[62vw] shrink-0 snap-start sm:w-[38vw] lg:w-[23vw] xl:w-[21rem]"
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </div>
  );
}
