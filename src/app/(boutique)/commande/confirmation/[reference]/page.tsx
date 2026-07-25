import type { Metadata } from 'next';
import { OrderLookup } from '@/components/order/OrderLookup';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Commande confirmée',
  description: 'Récapitulatif de votre commande DELUXIA.',
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;

  return (
    <>
      <PageHeader
        eyebrow="Confirmation"
        title="Commande enregistrée"
        description="Conservez la référence ci-dessous : elle vous permet de suivre votre commande à tout moment."
      />
      <OrderLookup reference={decodeURIComponent(reference)} celebrate />
    </>
  );
}
