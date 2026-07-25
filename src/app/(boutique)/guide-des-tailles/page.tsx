import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { ScrollableTable } from '@/components/ui/ScrollableTable';
import { ButtonLink } from '@/components/ui/Button';
import { BRAND } from '@/lib/brand';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Guide des tailles',
  description:
    'Correspondances de pointures EU / UK / US, méthode de mesure du pied et formats de sacs DELUXIA.',
  alternates: { canonical: '/guide-des-tailles' },
};

/* Ces valeurs sont identiques à celles de la fenêtre « Guide des tailles » des
   fiches produits (src/components/product/SizeGuide.tsx). Toute modification
   doit être reportée dans les deux fichiers, sous peine d'annoncer deux
   correspondances différentes pour la même pointure. */
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

const FIT_ROWS = [
  ['Sneakers', 'Chaussant normal', 'Prenez votre pointure habituelle.'],
  ['Bottines', 'Chaussant juste', 'Prévoyez une chaussette : montez d’une demi-pointure si vous hésitez.'],
  ['Escarpins pointus', 'Taillent petit', 'Prenez une demi-pointure au-dessus.'],
  ['Sandales & mules', 'Chaussant large', 'Restez à votre pointure ; ne montez pas.'],
] as const;

const BAG_ROWS = [
  ['Pochette', '22 × 13 × 4', 'Téléphone, clés, rouge à lèvres', 'Soirée'],
  ['Bandoulière', '24 × 17 × 8', 'Portefeuille, petit carnet', 'Journée'],
  ['Baguette', '30 × 14 × 6', 'Essentiels, porté épaule', 'Ville'],
  ['Sac à main', '30 × 22 × 12', 'Trousse, tablette 10″', 'Travail'],
  ['Cabas', '38 × 30 × 14', 'Ordinateur 13″, dossiers', 'Bureau, courses'],
  ['Sac à dos', '30 × 40 × 15', 'Ordinateur 14″, gourde', 'Études, voyage'],
] as const;

const MEASURE_STEPS = [
  'Posez une feuille de papier contre un mur et placez-y le talon, debout.',
  'Marquez au crayon l’extrémité de votre plus long orteil — ce n’est pas toujours le premier.',
  'Mesurez la distance entre le bord de la feuille et la marque, en centimètres.',
  'Mesurez en fin de journée : le pied est alors à son volume maximal.',
  'Entre deux pointures, prenez systématiquement la plus grande.',
] as const;

