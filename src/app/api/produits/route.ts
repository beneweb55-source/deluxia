import { NextResponse } from 'next/server';
import { getProductsBySlugs } from '@/lib/catalog';

/** Nombre maximal de slugs acceptés — borne la charge d'une requête forgée. */
const MAX_SLUGS = 12;

/**
 * Rehydrate une liste de produits à partir de leurs slugs.
 * Utilisée par « Récemment consultés » et par la page Favoris, qui ne stockent
 * localement que des identifiants et jamais de prix.
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get('slugs') ?? '';

  const slugs = raw
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => slug.length > 0 && /^[a-z0-9-]+$/.test(slug))
    .slice(0, MAX_SLUGS);

  if (slugs.length === 0) return NextResponse.json({ products: [] });

  const products = await getProductsBySlugs(slugs);

  return NextResponse.json({ products });
}
