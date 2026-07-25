import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

/**
 * Directives d'exploration.
 *
 * Tout ce qui dépend d'une session ou d'un panier est exclu : ces pages n'ont
 * pas de contenu stable à indexer, et les faire explorer gaspille le budget que
 * les moteurs consacrent au site — budget mieux employé sur les fiches produits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/',
        '/api/',
        '/panier',
        '/commande',
        '/favoris',
        '/recherche',
        '/mes-commandes',
        '/mon-compte',
        '/connexion',
        '/inscription',
      ],
    },
    sitemap: siteUrl('/sitemap.xml'),
    host: siteUrl(),
  };
}
