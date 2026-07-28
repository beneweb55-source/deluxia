import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { THEME_INIT_SCRIPT } from '@/components/ThemeToggle';
import { BRAND } from '@/lib/brand';
import { siteUrl } from '@/lib/seo';
import './globals.css';

const inter = Inter({
  // Sans clé `weight`, next/font charge la police **variable** d'Inter : un seul
  // fichier woff2 qui contient toutes les graisses (200 à 700 utilisées ici, le
  // gras du logo et des titres compris), au lieu de six fichiers statiques. Moins
  // d'octets et moins de requêtes — sensible sur mobile. `latin` seul suffit au
  // français (é, è, ç, œ, Ÿ compris) ; `latin-ext` était du poids inutile.
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: BRAND.name,
    template: `${BRAND.name} - %s`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: [
    'chaussures femme Algérie',
    'sacs femme Algérie',
    'sac à main Alger',
    'escarpins Algérie',
    'sneakers femme',
    'bottines femme',
    'boutique en ligne Algérie',
    'paiement à la livraison',
    'DELUXIA',
  ],
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: BRAND.locale,
    url: siteUrl(),
    siteName: BRAND.name,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: true, address: false, email: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} no-js`} suppressHydrationWarning>
      <head>
        {/* Applique le thème avant le premier rendu — évite le flash blanc. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
