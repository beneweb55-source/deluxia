import type { ReactNode } from 'react';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { JsonLd } from '@/components/JsonLd';
import { WhatsAppBubble } from '@/components/WhatsAppBubble';
import { CartProvider } from '@/components/providers/CartProvider';
import { FavoritesProvider } from '@/components/providers/FavoritesProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { organizationJsonLd } from '@/lib/seo';
import { getNavCollections } from '@/lib/catalog';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';

/** Habillage de la boutique : bandeau, en-tête, contenu, pied de page, panier. */
export default async function BoutiqueLayout({ children }: { children: ReactNode }) {
  // Lecture tolérante à la panne : l'en-tête et le pied de page de TOUTES les
  // pages en dépendent. Voir `getNavCollections`.
  const collections = await getNavCollections();

  const navLinks = [
    { label: 'Boutique', href: '/boutique' },
    ...collections.map((c) => ({ label: c.name, href: `/c/${c.slug}` })),
    { label: 'Nouveautés', href: '/nouveautes' },
    { label: 'Promotions', href: '/promotions' },
    { label: 'Contact', href: '/contact' },
  ];

  const footerLinks = [
    {
      title: 'Boutique',
      links: [
        { label: 'Toute la collection', href: '/boutique' },
        ...collections.map((c) => ({ label: c.name, href: `/c/${c.slug}` })),
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
  ];
  return (
    <SessionProvider>
      <CartProvider>
        <FavoritesProvider>
          {/* Identité de la marque pour les moteurs de recherche — une seule fois,
              au niveau de la boutique, jamais dans l'administration. */}
          <JsonLd data={organizationJsonLd()} />
          <AnnouncementBanner />
          <Header navLinks={navLinks} />

          <main id="contenu">{children}</main>

          <Footer footerLinks={footerLinks} />
          <CartDrawer />
          <WhatsAppBubble />
          <ScrollReveal />
        </FavoritesProvider>
      </CartProvider>
    </SessionProvider>
  );
}
