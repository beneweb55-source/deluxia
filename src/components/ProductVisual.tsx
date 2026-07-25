import Image from 'next/image';
import { cn, hashString } from '@/lib/utils';

/**
 * Visuel produit — composant unique utilisé partout (grille, fiche, panier, admin).
 *
 * ▸ Si le produit possède des photos, elles sont rendues via `next/image`
 *   (formats AVIF/WebP, lazy loading, tailles responsives).
 * ▸ Sinon, une composition monochrome est générée : fond studio dégradé, ombre
 *   portée douce, silhouette au trait de la famille de produit, grain fin.
 *
 * Le rendu généré est **déterministe** : il dérive du slug du produit. Le même
 * article affiche donc toujours exactement le même visuel, côté serveur comme
 * côté client — aucun décalage d'hydratation, aucune impression de « cassé ».
 *
 * Pour passer aux vraies photos : renseigner `images[]` du produit dans l'admin.
 * Aucune modification de code n'est nécessaire.
 */

export type VisualKind =
  | 'sneaker'
  | 'boot'
  | 'heel'
  | 'sandal'
  | 'bag'
  | 'backpack'
  | 'wallet'
  | 'belt'
  | 'abstract';

/** Silhouettes au trait, dessinées dans un viewBox 240 × 300. */
const SILHOUETTES: Record<VisualKind, readonly string[]> = {
  sneaker: [
    'M52 192 C44 192 43 178 54 176 L190 171 C200 170 201 191 192 192 Z',
    'M58 177 C60 152 78 138 102 133 L132 128 C143 126 151 131 155 141 L169 170',
    'M96 147 L114 140',
    'M101 157 L120 150',
    'M107 167 L126 160',
  ],
  boot: [
    'M62 194 C54 194 53 180 64 178 L184 174 C194 173 195 194 186 194 Z',
    'M76 177 L80 110 C81 100 89 94 100 94 L124 94 C136 94 142 101 142 113 L144 162 L180 175',
    'M80 128 L142 124',
  ],
  heel: [
    'M52 192 C70 187 98 176 120 159 L152 134 C160 128 167 131 168 140 L174 190',
    'M52 192 C61 181 80 168 101 153 L140 124',
    'M168 152 L177 192 L162 192',
  ],
  sandal: [
    'M60 190 C52 190 51 177 62 175 L182 171 C192 170 193 191 184 191 Z',
    'M74 176 C90 152 116 140 146 138',
    'M84 176 C104 160 126 152 150 150',
    'M146 138 C158 140 164 150 166 172',
  ],
  bag: [
    'M66 120 L174 120 L183 202 L57 202 Z',
    'M93 120 C93 87 147 87 147 120',
    'M110 120 L130 120 L130 134 L110 134 Z',
  ],
  backpack: [
    'M76 130 C76 113 88 105 105 105 L135 105 C152 105 164 113 164 130 L168 196 C168 206 160 212 150 212 L90 212 C80 212 72 206 72 196 Z',
    'M74 152 L166 152',
    'M101 105 C101 88 139 88 139 105',
    'M110 170 L130 170',
  ],
  wallet: [
    'M66 132 L174 132 C181 132 185 136 185 143 L185 190 C185 197 181 201 174 201 L66 201 C59 201 55 197 55 190 L55 143 C55 136 59 132 66 132 Z',
    'M55 166 L185 166',
    'M146 157 L170 157 L170 176 L146 176 Z',
  ],
  belt: [
    'M56 152 L148 152 L148 180 L56 180 Z',
    'M148 145 L188 145 L188 187 L148 187 Z',
    'M162 145 L162 187',
    'M56 166 L148 166',
  ],
  abstract: [
    'M60 210 C60 145 105 100 170 100',
    'M60 180 C60 132 98 94 146 94',
    'M60 150 C60 118 86 92 118 92',
  ],
};

/**
 * Ordre de repli quand la famille n'est pas identifiable depuis le catalogue.
 * Orienté femme : escarpins, sacs et bottines d'abord, la boutique étant
 * consacrée aux chaussures et aux sacs féminins.
 */
const FALLBACK_ORDER: readonly VisualKind[] = ['heel', 'bag', 'boot', 'sandal', 'sneaker', 'wallet'];

/**
 * Déduit la silhouette à partir du nom du produit et de sa catégorie.
 * Purement lexical : aucun champ supplémentaire à saisir par le gérant.
 */
