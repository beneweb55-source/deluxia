import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { ProductGrid } from '@/components/ProductGrid';
import { SectionHeading } from '@/components/SectionHeading';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { Accordion } from '@/components/ui/Accordion';
import { ExchangeIcon, ShieldIcon, TruckIcon } from '@/components/icons';
import { getProductBySlug, getRelatedProducts, isInStock } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/format';
import { breadcrumbJsonLd, productJsonLd } from '@/lib/seo';
import { MIN_HOME_FEE, SERVED_COUNT } from '@/data/wilayas';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: 'Article introuvable' };

  const title = `${product.name} — ${formatPrice(product.price)}`;
  const description =
    product.subtitle ??
    `${product.name} · ${product.category.name}. Livraison dans ${SERVED_COUNT} wilayas, paiement à la livraison.`;

  return {
    title: product.name,
    description: description.slice(0, 158),
    alternates: { canonical: `/produit/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/produit/${product.slug}`,
      ...(product.images.length > 0 ? { images: product.images } : {}),
    },
  };
}

export const revalidate = 300;

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product.id, product.category.id, 4);
  const inStock = isInStock(product);

  // Compteur de consultations — alimente le tri « les plus consultés » et le
  // tableau de bord. `catch` volontaire : une écriture ratée ne doit jamais
  // empêcher l'affichage d'une fiche produit.
  prisma.product
    .update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);

  const crumbs = [
    { name: 'Boutique', href: '/boutique' },
    { name: product.category.name, href: `/boutique?categorie=${product.category.slug}` },
    { name: product.name, href: `/produit/${product.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={productJsonLd({
          name: product.name,
          slug: product.slug,
          description: product.description,
          sku: product.sku,
          price: product.price,
          images: product.images,
          categoryName: product.category.name,
          inStock,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <div className="shell pt-8 sm:pt-12">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex flex-wrap items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em] text-ash">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Accueil
              </Link>
            </li>
            {crumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                {index === crumbs.length - 1 ? (
                  <span aria-current="page" className="text-ink">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.href} className="transition-colors hover:text-ink">
                    {crumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <article className="shell grid gap-12 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-14">
        <ProductGallery
          name={product.name}
          slug={product.slug}
          images={product.images}
          categorySlug={product.category.slug}
        />

        {/* Le panneau reste visible pendant la lecture du descriptif :
            le bouton d'achat n'est jamais hors d'atteinte sur grand écran. */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">{product.category.name}</p>
          <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
            {product.name}
          </h1>
          {product.subtitle && (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-graphite">{product.subtitle}</p>
          )}

          <PurchasePanel
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            comparePrice={product.comparePrice}
            images={product.images}
            categorySlug={product.category.slug}
            variants={product.variants}
          />

          {/* ── Réassurance ─────────────────────────────────────────────── */}
          <ul className="mt-10 space-y-4 border-y border-line py-7">
            <li className="flex gap-4">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <p className="text-[0.8125rem] leading-relaxed text-graphite">
                <span className="text-ink">Paiement à la livraison.</span> Vous réglez au livreur, à
                la réception du colis.
              </p>
            </li>
            <li className="flex gap-4">
              <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <p className="text-[0.8125rem] leading-relaxed text-graphite">
                <span className="text-ink">Livraison dès {formatPrice(MIN_HOME_FEE)}.</span> À
                domicile ou en bureau, dans {SERVED_COUNT} wilayas.
              </p>
            </li>
            <li className="flex gap-4">
              <ExchangeIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <p className="text-[0.8125rem] leading-relaxed text-graphite">
                <span className="text-ink">Échange sous 24 h.</span> Article non porté, dans son
                emballage d'origine.
              </p>
            </li>
          </ul>

          {/* ── Détails ─────────────────────────────────────────────────── */}
          <div className="mt-8">
            <Accordion title="Description" defaultOpen>
              <p className="whitespace-pre-line">{product.description}</p>
            </Accordion>

            {product.composition && (
              <Accordion title="Composition">
                <p className="whitespace-pre-line">{product.composition}</p>
              </Accordion>
            )}

            {product.care && (
              <Accordion title="Entretien">
                <p className="whitespace-pre-line">{product.care}</p>
              </Accordion>
            )}

            <Accordion title="Livraison & retours">
              <p>
                Livraison à domicile ou retrait en bureau selon votre wilaya, sous 1 à 10 jours
                ouvrés. Le montant exact s'affiche au moment de la commande, avant toute validation.
              </p>
              <p className="mt-3">
                Échange possible sous 24 h après réception, article non porté et dans son emballage
                d'origine.{' '}
                <Link href="/retours" className="link-underline text-ink">
                  Détail de la procédure
                </Link>
                .
              </p>
            </Accordion>

            <Accordion title="Référence">
              <p className="font-mono text-[0.8125rem]">{product.sku}</p>
            </Accordion>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-line">
          <div className="shell py-(--spacing-section)">
            <SectionHeading
              eyebrow="Dans le même esprit"
              title="Vous aimerez aussi"
              href={`/boutique?categorie=${product.category.slug}`}
              linkLabel={`Tout ${product.category.name.toLowerCase()}`}
              className="mb-12"
            />
            <ProductGrid products={related} priorityCount={0} />
          </div>
        </section>
      )}

      <RecentlyViewed currentSlug={product.slug} />
    </>
  );
}
