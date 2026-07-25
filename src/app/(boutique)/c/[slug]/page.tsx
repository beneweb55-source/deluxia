import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { CatalogSection } from '@/components/catalog/CatalogSection';
import { getCollectionBySlug, getFilterFacets, listProducts } from '@/lib/catalog';
import { parseCatalogParams, type RawSearchParams } from '@/lib/catalog-params';
import { breadcrumbJsonLd } from '@/lib/seo';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  
  if (!collection) return {};

  return {
    title: collection.name,
    description: `Découvrez la collection ${collection.name} sur DELUXIA. Livraison partout en Algérie.`,
    alternates: { canonical: `/c/${slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { slug } = await params;
  const search = await searchParams;
  
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const filters = { ...parseCatalogParams(search), collectionSlug: slug };

  const [products, facets] = await Promise.all([
    listProducts(filters),
    getFilterFacets(slug),
  ]);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: collection.name, href: `/c/${slug}` }])} />

      <PageHeader
        eyebrow="Collection"
        title={collection.name}
        description={`Découvrez toutes les pièces de la collection ${collection.name}.`}
        crumbs={[{ name: collection.name, href: `/c/${slug}` }]}
      />

      <CatalogSection products={products} facets={facets} />
    </>
  );
}
