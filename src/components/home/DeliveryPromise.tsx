import type { CSSProperties } from 'react';
import { ButtonLink } from '@/components/ui/Button';
import { formatPrice } from '@/lib/format';
import { MIN_HOME_FEE, SERVED_COUNT, SERVED_WILAYAS } from '@/data/wilayas';

/**
 * Promesse de livraison — chiffres réels issus de la grille du transporteur,
 * jamais d'estimations. Annoncer un nombre exact de wilayas plutôt que « toute
 * l'Algérie » est délibéré : un chiffre précis est plus crédible qu'une formule
 * générale, et il évite la déception d'une cliente d'une wilaya non desservie.
 * Le compte est calculé à partir des données, jamais écrit à la main.
 */
export function DeliveryPromise() {
  const deskCount = SERVED_WILAYAS.filter((w) => w.hasDesk).length;

  const figures = [
    { value: String(SERVED_COUNT), label: 'wilayas livrées' },
    { value: String(deskCount), label: 'bureaux de retrait' },
    { value: formatPrice(MIN_HOME_FEE), label: 'livraison dès' },
    { value: '0 DA', label: 'à l\'avance' },
  ];

  return (
    <section className="shell py-(--spacing-section)">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="reveal eyebrow">Livraison</p>
          <h2 className="reveal mt-4 text-title font-light text-ink">
            Partout en Algérie,<br />payé à la réception.
          </h2>
          <p className="reveal mt-6 max-w-lg text-[0.9375rem] leading-relaxed text-graphite">
            Livraison à domicile ou retrait en bureau, au choix, selon votre wilaya. Le montant
            exact s'affiche dès que vous sélectionnez votre wilaya — aucun frais n'apparaît à la
            dernière étape.
          </p>

          <ButtonLink href="/livraison" variant="outline" className="reveal mt-9">
            Voir les tarifs par wilaya
          </ButtonLink>
        </div>

        <dl className="grid grid-cols-2 gap-px border-t border-line">
          {figures.map((figure, index) => (
            <div
              key={figure.label}
              className="reveal border-b border-line py-8 sm:py-10"
              style={{ '--reveal-delay': `${index * 90}ms` } as CSSProperties}
            >
              <dt className="sr-only">{figure.label}</dt>
              <dd>
                <span className="block text-[clamp(2rem,5vw,3.25rem)] font-extralight leading-none tracking-[-0.04em] text-ink">
                  {figure.value}
                </span>
                <span className="mt-3 block text-[0.6875rem] uppercase tracking-[0.16em] text-ash">
                  {figure.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
