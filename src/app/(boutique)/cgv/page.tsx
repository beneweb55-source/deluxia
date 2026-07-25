import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { LegalPage, type LegalSection } from '@/components/LegalPage';
import { BRAND } from '@/lib/brand';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description:
    'Conditions générales de vente de la boutique DELUXIA : commande, prix, livraison, paiement à la réception, échanges et retours.',
  alternates: { canonical: '/cgv' },
};

/* Date figée : un texte contractuel ne doit pas se dater tout seul à chaque
   déploiement, sinon la mention de mise à jour ne veut plus rien dire. */
const LAST_UPDATE = '21 juillet 2026';

const SECTIONS: LegalSection[] = [
  {
    id: 'objet',
    title: 'Objet',
    body: (
      <>
        <p>
          Les présentes conditions régissent les ventes conclues sur le site {BRAND.name}, entre la
          maison {BRAND.legalName}, dont l&rsquo;activité est exercée à {BRAND.city} ({BRAND.country}),
          et toute personne effectuant un achat sur le site, désignée ci-après « la cliente ».
        </p>
        <p>
          Passer commande implique l&rsquo;acceptation entière des présentes conditions. Elles sont
          accessibles à tout moment depuis le pied de page du site.
        </p>
      </>
    ),
  },
  {
    id: 'produits',
    title: 'Produits',
    body: (
      <>
        <p>
          {BRAND.name} propose des chaussures et des sacs pour femme. Chaque fiche produit précise la
          composition, les pointures ou dimensions disponibles et les conseils d&rsquo;entretien.
        </p>
        <p>
          Les visuels sont fournis à titre d&rsquo;illustration. Des écarts de rendu peuvent exister
          selon les réglages d&rsquo;écran ; ils ne constituent pas un défaut de conformité.
        </p>
      </>
    ),
  },
  {
    id: 'prix',
    title: 'Prix',
    body: (
      <>
        <p>
          Les prix sont indiqués en dinars algériens (DA), toutes taxes comprises. Ils ne
          comprennent pas les frais de livraison, qui s&rsquo;ajoutent au montant du panier et sont
          affichés avant la validation de la commande.
        </p>
        <p>
          Le prix affiché au lancement d&rsquo;un produit reste inchangé. Une augmentation
          n&rsquo;intervient que si le produit est réapprovisionné à un coût plus élevé ; le nouveau
          prix est alors communiqué au moment de sa remise en vente. Le prix applicable à une
          commande est celui affiché au moment de sa validation.
        </p>
      </>
    ),
  },
  {
    id: 'commande',
    title: 'Commande',
    body: (
      <>
        <p>
          La commande est enregistrée après saisie des coordonnées de livraison et validation du
          récapitulatif. Une référence au format DLX-AAMM-NNNN est attribuée et affichée
          immédiatement.
        </p>
        <p>
          La commande est ensuite confirmée par téléphone. À défaut de réponse après plusieurs
          tentatives d&rsquo;appel sur une période de quarante-huit heures, elle peut être annulée
          sans frais.
        </p>
        <p>La création d&rsquo;un compte n&rsquo;est pas nécessaire pour commander.</p>
      </>
    ),
  },
  {
    id: 'disponibilite',
    title: 'Disponibilité et rupture de stock',
    body: (
      <>
        <p>
          Les stocks affichés correspondent aux quantités réellement disponibles au moment de la
          consultation. Une pointure peut néanmoins être épuisée entre l&rsquo;ajout au panier et la
          validation de la commande.
        </p>
        <p>
          En cas d&rsquo;indisponibilité constatée après commande, la cliente en est informée par
          téléphone. Un autre modèle, une autre pointure ou l&rsquo;annulation sans frais lui sont
          proposés.
        </p>
      </>
    ),
  },
  {
    id: 'livraison',
    title: 'Livraison',
    body: (
      <>
        <p>
          La livraison est assurée par un transporteur partenaire, à domicile ou en bureau de
          retrait selon la wilaya. Les tarifs et délais figurent sur la page{' '}
          <Link href="/livraison" className="link-underline text-ink">
            Livraison
          </Link>
          .
        </p>
        <p>
          Les délais annoncés sont indicatifs et courent à compter de la confirmation téléphonique.
          Un retard de livraison ne donne pas lieu à indemnité, mais ouvre droit à
          l&rsquo;annulation sans frais si le colis n&rsquo;a pas été remis.
        </p>
        <p>
          Il appartient à la cliente de fournir une adresse exacte et un numéro joignable. Les frais
          d&rsquo;une seconde présentation rendue nécessaire par une adresse erronée restent à sa
          charge.
        </p>
      </>
    ),
  },
  {
    id: 'paiement',
    title: 'Paiement',
    body: (
      <>
        <p>
          Le paiement s&rsquo;effectue exclusivement en espèces, auprès du livreur, au moment de la
          remise du colis. Aucun paiement en ligne, aucun acompte et aucun virement préalable ne sont
          demandés.
        </p>
        <p>
          Toute sollicitation de paiement anticipé au nom de {BRAND.name} doit être considérée comme
          frauduleuse et nous être signalée.
        </p>
      </>
    ),
  },
  {
    id: 'retours',
    title: 'Échanges et remboursements',
    body: (
      <>
        <p>
          Un échange est possible dans les vingt-quatre heures suivant la réception, pour tout
          article non porté, en parfait état, dans son emballage d&rsquo;origine. La demande
          s&rsquo;effectue depuis le site ou par téléphone. La procédure détaillée figure sur la
          page{' '}
          <Link href="/retours" className="link-underline text-ink">
            Échanges et remboursements
          </Link>
          .
        </p>
        <p>
          Lorsque l&rsquo;échange résulte d&rsquo;une erreur imputable à {BRAND.name} — mauvaise
          pointure, mauvaise couleur ou produit incorrect — les frais de livraison correspondants
          sont intégralement pris en charge par {BRAND.name}. Lorsque l&rsquo;échange résulte
          d&rsquo;une convenance personnelle de la cliente, ces frais restent à sa charge.
        </p>
        <p>
          Toute demande de remboursement doit être effectuée par téléphone auprès du service client.
        </p>
      </>
    ),
  },
  {
    id: 'garanties',
    title: 'Garanties',
    body: (
      <>
        <p>
          Les articles bénéficient de la garantie légale de conformité. Un défaut de fabrication
          constaté et signalé dans un délai raisonnable donne lieu à un échange ou, à défaut de
          modèle disponible, à un remboursement.
        </p>
        <p>
          Sont exclus de la garantie l&rsquo;usure normale, les dommages résultant d&rsquo;un usage
          inadapté, d&rsquo;un défaut d&rsquo;entretien ou d&rsquo;une réparation effectuée par un
          tiers.
        </p>
      </>
    ),
  },
  {
    id: 'donnees',
    title: 'Données personnelles',
    body: (
      <p>
        Les informations recueillies servent exclusivement au traitement et à la livraison des
        commandes. Leur usage, leur durée de conservation et les droits de la cliente sont détaillés
        dans notre{' '}
        <Link href="/confidentialite" className="link-underline text-ink">
          politique de confidentialité
        </Link>
        . Aucune donnée bancaire n&rsquo;est collectée, le paiement se faisant en espèces à la
        livraison.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité',
    body: (
      <>
        <p>
          {BRAND.name} ne saurait être tenue responsable des dommages résultant d&rsquo;une mauvaise
          utilisation des articles, ni d&rsquo;une interruption du site indépendante de sa volonté.
        </p>
        <p>
          La responsabilité de {BRAND.name} est en tout état de cause limitée au montant de la
          commande concernée.
        </p>
      </>
    ),
  },
  {
    id: 'litiges',
    title: 'Droit applicable et litiges',
    body: (
      <>
        <p>
          Les présentes conditions sont soumises au droit algérien. Les commandes sont réservées aux
          livraisons sur le territoire algérien.
        </p>
        <p>
          En cas de différend, une solution amiable sera recherchée en priorité. À défaut
          d&rsquo;accord, le litige relève de la compétence des juridictions algériennes.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        Pour toute question relative à une commande ou aux présentes conditions :{' '}
        <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-ink">
          {BRAND.phoneDisplay}
        </a>{' '}
        ou{' '}
        <a href={`mailto:${BRAND.email}`} className="link-underline text-ink">
          {BRAND.email}
        </a>
        , du samedi au jeudi, de 9 h à 18 h.
      </p>
    ),
  },
];

export default function CgvPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Conditions générales de vente', href: '/cgv' }])} />
      <LegalPage
        eyebrow="Cadre contractuel"
        title="Conditions générales de vente"
        intro="Ce que vous acceptez en commandant, et ce à quoi nous nous engageons en retour. Rédigé pour être lu, pas pour être contourné."
        updatedAt={LAST_UPDATE}
        sections={SECTIONS}
      />
    </>
  );
}
