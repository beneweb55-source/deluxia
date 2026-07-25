import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { LegalPage, type LegalSection } from '@/components/LegalPage';
import { BRAND } from '@/lib/brand';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Quelles données DELUXIA collecte, pourquoi, combien de temps, et comment exercer vos droits.',
  alternates: { canonical: '/confidentialite' },
};

const LAST_UPDATE = '21 juillet 2026';

const SECTIONS: LegalSection[] = [
  {
    id: 'donnees',
    title: 'Données collectées',
    body: (
      <>
        <p>Pour traiter une commande, nous enregistrons :</p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>votre nom et votre prénom ;</li>
          <li>votre numéro de téléphone, et le numéro secondaire si vous en indiquez un ;</li>
          <li>votre wilaya, votre commune et votre adresse de livraison ;</li>
          <li>la note que vous joignez éventuellement à la commande ;</li>
          <li>le détail des articles commandés et le montant réglé.</li>
        </ul>
        <p>
          Votre adresse e-mail n&rsquo;est enregistrée que si vous créez un compte, vous inscrivez à
          notre liste de diffusion ou nous écrivez depuis le formulaire de contact.
        </p>
        <p>
          <strong className="font-medium text-ink">Aucune donnée bancaire n&rsquo;est collectée</strong>,
          nulle part, puisque le paiement se fait en espèces au livreur.
        </p>
      </>
    ),
  },
  {
    id: 'finalites',
    title: 'À quoi elles servent',
    body: (
      <>
        <p>
          Uniquement à faire fonctionner la boutique : préparer et expédier votre commande, vous
          appeler pour la confirmer, répondre à vos messages, et traiter un éventuel échange.
        </p>
        <p>
          Nous ne pratiquons ni profilage, ni publicité ciblée, et nous ne vendons ni ne louons vos
          informations à quiconque.
        </p>
      </>
    ),
  },
  {
    id: 'destinataires',
    title: 'Qui y a accès',
    body: (
      <>
        <p>
          {BRAND.name} et son transporteur partenaire. Ce dernier ne reçoit que ce qui lui est
          strictement nécessaire pour livrer : nom, téléphone, adresse, wilaya, commune et montant à
          encaisser.
        </p>
        <p>
          Le détail de vos achats précédents, vos favoris et votre historique ne lui sont jamais
          transmis.
        </p>
      </>
    ),
  },
  {
    id: 'navigateur',
    title: 'Ce qui reste dans votre navigateur',
    body: (
      <>
        <p>
          Votre panier, vos favoris et les articles récemment consultés sont enregistrés
          <strong className="font-medium text-ink"> localement, dans votre navigateur</strong>. Ces
          informations ne sont jamais envoyées à nos serveurs.
        </p>
        <p>
          Elles disparaissent si vous videz les données du site, et ne suivent pas d&rsquo;un
          appareil à l&rsquo;autre.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <>
        <p>
          Aucun cookie publicitaire, aucun traceur tiers. Nous n&rsquo;affichons pas de bandeau de
          consentement parce que nous n&rsquo;avons rien à faire consentir.
        </p>
        <p>Les seuls cookies déposés sont techniques :</p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>un cookie de session lorsque vous vous connectez à un compte ;</li>
          <li>
            un second cookie, sans valeur de sécurité, qui permet à l&rsquo;en-tête d&rsquo;afficher
            votre prénom sans interroger le serveur à chaque page ;
          </li>
          <li>votre préférence de thème clair ou sombre.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'conservation',
    title: 'Durée de conservation',
    body: (
      <>
        <p>
          Les commandes sont conservées le temps nécessaire au suivi commercial et aux obligations
          comptables.
        </p>
        <p>
          Les messages du formulaire de contact sont supprimés une fois la demande traitée. Les
          adresses inscrites à la liste de diffusion le sont jusqu&rsquo;à désinscription.
        </p>
      </>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    body: (
      <>
        <p>
          Vous pouvez à tout moment demander à consulter, corriger ou supprimer les informations qui
          vous concernent. Si vous avez un compte, une partie est modifiable directement depuis votre
          espace personnel.
        </p>
        <p>
          Pour toute autre demande, appelez-nous au{' '}
          <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-ink">
            {BRAND.phoneDisplay}
          </a>{' '}
          ou écrivez à{' '}
          <a href={`mailto:${BRAND.email}`} className="link-underline text-ink">
            {BRAND.email}
          </a>
          . Nous répondons sous quelques jours ouvrés.
        </p>
        <p>
          La suppression d&rsquo;un compte n&rsquo;efface pas les commandes déjà livrées, que nous
          devons conserver pour des raisons comptables.
        </p>
      </>
    ),
  },
  {
    id: 'newsletter',
    title: 'Liste de diffusion',
    body: (
      <p>
        L&rsquo;inscription est libre et la désinscription se fait sur simple demande, par téléphone
        ou par e-mail. Nous n&rsquo;écrivons qu&rsquo;au moment des nouvelles collections, et jamais
        pour le compte d&rsquo;un tiers.
      </p>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    body: (
      <p>
        Les mots de passe ne sont jamais conservés en clair : seule une empreinte cryptographique
        est stockée, et elle ne permet pas de retrouver le mot de passe d&rsquo;origine. Les accès à
        l&rsquo;administration sont limités aux personnes autorisées.
      </p>
    ),
  },
];

export default function ConfidentialitePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([{ name: 'Politique de confidentialité', href: '/confidentialite' }])}
      />
      <LegalPage
        eyebrow="Vos données"
        title="Politique de confidentialité"
        intro="Ce que nous savons de vous, pourquoi nous le savons, et ce que vous pouvez en faire. Sans détour."
        updatedAt={LAST_UPDATE}
        sections={SECTIONS}
      />
    </>
  );
}
