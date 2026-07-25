import type { ReactNode } from 'react';

/**
 * Accordéon bâti sur <details>/<summary>.
 *
 * L'élément natif gère déjà le clavier, l'annonce du repliage aux lecteurs
 * d'écran et le fonctionnement sans JavaScript. Le réécrire en React n'aurait
 * apporté que des régressions d'accessibilité — on se contente de l'habiller.
 */
export function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-ink transition-opacity duration-300 hover:opacity-65 [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="relative h-3 w-3 shrink-0">
          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-ink" />
          <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-ink transition-transform duration-500 [transition-timing-function:var(--ease-luxe)] group-open:rotate-90 group-open:opacity-0" />
        </span>
      </summary>

      <div className="pb-6 text-[0.875rem] leading-relaxed text-graphite">{children}</div>
    </details>
  );
}
