import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { LegalPage, type LegalSection } from '@/components/LegalPage';
import { BRAND, SOCIALS } from '@/lib/brand';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: `Éditeur, hébergement et propriété intellectuelle du site ${BRAND.name}.`,
  alternates: { canonical: '/mentions-legales' },
};

const LAST_UPDATE = '21 juillet 2026';

const SECTIONS: LegalSection[] = [
  {
    id: 'editeur',
    title: 'Éditeur du site',
    body: (
      <>
        <dl className="space-y-2">
          <div className="flex flex-wrap gap-x-3">
            <dt className="text-ash">Dénomination :</dt>
            <dd className="text-ink">{BRAND.legalName}</dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="text-ash">Activité :</dt>
            <dd className="text-ink">Vente de chaussures et de sacs pour femme</dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="text-ash">Siège :</dt>
            <dd className="text-ink">
              {BRAND.city}, {BRAND.country}
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="text-ash">Téléphone :</dt>
            <dd>
              <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-ink">
                {BRAND.phoneDisplay}
              </a>
            </dd>
          </div>
          <div className="flex flex-wrap gap-x-3">
            <dt className="text-ash">E-mail :</dt>
            <dd>
              <a href={`mailto:${BRAND.email}`} className="link-underline text-ink">
                {BRAND.email}
              </a>
            </dd>
          </div>
        </dl>

        {/* Aucun numéro n'est inventé : les identifiants officiels doivent être
            renseignés par l'éditeur lui-même, à partir de ses propres documents. */}
        <p className="border-l-2 border-ink pl-4 text-[0.875rem]">
          Le numéro de registre du commerce et l&rsquo;identifiant fiscal seront ajoutés ici par
          l&rsquo;éditeur, d&rsquo;après ses documents officiels.
        </p>
      </>
    ),
  },
  {
    id: 'publication',
    title: 'Directeur de la publication',
    body: (
      <p>
        La direction de la publication est assurée par le représentant légal de {BRAND.legalName},
        joignable aux coordonnées indiquées ci-dessus.
      </p>
    ),
  },
  {
    id: 'hebergement',
    title: 'Hébergement',
    body: (
      <>
        <p>
          Le site est hébergé sur une infrastructure cloud, et sa base de données sur un service
          d&rsquo;hébergement PostgreSQL géré.
        </p>
        <p>
          Les coordonnées complètes des prestataires d&rsquo;hébergement sont communiquées sur simple
          demande à{' '}
          <a href={`mailto:${BRAND.email}`} className="link-underline text-ink">
            {BRAND.email}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    body: (
      <>
        <p>
          La marque {BRAND.name}, son logotype, la structure du site, ses textes et ses visuels sont
          protégés. Toute reproduction, même partielle, sans autorisation écrite préalable est
          interdite.
        </p>
        <p>
          Les noms des modèles et les descriptions de produits sont la propriété de{' '}
          {BRAND.legalName}.
        </p>
      </>
    ),
  },
  {
    id: 'liens',
    title: 'Liens externes',
    body: (
      <>
        <p>
          Le site renvoie vers nos comptes officiels sur les réseaux sociaux :{' '}
          {SOCIALS.map((social, index) => (
            <span key={social.label}>
              {index > 0 && ', '}
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline text-ink"
              >
                {social.label}
              </a>
            </span>
          ))}
          .
        </p>
        <p>
          Ces plateformes appliquent leurs propres conditions d&rsquo;utilisation et leurs propres
          règles de confidentialité, sur lesquelles nous n&rsquo;avons aucune prise.
        </p>
      </>
    ),
  },
  {
    id: 'signalement',
    title: 'Signalement de contenu',
    body: (
      <p>
        Pour signaler un contenu illicite ou une utilisation abusive de la marque, écrivez à{' '}
        <a href={`mailto:${BRAND.email}`} className="link-underline text-ink">
          {BRAND.email}
        </a>{' '}
        en précisant l&rsquo;adresse de la page concernée. Toute demande est examinée sans délai.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    body: (
      <p>
        Le traitement des données personnelles est décrit dans notre{' '}
        <Link href="/confidentialite" className="link-underline text-ink">
          politique de confidentialité
        </Link>
        . Les conditions de vente figurent quant à elles dans nos{' '}
        <Link href="/cgv" className="link-underline text-ink">
          conditions générales
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'droit',
    title: 'Droit applicable',
    body: (
      <p>
        Le site et son contenu sont soumis au droit algérien. Tout litige relatif à son utilisation
        relève de la compétence des juridictions algériennes.
      </p>
    ),
  },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Mentions légales', href: '/mentions-legales' }])} />
      <LegalPage
        eyebrow="Informations légales"
        title="Mentions légales"
        intro="Qui édite ce site, où il est hébergé, et à qui appartiennent les contenus qui s'y trouvent."
        updatedAt={LAST_UPDATE}
        sections={SECTIONS}
      />
    </>
  );
}
