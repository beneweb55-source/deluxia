import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { AdminPageHeader, Card } from '@/components/admin/ui';
import { ButtonLink } from '@/components/ui/Button';
import { formatDate, formatNumber } from '@/lib/format';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });

  return { title: product?.name ?? 'Produit introuvable' };
}

export default async function ProduitPage({ params }: PageProps) {
  const { id } = await params;

  const [product, categories, sold] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { variants: { orderBy: { position: 'asc' } } },
    }),
    prisma.category.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, collection: { select: { name: true } } },
    }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { productId: id } }),
  ]);

  if (!product) notFound();

  const soldQuantity = sold._sum.quantity ?? 0;

  return (
    <>
      <AdminPageHeader
        title={product.name}
        description={`Référence ${product.sku}`}
        actions={
          <ButtonLink
            href={`/produit/${product.slug}`}
            variant="outline"
            size="sm"
            target="_blank"
            rel="noreferrer"
          >
            Voir sur la boutique
          </ButtonLink>
        }
      />

      <Card>
        <ProductForm
          categories={categories}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            subtitle: product.subtitle,
            description: product.description,
            composition: product.composition,
            care: product.care,
            sku: product.sku,
            price: product.price,
            comparePrice: product.comparePrice,
            categoryId: product.categoryId,
            images: product.images,
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            isNew: product.isNew,
            position: product.position,
            variants: product.variants.map((variant) => ({
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              stock: variant.stock,
            })),
          }}
        />
      </Card>

      <Card title="Statistiques" className="mt-8">
        <dl className="grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="eyebrow text-ash">Vues de la fiche</dt>
            <dd className="mt-2 text-[1.25rem] font-light text-ink">
              {formatNumber(product.viewCount)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-ash">Quantité vendue</dt>
            <dd className="mt-2 text-[1.25rem] font-light text-ink">
              {formatNumber(soldQuantity)}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-ash">Créé le</dt>
            <dd className="mt-2 text-[1.25rem] font-light text-ink">
              {formatDate(product.createdAt)}
            </dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
