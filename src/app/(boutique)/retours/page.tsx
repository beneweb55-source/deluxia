import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { Accordion } from '@/components/ui/Accordion';
import { ButtonLink } from '@/components/ui/Button';
import { CheckIcon, CloseIcon } from '@/components/icons';
import { BRAND } from '@/lib/brand';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Échanges & remboursements',
  description:
    "Échange sous 24 h après réception chez DELUXIA : conditions, prise en charge des frais, remboursement et politique des prix.",
  alternates: { canonical: '/retours' },
};

/* Contenu conforme à la politique communiquée par la gérante :
   - échange dans les 24 h suivant la réception ;
   - frais à la charge de DELUXIA en cas d'erreur de sa part, à la charge de la
     cliente pour une convenance personnelle ;
   - demande d'échange depuis le site ou par téléphone ;
   - toute demande de remboursement passe obligatoirement par téléphone. */

const STEPS = [
  {
    title: 'Signalez sous 24 h',
    body: "Contactez-nous dans les 24 heures suivant la réception, depuis le site ou par téléphone. Munissez-vous de votre référence de commande et indiquez la pointure ou la couleur souhaitée.",
  },
  {
    title: 'Nous confirmons ensemble',
    body: "Nous vérifions avec vous la disponibilité de l'article de remplacement et convenons du mode de retour, avant que vous ne renvoyiez quoi que ce soit.",
  },
  {
    title: 'Préparez le colis',
    body: "Remettez l'article non porté dans son emballage d'origine, étiquettes en place. Glissez-y un mot avec votre référence et votre choix.",
  },
  {
    title: 'Nous expédions le remplacement',
    body: 'Une fois le colis retourné reçu et contrôlé, votre article de remplacement est envoyé. Vous êtes prévenue par téléphone.',
  },
] as const;

const ACCEPTED = [
  'Article non porté et en parfait état',
  'Emballage d’origine complet, étiquettes en place',
  'Demande formulée dans les 24 h suivant la réception',
  'Référence de commande communiquée',
] as const;

const REFUSED = [
  'Article porté ou abîmé après réception',
  'Emballage manquant ou étiquettes retirées',
  'Demande au-delà du délai de 24 h',
] as const;

