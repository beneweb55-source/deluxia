import type { MetadataRoute } from 'next';
import { prisma, withRetry } from '@/lib/prisma';
import { siteUrl } from '@/lib/seo';

/**
 * Plan du site.
 *
 * Les pages liées à un panier ou à une session — panier, commande, favoris,
 * recherche, espace client, administration — en sont volontairement absentes :
 * elles n'ont aucun contenu indexable et leur présence diluerait le
 * référencement des fiches produits, qui sont la vraie porte d'entrée du site.
 */
export const revalidate = 3600;

/**
 * Lecture du catalogue tolérante à la panne.
 *
 * Le plan du site est généré au build. Si la base est momentanément injoignable
 * — démarrage à froid d'une base serverless, coupure réseau — l'échec ferait
 * tomber le déploiement entier pour un fichier annexe. On préfère publier un
 * plan réduit aux pages fixes, que le prochain passage complétera.
 */
async function loadCatalogue() {
  try {
    return await withRetry(() =>
      Promise.all([
        prisma.product.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.category.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
          orderBy: { position: 'asc' },
        }),
        prisma.collection.findMany({
          select: { slug: true },
        }),
      ]),
    );
  } catch (error) {
    console.error('[sitemap] catalogue injoignable, plan réduit aux pages fixes', error);
    return [[], [], []] as const;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [products, categories, collections] = await loadCatalogue();

  const home: MetadataRoute.Sitemap = [
    { url: siteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
  ];

  const universes: MetadataRoute.Sitemap = [
    '/boutique',
    ...collections.map((c) => `/c/${c.slug}`),
    '/nouveautes',
    '/promotions',
  ].map((path) => ({
    url: siteUrl(path),
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: siteUrl(`/produit/${product.slug}`),
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: siteUrl(`/boutique?categorie=${category.slug}`),
    lastModified: category.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const information: MetadataRoute.Sitemap = [
    '/livraison',
    '/faq',
    '/contact',
    '/guide-des-tailles',
    '/retours',
    '/cgv',
    '/confidentialite',
    '/mentions-legales',
  ].map((path) => ({
    url: siteUrl(path),
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.3,
  }));

  return [...home, ...universes, ...productPages, ...categoryPages, ...information];
}
