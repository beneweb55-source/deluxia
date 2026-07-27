/**
 * Constantes de marque — point d'entrée unique pour toute information
 * publique de DELUXIA. Un changement de numéro ou de lien social se fait ici
 * et se propage partout (header, footer, contact, SEO, données structurées).
 */

export const BRAND = {
  name: 'DELUXIA',
  legalName: 'DELUXIA',
  tagline: 'Where luxury meets you',
  taglineFr: 'Le luxe vient à vous',
  description:
    "Maison algérienne de chaussures et de sacs pour femme. Des pièces choisies pour durer, livrées dans toute l'Algérie et réglées à la réception.",
  phone: '0772610546',
  phoneDisplay: '07 72 61 05 46',
  phoneE164: '+213772610546',
  email: 'contact@deluxia.dz',
  city: 'Alger',
  country: 'Algérie',
  countryCode: 'DZ',
  currency: 'DZD',
  locale: 'fr_DZ',
} as const;

export const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/rdeluxia', handle: '@rdeluxia' },
  { label: 'Facebook', href: 'https://www.facebook.com/share/19CswabGyy/', handle: 'DELUXIA' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@rdeluxia', handle: '@rdeluxia' },
] as const;

/** Navigation principale — utilisée par le header desktop et le menu mobile. */
export const NAV_LINKS = [
  { label: 'Boutique', href: '/boutique' },
  { label: 'Chaussures', href: '/chaussures' },
  { label: 'Sacs', href: '/sacs' },
  { label: 'Nouveautés', href: '/nouveautes' },
  { label: 'Promotions', href: '/promotions' },
  { label: 'Contact', href: '/contact' },
] as const;

/** Liens de pied de page, groupés par colonne. */
export const FOOTER_LINKS = [
  {
    title: 'Boutique',
    links: [
      { label: 'Toute la collection', href: '/boutique' },
      { label: 'Chaussures', href: '/chaussures' },
      { label: 'Sacs', href: '/sacs' },
      { label: 'Nouveautés', href: '/nouveautes' },
      { label: 'Promotions', href: '/promotions' },
    ],
  },
  {
    title: 'Aide',
    links: [
      { label: 'Suivre ma commande', href: '/mes-commandes' },
      { label: 'Nous contacter', href: '/contact' },
      { label: 'Questions fréquentes', href: '/faq' },
      { label: 'Livraison', href: '/livraison' },
      { label: 'Échanges & remboursements', href: '/retours' },
      { label: 'Guide des tailles', href: '/guide-des-tailles' },
    ],
  },
  {
    title: 'Maison',
    links: [
      { label: 'Conditions générales', href: '/cgv' },
      { label: 'Politique de confidentialité', href: '/confidentialite' },
      { label: 'Mentions légales', href: '/mentions-legales' },
    ],
  },
] as const;

/** Arguments de réassurance affichés sous le hero et en pied de page. */
export const TRUST_POINTS = [
  {
    title: 'Qualité certifiée',
    body: 'Chaque modèle est contrôlé avant expédition : matières, finitions et tenue dans le temps.',
  },
  {
    title: 'Livraison partout en Algérie',
    body: 'À domicile ou en bureau de retrait, avec un suivi assuré par notre transporteur partenaire.',
  },
  {
    title: 'Paiement à la livraison',
    body: "Vous ne réglez qu'au moment où le colis est entre vos mains. Aucun paiement en ligne.",
  },
  {
    title: 'Échange disponible',
    body: "Une pointure qui ne convient pas ? L'échange est possible sous 24 h après réception.",
  },
] as const;

/**
 * Les trois univers de la boutique. Ils correspondent à l'énumération `Universe`
 * du schéma Prisma : ajouter une catégorie dans l'administration la fait
 * apparaître automatiquement dans l'univers choisi, sans toucher au code.
 */
export const UNIVERSES = [
  {
    key: 'CHAUSSURES',
    slug: 'chaussures',
    name: 'Chaussures',
    tagline: 'Sneakers, bottines, escarpins et sandales',
    description:
      'Des modèles portables au quotidien comme le soir. Cuirs souples, semelles confortables, pointures du 36 au 41.',
  },
  {
    key: 'SACS',
    slug: 'sacs',
    name: 'Sacs',
    tagline: 'Sacs à main, épaule, bandoulière et sacs à dos',
    description:
      'Des formes structurées qui tiennent dans le temps. Doublure soignée, coutures régulières, fermetures testées.',
  },
  {
    key: 'ACCESSOIRES',
    slug: 'accessoires',
    name: 'Accessoires',
    tagline: 'Pochettes, portefeuilles et petite maroquinerie',
    description: 'Les pièces qui complètent une tenue — et le cadeau qui ne se trompe jamais.',
  },
] as const;

export type UniverseKey = (typeof UNIVERSES)[number]['key'];

export function getUniverse(slug: string) {
  return UNIVERSES.find((universe) => universe.slug === slug);
}
