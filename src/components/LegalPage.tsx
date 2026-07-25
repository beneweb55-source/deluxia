import type { ReactNode } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { BRAND } from '@/lib/brand';

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Gabarit des pages juridiques — conditions de vente, confidentialité, mentions
 * légales.
 *
 * Un sommaire d'ancres précède le texte : ces pages sont consultées pour trouver
 * un point précis, pas pour être lues de bout en bout. La largeur est réduite
 * (`shell-tight`) car au-delà d'environ 75 caractères par ligne, un texte long
 * devient pénible à suivre.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** Date de dernière révision, écrite en toutes lettres. */
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={intro}
        crumbs={[{ name: title, href: '#' }]}
      />

      <div className="shell-tight pb-(--spacing-section)">
        <p className="border-y border-line py-4 text-[0.75rem] uppercase tracking-[0.14em] text-ash">
          Dernière mise à jour : {updatedAt}
        </p>

        <nav aria-label="Sommaire" className="mt-10">
          <h2 className="eyebrow mb-5">Sommaire</h2>
          <ol className="space-y-2.5">
            {sections.map((section, index) => (
              <li key={section.id} className="flex gap-4">
                <span className="shrink-0 text-[0.75rem] tabular-nums text-ash">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <a
                  href={`#${section.id}`}
                  className="link-underline text-[0.875rem] text-graphite hover:text-ink"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-14 space-y-12">
          {sections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <h2 className="flex gap-4 text-[1.125rem] font-normal text-ink">
                <span className="shrink-0 tabular-nums text-ash">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 pl-9 text-[0.9375rem] leading-relaxed text-graphite">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-line pt-8">
          <p className="text-[0.875rem] leading-relaxed text-graphite">
            Une question sur ce document ? Appelez-nous au{' '}
            <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-ink">
              {BRAND.phoneDisplay}
            </a>{' '}
            ou écrivez-nous depuis la{' '}
            <Link href="/contact" className="link-underline text-ink">
              page contact
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
