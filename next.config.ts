import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  /**
   * Correctif Prisma sur Vercel — « Query Engine could not be located ».
   *
   * Sur le runtime serverless de Vercel, le traceur de fichiers de Next ne
   * copiait pas le moteur natif de Prisma
   * (`libquery_engine-rhel-openssl-3.0.x.so.node`) à côté de la fonction :
   * toute requête à la base échouait alors au runtime — connexion, inscription
   * et commande cassées, alors que le site s'affichait.
   *
   *  1. `serverExternalPackages` empêche webpack de bundler Prisma : le paquet
   *     reste chargé depuis node_modules, moteur compris.
   *  2. `outputFileTracingIncludes` force la copie du moteur dans le bundle de
   *     chaque route, quelle qu'elle soit.
   *
   * L'ancienne option `optimizePackageImports: ['@prisma/client']` est retirée :
   * elle réécrit les imports de Prisma et brouille justement la localisation du
   * moteur.
   */
  serverExternalPackages: ['@prisma/client', 'prisma'],

  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/client/**/*'],
  },

  images: {
    // Les visuels produits sont pour l'instant générés (placeholders premium).
    // Quand le client fournira ses photos, il suffira d'ajouter son domaine ici
    // (ou de déposer les fichiers dans /public/produits).
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1920],
  },

  /**
   * Anciennes adresses des univers.
   *
   * Les collections vivaient à `/chaussures`, `/sacs`, `/accessoires` avant de
   * devenir dynamiques sous `/c/[slug]`. Sans ces redirections, tout lien
   * partagé sur les réseaux, tout favori et toute page déjà indexée renvoient
   * une 404 — et le référencement acquis est perdu. Une redirection permanente
   * (301) transmet au contraire l'antériorité à la nouvelle adresse.
   */
  async redirects() {
    return [
      { source: '/chaussures', destination: '/c/chaussures', permanent: true },
      { source: '/sacs', destination: '/c/sacs', permanent: true },
      { source: '/accessoires', destination: '/c/accessoires', permanent: true },
      // Découpage homme/femme d'une version antérieure : la boutique ne
      // s'adresse qu'aux femmes, ces adresses n'ont plus d'équivalent.
      { source: '/homme', destination: '/boutique', permanent: true },
      { source: '/femme', destination: '/boutique', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
