import { BRAND, SOCIALS } from '@/lib/brand';

/**
 * Référencement — URL canonique et données structurées schema.org.
 *
 * Un seul point de vérité pour l'URL du site : en production elle vient de
 * NEXT_PUBLIC_SITE_URL, en local elle retombe sur le port de développement.
 * Toutes les URL absolues (sitemap, Open Graph, JSON-LD) en découlent.
 */
export function siteUrl(path = ''): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100').replace(/\/$/, '');
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
