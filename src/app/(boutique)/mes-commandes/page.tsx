import type { Metadata } from 'next';
import { OrderLookup } from '@/components/order/OrderLookup';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Suivre ma commande',
  description:
    'Suivez votre commande DELUXIA avec votre référence et votre numéro de téléphone. Aucun compte nécessaire.',
  alternates: { canonical: '/mes-commandes' },
};

export default function MesCommandesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Suivi"
        title="Suivre ma commande"
        description="Aucun compte à créer : votre référence de commande et le numéro de téléphone utilisé suffisent."
        crumbs={[{ name: 'Suivre ma commande', href: '/mes-commandes' }]}
      />
      <OrderLookup />
    </>
  );
}
