import Link from 'next/link';
import type { CSSProperties } from 'react';
import { ProductVisual, type VisualKind } from '@/components/ProductVisual';
import { ArrowRightIcon } from '@/components/icons';
import { getNavCollections } from '@/lib/catalog';

/** Silhouette de fond associée à chaque univers. */
const KINDS: Record<string, VisualKind> = {
  chaussures: 'heel',
  sacs: 'bag',
  accessoires: 'wallet',
};

/**
 * Trois portes d'entrée dans le catalogue : chaussures, sacs, accessoires.
 *
 * Les cartes sont hautes et plein cadre : la visiteuse choisit son univers en un
 * geste, ce qui est plus rapide qu'un menu déroulant et bien plus lisible sur
 * mobile, où se fait l'essentiel du trafic.
 */
export async function CategoryShowcase() {
  // Lecture partagée et tolérante à la panne (voir `getNavCollections`) : si la
  // base est momentanément injoignable, la section est simplement omise plutôt
  // que de faire tomber l'accueil.
  const collections = await getNavCollections();

  if (collections.length === 0) return null;

  return (
    <section className="shell py-(--spacing-section)">
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
                    slug={`univers-${collection.slug}`}
                    kind={KINDS[collection.slug] ?? 'abstract'}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                {/* Voile bas pour garantir le contraste du titre (WCAG AA). */}
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-paper via-paper/85 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                  <h3 className="text-[1.75rem] font-light leading-none tracking-[-0.03em] text-ink lg:text-[2.25rem]">
                    {collection.name}
                  </h3>
                  <p className="mt-2.5 text-[0.8125rem] leading-snug text-graphite">
                    Découvrir la collection {collection.name.toLowerCase()}
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
  );
}
