'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Côté d'ouverture. Le panier vient de la droite, le menu de la gauche. */
  side?: 'left' | 'right';
  title: string;
  /** Masque le titre visuellement tout en le gardant pour les lecteurs d'écran. */
  hideTitle?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Panneau latéral accessible : verrouillage du défilement, piège à focus,
 * fermeture par Échap et restitution du focus à l'élément déclencheur.
 */
export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  hideTitle,
  children,
  footer,
  className,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Verrou du défilement — compense la largeur de la barre pour éviter
  // le saut horizontal de la page à l'ouverture.
  useEffect(() => {
    if (!open) return;

    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-width', `${scrollbar}px`);
    document.body.classList.add('scroll-locked');

    return () => {
      document.body.classList.remove('scroll-locked');
      document.documentElement.style.removeProperty('--scrollbar-width');
    };
  }, [open]);

  // Focus : mémorise le déclencheur, place le focus dans le panneau, le rend au retour.
  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 60);

    return () => {
      window.clearTimeout(timer);
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  // Échap pour fermer, Tab confiné au panneau.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0]!;
      const last = items[items.length - 1]!;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={cn('fixed inset-0 z-[70]', !open && 'pointer-events-none')}
      aria-hidden={!open}
      // `inert` retire tout le sous-arbre de l'ordre de tabulation et de l'arbre
      // d'accessibilité tant que le tiroir est fermé. Sans lui, la tabulation
      // traverserait les boutons d'un panneau invisible — masquer par l'opacité
      // ne suffit pas.
      inert={!open}
    >
      <div
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-ink/25 backdrop-blur-[2px] transition-opacity duration-700',
          '[transition-timing-function:var(--ease-luxe)]',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'absolute inset-y-0 flex w-full max-w-[27rem] flex-col bg-paper shadow-[0_0_60px_rgba(0,0,0,0.12)]',
          'transition-transform duration-700 [transition-timing-function:var(--ease-luxe)]',
          side === 'right' ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : side === 'right' ? 'translate-x-full' : '-translate-x-full',
          className,
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className={cn('eyebrow text-ink', hideTitle && 'sr-only')}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="-mr-3 ml-auto flex h-11 w-11 items-center justify-center text-ink transition-opacity duration-300 hover:opacity-50"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <path d="M1 1 15 15M15 1 1 15" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>

        {footer && <div className="border-t border-line bg-paper px-6 py-5">{footer}</div>}
      </div>
    </div>
  );
}
