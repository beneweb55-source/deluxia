import type { MetadataRoute } from 'next';
import { BRAND } from '@/lib/brand';

/**
 * Manifeste d'application.
 *
 * Il permet d'ajouter la boutique à l'écran d'accueil d'un téléphone, avec le
 * bon nom et la bonne icône plutôt qu'une vignette de page. C'est un usage
 * réel en Algérie, où beaucoup de clientes reviennent par un raccourci plutôt
 * que par un moteur de recherche.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0A0A0A',
    lang: 'fr',
    dir: 'ltr',
    categories: ['shopping'],
    // Uniquement le logotype SVG, servi tel quel : aucune déclinaison PNG
    // n'est générée. Voir `src/app/icon.svg`.
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
