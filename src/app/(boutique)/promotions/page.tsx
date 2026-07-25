import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { getFilterFacets, listProducts } from '@/lib/catalog';
import { parseCatalogParams, type RawSearchParams } from '@/lib/catalog-params';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Promotions',
  description:
    'Fins de séries et dernières tailles à prix réduit chez DELUXIA. Mêmes exigences, quantités limitées.',
  alternates: { canonical: '/promotions' },
};

export const revalidate = 300;

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const filters = { ...parseCatalogParams(params), onlyPromo: true };

  const [products, facets] = await Promise.all([listProducts(filters), getFilterFacets()]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Promotions', href: '/promotions' }])} />

      <PageHeader
        eyebrow="Prix réduits"
        title="Promotions"
        description="Fins de séries et dernières pointures. Ce sont les mêmes modèles, contrôlés de la même façon — seul le prix change."
        crumbs={[{ name: 'Promotions', href: '/promotions' }]}
      />

      <CatalogSection
        products={products}
        facets={facets}
        emptyTitle="Aucune promotion en cours"
        emptyDescription="Nos remises sont ponctuelles et portent sur des quantités limitées. Inscrivez-vous à la liste pour être prévenu en premier."
      />
    </>
  );
}
