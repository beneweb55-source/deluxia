import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { ScrollableTable } from '@/components/ui/ScrollableTable';
import { ButtonLink } from '@/components/ui/Button';
import { BagIcon, ShieldIcon, TruckIcon } from '@/components/icons';
import { BRAND } from '@/lib/brand';
import { getDeliverySummary } from '@/lib/delivery-rates';
import { formatPrice } from '@/lib/format';
import { breadcrumbJsonLd } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Livraison',
  description:
    "Tarifs et délais de livraison DELUXIA, wilaya par wilaya. Livraison à domicile ou en bureau de retrait, paiement à la réception.",
  alternates: { canonical: '/livraison' },
};

/** La grille est modifiable depuis l'administration : on la relit régulièrement. */
export const revalidate = 300;

const STEPS = [
  {
    title: 'Vous commandez',
    body: 'Sans compte si vous préférez. Nom, téléphone et adresse suffisent — deux minutes, sans carte bancaire.',
  },
  {
    title: 'Nous appelons',
    body: 'Un appel de confirmation avant toute expédition : pointure, adresse, disponibilité. Rien ne part sans votre accord.',
  },
  {
    title: 'Nous expédions',
    body: 'Le colis est ouvert et vérifié, puis confié à notre transporteur partenaire le jour même ou le lendemain.',
  },
  {
    title: 'Vous réglez au livreur',
    body: 'En espèces, à la remise du colis. Préparez si possible l’appoint, cela fait gagner du temps à tout le monde.',
  },
] as const;

