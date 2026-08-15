import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { ProductVisual, type VisualKind } from '@/components/ProductVisual';
import { ArrowRightIcon } from '@/components/icons';
import { getNavCollections } from '@/lib/catalog';
import { breadcrumbJsonLd } from '@/lib/seo';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Nos catégories',
  description:
    'Chaussures, sacs et sneakers pour femme — choisissez votre univers. Livraison partout en Algérie, paiement à la livraison.',
  alternates: { canonical: '/collections' },
};

/** Silhouette de repli associée à chaque univers connu. */
const KINDS: Record<string, VisualKind> = {
  chaussures: 'heel',
  sacs: 'bag',
  accessoires: 'wallet',
  sneakers: 'sneaker',
};

/** Tagline par défaut, utilisée si aucune n'est définie en base. */
const TAGLINES: Record<string, string> = {
  chaussures: 'Escarpins, bottines, sandales',
  sacs: 'À main, bandoulière, cabas',
  accessoires: 'Ceintures, portefeuilles, pochettes',
};

/**
 * Page « catégories » — destination du bouton « Découvrir la collection » du
 * premier écran. Les cartes sont chargées dynamiquement depuis la base : les
 * images, noms et l'ordre définis dans l'admin se reflètent ici.
 */
export default async function CollectionsPage() {
  const collections = await getNavCollections();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Catégories', href: '/collections' }])} />

      <PageHeader
        eyebrow="Découvrez nos collections"
        title="Nos catégories"
        description="Trois univers, une même exigence. Choisissez le vôtre."
        crumbs={[{ name: 'Catégories', href: '/collections' }]}
      />

      <section className="shell pb-(--spacing-section)">
        <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
          {collections.map((collection, index) => (
            <li
              key={collection.slug}
              className="reveal"
              style={{ '--reveal-delay': `${index * 110}ms` } as CSSProperties}
            >
              <Link href={`/c/${collection.slug}`} className="group block">
                <div className="relative aspect-3/4 overflow-hidden bg-mist md:aspect-4/5 lg:aspect-3/4">
                  <div className="absolute inset-0 transition-transform duration-[1400ms] [transition-timing-function:var(--ease-luxe)] group-hover:scale-[1.05]">
                    <ProductVisual
                      name={collection.name}
                      slug={`categorie-${collection.slug}`}
                      images={collection.imageUrl ? [collection.imageUrl] : undefined}
                      kind={KINDS[collection.slug] ?? 'abstract'}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Voile bas pour garantir le contraste du titre (WCAG AA). */}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-paper via-paper/85 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                    <h2 className="text-[1.75rem] font-light leading-none tracking-[-0.03em] text-ink lg:text-[2.25rem]">
                      {collection.name}
                    </h2>
                    <p className="mt-2.5 text-[0.8125rem] leading-snug text-graphite">
                      {TAGLINES[collection.slug] ?? `Découvrir la collection ${collection.name.toLowerCase()}`}
                    </p>

                    <span className="mt-5 inline-flex items-center gap-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink">
                      <span className="link-underline">Découvrir</span>
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-500 [transition-timing-function:var(--ease-luxe)] group-hover:translate-x-1.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
