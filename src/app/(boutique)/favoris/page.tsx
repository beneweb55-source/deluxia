import type { Metadata } from 'next';
import { FavoritesView } from '@/components/FavoritesView';
import { PageHeader } from '@/components/PageHeader';

export const metadata: Metadata = {
  title: 'Mes favoris',
  description: 'Les pièces DELUXIA que vous avez mises de côté.',
  robots: { index: false, follow: true },
};

export default function FavorisPage() {
  return (
    <>
      <PageHeader
        eyebrow="Votre sélection"
        title="Favoris"
        description="Vos coups de cœur sont enregistrés sur cet appareil. Les prix et la disponibilité affichés sont ceux du moment."
        crumbs={[{ name: 'Favoris', href: '/favoris' }]}
      />
      <FavoritesView />
    </>
  );
}
