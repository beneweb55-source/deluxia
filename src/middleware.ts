import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_SESSION_COOKIE = 'deluxia_admin';
const CUSTOMER_SESSION_COOKIE = 'deluxia_customer';

/** Page de connexion unique, partagée par la gérante et les clientes. */
const LOGIN_PATH = '/connexion';

/**
 * Garde d'accès aux espaces authentifiés.
 *
 * Le middleware s'exécute sur le runtime Edge : il ne peut ni interroger la base
 * ni utiliser `node:crypto`. Il se contente donc de vérifier la **présence** du
 * cookie de session et de rediriger les visiteurs manifestement anonymes — c'est
 * un filtre de confort, pas un contrôle de sécurité.
 *
 * Les vérifications qui font autorité — session existante, non expirée, compte
 * actif — ont lieu côté serveur : `requireAdmin()` dans le layout du panneau
 * d'administration, `getSessionCustomer()` dans l'espace client. Un cookie forgé
 * franchit donc le middleware mais n'affiche aucune donnée.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isAdminArea = pathname.startsWith('/admin');
  const cookieName = isAdminArea ? ADMIN_SESSION_COOKIE : CUSTOMER_SESSION_COOKIE;

  if (!request.cookies.has(cookieName)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    // Mémorise la destination pour y revenir une fois authentifié.
    url.search = `?suite=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/*
 * Le `matcher` doit être composé de littéraux statiques : Next.js l'analyse au
 * build sans exécuter le fichier, et refuse toute expression interpolée.
 */
export const config = {
  matcher: ['/admin/:path*', '/mon-compte', '/mon-compte/:path*'],
};
