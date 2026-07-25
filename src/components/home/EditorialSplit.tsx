import type { CSSProperties } from 'react';
import { ProductVisual } from '@/components/ProductVisual';
import { ButtonLink } from '@/components/ui/Button';

const CHAPTERS = [
  {
    number: '01',
    title: 'La sélection avant tout',
    body: 'Nous ne référençons pas un catalogue, nous choisissons des modèles. Chaque paire, chaque sac est retenu pour sa matière, sa construction et sa capacité à bien vieillir.',
  },
  {
    number: '02',
    title: 'Le contrôle avant l\'envoi',
    body: 'Chaque colis est ouvert et vérifié avant expédition : bon modèle, bonne pointure, aucune trace. C\'est la meilleure garantie contre les mauvaises surprises.',
  },
  {
    number: '03',
    title: 'La confiance avant le paiement',
    body: 'Vous réglez au livreur, une fois le colis en main. Aucune carte, aucun virement, aucune avance.',
  },
];

/**
 * Section éditoriale — c'est ici que la marque cesse d'être un catalogue et
 * devient une maison. Le texte est court et concret : trois engagements
 * vérifiables, pas de promesse creuse.
 */
export function EditorialSplit() {
  return (
    <section className="border-y border-line bg-mist">
      <div className="shell grid gap-12 py-(--spacing-section) lg:grid-cols-2 lg:items-center lg:gap-20">
        <div className="reveal relative aspect-4/5 overflow-hidden bg-paper sm:aspect-3/2 lg:aspect-4/5">
          <ProductVisual name="L'atelier DELUXIA" slug="editorial-atelier" kind="bag" sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>

        <div>
          <p className="reveal eyebrow">La maison</p>
          <h2 className="reveal mt-4 text-title font-light text-ink" style={{ '--reveal-delay': '60ms' } as CSSProperties}>
            Trois exigences,<br />tenues à chaque commande.
          </h2>

          <ol className="mt-10 space-y-8">
            {CHAPTERS.map((chapter, index) => (
              <li
                key={chapter.number}
                className="reveal flex gap-6 border-t border-line pt-7"
                style={{ '--reveal-delay': `${140 + index * 90}ms` } as CSSProperties}
              >
                <span className="shrink-0 text-[0.6875rem] font-medium tracking-[0.16em] text-ash">
                  {chapter.number}
                </span>
                <div>
                  <h3 className="text-[1.0625rem] font-normal text-ink">{chapter.title}</h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-graphite">{chapter.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <ButtonLink href="/boutique" variant="outline" className="reveal mt-10">
            Voir la collection
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
