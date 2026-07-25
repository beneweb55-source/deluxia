import type { Metadata } from 'next';
import { EmptyState, ProductGrid } from '@/components/ProductGrid';
import { PageHeader } from '@/components/PageHeader';
import { ButtonLink } from '@/components/ui/Button';
import { searchProducts } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Recherche',
  description: 'Trouvez un modèle dans la collection DELUXIA.',
  // Les pages de résultats ne doivent pas être indexées : elles dupliqueraient
  // le catalogue et diluteraient le référencement des fiches produits.
  robots: { index: false, follow: true },
};

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (raw ?? '').trim().slice(0, 80);

  const products = query.length >= 2 ? await searchProducts(query, 48) : [];

  return (
    <>
      <PageHeader
        eyebrow="Recherche"
        title={query ? `« ${query} »` : 'Rechercher'}
        description={
          query.length >= 2
            ? `${products.length} article${products.length > 1 ? 's' : ''} correspond${products.length > 1 ? 'ent' : ''} à votre recherche.`
            : 'Saisissez au moins deux caractères pour lancer une recherche.'
        }
        crumbs={[{ name: 'Recherche', href: '/recherche' }]}
      />

      <div className="shell pb-(--spacing-section)">
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <EmptyState
            title={query.length >= 2 ? 'Aucun résultat' : 'Que cherchez-vous ?'}
            description={
              query.length >= 2
                ? 'Essayez un terme plus court ou plus général — « sneakers », « sac », « noir ».'
                : 'Utilisez la loupe en haut de page pour lancer une recherche instantanée.'
            }
            action={<ButtonLink href="/boutique">Voir toute la collection</ButtonLink>}
          />
        )}
      </div>
    </>
  );
}
