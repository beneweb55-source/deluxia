import Link from 'next/link';
import { NewsletterForm } from '@/components/NewsletterForm';
import { FacebookIcon, InstagramIcon, MailIcon, PhoneIcon, TikTokIcon } from '@/components/icons';
import { BRAND, SOCIALS } from '@/lib/brand';
import { type NavLink } from '@/components/Header';

export interface FooterColumn {
  title: string;
  links: NavLink[];
}
import { SERVED_COUNT } from '@/data/wilayas';

const SOCIAL_ICONS = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: TikTokIcon,
} as const;

export function Footer({ footerLinks }: { footerLinks: FooterColumn[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-(--spacing-section) border-t border-line bg-paper">
      <div className="shell">
        {/* ── Newsletter ─────────────────────────────────────────────────── */}
        <div className="grid gap-10 border-b border-line py-14 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-20">
          <div>
            <p className="eyebrow">La liste DELUXIA</p>
            <h2 className="mt-4 max-w-lg text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.15] tracking-[-0.03em] text-ink">
              Les nouveaux modèles, en avant-première.
            </h2>
            <p className="mt-3 max-w-md text-[0.875rem] leading-relaxed text-graphite">
              Un message par collection. Jamais de publicité, jamais de revente d'adresse.
            </p>
          </div>
          <NewsletterForm className="w-full lg:w-[26rem]" />
        </div>

        {/* ── Colonnes ───────────────────────────────────────────────────── */}
        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="wordmark text-[1.25rem] text-ink">Deluxia</p>
            <p className="mt-5 max-w-xs text-[0.875rem] leading-relaxed text-graphite">
              {BRAND.description}
            </p>

            <ul className="mt-7 space-y-3">
              <li>
                <a
                  href={`tel:${BRAND.phoneE164}`}
                  className="inline-flex items-center gap-3 text-[0.875rem] text-ink transition-opacity hover:opacity-60"
                >
                  <PhoneIcon className="h-4 w-4 shrink-0 text-ash" />
                  {BRAND.phoneDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${BRAND.email}`}
                  className="inline-flex items-center gap-3 text-[0.875rem] text-ink transition-opacity hover:opacity-60"
                >
                  <MailIcon className="h-4 w-4 shrink-0 text-ash" />
                  {BRAND.email}
                </a>
              </li>
            </ul>

            <ul className="mt-7 flex gap-3">
              {SOCIALS.map((social) => {
                const Icon = SOCIAL_ICONS[social.label];
                return (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${BRAND.name} sur ${social.label}`}
                      className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors duration-300 hover:border-ink"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {footerLinks.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="eyebrow">{column.title}</p>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-underline text-[0.875rem] text-graphite transition-colors duration-300 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Bas de page ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 border-t border-line py-7 text-[0.75rem] text-ash sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {BRAND.name}. Tous droits réservés.
          </p>
          <p className="sm:text-right">
            Paiement à la livraison · Livraison dans {SERVED_COUNT} wilayas · Fabriqué avec soin à{' '}
            {BRAND.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
