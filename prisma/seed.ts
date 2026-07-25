/**
 * Jeu de données initial DELUXIA.
 *
 * Idempotent : relancer `npm run db:seed` met à jour ce qui existe au lieu de
 * créer des doublons. Le gérant peut donc partir de ce catalogue de démonstration,
 * le modifier depuis l'administration, et le seed ne détruira pas son travail
 * (seules les fiches portant les mêmes slugs sont réalignées).
 *
 * Les prix sont exprimés en dinars algériens, entiers, et calés sur le segment
 * moyen-haut du marché algérien de la chaussure et du sac femme.
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { WILAYAS } from '../src/data/wilayas';

const prisma = new PrismaClient();
const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/** Reproduit `hashPassword` de src/lib/auth.ts sans importer de module `server-only`. */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize('NFKC'), salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────────────────────────────────────

interface CategorySeed {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  collectionSlug: string;
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: 'sneakers',
    name: 'Sneakers',
    tagline: 'La paire de tous les jours',
    description:
      'Des sneakers sobres, montées sur des semelles souples, qui se portent du matin au soir sans jamais faire négligé.',
    collectionSlug: 'chaussures',
  },
  {
    slug: 'bottines',
    name: 'Bottines',
    tagline: 'Le pilier de la mi-saison',
    description:
      'Bottines à talon carré ou plates, en cuir et daim. La pièce qui structure une silhouette dès les premiers froids.',
    collectionSlug: 'chaussures',
  },
  {
    slug: 'escarpins',
    name: 'Escarpins',
    tagline: 'Le soir, et les jours qui comptent',
    description:
      'Talons pensés pour être tenus plusieurs heures : patin antidérapant, semelle rembourrée, aplomb travaillé.',
    collectionSlug: 'chaussures',
  },
  {
    slug: 'sandales',
    name: 'Sandales & mules',
    tagline: "L'été, sans compromis",
    description:
      'Lanières fines, mules à bout carré, talons bobine. Des modèles qui restent élégants pieds nus.',
    collectionSlug: 'chaussures',
  },
  {
    slug: 'sacs-a-main',
    name: 'Sacs à main',
    tagline: 'Structuré, tenu, intemporel',
    description:
      'Des sacs qui gardent leur forme. Base rigide, doublure intérieure complète, poches organisées.',
    collectionSlug: 'sacs',
  },
  {
    slug: 'bandoulieres',
    name: 'Bandoulières',
    tagline: 'Les mains libres',
    description:
      'Petits formats à anse réglable, pour les journées où l’on ne veut porter que l’essentiel.',
    collectionSlug: 'sacs',
  },
  {
    slug: 'cabas',
    name: 'Cabas & tote',
    tagline: 'Grand format, allure nette',
    description:
      'Assez grands pour un ordinateur et un dossier, assez sobres pour ne jamais faire sac de sport.',
    collectionSlug: 'sacs',
  },
  {
    slug: 'sacs-a-dos',
    name: 'Sacs à dos',
    tagline: 'Pratique, jamais scolaire',
    description:
      'Des sacs à dos en cuir grainé, à bretelles rembourrées, pensés pour la ville et les études.',
    collectionSlug: 'sacs',
  },
  {
    slug: 'pochettes',
    name: 'Pochettes & portefeuilles',
    tagline: 'La petite maroquinerie',
    description:
      'Pochettes de soirée et portefeuilles compacts, dans les mêmes cuirs que nos sacs.',
    collectionSlug: 'accessoires',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Produits
// ─────────────────────────────────────────────────────────────────────────────

interface ProductSeed {
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  composition: string;
  care: string;
  sku: string;
  price: number;
  comparePrice?: number;
  category: string;
  isFeatured?: boolean;
  isNew?: boolean;
  colors: Array<{ name: string; hex: string }>;
  /** Pointures pour les chaussures, `['TU']` pour la maroquinerie. */
  sizes: string[];
  /** Stock attribué à chaque déclinaison, en boucle. */
  stockPattern: number[];
}

const SHOE_SIZES = ['36', '37', '38', '39', '40', '41'];
const ONE_SIZE = ['TU'];

const PRODUCTS: ProductSeed[] = [
  // ── Sneakers ──────────────────────────────────────────────────────────────
  {
    slug: 'sneaker-albe-cuir-blanc',
    name: 'Sneaker Albe',
    subtitle: 'Cuir lisse, semelle gomme',
    description:
      "Une sneaker basse volontairement dépouillée : pas de logo apparent, une tige en cuir lisse et une semelle en gomme qui amortit sans épaissir la silhouette.\n\nElle se porte aussi bien avec un jean qu'avec une jupe midi, et c'est précisément ce qu'on lui demande. Le cuir se patine légèrement aux plis, sans se marquer.",
    composition:
      'Tige : cuir de veau lisse. Doublure : cuir de porc. Semelle intérieure : cuir rembourré. Semelle extérieure : caoutchouc, 2,5 cm.',
    care: "Essuyer avec un chiffon doux légèrement humide. Nourrir le cuir tous les deux mois avec un lait incolore. Éviter le séchage près d'une source de chaleur.",
    sku: 'DLX-SNK-ALB',
    price: 9800,
    category: 'sneakers',
    isFeatured: true,
    isNew: true,
    colors: [
      { name: 'Blanc', hex: '#F5F5F3' },
      { name: 'Noir', hex: '#0A0A0A' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [4, 6, 8, 7, 5, 2],
  },
  {
    slug: 'sneaker-marsa-retro',
    name: 'Sneaker Marsa',
    subtitle: 'Silhouette rétro, semelle crantée',
    description:
      "Une ligne inspirée des modèles de tennis des années soixante-dix, reprise dans des proportions plus fines. La semelle crantée donne de l'accroche sans alourdir.\n\nLe daim des empiècements apporte une profondeur de matière que le cuir seul ne donne pas.",
    composition:
      'Tige : cuir de veau et croûte de cuir velours. Doublure : textile respirant. Semelle extérieure : caoutchouc cranté, 3 cm.',
    care: 'Brosser le daim à sec avec une brosse en crêpe. Imperméabiliser avant la première mise.',
    sku: 'DLX-SNK-MRS',
    price: 11500,
    comparePrice: 14000,
    category: 'sneakers',
    isNew: true,
    colors: [
      { name: 'Gris perle', hex: '#C9C9C5' },
      { name: 'Noir', hex: '#0A0A0A' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [2, 5, 6, 4, 3, 1],
  },
  {
    slug: 'sneaker-oran-plateforme',
    name: 'Sneaker Oran',
    subtitle: 'Plateforme discrète de 4 cm',
    description:
      "Une plateforme assumée mais mesurée : quatre centimètres qui allongent la jambe sans jamais devenir encombrants.\n\nLe montage sur semelle compensée reste léger, l'ensemble ne pèse pas plus qu'une sneaker classique.",
    composition:
      'Tige : cuir de veau grainé. Doublure : textile. Semelle : caoutchouc expansé, plateforme 4 cm.',
    care: 'Nettoyer à la mousse spéciale cuir. Ne pas immerger.',
    sku: 'DLX-SNK-ORN',
    price: 10900,
    category: 'sneakers',
    colors: [
      { name: 'Blanc', hex: '#F5F5F3' },
      { name: 'Ivoire', hex: '#EDE9E2' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [3, 4, 7, 6, 4, 2],
  },

  // ── Bottines ──────────────────────────────────────────────────────────────
  {
    slug: 'bottine-alger-talon-carre',
    name: 'Bottine Alger',
    subtitle: 'Talon carré 6 cm, bout effilé',
    description:
      "La bottine que l'on garde plusieurs saisons. Le talon carré de six centimètres offre un aplomb stable — on peut marcher longtemps — et le bout légèrement effilé affine le pied.\n\nLes élastiques latéraux permettent de l'enfiler sans fermeture apparente, ce qui garde la ligne nette.",
    composition:
      'Tige : cuir de veau lisse. Doublure et première : cuir. Semelle : cuir avec patin antidérapant. Talon : 6 cm. Tige : 11 cm.',
    care: 'Cirer régulièrement. Utiliser des embauchoirs pour conserver la forme de la tige.',
    sku: 'DLX-BOT-ALG',
    price: 15900,
    category: 'bottines',
    isFeatured: true,
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Taupe', hex: '#7A736B' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [2, 4, 6, 5, 3, 1],
  },
  {
    slug: 'bottine-kabylie-daim',
    name: 'Bottine Kabylie',
    subtitle: 'Daim souple, talon bobine',
    description:
      "Un daim épais et mat, monté sur un talon bobine de cinq centimètres. La tige monte juste au-dessus de la cheville, à la hauteur qui fonctionne avec un pantalon droit comme avec une robe.\n\nLa doublure intégrale en cuir évite la sensation de froid des premiers jours d'hiver.",
    composition:
      'Tige : croûte de cuir velours. Doublure : cuir. Semelle : gomme. Talon bobine : 5 cm.',
    care: 'Brosser à sec. Imperméabiliser avant la première mise, puis une fois par mois.',
    sku: 'DLX-BOT-KAB',
    price: 14500,
    comparePrice: 17900,
    category: 'bottines',
    colors: [
      { name: 'Anthracite', hex: '#3A3A38' },
      { name: 'Noir', hex: '#0A0A0A' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [1, 3, 5, 4, 2, 1],
  },
  {
    slug: 'boots-tipaza-plate',
    name: 'Boots Tipaza',
    subtitle: 'Semelle track, entièrement plate',
    description:
      "Une boots plate à semelle track, pensée pour les journées où l'on marche vraiment. Le col rembourré ne scie pas la cheville.\n\nLe cuir grainé supporte la pluie et se nettoie d'un coup de chiffon.",
    composition:
      'Tige : cuir de veau grainé. Doublure : textile chaud. Semelle : caoutchouc track, 3,5 cm.',
    care: 'Essuyer après exposition à la pluie. Nourrir le cuir chaque trimestre.',
    sku: 'DLX-BOT-TPZ',
    price: 13900,
    category: 'bottines',
    isNew: true,
    colors: [{ name: 'Noir', hex: '#0A0A0A' }],
    sizes: SHOE_SIZES,
    stockPattern: [3, 5, 6, 6, 4, 2],
  },

  // ── Escarpins ─────────────────────────────────────────────────────────────
  {
    slug: 'escarpin-nuit-85',
    name: 'Escarpin Nuit 85',
    subtitle: 'Talon aiguille 8,5 cm, bout pointu',
    description:
      "L'escarpin classique, exécuté avec soin. Le décolleté est monté haut sur le cou-de-pied pour tenir le pied, et la semelle intérieure est rembourrée sous l'avant-pied — la différence se sent après deux heures.\n\nLe cuir mat ne renvoie pas la lumière au flash, détail qui compte pour les photos de soirée.",
    composition:
      'Tige : cuir de chèvre mat. Doublure et première : cuir rembourré. Semelle : cuir, patin antidérapant. Talon : 8,5 cm.',
    care: 'Ranger dans le sac fourni. Faire remplacer le patin dès usure.',
    sku: 'DLX-ESC-NUI',
    price: 16900,
    category: 'escarpins',
    isFeatured: true,
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Ivoire', hex: '#EDE9E2' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [2, 3, 5, 4, 2, 1],
  },
  {
    slug: 'escarpin-slingback-medina',
    name: 'Slingback Medina',
    subtitle: 'Bride arrière, talon 6 cm',
    description:
      "Une slingback à bride élastiquée : elle tient sans serrer et se met en quelques secondes. Le talon de six centimètres est le bon compromis entre allure et journée de travail.\n\nLe bout carré, plus large, laisse de la place aux orteils.",
    composition: 'Tige : cuir de veau. Doublure : cuir. Semelle : cuir et gomme. Talon : 6 cm.',
    care: 'Essuyer avec un chiffon doux. Éviter les frottements sur le talon arrière.',
    sku: 'DLX-ESC-MED',
    price: 13500,
    category: 'escarpins',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Gris perle', hex: '#C9C9C5' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [2, 4, 5, 4, 3, 1],
  },

  // ── Sandales ──────────────────────────────────────────────────────────────
  {
    slug: 'sandale-sidi-lanieres',
    name: 'Sandale Sidi',
    subtitle: 'Lanières fines, talon 7 cm',
    description:
      "Trois lanières, rien de plus. La finesse du dessin fait tout le travail : le pied paraît allongé et la chaussure disparaît sous la tenue.\n\nLa bride de cheville est réglable sur trois crans.",
    composition: 'Tige : cuir de veau. Première : cuir rembourré. Talon : 7 cm.',
    care: 'Nettoyer les lanières au chiffon humide, sécher à plat.',
    sku: 'DLX-SAN-SID',
    price: 11900,
    category: 'sandales',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Ivoire', hex: '#EDE9E2' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [3, 4, 6, 5, 3, 2],
  },
  {
    slug: 'mule-annaba-bout-carre',
    name: 'Mule Annaba',
    subtitle: 'Bout carré, talon bobine 5 cm',
    description:
      "Une mule à enfiler, coupée large sur le dessus du pied pour ne pas marquer. Le talon bobine assure la stabilité que les mules n'ont pas toujours.\n\nLe modèle qui accompagne aussi bien un tailleur qu'une robe légère.",
    composition: 'Tige : cuir de veau lisse. Première : cuir. Talon bobine : 5 cm.',
    care: 'Chiffon doux. Ne pas exposer longuement au soleil direct.',
    sku: 'DLX-SAN-ANB',
    price: 9900,
    comparePrice: 12500,
    category: 'sandales',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Taupe', hex: '#7A736B' },
    ],
    sizes: SHOE_SIZES,
    stockPattern: [2, 3, 4, 4, 2, 1],
  },
  {
    slug: 'sandale-plate-djemila',
    name: 'Sandale Djemila',
    subtitle: 'Entièrement plate, cuir tressé',
    description:
      "Une sandale plate en cuir tressé à la main, qui prend la forme du pied au fil des ports. La semelle en cuir épais amortit mieux qu'il n'y paraît.\n\nLe modèle des journées entières debout.",
    composition: 'Tige : cuir tressé. Semelle : cuir épais et gomme.',
    care: 'Laisser sécher à l’air libre. Nourrir le cuir tressé deux fois par saison.',
    sku: 'DLX-SAN-DJM',
    price: 8500,
    category: 'sandales',
    isNew: true,
    colors: [{ name: 'Noir', hex: '#0A0A0A' }],
    sizes: SHOE_SIZES,
    stockPattern: [4, 6, 7, 6, 4, 3],
  },

  // ── Sacs à main ───────────────────────────────────────────────────────────
  {
    slug: 'sac-casbah-structure',
    name: 'Sac Casbah',
    subtitle: 'Format 30 × 22 cm, base rigide',
    description:
      "Un sac à main qui tient debout, vide comme plein. La base est renforcée, les angles sont doublés, et la doublure textile couvre l'intégralité de l'intérieur — aucune couture apparente.\n\nDeux anses courtes pour le porter à la main, une bandoulière amovible pour le reste de la journée.",
    composition:
      'Extérieur : cuir de vachette grainé. Doublure : coton enduit. Ferrures : laiton finition mate. Dimensions : 30 × 22 × 12 cm. Anse : 12 cm. Bandoulière amovible : 118 cm.',
    care: 'Ranger dans sa housse. Éviter le contact prolongé avec le denim brut, qui peut déteindre.',
    sku: 'DLX-SAC-CSB',
    price: 17900,
    category: 'sacs-a-main',
    isFeatured: true,
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Taupe', hex: '#7A736B' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [6, 4],
  },
  {
    slug: 'sac-hydra-baguette',
    name: 'Sac Hydra',
    subtitle: 'Baguette portée épaule',
    description:
      "Un format baguette allongé, porté sous le bras. Assez de place pour un portefeuille, un téléphone et une trousse, pas assez pour s'encombrer.\n\nLa fermeture aimantée s'ouvre d'une seule main.",
    composition:
      'Extérieur : cuir de veau lisse. Doublure : microfibre. Dimensions : 30 × 14 × 6 cm. Anse : 26 cm.',
    care: 'Chiffon doux. Nourrir le cuir deux fois par an.',
    sku: 'DLX-SAC-HYD',
    price: 13900,
    comparePrice: 16900,
    category: 'sacs-a-main',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Ivoire', hex: '#EDE9E2' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [3, 2],
  },
  {
    slug: 'sac-zeralda-anse-ronde',
    name: 'Sac Zeralda',
    subtitle: 'Anse ronde, fermoir tournant',
    description:
      "Une anse ronde rigide et un fermoir tournant en laiton : deux détails qui suffisent à donner au sac son caractère, sans aucun logo.\n\nLe format compact reste suffisant pour l'essentiel d'une soirée ou d'un déjeuner.",
    composition:
      'Extérieur : cuir de vachette. Doublure : textile. Ferrures : laiton. Dimensions : 24 × 17 × 8 cm.',
    care: 'Éviter de suspendre le sac par son anse rigide lorsqu’il est chargé.',
    sku: 'DLX-SAC-ZRL',
    price: 15500,
    category: 'sacs-a-main',
    isNew: true,
    colors: [{ name: 'Noir', hex: '#0A0A0A' }],
    sizes: ONE_SIZE,
    stockPattern: [5],
  },

  // ── Bandoulières ──────────────────────────────────────────────────────────
  {
    slug: 'bandouliere-sahel',
    name: 'Bandoulière Sahel',
    subtitle: 'Anse réglable jusqu’à 125 cm',
    description:
      "Le petit sac que l'on porte en travers, pour les journées où l'on veut les mains libres. L'anse se règle sur toute sa longueur et se retire complètement.\n\nUne poche arrière plaquée permet de glisser le téléphone sans ouvrir le rabat.",
    composition:
      'Extérieur : cuir grainé. Doublure : microfibre. Dimensions : 22 × 16 × 7 cm. Anse : 80 à 125 cm.',
    care: 'Chiffon humide, séchage à l’air libre.',
    sku: 'DLX-BAN-SHL',
    price: 10900,
    category: 'bandoulieres',
    isFeatured: true,
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Gris perle', hex: '#C9C9C5' },
      { name: 'Taupe', hex: '#7A736B' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [7, 5, 4],
  },
  {
    slug: 'bandouliere-bejaia-mini',
    name: 'Bandoulière Béjaïa',
    subtitle: 'Mini format, chaîne et cuir',
    description:
      "Un mini sac à chaîne, dont le maillon plat ne se prend pas dans les cheveux — nous avons écarté deux fournisseurs avant de trouver le bon.\n\nContient un téléphone grand format, une carte et un rouge à lèvres.",
    composition:
      'Extérieur : cuir de veau. Chaîne : laiton plaqué. Dimensions : 18 × 12 × 5 cm. Chaîne : 110 cm.',
    care: 'Ne pas immerger la chaîne. Ranger à plat.',
    sku: 'DLX-BAN-BJA',
    price: 8900,
    comparePrice: 11500,
    category: 'bandoulieres',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Ivoire', hex: '#EDE9E2' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [2, 3],
  },

  // ── Cabas ─────────────────────────────────────────────────────────────────
  {
    slug: 'cabas-tassili',
    name: 'Cabas Tassili',
    subtitle: 'Ordinateur 13″, cuir souple',
    description:
      "Un grand cabas souple, à porter à l'épaule même avec un manteau. Il avale un ordinateur treize pouces, un dossier A4 et une gourde sans se déformer.\n\nLa pochette intérieure zippée est cousue, pas rapportée : elle ne se décroche pas.",
    composition:
      'Extérieur : cuir de vachette souple. Doublure : coton. Dimensions : 38 × 30 × 14 cm. Anses : 24 cm.',
    care: 'Nourrir le cuir tous les trimestres. Ne pas surcharger au-delà de 6 kg.',
    sku: 'DLX-CAB-TSL',
    price: 18900,
    category: 'cabas',
    isFeatured: true,
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Taupe', hex: '#7A736B' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [4, 3],
  },
  {
    slug: 'cabas-constantine-reversible',
    name: 'Cabas Constantine',
    subtitle: 'Réversible, pochette incluse',
    description:
      "Deux sacs en un : une face lisse, une face grainée, et une pochette assortie qui se clipse à l'intérieur.\n\nC'est le cadeau qui fonctionne à tous les coups, parce qu'il n'impose pas un seul style.",
    composition:
      'Extérieur : cuir de veau réversible. Dimensions : 36 × 28 × 12 cm. Pochette : 20 × 14 cm.',
    care: 'Chiffon sec sur la face grainée, chiffon doux sur la face lisse.',
    sku: 'DLX-CAB-CST',
    price: 15900,
    comparePrice: 19500,
    category: 'cabas',
    colors: [{ name: 'Noir', hex: '#0A0A0A' }],
    sizes: ONE_SIZE,
    stockPattern: [3],
  },

  // ── Sacs à dos ────────────────────────────────────────────────────────────
  {
    slug: 'sac-a-dos-atlas',
    name: 'Sac à dos Atlas',
    subtitle: 'Cuir grainé, ordinateur 14″',
    description:
      "Un sac à dos en cuir grainé qui ne fait pas cartable. Les bretelles sont rembourrées et réglables, le dos est matelassé, et le compartiment ordinateur est doublé de feutre.\n\nL'ouverture par rabat magnétique reste rapide, même debout dans un bus.",
    composition:
      'Extérieur : cuir grainé. Doublure : polyester recyclé. Compartiment ordinateur : feutre, jusqu’à 14″. Dimensions : 30 × 40 × 15 cm.',
    care: 'Essuyer après la pluie. Nourrir le cuir deux fois par an.',
    sku: 'DLX-DOS-ATL',
    price: 16500,
    category: 'sacs-a-dos',
    isNew: true,
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Anthracite', hex: '#3A3A38' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [5, 4],
  },
  {
    slug: 'sac-a-dos-chrea-compact',
    name: 'Sac à dos Chréa',
    subtitle: 'Format compact, ville',
    description:
      "Un sac à dos réduit à l'essentiel, pour la ville. Assez pour une tablette, un carnet et une gourde, pas plus.\n\nLes bretelles fines gardent la ligne du dos nette.",
    composition: 'Extérieur : cuir de veau. Doublure : textile. Dimensions : 26 × 32 × 11 cm.',
    care: 'Chiffon doux. Ne pas surcharger.',
    sku: 'DLX-DOS-CHR',
    price: 12900,
    category: 'sacs-a-dos',
    colors: [{ name: 'Noir', hex: '#0A0A0A' }],
    sizes: ONE_SIZE,
    stockPattern: [6],
  },

  // ── Pochettes & portefeuilles ─────────────────────────────────────────────
  {
    slug: 'pochette-soiree-tamanrasset',
    name: 'Pochette Tamanrasset',
    subtitle: 'Soirée, chaînette amovible',
    description:
      "Une pochette rigide de soirée, à tenir en main ou à porter par sa chaînette fine. Le fermoir clic se manipule sans regarder.\n\nL'intérieur est doublé de satin, pour ne pas rayer un téléphone.",
    composition:
      'Extérieur : cuir de chèvre. Doublure : satin. Chaînette amovible : 105 cm. Dimensions : 22 × 13 × 4 cm.',
    care: 'Ranger à plat dans sa housse.',
    sku: 'DLX-POC-TMR',
    price: 7900,
    category: 'pochettes',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Ivoire', hex: '#EDE9E2' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [4, 3],
  },
  {
    slug: 'portefeuille-compact-oasis',
    name: 'Portefeuille Oasis',
    subtitle: 'Compact, six cartes',
    description:
      "Un portefeuille qui tient dans une petite bandoulière : six emplacements cartes, une poche billets et une poche monnaie zippée.\n\nLe cuir est le même que celui de nos sacs — les pièces vieillissent donc ensemble.",
    composition: 'Cuir de vachette grainé. Dimensions : 11 × 9 × 2,5 cm.',
    care: 'Ne pas surcharger les emplacements cartes les premiers jours, le cuir se détend seul.',
    sku: 'DLX-POC-OAS',
    price: 5500,
    comparePrice: 6900,
    category: 'pochettes',
    colors: [
      { name: 'Noir', hex: '#0A0A0A' },
      { name: 'Taupe', hex: '#7A736B' },
      { name: 'Ivoire', hex: '#EDE9E2' },
    ],
    sizes: ONE_SIZE,
    stockPattern: [8, 6, 5],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Exécution
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('▸ DELUXIA — initialisation des données\n');

  // ── Compte administrateur ────────────────────────────────────────────────
  const email = (process.env.ADMIN_EMAIL ?? 'admin@deluxia.dz').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      'ADMIN_PASSWORD est absent du fichier .env — impossible de créer le compte administrateur.',
    );
  }

  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    // `update: {}` volontairement vide : relancer le seed ne doit jamais
    // réinitialiser un mot de passe que le gérant aurait changé lui-même.
    create: {
      email,
      name: 'Direction DELUXIA',
      role: 'OWNER',
      passwordHash: await hashPassword(password),
    },
  });
  console.log(`  ✓ Compte administrateur : ${email}`);

  // ── Grille de livraison ──────────────────────────────────────────────────
  for (const wilaya of WILAYAS) {
    const payload = {
      name: wilaya.name,
      nameAr: wilaya.nameAr,
      homeFee: wilaya.homeFee,
      deskFee: wilaya.deskFee,
      hasDesk: wilaya.hasDesk,
      returnFee: wilaya.returnFee,
      isServed: wilaya.isServed,
      deliveryMin: wilaya.delay[0],
      deliveryMax: wilaya.delay[1],
    };
    await prisma.deliveryRate.upsert({
      where: { code: wilaya.code },
      update: payload,
      create: { code: wilaya.code, ...payload },
    });
  }
  console.log(`  ✓ Tarifs de livraison : ${WILAYAS.length} wilayas`);

  // ── Collections ──────────────────────────────────────────────────────────
  const collections = [
    { name: 'Chaussures', slug: 'chaussures', position: 0 },
    { name: 'Sacs', slug: 'sacs', position: 1 },
    { name: 'Accessoires', slug: 'accessoires', position: 2 },
  ];
  
  const collectionIds = new Map<string, string>();
  for (const c of collections) {
    const record = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { name: c.name, position: c.position },
      create: { slug: c.slug, name: c.name, position: c.position },
    });
    collectionIds.set(c.slug, record.id);
  }
  console.log(`  ✓ Collections : ${collections.length}`);

  // ── Catégories ───────────────────────────────────────────────────────────
  const categoryIds = new Map<string, string>();

  for (const [index, category] of CATEGORIES.entries()) {
    const { collectionSlug, ...catData } = category;
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { ...catData, position: index, collectionId: collectionIds.get(collectionSlug) },
      create: { ...catData, position: index, collectionId: collectionIds.get(collectionSlug) },
      select: { id: true },
    });
    categoryIds.set(category.slug, record.id);
  }
  console.log(`  ✓ Catégories : ${CATEGORIES.length}`);

  // ── Produits ─────────────────────────────────────────────────────────────
  let variantCount = 0;

  for (const [index, product] of PRODUCTS.entries()) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Catégorie inconnue : ${product.category}`);

    const payload = {
      name: product.name,
      subtitle: product.subtitle,
      description: product.description,
      composition: product.composition,
      care: product.care,
      sku: product.sku,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
      categoryId,
      images: [],
      isActive: true,
      isFeatured: product.isFeatured ?? false,
      isNew: product.isNew ?? false,
      position: index,
    };

    const record = await prisma.product.upsert({
      where: { slug: product.slug },
      update: payload,
      create: { slug: product.slug, ...payload },
      select: { id: true },
    });

    // Les déclinaisons sont recréées à l'identique : le seed reste la référence
    // du catalogue de démonstration.
    await prisma.productVariant.deleteMany({ where: { productId: record.id } });

    const variants = product.colors.flatMap((color, colorIndex) =>
      product.sizes.map((size, sizeIndex) => ({
        productId: record.id,
        size,
        color: color.name,
        colorHex: color.hex,
        stock:
          product.sizes.length === 1
            ? (product.stockPattern[colorIndex] ?? 4)
            : (product.stockPattern[sizeIndex % product.stockPattern.length] ?? 3),
        position: colorIndex * 100 + sizeIndex,
      })),
    );

    await prisma.productVariant.createMany({ data: variants });
    variantCount += variants.length;
  }

  console.log(`  ✓ Produits : ${PRODUCTS.length} (${variantCount} déclinaisons)`);

  // ── Réglages ─────────────────────────────────────────────────────────────
  await prisma.setting.upsert({
    where: { key: 'announcement' },
    update: {},
    create: { key: 'announcement', value: 'Livraison dans toute l’Algérie · Paiement à la livraison' },
  });

  const totalStock = await prisma.productVariant.aggregate({ _sum: { stock: true } });
  console.log(`\n  Stock total en rayon : ${totalStock._sum.stock ?? 0} pièces`);
  console.log('\n▸ Terminé.\n');
}

main()
  .catch((error) => {
    console.error('\n✗ Échec du seed :', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
