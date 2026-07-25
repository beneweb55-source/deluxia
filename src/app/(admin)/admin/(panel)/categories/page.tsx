import type { Metadata } from 'next';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { AdminPageHeader } from '@/components/admin/ui';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catégories',
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string; erreur?: string }>;
}) {
  const params = await searchParams;

  const categories = await prisma.category.findMany({
    orderBy: { position: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      description: true,
      collectionId: true,
      position: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });

  const collections = await prisma.collection.findMany({
    orderBy: { position: 'asc' },
    select: { id: true, name: true, slug: true },
  });

  return (
    <>
      <AdminPageHeader
        title="Catégories"
        description="Les catégories structurent la navigation de la boutique : chaque produit appartient à l’une d’elles, et chaque catégorie s’affiche dans son univers (chaussures, sacs, accessoires)."
      />

      {params.erreur === 'non-vide' && (
        <p role="alert" className="mb-8 border-l-2 border-ink pl-4 text-[0.875rem] leading-relaxed text-ink">
          Cette catégorie contient encore des produits : elle n’a pas été supprimée. Rattachez ces
          produits à une autre catégorie, ou supprimez-les, puis recommencez.
        </p>
      )}

      {params.supprime === '1' && (
        <p role="status" className="mb-8 border-l-2 border-ink pl-4 text-[0.875rem] text-ink">
          Catégorie supprimée.
        </p>
      )}

      <CategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          slug: category.slug,
          name: category.name,
          tagline: category.tagline,
          description: category.description,
          collectionId: category.collectionId,
          position: category.position,
          isActive: category.isActive,
          productCount: category._count.products,
        }))}
        collections={collections}
      />
    </>
  );
}
