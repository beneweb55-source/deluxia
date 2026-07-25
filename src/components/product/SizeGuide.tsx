'use client';

import { useEffect, useState } from 'react';
import { CloseIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/** Correspondances pointures femme — repères usuels du marché algérien. */
const SHOE_ROWS = [
  ['35', '2,5', '5', '22,0'],
  ['36', '3,5', '6', '22,5'],
  ['37', '4', '6,5', '23,5'],
  ['38', '5', '7,5', '24,0'],
  ['39', '6', '8,5', '25,0'],
  ['40', '6,5', '9', '25,5'],
  ['41', '7,5', '10', '26,0'],
  ['42', '8', '10,5', '27,0'],
] as const;

/** Formats de sacs — dimensions moyennes et usage, pour choisir sans hésiter. */
const BAG_ROWS = [
  ['Pochette', '22 × 13 × 4', 'Téléphone, clés, rouge à lèvres', 'Soirée'],
  ['Bandoulière', '24 × 17 × 8', 'Portefeuille, petit carnet', 'Journée'],
  ['Baguette', '30 × 14 × 6', 'Essentiels, porté épaule', 'Ville'],
  ['Sac à main', '30 × 22 × 12', 'Trousse, tablette 10″', 'Travail'],
  ['Cabas', '38 × 30 × 14', 'Ordinateur 13″, dossiers', 'Bureau, courses'],
  ['Sac à dos', '30 × 40 × 15', 'Ordinateur 14″, gourde', 'Études, voyage'],
] as const;

type Tab = 'chaussures' | 'sacs';

/**
 * Guide des tailles — ouvert depuis la fiche produit.
 *
 * L'incertitude sur la pointure est la première cause d'hésitation à l'achat de
 * chaussures en ligne, et la première cause d'échange. Le tableau et le conseil
 * de mesure diminuent les deux.
 */
export function SizeGuide({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chaussures');

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.classList.add('scroll-locked');
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('scroll-locked');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'link-underline text-[0.6875rem] uppercase tracking-[0.14em] text-graphite hover:text-ink',
          triggerClassName,
        )}
      >
        Guide des tailles
      </button>

      {open && (
        <div className="fixed inset-0 z-[85] flex animate-fade-in items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Guide des tailles"
            className="relative max-h-[88vh] w-full max-w-2xl overflow-y-auto bg-paper shadow-[0_20px_70px_rgba(0,0,0,0.16)]"
          >
            <header className="sticky top-0 flex items-center justify-between border-b border-line bg-paper px-6 py-5">
              <h2 className="eyebrow text-ink">Guide des tailles</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                autoFocus
                className="-mr-2 p-2 text-ink transition-opacity hover:opacity-55"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </header>

            <div className="px-6 py-7">
              <div role="tablist" aria-label="Type d'article" className="mb-7 flex gap-6 border-b border-line">
                {(
                  [
                    ['chaussures', 'Pointures'],
                    ['sacs', 'Formats de sacs'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    role="tab"
                    type="button"
                    aria-selected={tab === value}
                    onClick={() => setTab(value)}
                    className={cn(
                      '-mb-px border-b pb-3 text-[0.6875rem] uppercase tracking-[0.16em] transition-colors',
                      tab === value ? 'border-ink text-ink' : 'border-transparent text-ash hover:text-ink',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'chaussures' ? (
                <SizeTable headers={['EU', 'UK', 'US', 'Longueur du pied (cm)']} rows={SHOE_ROWS} />
              ) : (
                <SizeTable
                  headers={['Format', 'Dimensions (cm)', 'Contient', 'Usage']}
                  rows={BAG_ROWS}
                />
              )}

              <div className="mt-8 border-t border-line pt-6">
                {tab === 'chaussures' ? (
                  <>
                    <h3 className="text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink">
                      Bien mesurer votre pointure
                    </h3>
                    <ol className="mt-4 space-y-2.5 text-[0.875rem] leading-relaxed text-graphite">
                      <li>1. Posez une feuille contre un mur et placez-y le talon.</li>
                      <li>
                        2. Marquez l'extrémité du plus long orteil, puis mesurez en centimètres.
                      </li>
                      <li>3. Mesurez en fin de journée : le pied est alors à son volume maximal.</li>
                      <li>4. Entre deux pointures, prenez la plus grande.</li>
                      <li>
                        5. Les escarpins pointus taillent souvent petit : prenez une demi-pointure
                        au-dessus.
                      </li>
                    </ol>
                  </>
                ) : (
                  <>
                    <h3 className="text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink">
                      Choisir le bon format
                    </h3>
                    <ol className="mt-4 space-y-2.5 text-[0.875rem] leading-relaxed text-graphite">
                      <li>
                        1. Les dimensions exactes de chaque modèle figurent dans l'onglet
                        « Composition » de sa fiche.
                      </li>
                      <li>
                        2. Vérifiez la longueur de l'anse : moins de 60 cm se porte à l'épaule,
                        au-delà en bandoulière.
                      </li>
                      <li>
                        3. Pour un ordinateur, comptez 2 cm de marge sur chaque dimension de la
                        housse.
                      </li>
                    </ol>
                  </>
                )}

                <p className="mt-5 text-[0.8125rem] leading-relaxed text-graphite">
                  Un doute subsiste ? Appelez-nous avant de commander, nous vérifions le modèle avec
                  vous. L'échange reste possible sous 24 h après réception.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SizeTable({
  headers,
  rows,
}: {
  headers: readonly string[];
  rows: readonly (readonly string[])[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-line">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="pb-3 pr-4 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ash"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-line/70 last:border-b-0">
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={cn('py-3 pr-4 text-[0.875rem]', index === 0 ? 'text-ink' : 'text-graphite')}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
