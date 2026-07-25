import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { getFilterFacets, listProducts } from '@/lib/catalog';
import { parseCatalogParams, type RawSearchParams } from '@/lib/catalog-params';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Boutique',
  description:
    "Toute la collection DELUXIA : chaussures et sacs pour femme. Livraison dans toute l'Algérie, paiement à la livraison.",
  alternates: { canonical: '/boutique' },
};

export const revalidate = 300;

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseCatalogParams(params);

  const [products, facets] = await Promise.all([listProducts(filters), getFilterFacets()]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Boutique', href: '/boutique' }])} />

      <PageHeader
        eyebrow="Collection"
        title="Toute la boutique"
        description="Chaussures et sacs sélectionnés pièce par pièce. Chaque modèle est contrôlé avant expédition et réglé à la réception."
        crumbs={[{ name: 'Boutique', href: '/boutique' }]}
      />

      <CatalogSection products={products} facets={facets} />
    </>
  );
}
