import type { Metadata } from 'next';
import { CollectionManager } from '@/components/admin/CollectionManager';
import { AdminPageHeader } from '@/components/admin/ui';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Collections',
};

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string; erreur?: string }>;
}) {
  const params = await searchParams;

  const collections = await prisma.collection.findMany({
    orderBy: { position: 'asc' },
    select: {
      id: true,
      slug: true,
      name: true,
      imageUrl: true,
      position: true,
      _count: { select: { categories: true } },
      // Nombre de produits de la collection : affiché dans le dialogue de
      // suppression pour annoncer la portée exacte de la cascade.
      categories: { select: { _count: { select: { products: true } } } },
    },
  });

  return (
    <>
      <AdminPageHeader
        title="Collections"
        description="Les collections regroupent les catégories. Elles constituent la navigation principale de la boutique."
      />

      {params.erreur === 'non-vide' && (
        <p role="alert" className="mb-8 border-l-2 border-ink pl-4 text-[0.875rem] leading-relaxed text-ink">
          Cette collection contient encore des catégories : elle n'a pas été supprimée. Déplacez
          ces catégories vers une autre collection, ou supprimez-les, puis recommencez.
        </p>
      )}

      {params.supprime === '1' && (
        <p role="status" className="mb-8 border-l-2 border-ink pl-4 text-[0.875rem] text-ink">
          Collection supprimée.
        </p>
      )}

      <CollectionManager
        collections={collections.map((col) => ({
          id: col.id,
          slug: col.slug,
          name: col.name,
          imageUrl: col.imageUrl,
          position: col.position,
          categoryCount: col._count.categories,
          productCount: col.categories.reduce((sum, cat) => sum + cat._count.products, 0),
        }))}
      />
    </>
  );
}
