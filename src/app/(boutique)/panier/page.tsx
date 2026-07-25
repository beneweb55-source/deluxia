import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Panier',
  description: 'Votre sélection DELUXIA. Paiement à la livraison, dans toute l\'Algérie.',
  robots: { index: false, follow: true },
};

export default function PanierPage() {
  return (
    <>
      <PageHeader
        eyebrow="Votre sélection"
        title="Panier"
        crumbs={[{ name: 'Panier', href: '/panier' }]}
      />
      <CartView />
    </>
  );
}
