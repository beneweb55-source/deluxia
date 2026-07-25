'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * Conteneur de tableau défilable, avec indice de défilement.
 *
 * Sur un écran de 320 px, un tableau de tarifs ne montre que ses deux premières
 * colonnes : la visiteuse voit une liste de wilayas et aucun prix, sans rien qui
 * lui indique que le reste se trouve à droite. Elle en conclut que la page est
 * vide — c'est exactement l'information qu'elle était venue chercher.
 *
 * D'où deux affordances, affichées uniquement quand le débordement existe
 * réellement et retirées dès qu'on atteint la fin : un dégradé sur le bord droit
 * et une mention explicite. Le conteneur reste focalisable au clavier, pour que
 * le tableau puisse aussi être parcouru avec les flèches.
 */
export function ScrollableTable({
  children,
  label,
  className,
}: {
  children: ReactNode;
  /** Décrit le tableau pour les lecteurs d'écran. */
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const overflow = node.scrollWidth - node.clientWidth;
      setCanScroll(overflow > 4);
      setAtEnd(node.scrollLeft >= overflow - 4);
    };

    measure();
    node.addEventListener('scroll', measure, { passive: true });

    // La largeur disponible change à la rotation de l'écran comme au
    // redimensionnement de la fenêtre : on remesure plutôt que de figer.
    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => {
      node.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
      >
        {children}
      </div>

      {/* Dégradé de bord — décoratif, il ne fait que suggérer la continuité. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-paper to-transparent transition-opacity duration-300',
          canScroll && !atEnd ? 'opacity-100' : 'opacity-0',
        )}
      />

      {canScroll && !atEnd && (
        <p className="mt-3 flex items-center gap-2 text-[0.75rem] text-graphite sm:hidden">
          <ArrowRightIcon className="h-3.5 w-3.5 shrink-0" />
          Faites glisser le tableau pour voir les tarifs
        </p>
      )}
    </div>
  );
}
