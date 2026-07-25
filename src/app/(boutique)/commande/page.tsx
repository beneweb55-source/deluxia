import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { PageHeader } from '@/components/PageHeader';
import { getDeliveryOptions } from '@/lib/delivery-rates';

export const metadata: Metadata = {
  title: 'Commande',
  description: 'Finalisez votre commande DELUXIA. Paiement à la livraison, partout en Algérie.',
  robots: { index: false, follow: false },
};

/**
 * La grille tarifaire est relue toutes les cinq minutes. Une modification faite
 * dans l'administration se répercute donc rapidement sur le tunnel de commande,
 * sans exiger un rendu dynamique de la page à chaque visiteuse.
 */
export const revalidate = 300;

export default async function CommandePage() {
  const options = await getDeliveryOptions();

  return (
    <>
      <PageHeader
        eyebrow="Dernière étape"
        title="Votre commande"
        description="Renseignez vos coordonnées de livraison. Vous réglerez au livreur, à la réception du colis."
        crumbs={[
          { name: 'Panier', href: '/panier' },
          { name: 'Commande', href: '/commande' },
        ]}
      />
      <CheckoutForm options={options} />
    </>
  );
}
