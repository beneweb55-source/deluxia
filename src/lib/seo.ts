import { BRAND, SOCIALS } from '@/lib/brand';

/**
 * Référencement — URL canonique et données structurées schema.org.
 *
 * ⚠ Cette fonction alimente `metadataBase: new URL(siteUrl())` dans le layout
 * racine. Si elle renvoyait une chaîne invalide, `new URL()` lèverait une
 * exception à l'évaluation du module, et **toutes les pages** du site
 * s'afficheraient en « erreur serveur ». C'est le piège classique du
 * déploiement Vercel : une variable `NEXT_PUBLIC_SITE_URL` saisie sans
 * `https://` (« deluxia.vercel.app »), avec un `/` final, ou laissée vide,
 * suffit à faire tomber l'ensemble du site.
 *
 * `siteUrl()` doit donc TOUJOURS renvoyer une URL absolue valide, quoi qu'on
 * lui donne. L'ordre de résolution : la variable explicite, puis les variables
 * fournies automatiquement par Vercel, puis le port de développement.
 */

/** Ajoute le protocole manquant, valide, et ne garde que l'origine (sans chemin). */
function normalizeBase(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function siteUrl(path = ''): string {
  const base =
    normalizeBase(process.env.NEXT_PUBLIC_SITE_URL) ??
    // Domaine de production Vercel, puis URL de déploiement — toutes deux
    // fournies sans protocole, d'où la normalisation.
    normalizeBase(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeBase(process.env.VERCEL_URL) ??
    'http://localhost:3100';

  if (!path) return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Identité de la marque — alimente le panneau de connaissance Google. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: BRAND.name,
    slogan: BRAND.tagline,
    description: BRAND.description,
    url: siteUrl(),
    telephone: BRAND.phoneE164,
    email: BRAND.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: BRAND.city,
      addressCountry: BRAND.countryCode,
    },
    areaServed: { '@type': 'Country', name: BRAND.country },
    currenciesAccepted: BRAND.currency,
    paymentAccepted: 'Paiement à la livraison',
    sameAs: SOCIALS.map((social) => social.href),
  };
}

interface ProductJsonLdInput {
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: number;
  images: string[];
  categoryName: string;
  inStock: boolean;
}

/** Fiche produit — rend le prix et la disponibilité éligibles aux résultats enrichis. */
export function productJsonLd(product: ProductJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    category: product.categoryName,
    brand: { '@type': 'Brand', name: BRAND.name },
    ...(product.images.length > 0 ? { image: product.images.map((src) => siteUrl(src)) } : {}),
    offers: {
      '@type': 'Offer',
      url: siteUrl(`/produit/${product.slug}`),
      priceCurrency: BRAND.currency,
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: BRAND.name },
    },
  };
}

/** Fil d'Ariane — Google l'affiche à la place de l'URL brute dans les résultats. */
export function breadcrumbJsonLd(trail: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: siteUrl(step.href),
    })),
  };
}

/** Questions fréquentes — éligible au bloc « Questions fréquentes » de Google. */
export function faqJsonLd(entries: ReadonlyArray<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
}
