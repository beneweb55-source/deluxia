import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Crumb {
  name: string;
  href: string;
}

/**
 * En-tête de page — fil d'Ariane, surtitre, titre, chapô.
 * Le fil d'Ariane est un vrai <nav> avec `aria-current` sur la page active :
 * il sert autant à l'orientation qu'au référencement (voir `breadcrumbJsonLd`).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  crumbs = [],
  className,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={cn('shell pb-10 pt-12 sm:pt-16', className)}>
      {crumbs.length > 0 && (
        <nav aria-label="Fil d'Ariane" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em] text-ash">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Accueil
              </Link>
            </li>
            {crumbs.map((crumb, index) => {
              const last = index === crumbs.length - 1;
              return (
                <li key={crumb.href} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  {last ? (
                    <span aria-current="page" className="text-ink">
                      {crumb.name}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-ink">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {eyebrow && <p className="eyebrow">{eyebrow}</p>}

      <h1 className="mt-4 max-w-4xl text-display font-extralight text-ink">{title}</h1>

      {description && (
        <p className="mt-6 max-w-2xl text-[0.9375rem] leading-relaxed text-graphite sm:text-[1rem]">
          {description}
        </p>
      )}

      {children}
    </header>
  );
}
