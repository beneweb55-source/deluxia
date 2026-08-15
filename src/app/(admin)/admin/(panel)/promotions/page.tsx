import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { AdminPageHeader } from '@/components/admin/ui';
import { PromotionsForm } from '@/components/admin/PromotionsForm';

export const metadata: Metadata = { title: 'Gestion des Promotions' };
export const dynamic = 'force-dynamic';

export default async function AdminPromotionsPage() {
  const [collections, categories] = await Promise.all([
    prisma.collection.findMany({
      select: { id: true, name: true },
      orderBy: { position: 'asc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, collection: { select: { name: true } } },
      orderBy: [{ collectionId: 'asc' }, { position: 'asc' }],
    }),
  ]);

  const categoryList = categories.map((c) => ({
    id: c.id,
    name: c.name,
    collectionName: c.collection?.name,
  }));

  return (
    <>
      <AdminPageHeader
        title="Promotions en masse"
        description="Appliquez rapidement une réduction (en %) sur une catégorie, une collection, ou sur l'ensemble du catalogue."
      />

      <PromotionsForm collections={collections} categories={categoryList} />
    </>
  );
}