export function visualKindFor(name: string, categorySlug?: string | null): VisualKind {
  const haystack = `${name} ${categorySlug ?? ''}`.toLowerCase();

  const rules: ReadonlyArray<[RegExp, VisualKind]> = [
    [/sneaker|basket|running|tennis|court|trainer/, 'sneaker'],
    [/boot|bottine|bottes|chelsea|cuissarde/, 'boot'],
    [/escarpin|talon|heel|stiletto|pump|sling/, 'heel'],
    [/sandale|mule|nu[\s-]?pied|espadrille|claquette|slide/, 'sandal'],
    [/sac[\s-]?[àa][\s-]?dos|backpack|cartable/, 'backpack'],
    [/portefeuille|wallet|porte[\s-]?carte|pochette|clutch/, 'wallet'],
    [/ceinture|belt/, 'belt'],
    [/sac|bag|besace|tote|cabas|bandouli|hobo|baguette|maroquinerie/, 'bag'],
  ];

  for (const [pattern, kind] of rules) {
    if (pattern.test(haystack)) return kind;
  }

  return FALLBACK_ORDER[hashString(name) % FALLBACK_ORDER.length] ?? 'abstract';
}

interface ProductVisualProps {
  name: string;
  slug: string;
  images?: readonly string[] | null;
  categorySlug?: string | null;
  /** Index de l'image à afficher (galerie de la fiche produit). */
  index?: number;
  /** `true` pour le visuel principal au-dessus de la ligne de flottaison. */
  priority?: boolean;
  sizes?: string;
  className?: string;
  /** Force une silhouette (utile pour les cartes de catégorie). */
  kind?: VisualKind;
}

export function ProductVisual({
  name,
  slug,
  images,
  categorySlug,
  index = 0,
  priority = false,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  className,
  kind,
}: ProductVisualProps) {
  const source = images?.[index] ?? images?.[0];

  if (source) {
    return (
      <Image
        src={source}
        alt={name}
        fill
        sizes={sizes}
        priority={priority}
        // Les visuels téléversés sont déjà redimensionnés et convertis en WebP
        // par le navigateur au moment de l'envoi : les repasser dans
        // l'optimiseur de Next.js coûterait du calcul serveur pour ne rien
        // gagner. Les images d'origine externe, elles, en profitent.
        unoptimized={source.startsWith('/api/media/')}
        className={cn('object-cover', className)}
      />
    );
  }

  const seed = hashString(`${slug}:${index}`);
  const silhouette = kind ?? visualKindFor(name, categorySlug);
  const paths = SILHOUETTES[silhouette];

  // Deux réglages dérivés du hachage : la position de la source lumineuse et
  // l'intensité du fond. Suffisant pour que deux produits voisins dans une
  // grille ne soient jamais identiques, sans jamais sortir du noir et blanc.
  const lightX = 30 + (seed % 40); // 30 → 69 %
  const lightY = 18 + ((seed >> 6) % 22); // 18 → 39 %
  const backdrop = 0.04 + ((seed >> 11) % 5) * 0.012; // 0.040 → 0.088

  const gradientId = `dlx-bg-${seed}`;
  const shadowId = `dlx-sh-${seed}`;
  const grainId = `dlx-gr-${seed}`;

  return (
    <svg
      viewBox="0 0 240 300"
      role="img"
      aria-label={name}
      preserveAspectRatio="xMidYMid slice"
      className={cn('h-full w-full', className)}
    >
      <defs>
        {/* Fond studio : lumière douce décalée, comme un fond de cyclorama. */}
        <radialGradient id={gradientId} cx={`${lightX}%`} cy={`${lightY}%`} r="85%">
          <stop offset="0%" stopColor="var(--color-paper)" />
          <stop offset="55%" stopColor="var(--color-mist)" />
          <stop offset="100%" stopColor="var(--color-ink)" stopOpacity={backdrop} />
        </radialGradient>

        {/* Ombre portée : ellipse floutée sous l'objet. */}
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-ink)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0" />
        </radialGradient>

        {/* Grain : trame diagonale très fine, façon papier d'impression. */}
        <pattern id={grainId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-ink)" strokeWidth="0.4" opacity="0.05" />
        </pattern>
      </defs>

      <rect width="240" height="300" fill={`url(#${gradientId})`} />
      <rect width="240" height="300" fill={`url(#${grainId})`} />

      <ellipse cx="120" cy="214" rx="82" ry="16" fill={`url(#${shadowId})`} />

      <g
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.42"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Signature discrète, à l'échelle du visuel. */}
      <text
        x="120"
        y="262"
        textAnchor="middle"
        fill="var(--color-ink)"
        opacity="0.26"
        fontSize="8.5"
        letterSpacing="4.6"
        fontFamily="var(--font-sans)"
        fontWeight="300"
      >
        DELUXIA
      </text>
    </svg>
  );
}