export default function GuideDesTaillesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Guide des tailles', href: '/guide-des-tailles' }])} />

      <PageHeader
        eyebrow="Bien choisir"
        title="Guide des tailles"
        description="Une pointure juste évite un échange. Voici les correspondances, la méthode pour mesurer votre pied, et les dimensions réelles de nos sacs."
        crumbs={[{ name: 'Guide des tailles', href: '/guide-des-tailles' }]}
      />

      {/* ── Pointures ────────────────────────────────────────────────────── */}
      <section aria-labelledby="pointures" className="shell pb-14">
        <h2 id="pointures" className="text-title font-light text-ink">
          Pointures femme
        </h2>

        <ScrollableTable label="Correspondances de pointures" className="mt-8">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink">
                {['EU', 'UK', 'US', 'Longueur du pied (cm)'].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="pb-3 pr-4 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHOE_ROWS.map((row) => (
                <tr key={row[0]} className="border-b border-line/70">
                  {row.map((cell, index) => (
                    <td
                      key={index}
                      className={`py-3.5 pr-4 text-[0.875rem] tabular-nums ${
                        index === 0 ? 'text-ink' : 'text-graphite'
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>

        <p className="mt-5 text-[0.8125rem] text-ash">
          Les pointures disponibles varient selon les modèles ; celles qui sont épuisées apparaissent
          barrées sur la fiche produit.
        </p>
      </section>

      {/* ── Mesure ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="mesurer" className="border-y border-line bg-mist">
        <div className="shell grid gap-12 py-(--spacing-section) lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 id="mesurer" className="text-title font-light text-ink">
              Mesurer son pied
            </h2>
            <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-graphite">
              Deux minutes, une feuille et un crayon. C&rsquo;est plus fiable que de se fier à la
              pointure d&rsquo;une paire achetée il y a trois ans.
            </p>

            <ol className="mt-9 space-y-5">
              {MEASURE_STEPS.map((step, index) => (
                <li key={step} className="flex gap-5 border-t border-line pt-5">
                  <span className="shrink-0 text-[0.6875rem] font-medium tabular-nums tracking-[0.16em] text-ash">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-[0.9375rem] leading-relaxed text-graphite">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h2 className="text-title font-light text-ink">Selon le modèle</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-graphite">
              Toutes les chaussures ne chaussent pas de la même façon. Ce tableau résume ce que nous
              observons sur nos propres modèles.
            </p>

            <ScrollableTable label="Conseils de chaussant par famille" className="mt-9">
              <table className="w-full min-w-[26rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-ink">
                    {['Famille', 'Chaussant', 'Conseil'].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="pb-3 pr-4 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FIT_ROWS.map((row) => (
                    <tr key={row[0]} className="border-b border-line/70">
                      <td className="py-3.5 pr-4 text-[0.875rem] text-ink">{row[0]}</td>
                      <td className="py-3.5 pr-4 text-[0.875rem] text-graphite">{row[1]}</td>
                      <td className="py-3.5 text-[0.875rem] text-graphite">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          </div>
        </div>
      </section>

      {/* ── Sacs ─────────────────────────────────────────────────────────── */}
      <section aria-labelledby="sacs" className="shell py-(--spacing-section)">
        <h2 id="sacs" className="text-title font-light text-ink">
          Formats de sacs
        </h2>
        <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-graphite">
          Les dimensions exactes de chaque modèle figurent dans l&rsquo;onglet « Composition » de sa
          fiche. Ce tableau donne les ordres de grandeur pour se repérer.
        </p>

        <ScrollableTable label="Correspondances de pointures" className="mt-8">
          <table className="w-full min-w-[38rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink">
                {['Format', 'Dimensions (cm)', 'Contient', 'Usage'].map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="pb-3 pr-4 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BAG_ROWS.map((row) => (
                <tr key={row[0]} className="border-b border-line/70">
                  <td className="py-3.5 pr-4 text-[0.875rem] text-ink">{row[0]}</td>
                  <td className="py-3.5 pr-4 text-[0.875rem] tabular-nums text-graphite">{row[1]}</td>
                  <td className="py-3.5 pr-4 text-[0.875rem] text-graphite">{row[2]}</td>
                  <td className="py-3.5 text-[0.875rem] text-graphite">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>

        <ul className="mt-7 space-y-2.5 text-[0.8125rem] leading-relaxed text-graphite">
          <li className="border-l-2 border-line pl-4">
            Anse de moins de 60 cm : le sac se porte à l&rsquo;épaule. Au-delà, en bandoulière.
          </li>
          <li className="border-l-2 border-line pl-4">
            Pour un ordinateur, comptez 2 cm de marge sur chaque dimension par rapport à sa housse.
          </li>
        </ul>
      </section>

      {/* ── Doute ────────────────────────────────────────────────────────── */}
      <section className="shell pb-(--spacing-section)">
        <div className="border border-ink p-8 text-center sm:p-12">
          <p className="eyebrow">Encore un doute ?</p>
          <h2 className="mt-5 text-[clamp(1.25rem,3vw,1.875rem)] font-light tracking-[-0.02em] text-ink">
            Appelez-nous avant de commander.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-graphite">
            Nous avons les modèles en main : nous vérifions le chaussant avec vous. Et si la
            pointure ne convenait tout de même pas, l&rsquo;échange reste possible sous 24 h.
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={`tel:${BRAND.phoneE164}`}
              className="text-[1.5rem] font-light tracking-[-0.02em] text-ink transition-opacity hover:opacity-60"
            >
              {BRAND.phoneDisplay}
            </a>
            <ButtonLink href="/retours" variant="outline">
              Conditions d&rsquo;échange
            </ButtonLink>
          </div>

          <p className="mt-8 text-[0.8125rem] text-graphite">
            Prête à choisir ?{' '}
            <Link href="/chaussures" className="link-underline text-ink">
              Voir les chaussures
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
