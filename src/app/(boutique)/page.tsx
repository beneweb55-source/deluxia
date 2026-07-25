import type { Metadata } from 'next';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductRail } from '@/components/ProductRail';
import { SectionHeading } from '@/components/SectionHeading';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { DeliveryPromise } from '@/components/home/DeliveryPromise';
import { EditorialSplit } from '@/components/home/EditorialSplit';
import { Hero } from '@/components/home/Hero';
import { TrustStrip } from '@/components/home/TrustStrip';
import { ButtonLink } from '@/components/ui/Button';
import { getFeaturedProducts, getNewProducts, getPromoProducts } from '@/lib/catalog';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  description: BRAND.description,
  alternates: { canonical: '/' },
};

/**
 * Le catalogue change rarement : la page est régénérée toutes les dix minutes
 * plutôt qu'à chaque visite. Le visiteur reçoit du HTML statique — le meilleur
 * temps de réponse possible — et une modification faite dans l'admin apparaît
 * en moins de dix minutes sans intervention.
 */
export const revalidate = 600;

export default async function HomePage() {
  // Trois requêtes indépendantes : lancées en parallèle plutôt qu'en séquence.
  const [featured, novelties, promos] = await Promise.all([
    getFeaturedProducts(8),
    getNewProducts(8),
    getPromoProducts(4),
  ]);

  return (
    <>
      <Hero />
      <TrustStrip />
      <CategoryShowcase />

      {featured.length > 0 && (
        <section className="shell pb-(--spacing-section)">
          <SectionHeading
            eyebrow="Sélection"
            title="Les pièces de la saison"
            description="Les modèles que nous recommandons en premier — ceux qui reviennent le plus souvent, et qui déçoivent le moins."
            href="/boutique"
            className="mb-12"
          />
          <ProductGrid products={featured} />
        </section>
      )}

      <EditorialSplit />

      {novelties.length > 0 && (
        <section className="shell py-(--spacing-section)">
          <SectionHeading
            eyebrow="Nouveautés"
            title="Arrivé récemment"
            href="/nouveautes"
            linkLabel="Toutes les nouveautés"
            className="mb-12"
          />
          <ProductRail products={novelties} ariaLabel="Nouveautés" />
        </section>
      )}

      {promos.length > 0 && (
        <section className="border-y border-line bg-mist">
          <div className="shell py-(--spacing-section)">
            <SectionHeading
              eyebrow="Promotions"
              title="Prix réduits, mêmes exigences"
              description="Fins de séries et dernières tailles. Les quantités sont limitées à ce qui reste en stock."
              href="/promotions"
              linkLabel="Voir les promotions"
              className="mb-12"
            />
            <ProductGrid products={promos} priorityCount={0} />
          </div>
        </section>
      )}

      <DeliveryPromise />

      {/* Rappel final — dernier point de conversion avant le pied de page. */}
      <section className="border-t border-line">
        <div className="shell-tight flex flex-col items-center py-(--spacing-section) text-center">
          <p className="reveal eyebrow">DELUXIA</p>
          <h2 className="reveal mt-5 text-display font-extralight text-ink">{BRAND.tagline}</h2>
          <p className="reveal mt-6 max-w-md text-[0.9375rem] leading-relaxed text-graphite">
            Commandez en deux minutes, sans compte et sans carte bancaire. Vous réglez au livreur.
          </p>
          <div className="reveal mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/boutique" size="lg">
              Découvrir la collection
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" size="lg">
              Nous écrire
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
