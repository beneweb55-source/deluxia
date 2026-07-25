'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/icons';
import { useCart } from '@/components/providers/CartProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSession } from '@/components/providers/SessionProvider';
import { MobileMenu } from '@/components/MobileMenu';
import { SearchOverlay } from '@/components/SearchOverlay';
import { logoutUnified } from '@/app/(boutique)/_actions/auth';
import { cn } from '@/lib/utils';

export interface NavLink {
  label: string;
  href: string;
}

export function Header({ navLinks }: { navLinks: NavLink[] }) {
  const LEFT_LINKS = navLinks.slice(0, Math.ceil(navLinks.length / 2));
  const RIGHT_LINKS = navLinks.slice(Math.ceil(navLinks.length / 2));
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const accountRef = useRef<HTMLDivElement>(null);

  const cart = useCart();
  const favorites = useFavorites();
  const { user } = useSession();

  // Passage de l'état transparent à l'état plein.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Une navigation referme tout ce qui était ouvert.
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Fermeture du menu compte au clic extérieur et à la touche Échap : un menu
  // déroulant qui reste ouvert quand on clique ailleurs donne l'impression que
  // la page ne répond plus.
  useEffect(() => {
    if (!userMenuOpen) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  // Raccourci « / » pour ouvrir la recherche, comme sur les sites de référence.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const iconButton =
    'inline-flex h-11 w-11 items-center justify-center text-ink transition-opacity duration-300 hover:opacity-55 sm:h-10 sm:w-10';

  return (
    <>
      {/* Lien d'évitement — première tabulation de la page (WCAG 2.4.1). */}
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-5 focus:py-3 focus:text-[0.6875rem] focus:uppercase focus:tracking-[0.18em] focus:text-paper"
      >
        Aller au contenu
      </a>

      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-[background-color,border-color,box-shadow,padding] duration-500',
          '[transition-timing-function:var(--ease-luxe)]',
          scrolled
            ? 'border-b border-line bg-paper/92 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div
          className={cn(
            'shell grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-500',
            '[transition-timing-function:var(--ease-luxe)]',
            scrolled ? 'h-16' : 'h-20 lg:h-24',
          )}
        >
          {/* ── Gauche ─────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Ouvrir le menu"
              aria-expanded={menuOpen}
              className={cn(iconButton, '-ml-3 lg:hidden')}
            >
              <MenuIcon className="h-[1.15rem] w-[1.15rem]" />
            </button>

            <nav aria-label="Navigation principale" className="hidden lg:block">
              <ul className="flex items-center gap-8">
                {LEFT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={pathname === link.href ? 'page' : undefined}
                      className={cn(
                        'link-underline text-[0.6875rem] font-medium uppercase tracking-[0.18em] transition-opacity duration-300',
                        pathname === link.href ? 'text-ink' : 'text-graphite hover:text-ink',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* ── Centre ─────────────────────────────────────────────────────── */}
          <div className="flex justify-center">
            <Logo size={scrolled ? 'sm' : 'md'} />
          </div>

          {/* ── Droite ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-0.5">
            <nav aria-label="Navigation secondaire" className="mr-6 hidden lg:block">
              <ul className="flex items-center gap-8">
                {RIGHT_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={pathname === link.href ? 'page' : undefined}
                      className={cn(
                        'link-underline text-[0.6875rem] font-medium uppercase tracking-[0.18em] transition-opacity duration-300',
                        pathname === link.href ? 'text-ink' : 'text-graphite hover:text-ink',
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher un article"
              className={iconButton}
            >
              <SearchIcon className="h-[1.15rem] w-[1.15rem]" />
            </button>

            <ThemeToggle className="hidden sm:inline-flex" />

            {/* Le menu compte est masqué sur mobile : les mêmes entrées figurent
                dans le menu latéral, plus confortables au pouce. */}
            <div ref={accountRef} className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-label={user ? `Compte de ${user.name}` : 'Espace client'}
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                className={cn(iconButton, userMenuOpen && 'opacity-55')}
              >
                <UserIcon className="h-[1.15rem] w-[1.15rem]" />
              </button>

              {userMenuOpen && <AccountMenu user={user} onNavigate={() => setUserMenuOpen(false)} />}
            </div>

            <Link href="/favoris" aria-label="Mes favoris" className={cn(iconButton, 'relative')}>
              <HeartIcon className="h-[1.15rem] w-[1.15rem]" />
              <Counter value={favorites.ready ? favorites.count : 0} />
            </Link>

            <button
              type="button"
              onClick={cart.open}
              aria-label={`Panier${cart.ready && cart.count > 0 ? ` — ${cart.count} article${cart.count > 1 ? 's' : ''}` : ' — vide'}`}
              className={cn(iconButton, 'relative -mr-3')}
            >
              <BagIcon className="h-[1.15rem] w-[1.15rem]" />
              <Counter value={cart.ready ? cart.count : 0} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} navLinks={navLinks} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/** Menu déroulant du compte, affiché sous l'icône silhouette. */
function AccountMenu({
  user,
  onNavigate,
}: {
  user: { role: 'ADMIN' | 'CUSTOMER'; name: string } | null;
  onNavigate: () => void;
}) {
  const linkClass =
    'link-underline w-max text-[0.6875rem] uppercase tracking-[0.18em] text-graphite transition-colors hover:text-ink';

  return (
    <div
      role="menu"
      className="absolute right-0 mt-4 w-72 border border-line bg-paper p-7 shadow-[0_20px_60px_rgba(0,0,0,0.14)]"
    >
      {user ? (
        <div className="flex flex-col gap-4">
          <p className="eyebrow text-ink">Bonjour, {user.name}</p>
          <span className="rule" />

          <Link
            href={user.role === 'ADMIN' ? '/admin' : '/mon-compte'}
            className={linkClass}
            onClick={onNavigate}
          >
            {user.role === 'ADMIN' ? 'Administration' : 'Mon compte'}
          </Link>

          <Link href="/favoris" className={linkClass} onClick={onNavigate}>
            Mes favoris
          </Link>

          {/* Formulaire plutôt qu'un onClick : la déconnexion modifie l'état du
              serveur, elle doit donc passer par une requête, pas par un lien. */}
          <form action={logoutUnified}>
            <button type="submit" className={linkClass}>
              Se déconnecter
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col text-center">
          <p className="eyebrow text-ink">Espace client</p>
          <p className="mt-3 text-[0.75rem] leading-relaxed text-graphite">
            Connectez-vous pour retrouver vos commandes et gagner du temps au moment de payer.
          </p>

          <Link
            href="/connexion"
            className="mt-6 flex h-11 w-full items-center justify-center bg-ink text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-soft"
            onClick={onNavigate}
          >
            Se connecter
          </Link>

          <Link href="/inscription" className="mt-4 text-[0.75rem] text-graphite" onClick={onNavigate}>
            Pas encore de compte ? <span className="link-underline text-ink">Créer un compte</span>
          </Link>

          <span className="rule my-6" />

          <Link href="/mes-commandes" className={cn(linkClass, 'mx-auto')} onClick={onNavigate}>
            Suivre une commande
          </Link>
        </div>
      )}
    </div>
  );
}

/** Pastille de comptage. Rendue vide (et non masquée) pour éviter tout saut de mise en page. */
function Counter({ value }: { value: number }) {
  if (value <= 0) return null;

  return (
    <span
      aria-hidden="true"
      className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[0.5625rem] font-semibold leading-none text-paper"
    >
      {value > 99 ? '99+' : value}
    </span>
  );
}
