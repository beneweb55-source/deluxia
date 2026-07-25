import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { getFilterFacets, listProducts } from '@/lib/catalog';
import { parseCatalogParams, type RawSearchParams } from '@/lib/catalog-params';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Nouveautés',
  description:
    "Les derniers modèles arrivés chez DELUXIA. Chaussures et maroquinerie, livrées dans toute l'Algérie.",
  alternates: { canonical: '/nouveautes' },
};

export const revalidate = 300;

export default async function NouveautesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const filters = { ...parseCatalogParams(params), onlyNew: true };

  const [products, facets] = await Promise.all([listProducts(filters), getFilterFacets()]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Nouveautés', href: '/nouveautes' }])} />

      <PageHeader
        eyebrow="Dernières arrivées"
        title="Nouveautés"
        description="Les modèles reçus le plus récemment. Les premières tailles partent vite — le stock affiché est celui du moment."
        crumbs={[{ name: 'Nouveautés', href: '/nouveautes' }]}
      />

      <CatalogSection
        products={products}
        facets={facets}
        emptyTitle="Aucune nouveauté pour l'instant"
        emptyDescription="Les prochains modèles arrivent très bientôt. En attendant, la collection complète reste disponible."
      />
    </>
  );
}
