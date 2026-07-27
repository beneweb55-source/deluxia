import type { Metadata } from 'next';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { ProductVisual, type VisualKind } from '@/components/ProductVisual';
import { ArrowRightIcon } from '@/components/icons';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Nos catégories',
  description:
    'Chaussures, sacs et sneakers pour femme — choisissez votre univers. Livraison partout en Algérie, paiement à la livraison.',
  alternates: { canonical: '/collections' },
};

interface Categorie {
  name: string;
  href: string;
  kind: VisualKind;
  tagline: string;
}

/**
 * Les trois portes d'entrée mises en avant à la demande de la maison : deux
 * univers (Chaussures, Sacs) et une famille phare (Sneakers).
 *
 * C'est une sélection éditoriale volontairement figée. Elle ne suit pas la liste
 * des collections en base — elle met en avant *exactement* ce que la boutique
 * veut montrer en premier. Les destinations restent, elles, dynamiques : les
 * univers pointent vers `/c/<slug>`, Sneakers vers le catalogue filtré sur sa
 * catégorie, si bien qu'aucun produit n'est jamais figé en dur.
 */
const CATEGORIES: Categorie[] = [
  { name: 'Chaussures', href: '/c/chaussures', kind: 'heel', tagline: 'Escarpins, bottines, sandales' },
  { name: 'Sacs', href: '/c/sacs', kind: 'bag', tagline: 'À main, bandoulière, cabas' },
  { name: 'Sneakers', href: '/boutique?categorie=sneakers', kind: 'sneaker', tagline: 'Du matin au soir, sans faux pli' },
];

/**
 * Page « catégories » — destination du bouton « Découvrir la collection » du
 * premier écran. Trois grandes cartes plein cadre, une par univers : la
 * visiteuse choisit sa direction en un geste, sur mobile comme sur ordinateur.
 */
export default function CollectionsPage() {
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
          {CATEGORIES.map((categorie, index) => (
            <li
              key={categorie.href}
              className="reveal"
              style={{ '--reveal-delay': `${index * 110}ms` } as CSSProperties}
            >
              <Link href={categorie.href} className="group block">
                <div className="relative aspect-3/4 overflow-hidden bg-mist md:aspect-4/5 lg:aspect-3/4">
                  <div className="absolute inset-0 transition-transform duration-[1400ms] [transition-timing-function:var(--ease-luxe)] group-hover:scale-[1.05]">
                    <ProductVisual
                      name={categorie.name}
                      slug={`categorie-${categorie.name.toLowerCase()}`}
                      kind={categorie.kind}
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Voile bas pour garantir le contraste du titre (WCAG AA). */}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-paper via-paper/85 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                    <h2 className="text-[1.75rem] font-light leading-none tracking-[-0.03em] text-ink lg:text-[2.25rem]">
                      {categorie.name}
                    </h2>
                    <p className="mt-2.5 text-[0.8125rem] leading-snug text-graphite">
                      {categorie.tagline}
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
