import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { Accordion } from '@/components/ui/Accordion';
import { ButtonLink } from '@/components/ui/Button';
import { BRAND } from '@/lib/brand';
import { MIN_HOME_FEE, SERVED_COUNT } from '@/data/wilayas';
import { formatPrice } from '@/lib/format';
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Questions fréquentes',
  description:
    "Commande, livraison, paiement à la réception, pointures, échanges : toutes les réponses sur la boutique DELUXIA.",
  alternates: { canonical: '/faq' },
};

interface FaqEntry {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  questions: FaqEntry[];
}

/**
 * Source unique des questions : le même tableau alimente l'affichage et les
 * données structurées. Écrire les réponses deux fois finirait toujours par
 * produire deux versions divergentes, dont une lue par Google.
 */
const SECTIONS: FaqSection[] = [
  {
    title: 'Commander',
    questions: [
      {
        question: 'Faut-il créer un compte pour commander ?',
        answer:
          "Non. Le compte est facultatif : nom, téléphone et adresse suffisent. Créer un compte sert seulement à retrouver l'historique de vos commandes et à pré-remplir le formulaire la fois suivante.",
      },
      {
        question: 'Comment se passe une commande ?',
        answer:
          "Vous choisissez votre pointure, vous ajoutez au panier, puis vous renseignez vos coordonnées de livraison. Nous vous appelons ensuite pour confirmer avant d'expédier. Aucun paiement n'est demandé à ce stade.",
      },
      {
        question: 'Vais-je recevoir une confirmation ?',
        answer:
          "Oui : une référence au format DLX-AAMM-NNNN s'affiche dès la validation. Conservez-la, elle permet de suivre la commande à tout moment. Un appel de confirmation suit dans les heures ouvrées qui viennent.",
      },
      {
        question: 'Puis-je modifier ou annuler ma commande ?',
        answer:
          "Tant que le colis n'est pas remis au transporteur, oui. Appelez-nous avec votre référence : nous modifions la pointure, l'adresse ou nous annulons sans frais.",
      },
    ],
  },
  {
    title: 'Livraison',
    questions: [
      {
        question: 'Livrez-vous dans toute l’Algérie ?',
        answer: `Nous livrons dans ${SERVED_COUNT} wilayas, à domicile ou en bureau de retrait. Quatre wilayas ne sont pas encore desservies par notre transporteur : Illizi, Tindouf, Bordj Badji Mokhtar et Djanet. Si vous y résidez, appelez-nous : nous cherchons une solution au cas par cas.`,
      },
      {
        question: 'Combien coûte la livraison ?',
        answer: `Le tarif dépend de votre wilaya et du mode choisi, à partir de ${formatPrice(MIN_HOME_FEE)}. Le montant exact s'affiche dès que vous sélectionnez votre wilaya dans le formulaire de commande, avant toute validation. La grille complète figure sur la page Livraison.`,
      },
      {
        question: 'Quelle différence entre domicile et bureau de retrait ?',
        answer:
          "À domicile, le livreur vous remet le colis à l'adresse indiquée. En bureau, vous le retirez à l'agence du transporteur, ce qui coûte moins cher. Certaines wilayas n'ont pas de bureau : dans ce cas l'option n'apparaît tout simplement pas, et la livraison se fait à domicile.",
      },
      {
        question: 'Quel est le délai de livraison ?',
        answer:
          "Il dépend de votre wilaya et de notre transporteur : plus court sur Alger et le Nord, plus long dans le Grand Sud. Nous vous appelons pour confirmer votre commande avant de l'expédier.",
      },
      {
        question: 'Ma commande tarde à arriver, que faire ?',
        answer:
          "En cas de retard du livreur, contactez directement notre service client par téléphone : nous vous renseignons sur l'état exact de votre commande.",
      },
      {
        question: 'Comment suivre mon colis ?',
        answer:
          "Rendez-vous sur la page « Suivre ma commande », avec votre référence et le numéro de téléphone utilisé lors de la commande. Le statut y est à jour : confirmée, en préparation, expédiée, livrée.",
      },
      {
        question: 'La livraison à Alger est-elle au même prix partout ?',
        answer:
          'Oui. Alger est à 500 DA, aussi bien à domicile qu’en bureau de retrait, quelle que soit la commune.',
      },
    ],
  },
  {
    title: 'Paiement',
    questions: [
      {
        question: 'Comment puis-je payer ?',
        answer:
          "En espèces, au livreur, au moment où le colis vous est remis. C'est le seul mode de paiement accepté aujourd'hui.",
      },
      {
        question: 'Dois-je payer quelque chose à l’avance ?',
        answer:
          "Non, jamais. Aucun acompte, aucun virement, aucune carte bancaire. Si quelqu'un vous demande un paiement avant la livraison en se réclamant de DELUXIA, ce n'est pas nous : appelez-nous immédiatement.",
      },
      {
        question: 'Acceptez-vous CIB, Edahabia ou BaridiMob ?',
        answer:
          "Pas encore. Le site est préparé pour les accueillir, et nous vous préviendrons dès qu'ils seront disponibles.",
      },
      {
        question: 'Le prix affiché est-il le prix final ?',
        answer:
          'Oui, les prix sont en dinars algériens, toutes taxes comprises. Seuls les frais de livraison s’ajoutent, et ils vous sont annoncés avant validation.',
      },
    ],
  },
  {
    title: 'Tailles et produits',
    questions: [
      {
        question: 'Quelles pointures proposez-vous ?',
        answer:
          'Du 36 au 41 selon les modèles. Les pointures disponibles apparaissent sur chaque fiche produit ; celles qui sont épuisées sont barrées.',
      },
      {
        question: 'Comment savoir quelle pointure prendre ?',
        answer:
          "Notre guide des tailles donne les correspondances EU / UK / US et la méthode pour mesurer votre pied. Repère utile : les escarpins pointus taillent petit, prenez une demi-pointure au-dessus.",
      },
      {
        question: 'Les articles sont-ils en cuir véritable ?',
        answer:
          "La composition exacte est indiquée sur chaque fiche produit, dans l'onglet « Composition ». Nous y précisons la matière de la tige, de la doublure et de la semelle, sans formule vague.",
      },
      {
        question: 'Les photos correspondent-elles au produit réel ?',
        answer:
          "Nous mettons tout en œuvre pour que l'article reçu corresponde à la fiche. Si ce n'était pas le cas, ou si vous receviez un article différent de celui commandé, l'échange est entièrement à notre charge.",
      },
      {
        question: 'Un article est épuisé, sera-t-il réapprovisionné ?',
        answer:
          'Souvent, mais pas toujours : certaines séries sont limitées. Appelez-nous avec le nom du modèle, nous vous dirons si un réassort est prévu.',
      },
    ],
  },
  {
    title: 'Échanges et remboursements',
    questions: [
      {
        question: 'Puis-je échanger un article ?',
        answer:
          "Oui, dans les 24 heures suivant la réception, si l'article n'a pas été porté et se trouve en parfait état dans son emballage d'origine. La demande se fait depuis le site (formulaire de contact) ou par téléphone. Contactez-nous d'abord : nous vérifions la disponibilité de l'article de remplacement.",
      },
      {
        question: 'Qui paie les frais de livraison de l’échange ?',
        answer:
          "Si l'erreur vient de nous — mauvaise pointure, mauvaise couleur ou produit incorrect — tous les frais de livraison de l'échange sont à notre charge. Si vous changez de pointure, de couleur ou de modèle par convenance, ces frais sont à votre charge.",
      },
      {
        question: 'Comment demander un remboursement ?',
        answer:
          "Toute demande de remboursement doit obligatoirement être effectuée par téléphone, auprès de notre service client. Nous étudions votre demande avec vous et vous indiquons la marche à suivre.",
      },
      {
        question: 'Le colis est arrivé abîmé, que faire ?',
        answer:
          'Refusez la livraison devant le livreur et appelez-nous dans la foulée. Un colis refusé nous revient directement, et nous vous renvoyons un article neuf sans frais.',
      },
    ],
  },
  {
    title: 'Prix et fidélité',
    questions: [
      {
        question: 'Les prix peuvent-ils augmenter après le lancement ?',
        answer:
          "Le prix affiché au lancement d'un produit reste inchangé. Une augmentation n'intervient que si le produit est réapprovisionné à un coût plus élevé : le nouveau prix est alors communiqué au moment de sa remise en vente.",
      },
      {
        question: 'Existe-t-il un programme de fidélité ?',
        answer:
          "Un programme de fidélité sera mis en place. Ses modalités restent à définir et vous seront communiquées ultérieurement.",
      },
    ],
  },
];

