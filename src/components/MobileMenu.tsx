'use client';

import Link from 'next/link';
import { Drawer } from '@/components/ui/Drawer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowRightIcon, PhoneIcon } from '@/components/icons';
import { useSession } from '@/components/providers/SessionProvider';
import { logoutUnified } from '@/app/(boutique)/_actions/auth';
import { BRAND, SOCIALS } from '@/lib/brand';
import { type NavLink } from '@/components/Header';

/** Entrées secondaires, communes aux visiteuses connectées ou non. */
const UTILITY_LINKS = [
  { label: 'Mes favoris', href: '/favoris' },
  { label: 'Suivre une commande', href: '/mes-commandes' },
  { label: 'Guide des tailles', href: '/guide-des-tailles' },
] as const;

/**
 * Menu mobile — typographie large, entrées échelonnées.
 *
 * L'échelonnement est porté par un délai calculé par index plutôt que par une
 * bibliothèque d'animation : même résultat, aucun kilo-octet supplémentaire.
 *
 * C'est aussi le seul accès au compte sur mobile : le menu déroulant de
 * l'en-tête y est masqué, une liste déroulante de 288 px de large étant
 * impraticable au pouce.
 */
export function MobileMenu({ open, onClose, navLinks }: { open: boolean; onClose: () => void; navLinks: NavLink[] }) {
  const { user } = useSession();

  // Hauteur minimale de 44 px : ces entrées sont l'accès principal au compte
  // sur mobile, elles doivent se toucher sans viser.
  const utilityClass =
    'flex min-h-11 w-full items-center text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-graphite transition-colors hover:text-ink';

  return (
    <Drawer open={open} onClose={onClose} side="left" title="Menu" hideTitle className="max-w-[24rem]">
      <nav aria-label="Navigation mobile" className="px-6 pb-8 pt-6">
        <ul>
          {navLinks.map((link, index) => (
            <li key={link.href} className="border-b border-line/70 last:border-b-0">
              <Link
                href={link.href}
                onClick={onClose}
                style={{ transitionDelay: open ? `${120 + index * 55}ms` : '0ms' }}
                className={[
                  'group flex items-center justify-between py-5',
                  'text-[1.5rem] font-light tracking-[-0.02em] text-ink',
                  'transition-[opacity,transform] duration-700 [transition-timing-function:var(--ease-luxe)]',
                  open ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0',
                ].join(' ')}
              >
                {link.label}
                <ArrowRightIcon className="h-4 w-4 -translate-x-2 text-ash opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>

        {/* ── Compte ───────────────────────────────────────────────────────── */}
        <div className="mt-10 border-t border-line pt-7">
          {user ? (
            <>
              <p className="eyebrow text-ink">Bonjour, {user.name}</p>
              <div className="mt-3 divide-y divide-line/60">
                <Link
                  href={user.role === 'ADMIN' ? '/admin' : '/mon-compte'}
                  onClick={onClose}
                  className={utilityClass}
                >
                  {user.role === 'ADMIN' ? 'Administration' : 'Mon compte'}
                </Link>
                {UTILITY_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} onClick={onClose} className={utilityClass}>
                    {link.label}
                  </Link>
                ))}
                <form action={logoutUnified}>
                  <button type="submit" className={utilityClass}>
                    Se déconnecter
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/connexion"
                onClick={onClose}
                className="flex h-12 w-full items-center justify-center bg-ink text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-paper"
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                onClick={onClose}
                className="mt-4 block text-center text-[0.75rem] text-graphite"
              >
                Pas encore de compte ? <span className="link-underline text-ink">Créer un compte</span>
              </Link>

              <div className="mt-5 divide-y divide-line/60">
                {UTILITY_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} onClick={onClose} className={utilityClass}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Contact ──────────────────────────────────────────────────────── */}
        <div className="mt-10 border-t border-line pt-6">
          <a
            href={`tel:${BRAND.phoneE164}`}
            className="inline-flex items-center gap-3 text-[0.9375rem] text-ink transition-opacity hover:opacity-60"
          >
            <PhoneIcon className="h-4 w-4 text-ash" />
            {BRAND.phoneDisplay}
          </a>

          <div className="mt-6 flex items-center justify-between">
            <ul className="-ml-2 flex">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center px-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-graphite transition-colors hover:text-ink"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
            <ThemeToggle className="-mr-2 sm:hidden" />
          </div>
        </div>
      </nav>
    </Drawer>
  );
}
