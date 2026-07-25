import { NextResponse } from 'next/server';
import { searchProducts } from '@/lib/catalog';

/** Recherche instantanée appelée par la barre de recherche du header. */
export async function GET(request: Request) {
  const term = new URL(request.url).searchParams.get('q')?.trim() ?? '';

  if (term.length < 2) return NextResponse.json({ products: [] });

  const products = await searchProducts(term, 10);

  return NextResponse.json(
    {
      products: products.map((product) => ({
        slug: product.slug,
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice,
        images: product.images,
        categoryName: product.category.name,
        categorySlug: product.category.slug,
      })),
    },
    {
      // Les frappes successives d'un même visiteur touchent souvent les mêmes
      // préfixes : une minute de cache soulage la base sans jamais montrer
      // un catalogue périmé.
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' },
    },
  );
}