const ALL_QUESTIONS: FaqEntry[] = SECTIONS.flatMap((section) => section.questions);

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(ALL_QUESTIONS)} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Questions fréquentes', href: '/faq' }])} />

      <PageHeader
        eyebrow="Aide"
        title="Questions fréquentes"
        description="Tout ce qu'on nous demande le plus souvent, répondu franchement. Si votre question n'y figure pas, appelez-nous."
        crumbs={[{ name: 'Questions fréquentes', href: '/faq' }]}
      />

      <div className="shell-tight pb-(--spacing-section)">
        {/* Sommaire : la page est longue, autant permettre d'y sauter. */}
        <nav aria-label="Sections" className="mb-14 border-y border-line py-5">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {SECTIONS.map((section) => (
              <li key={section.title}>
                <a
                  href={`#${slug(section.title)}`}
                  className="link-underline text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-graphite hover:text-ink"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {SECTIONS.map((section) => (
          <section key={section.title} id={slug(section.title)} className="mb-14 scroll-mt-28">
            <h2 className="mb-6 text-[1.375rem] font-light tracking-[-0.02em] text-ink">
              {section.title}
            </h2>

            <div className="border-t border-line">
              {section.questions.map((entry) => (
                <Accordion key={entry.question} title={entry.question}>
                  <p>{entry.answer}</p>
                </Accordion>
              ))}
            </div>
          </section>
        ))}

        {/* ── Sortie ─────────────────────────────────────────────────────── */}
        <div className="border border-ink p-8 text-center sm:p-10">
          <h2 className="text-[1.25rem] font-light tracking-[-0.02em] text-ink">
            Vous n&rsquo;avez pas trouvé ?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[0.875rem] leading-relaxed text-graphite">
            Appelez-nous, c&rsquo;est le plus rapide. Nous répondons du samedi au jeudi, de 9 h à 18 h.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href={`tel:${BRAND.phoneE164}`}
              className="text-[1.375rem] font-light tracking-[-0.02em] text-ink transition-opacity hover:opacity-60"
            >
              {BRAND.phoneDisplay}
            </a>
            <ButtonLink href="/contact" variant="outline">
              Nous écrire
            </ButtonLink>
          </div>

          <p className="mt-8 text-[0.8125rem] text-graphite">
            Vous cherchez une commande en cours ?{' '}
            <Link href="/mes-commandes" className="link-underline text-ink">
              Suivre ma commande
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

/** Identifiant d'ancre stable, dérivé du titre de section. */
function slug(title: string): string {
  return title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}
