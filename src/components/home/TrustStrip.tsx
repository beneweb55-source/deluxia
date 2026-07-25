import type { CSSProperties } from 'react';
import { ExchangeIcon, ShieldIcon, StarIcon, TruckIcon } from '@/components/icons';
import { TRUST_POINTS } from '@/lib/brand';

const ICONS = [ShieldIcon, TruckIcon, ExchangeIcon, StarIcon] as const;

/**
 * Bandeau de réassurance, placé juste sous le hero.
 *
 * L'objection dominante de l'achat en ligne en Algérie est la confiance :
 * payer d'avance, ne pas pouvoir essayer, ne pas savoir si le colis arrivera.
 * Ces quatre réponses sont donc placées avant le premier produit, et non
 * reléguées en pied de page où elles ne seraient jamais lues.
 */
export function TrustStrip() {
  return (
    <section aria-label="Nos engagements" className="border-y border-line bg-mist">
      <div className="shell">
        <ul className="grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((point, index) => {
            const Icon = ICONS[index] ?? ShieldIcon;
            return (
              <li
                key={point.title}
                className="reveal py-10 lg:px-8 lg:first:pl-0 lg:last:pr-0"
                style={{ '--reveal-delay': `${index * 80}ms` } as CSSProperties}
              >
                <Icon className="h-5 w-5 text-ink" />
                <h3 className="mt-5 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink">
                  {point.title}
                </h3>
                <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-graphite">{point.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
