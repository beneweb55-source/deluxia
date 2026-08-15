'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { logout } from '@/app/(admin)/admin/_actions/auth';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CloseIcon, MenuIcon } from '@/components/icons';
import type { SessionUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  /** Clé de pastille de comptage, si la rubrique en affiche une. */
  badge?: 'commandes' | 'messages';
  /** Correspondance exacte plutôt que par préfixe (cas de la racine). */
  exact?: boolean;
}

const NAV: ReadonlyArray<{ title: string; items: readonly NavItem[] }> = [
  {
    title: 'Pilotage',
    items: [
      { label: 'Tableau de bord', href: '/admin', exact: true },
      { label: 'Commandes', href: '/admin/commandes', badge: 'commandes' },
      { label: 'Clients', href: '/admin/clients' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Produits', href: '/admin/produits' },
      { label: 'Collections', href: '/admin/collections' },
      { label: 'Catégories', href: '/admin/categories' },
      { label: 'Promotions', href: '/admin/promotions' },
    ],
  },
  {
    title: 'Boutique',    items: [
      { label: 'Livraison', href: '/admin/livraison' },
      { label: 'Messages', href: '/admin/messages', badge: 'messages' },
      { label: 'Paramètres', href: '/admin/parametres' },
    ],
  },
];

/**
 * Coquille de l'administration : barre latérale fixe sur grand écran, tiroir sur
 * mobile. Le gérant travaille souvent depuis son téléphone — la version mobile
 * n'est donc pas une version dégradée, elle donne accès à tout.
 */
export function AdminShell({
  user,
  badges,
  children,
}: {
  user: SessionUser;
  badges: Record<'commandes' | 'messages', number>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const nav = (
    <nav aria-label="Navigation de l'administration" className="flex flex-col gap-8">
      {NAV.map((group) => (
        <div key={group.title}>
          <p className="eyebrow mb-3 px-3">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item);
              const count = item.badge ? badges[item.badge] : 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between gap-3 px-3 py-2.5 text-[0.875rem] transition-colors duration-200',
                      active ? 'bg-ink text-paper' : 'text-graphite hover:bg-mist hover:text-ink',
                    )}
                  >
                    {item.label}
                    {count > 0 && (
                      <span
                        className={cn(
                          'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[0.625rem] font-semibold',
                          active ? 'bg-paper text-ink' : 'bg-ink text-paper',
                        )}
                      >
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-mist">
      {/* ── Barre latérale (grand écran) ──────────────────────────────────── */}
      {/* `no-print` : le bon de préparation d'une commande s'imprime depuis
          l'administration. Sans cela, la navigation occuperait le tiers gauche
          de la feuille remise au livreur. */}
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-paper lg:flex">
        <div className="border-b border-line px-6 py-6">
          <Logo size="sm" asLink={false} />
          <p className="eyebrow mt-2">Administration</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-6">{nav}</div>

        <UserBlock user={user} />
      </aside>

      {/* ── Tiroir (mobile) ───────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/25" onClick={() => setMenuOpen(false)} />
          <div className="relative flex h-full w-72 flex-col bg-paper">
            <div className="flex items-center justify-between border-b border-line px-5 py-5">
              <Logo size="sm" asLink={false} />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fermer le menu"
                className="p-2 text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-6">{nav}</div>
            <UserBlock user={user} />
          </div>
        </div>
      )}

      {/* ── Contenu ───────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-paper/92 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Ouvrir le menu"
            className="-ml-2 p-2 text-ink"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Logo size="sm" asLink={false} />
          <ThemeToggle className="ml-auto -mr-2" />
        </header>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function UserBlock({ user }: { user: SessionUser }) {
  return (
    <div className="border-t border-line px-6 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.8125rem] text-ink">{user.name}</p>
          <p className="truncate text-[0.6875rem] text-ash">{user.email}</p>
        </div>
        <ThemeToggle className="-mr-2 hidden lg:inline-flex" />
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="link-underline text-[0.6875rem] uppercase tracking-[0.14em] text-graphite hover:text-ink"
        >
          Voir la boutique
        </Link>

        <form action={logout} className="ml-auto">
          <button
            type="submit"
            className="link-underline text-[0.6875rem] uppercase tracking-[0.14em] text-graphite hover:text-ink"
          >
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  );
}