export default async function LivraisonPage() {
  const { options, servedCount, deskCount, minHomeFee } = await getDeliverySummary();

  const figures = [
    { value: String(servedCount), label: 'wilayas livrées' },
    { value: String(deskCount), label: 'bureaux de retrait' },
    { value: formatPrice(minHomeFee), label: 'livraison dès' },
    { value: '0 DA', label: 'à l’avance' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Livraison', href: '/livraison' }])} />

      <PageHeader
        eyebrow="Expédition"
        title="Livraison"
        description="Partout en Algérie, à domicile ou en bureau de retrait, et toujours payée à la réception. Voici exactement combien cela coûte, wilaya par wilaya."
        crumbs={[{ name: 'Livraison', href: '/livraison' }]}
      />

      {/* ── Modes ────────────────────────────────────────────────────────── */}
      <section aria-labelledby="modes" className="shell pb-14">
        <h2 id="modes" className="sr-only">
          Modes de livraison
        </h2>

        <ul className="grid gap-px sm:grid-cols-3">
          {[
            {
              icon: TruckIcon,
              title: 'À domicile',
              body: 'Le livreur vous remet le colis à l’adresse indiquée et vous appelle avant de passer. Disponible dans toutes les wilayas desservies.',
            },
            {
              icon: BagIcon,
              title: 'En bureau de retrait',
              body: 'Vous retirez le colis à l’agence du transporteur, à votre rythme et à moindre coût. Là où aucun bureau n’existe, l’option n’apparaît pas.',
            },
            {
              icon: ShieldIcon,
              title: 'Paiement à la réception',
              body: 'Vous réglez en espèces au livreur, une fois le colis en main. Aucun acompte, aucune carte, aucun virement.',
            },
          ].map((mode) => (
            <li key={mode.title} className="reveal border border-line p-7">
              <mode.icon className="h-5 w-5 text-ink" />
              <h3 className="mt-5 text-[1.0625rem] font-normal text-ink">{mode.title}</h3>
              <p className="mt-2.5 text-[0.875rem] leading-relaxed text-graphite">{mode.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Chiffres ─────────────────────────────────────────────────────── */}
      <section className="border-y border-line bg-mist">
        <div className="shell">
          <dl className="grid grid-cols-2 gap-px lg:grid-cols-4">
            {figures.map((figure) => (
              <div key={figure.label} className="py-9 lg:px-8 lg:first:pl-0">
                <dt className="sr-only">{figure.label}</dt>
                <dd>
                  <span className="block text-[clamp(1.75rem,4vw,2.75rem)] font-extralight leading-none tracking-[-0.04em] text-ink">
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

      {/* ── Grille tarifaire ─────────────────────────────────────────────── */}
      <section aria-labelledby="tarifs" className="shell py-(--spacing-section)">
        <h2 id="tarifs" className="text-title font-light text-ink">
          Tarifs par wilaya
        </h2>
        <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-graphite">
          Les montants ci-dessous sont ceux qui s&rsquo;appliquent à votre commande. Ils
          s&rsquo;affichent également au moment de choisir votre wilaya, avant toute validation.
        </p>

        <ScrollableTable label="Tarifs de livraison par wilaya" className="mt-10">
          <table className="w-full min-w-[32rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="pb-3 pr-4 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash">
                  Code
                </th>
                <th scope="col" className="pb-3 pr-4 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash">
                  Wilaya
                </th>
                <th scope="col" className="pb-3 pr-4 text-right text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash">
                  À domicile
                </th>
                <th scope="col" className="pb-3 pr-4 text-right text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash">
                  En bureau
                </th>
              </tr>
            </thead>

            <tbody>
              {options.map((option) => {
                const unavailable = !option.isServed;

                return (
                  <tr
                    key={option.code}
                    className={cn(
                      'border-b border-line/70',
                      // Alger suit une règle propre : même tarif quel que soit le
                      // mode. La ligne est mise en évidence pour éviter la question.
                      option.code === 16 && 'bg-mist',
                    )}
                  >
                    <td className="py-3.5 pr-4 text-[0.8125rem] tabular-nums text-ash">
                      {String(option.code).padStart(2, '0')}
                    </td>
                    <td className={cn('py-3.5 pr-4 text-[0.875rem]', unavailable ? 'text-ash' : 'text-ink')}>
                      {option.name}
                    </td>

                    {unavailable ? (
                      <td colSpan={2} className="py-3.5 text-right text-[0.8125rem] text-ash">
                        Non desservie — appelez-nous
                      </td>
                    ) : (
                      <>
                        <td className="py-3.5 pr-4 text-right text-[0.875rem] tabular-nums text-ink">
                          {formatPrice(option.homeFee)}
                        </td>
                        <td className="py-3.5 pr-4 text-right text-[0.875rem] tabular-nums text-ink">
                          {option.hasDesk ? (
                            formatPrice(option.deskFee)
                          ) : (
                            <span className="text-ash">—</span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollableTable>

        <ul className="mt-7 space-y-2.5 text-[0.8125rem] leading-relaxed text-graphite">
          <li className="border-l-2 border-line pl-4">
            Un tiret dans la colonne « En bureau » signifie qu&rsquo;aucun bureau de retrait
            n&rsquo;existe dans cette wilaya : la livraison s&rsquo;y fait à domicile.
          </li>
          <li className="border-l-2 border-line pl-4">
            Les wilayas marquées « Non desservie » ne sont pas encore couvertes par notre
            transporteur. Appelez-nous : nous étudions chaque demande.
          </li>
        </ul>
      </section>

      {/* ── Déroulé ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="deroule" className="border-t border-line bg-mist">
        <div className="shell py-(--spacing-section)">
          <h2 id="deroule" className="text-title font-light text-ink">
            Comment ça se passe
          </h2>

          <ol className="mt-12 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="reveal border border-line bg-paper p-7">
                <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-ash">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-[1.0625rem] font-normal text-ink">{step.title}</h3>
                <p className="mt-2.5 text-[0.875rem] leading-relaxed text-graphite">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Wilayas non desservies ───────────────────────────────────────── */}
      <section className="shell py-(--spacing-section)">
        <div className="border border-ink p-8 text-center sm:p-12">
          <p className="eyebrow">Votre wilaya n&rsquo;est pas dans la liste ?</p>
          <h2 className="mt-5 text-[clamp(1.25rem,3vw,1.875rem)] font-light tracking-[-0.02em] text-ink">
            Appelez-nous, nous trouvons souvent une solution.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-graphite">
            Quatre wilayas ne sont pas encore desservies par notre transporteur. Selon les cas, nous
            pouvons passer par un autre relais ou vous proposer un point de retrait proche.
          </p>

          <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={`tel:${BRAND.phoneE164}`}
              className="text-[1.5rem] font-light tracking-[-0.02em] text-ink transition-opacity hover:opacity-60"
            >
              {BRAND.phoneDisplay}
            </a>
            <ButtonLink href="/contact" variant="outline">
              Nous écrire
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