export default function RetoursPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Échanges & remboursements', href: '/retours' }])} />

      <PageHeader
        eyebrow="Après réception"
        title="Échanges & remboursements"
        description="La pointure ne convient pas ? L'échange est possible sous 24 heures. Voici précisément comment cela se passe, et ce qui reste à votre charge."
        crumbs={[{ name: 'Échanges & remboursements', href: '/retours' }]}
      />

      {/* ── Procédure ────────────────────────────────────────────────────── */}
      <section aria-labelledby="procedure" className="shell pb-14">
        <h2 id="procedure" className="text-title font-light text-ink">
          La procédure, en quatre étapes
        </h2>

        <ol className="mt-10 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="reveal border border-line p-7">
              <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-ash">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-[1.0625rem] font-normal leading-snug text-ink">{step.title}</h3>
              <p className="mt-2.5 text-[0.875rem] leading-relaxed text-graphite">{step.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 border-l-2 border-ink pl-4 text-[0.9375rem] leading-relaxed text-graphite">
          Contactez-nous <strong className="font-medium text-ink">avant</strong> de renvoyer un
          colis. Un article expédié sans accord préalable peut arriver alors que la pointure de
          remplacement n&rsquo;est plus disponible, et l&rsquo;échange prend alors bien plus de temps.
        </p>
      </section>

      {/* ── Conditions ───────────────────────────────────────────────────── */}
      <section aria-labelledby="conditions" className="border-y border-line bg-mist">
        <div className="shell py-(--spacing-section)">
          <h2 id="conditions" className="text-title font-light text-ink">
            Ce qui est accepté, ce qui ne l&rsquo;est pas
          </h2>
          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-graphite">
            L&rsquo;article échangé doit revenir dans l&rsquo;état où vous l&rsquo;avez reçu : non
            porté, en parfait état, dans son emballage d&rsquo;origine.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="border border-line bg-paper p-7">
              <h3 className="eyebrow text-ink">Échange accepté</h3>
              <ul className="mt-6 space-y-3.5">
                {ACCEPTED.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                    <span className="text-[0.875rem] leading-relaxed text-graphite">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-line bg-paper p-7">
              <h3 className="eyebrow text-ink">Échange refusé</h3>
              <ul className="mt-6 space-y-3.5">
                {REFUSED.map((item) => (
                  <li key={item} className="flex gap-3">
                    <CloseIcon className="mt-0.5 h-4 w-4 shrink-0 text-ash" />
                    <span className="text-[0.875rem] leading-relaxed text-ash">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cas particuliers ─────────────────────────────────────────────── */}
      <section aria-labelledby="cas" className="shell-tight py-(--spacing-section)">
        <h2 id="cas" className="text-title font-light text-ink">
          Vos questions
        </h2>

        <div className="mt-10 border-t border-line">
          <Accordion title="Qui paie les frais de livraison de l’échange ?" defaultOpen>
            <p>
              <strong className="font-medium text-ink">Si l&rsquo;erreur vient de nous</strong> —
              mauvaise pointure, mauvaise couleur ou produit incorrect — tous les frais de livraison
              liés à l&rsquo;échange sont à notre charge.
            </p>
            <p className="mt-3">
              <strong className="font-medium text-ink">Si vous souhaitez changer</strong> de
              pointure, de couleur ou de modèle par convenance personnelle, les frais de livraison
              de l&rsquo;échange sont à votre charge.
            </p>
          </Accordion>

          <Accordion title="Comment demander un échange ?">
            <p>
              De deux façons, au choix : directement depuis le site, via notre{' '}
              <Link href="/contact" className="link-underline text-ink">
                formulaire de contact
              </Link>{' '}
              (motif « Échange ou retour »), ou par téléphone auprès de notre service client. Dans
              les deux cas, gardez votre référence de commande à portée de main.
            </p>
          </Accordion>

          <Accordion title="Comment demander un remboursement ?">
            <p>
              Toute demande de remboursement doit obligatoirement être effectuée{' '}
              <strong className="font-medium text-ink">par téléphone</strong>, auprès de notre
              service client au{' '}
              <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-ink">
                {BRAND.phoneDisplay}
              </a>
              . Nous étudions votre demande avec vous et vous indiquons la marche à suivre.
            </p>
          </Accordion>

          <Accordion title="Le colis est arrivé abîmé">
            <p>
              Refusez-le devant le livreur, sans le régler, et contactez-nous dans la foulée. Si
              vous vous en apercevez après son départ, prenez une photo du colis et de
              l&rsquo;article avant toute manipulation, puis appelez-nous.
            </p>
          </Accordion>

          <Accordion title="J’ai reçu un article différent de celui commandé">
            <p>
              C&rsquo;est une erreur de notre part, et elle est traitée en priorité : contactez-nous,
              l&rsquo;échange se fait entièrement à nos frais.
            </p>
          </Accordion>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section className="shell pb-(--spacing-section)">
        <div className="border border-ink p-8 text-center sm:p-12">
          <p className="eyebrow">Une demande d&rsquo;échange ou de remboursement ?</p>
          <h2 className="mt-5 text-[clamp(1.25rem,3vw,1.875rem)] font-light tracking-[-0.02em] text-ink">
            Le téléphone reste le plus rapide.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-graphite">
            Munissez-vous de votre référence de commande — elle figure sur votre récapitulatif et
            dans le suivi de commande. Le remboursement, lui, se demande uniquement par téléphone.
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

          <p className="mt-8 text-[0.8125rem] text-graphite">
            Besoin de retrouver votre référence ?{' '}
            <Link href="/mes-commandes" className="link-underline text-ink">
              Suivre ma commande
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
