import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import {
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  PhoneIcon,
  TikTokIcon,
} from '@/components/icons';
import { BRAND, SOCIALS } from '@/lib/brand';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contactez DELUXIA au ${BRAND.phoneDisplay}. Réponse sous 24 h ouvrées, du samedi au jeudi.`,
  alternates: { canonical: '/contact' },
};

const SOCIAL_ICONS = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: TikTokIcon,
} as const;

/** Questions qui trouvent réponse ailleurs — autant l'indiquer avant d'écrire. */
const SHORTCUTS = [
  { label: 'Où en est ma commande ?', href: '/mes-commandes', hint: 'Suivi avec votre référence' },
  { label: 'Combien coûte la livraison ?', href: '/livraison', hint: 'Tarifs par wilaya' },
  { label: 'Quelle pointure choisir ?', href: '/guide-des-tailles', hint: 'Guide des tailles' },
  { label: 'Comment échanger un article ?', href: '/retours', hint: 'Échanges sous 24 h' },
] as const;

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Contact', href: '/contact' }])} />

      <PageHeader
        eyebrow="Nous écrire"
        title="Contact"
        description="Une question sur un modèle, une pointure, une commande en cours ? Nous répondons vite, et par téléphone en priorité."
        crumbs={[{ name: 'Contact', href: '/contact' }]}
      />

      <div className="shell grid gap-14 pb-(--spacing-section) lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:gap-20">
        <section aria-labelledby="formulaire" className="min-w-0">
          <h2 id="formulaire" className="sr-only">
            Formulaire de contact
          </h2>
          <ContactForm />
        </section>

        <aside className="space-y-10">
          <section aria-labelledby="coordonnees">
            <h2 id="coordonnees" className="eyebrow text-ink">
              Nous joindre
            </h2>

            <a
              href={`tel:${BRAND.phoneE164}`}
              className="mt-5 flex items-center gap-3 text-[1.375rem] font-light tracking-[-0.02em] text-ink transition-opacity hover:opacity-60"
            >
              <PhoneIcon className="h-5 w-5 shrink-0 text-ash" />
              {BRAND.phoneDisplay}
            </a>

            <a
              href={`mailto:${BRAND.email}`}
              className="mt-4 flex items-center gap-3 text-[0.9375rem] text-graphite transition-colors hover:text-ink"
            >
              <MailIcon className="h-4 w-4 shrink-0 text-ash" />
              {BRAND.email}
            </a>

            <dl className="mt-7 space-y-2 border-t border-line pt-6 text-[0.875rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-graphite">Samedi – jeudi</dt>
                <dd className="text-ink">9 h – 18 h</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-graphite">Vendredi</dt>
                <dd className="text-ash">Fermé</dd>
              </div>
            </dl>

            <p className="mt-6 border-l-2 border-ink pl-4 text-[0.8125rem] leading-relaxed text-graphite">
              Réponse sous 24 h ouvrées. Les messages reçus le vendredi sont traités le samedi
              matin.
            </p>
          </section>

          <section aria-labelledby="reseaux">
            <h2 id="reseaux" className="eyebrow text-ink">
              Nous suivre
            </h2>
            <ul className="mt-5 space-y-3">
              {SOCIALS.map((social) => {
                const Icon = SOCIAL_ICONS[social.label];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-[0.875rem] text-graphite transition-colors hover:text-ink"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-ash" />
                      <span>
                        {social.label} <span className="text-ash">{social.handle}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      {/* ── Raccourcis ──────────────────────────────────────────────────── */}
      <section aria-labelledby="avant-decrire" className="border-t border-line bg-mist">
        <div className="shell py-(--spacing-section)">
          <h2 id="avant-decrire" className="text-title font-light text-ink">
            Avant de nous écrire
          </h2>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-graphite">
            Ces quatre questions reviennent presque toujours — vous aurez la réponse plus vite ici.
          </p>

          <ul className="mt-10 grid gap-px sm:grid-cols-2 lg:grid-cols-4">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.href}>
                <Link
                  href={shortcut.href}
                  className="group flex h-full flex-col justify-between border border-line bg-paper p-6 transition-colors duration-300 hover:border-ink"
                >
                  <span className="text-[0.9375rem] leading-snug text-ink">{shortcut.label}</span>
                  <span className="mt-6 text-[0.6875rem] uppercase tracking-[0.14em] text-ash">
                    {shortcut.hint}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
