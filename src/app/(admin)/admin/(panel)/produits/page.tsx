import type { Metadata } from 'next';
import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { ButtonLink } from '@/components/ui/Button';
import { AdminPageHeader, Card } from '@/components/admin/ui';
import { ProductsTable, type ProductRow } from '@/components/admin/ProductsTable';
import { formatNumber, formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Produits' };

// Le gérant doit voir l'effet d'une création ou d'un masquage immédiatement :
// aucune mise en cache de cette page.
export const dynamic = 'force-dynamic';

type RawParams = Record<string, string | string[] | undefined>;

/** En dessous de ce total, le réassort devient urgent : la ligne est signalée. */
const SEUIL_STOCK_FAIBLE = 3;

/** Les paramètres d'URL peuvent être répétés ; seule la première valeur compte. */
function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export default async function AdminProduitsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const q = one(params.q);
  const categorie = one(params.categorie);
  const etatRaw = one(params.etat);
  const etat = etatRaw === 'actif' || etatRaw === 'inactif' ? etatRaw : '';
  const cree = one(params.cree) === '1';
  const supprime = one(params.supprime) === '1';

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (categorie) where.category = { slug: categorie };
  if (etat) where.isActive = etat === 'actif';

  const [products, categories, totalProducts, stockAggregate] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: { select: { id: true, size: true, color: true, stock: true } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    }),
    prisma.category.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { position: 'asc' },
    }),
    prisma.product.count(),
    prisma.productVariant.aggregate({ _sum: { stock: true } }),
  ]);

  const stockTotal = stockAggregate._sum.stock ?? 0;
  const filtre = Boolean(q || categorie || etat);

  // Projection vers le composant client : seules des valeurs sérialisables
  // traversent la frontière, et le stock est agrégé une fois pour toutes.
  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    images: product.images,
    price: product.price,
    comparePrice: product.comparePrice,
    stock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
  }));

  return (
    <>
      {cree && (
        <p role="status" className="mb-8 border-l-2 border-ink pl-4 text-[0.875rem] text-ink">
          Produit créé.
        </p>
      )}

      {supprime && (
        <p className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          Produit supprimé avec succès.
        </p>
      )}

      <AdminPageHeader
        title="Produits"
        description={`${formatNumber(totalProducts)} référence${totalProducts > 1 ? 's' : ''} au catalogue, ${formatNumber(stockTotal)} pièce${stockTotal > 1 ? 's' : ''} en stock.`}
        actions={
          <ButtonLink href="/admin/produits/nouveau" size="sm">
            Nouveau produit
          </ButtonLink>
        }
      />

      <Card className="mb-6" padded>
        <form method="get" action="/admin/produits" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="q" className="eyebrow mb-2 block">
              Recherche
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Nom ou référence…"
              className="h-11 w-full border border-line bg-paper px-3 text-[0.875rem] text-ink outline-none placeholder:text-ash focus:border-ink"
            />
          </div>

          <div className="min-w-[12rem]">
            <label htmlFor="categorie" className="eyebrow mb-2 block">
              Catégorie
            </label>
            <select
              id="categorie"
              name="categorie"
              defaultValue={categorie}
              className="h-11 w-full border border-line bg-paper px-3 text-[0.875rem] text-ink outline-none focus:border-ink"
            >
              <option value="">Toutes</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[10rem]">
            <label htmlFor="etat" className="eyebrow mb-2 block">
              État
            </label>
            <select
              id="etat"
              name="etat"
              defaultValue={etat}
              className="h-11 w-full border border-line bg-paper px-3 text-[0.875rem] text-ink outline-none focus:border-ink"
            >
              <option value="">Tous</option>
              <option value="actif">Visibles</option>
              <option value="inactif">Masqués</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="h-11 border border-ink bg-ink px-6 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity duration-300 hover:opacity-80"
            >
              Filtrer
            </button>
            <Link href="/admin/produits" className="link-underline text-[0.875rem] text-graphite">
              Réinitialiser
            </Link>
          </div>
        </form>
      </Card>

      <Card padded={false}>
        <div className="p-5">
          <ProductsTable products={rows} hasFilter={Boolean(filtre)} />
        </div>
      </Card>
    </>
  );
}
