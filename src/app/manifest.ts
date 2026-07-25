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
    // Le logotype est fourni en PNG (src/app/icon.png). Le manifeste doit
    // pointer vers le fichier qui existe réellement, sinon le navigateur signale
    // « icon isn't a valid image » et l'ajout à l'écran d'accueil échoue.
    icons: [{ src: '/icon.png', sizes: '1080x1080', type: 'image/png' }],
  };
}
