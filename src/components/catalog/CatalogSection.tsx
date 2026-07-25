import { CatalogControls, type CatalogFacets } from '@/components/catalog/CatalogControls';
import { EmptyState, ProductGrid } from '@/components/ProductGrid';
import { ButtonLink } from '@/components/ui/Button';
import type { ProductCardData } from '@/lib/catalog';

/**
 * Corps commun à toutes les pages de catalogue (Boutique, Homme, Femme,
 * Nouveautés, Promotions). Une seule implémentation : la barre de filtres, la
 * grille et l'état vide se comportent exactement de la même façon partout.
 */
export function CatalogSection({
  products,
  facets,
  showCategories = true,
  emptyTitle = 'Aucun article ne correspond à ces filtres',
  emptyDescription = 'Élargissez votre sélection — en retirant une taille ou une couleur, par exemple.',
}: {
  products: ProductCardData[];
  facets: CatalogFacets;
  showCategories?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <section className="shell pb-(--spacing-section)">
      <CatalogControls facets={facets} total={products.length} showCategories={showCategories} />

      <div className="pt-12">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            action={
              <ButtonLink href="/boutique" variant="outline">
                Voir toute la collection
              </ButtonLink>
            }
          />
        )}
      </div>
    </section>
  );
}
