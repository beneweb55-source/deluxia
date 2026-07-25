import Link from 'next/link';
import type { ReactNode } from 'react';
import { ShieldIcon, TruckIcon } from '@/components/icons';
import { SERVED_COUNT } from '@/data/wilayas';

/**
 * Habillage commun aux écrans de connexion et d'inscription.
 *
 * La colonne de droite existe pour une raison précise : un compte n'est pas
 * obligatoire pour commander chez DELUXIA. Sans ce rappel, l'écran de connexion
 * ressemblerait à un péage et ferait fuir les visiteuses qui voulaient
 * simplement acheter. On annonce donc franchement l'alternative.
 */
export function AuthLayout({
  title,
  intro,
  children,
  aside,
}: {
  title: string;
  intro: string;
  children: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="shell grid gap-14 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-20">
      <section className="min-w-0">
        <p className="eyebrow">Espace client</p>
        <h1 className="mt-4 text-[clamp(1.875rem,5vw,3rem)] font-extralight leading-[1.05] tracking-[-0.03em] text-ink">
          {title}
        </h1>
        <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-graphite">{intro}</p>

        <div className="mt-10 max-w-md">{children}</div>
      </section>

      <aside className="lg:pt-16">
        <div className="border border-line p-7 sm:p-8">{aside}</div>

        <ul className="mt-8 space-y-4">
          <li className="flex gap-3">
            <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
            <span className="text-[0.8125rem] leading-relaxed text-graphite">
              Aucune donnée bancaire n'est demandée : le paiement se fait en espèces au livreur.
            </span>
          </li>
          <li className="flex gap-3">
            <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
            <span className="text-[0.8125rem] leading-relaxed text-graphite">
              Livraison dans {SERVED_COUNT} wilayas, à domicile ou en bureau de retrait.
            </span>
          </li>
        </ul>

        <p className="mt-8 text-[0.75rem] leading-relaxed text-ash">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/cgv" className="link-underline text-graphite">
            conditions générales
          </Link>{' '}
          et notre{' '}
          <Link href="/confidentialite" className="link-underline text-graphite">
            politique de confidentialité
          </Link>
          .
        </p>
      </aside>
    </div>
  );
}
