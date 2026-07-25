import type { Metadata } from 'next';
import { ProductForm } from '@/components/admin/ProductForm';
import { AdminPageHeader, Card } from '@/components/admin/ui';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Nouveau produit' };

export default async function NouveauProduitPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, collection: { select: { name: true } } },
  });

  return (
    <>
      <AdminPageHeader
        title="Nouveau produit"
        description="Le produit apparaît sur la boutique dès qu'il est visible et qu'une déclinaison dispose de stock. Vous pourrez modifier chaque champ après l'enregistrement."
      />

      <Card>
        <ProductForm categories={categories} />
      </Card>
    </>
  );
}
