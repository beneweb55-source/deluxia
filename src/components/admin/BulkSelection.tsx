'use client';

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sélection multiple partagée par les tableaux de l'administration.
 *
 * Le même mécanisme sert aux produits, aux catégories et aux collections : une
 * seule implémentation, donc un seul comportement à apprendre et un seul endroit
 * à corriger. La sélection se vide d'elle-même quand les identifiants affichés
 * changent — après un filtre ou une suppression, on ne garde jamais en mémoire
 * des lignes qui ne sont plus à l'écran.
 */
export function useBulkSelection(availableIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = useMemo(() => new Set(availableIds), [availableIds]);

  // Intersection avec ce qui est réellement affiché : une ligne supprimée ou
  // masquée par un filtre ne peut pas rester sélectionnée à l'insu de la gérante.
  const ids = useMemo(
    () => availableIds.filter((id) => selected.has(id)),
    [availableIds, selected],
  );

  const toggle = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected = availableIds.length > 0 && ids.length === availableIds.length;

  const toggleAll = useCallback(() => {
    setSelected((current) => {
      const everySelected =
        availableIds.length > 0 && availableIds.every((id) => current.has(id));
      return everySelected ? new Set() : new Set(availableIds);
    });
  }, [availableIds]);

  return {
    ids,
    count: ids.length,
    has: (id: string) => selected.has(id) && available.has(id),
    toggle,
    toggleAll,
    clear,
    allSelected,
  };
}

/** Case de sélection d'une ligne, avec libellé lu par les lecteurs d'écran. */
export function SelectBox({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={label}
      className="size-4 accent-ink disabled:opacity-30"
    />
  );
}

/**
 * Barre d'actions groupées.
 *
 * Elle reste collée au bas de la zone de contenu tant qu'une sélection existe :
 * après avoir coché vingt lignes en faisant défiler la page, il ne faut pas
 * avoir à remonter pour agir.
 */
export function BulkBar({
  count,
  singular,
  plural,
  onClear,
  children,
}: {
  count: number;
  /** Nom de l'élément au singulier, ex. « produit ». */
  singular: string;
  plural: string;
  onClear: () => void;
  children: ReactNode;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Actions sur la sélection"
      className={cn(
        'sticky bottom-0 z-30 -mx-5 mt-4 border-t border-ink bg-paper px-5 py-4',
        'animate-slide-up',
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p aria-live="polite" className="text-[0.875rem] text-ink">
          {count} {count > 1 ? plural : singular} sélectionné{count > 1 ? 's' : ''}
        </p>

        <button
          type="button"
          onClick={onClear}
          className="link-underline text-[0.75rem] text-graphite hover:text-ink"
        >
          Tout désélectionner
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2.5">{children}</div>
      </div>
    </div>
  );
}

/** Bouton d'action groupée, aligné sur la hauteur de la barre. */
export function BulkButton({
  onClick,
  disabled,
  variant = 'ghost',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'ghost' | 'solid';
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-10 px-5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] transition-colors disabled:opacity-40',
        variant === 'solid'
          ? 'border border-ink bg-ink text-paper hover:opacity-80'
          : 'border border-line text-ink hover:border-ink',
      )}
    >
      {children}
    </button>
  );
}
