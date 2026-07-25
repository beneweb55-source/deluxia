import Link from 'next/link';
import type { ReactNode } from 'react';
import type { OrderStatus } from '@prisma/client';
import { ORDER_STATUS } from '@/lib/order-status';
import { cn } from '@/lib/utils';

/* Primitives de l'administration — mêmes tokens que la boutique, densité plus
   forte : le gérant consulte des tableaux, pas des pages éditoriales. */

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[1.5rem] font-light tracking-[-0.02em] text-ink sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[0.875rem] leading-relaxed text-graphite">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn('border border-line bg-paper', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          {title && <h2 className="eyebrow text-ink">{title}</h2>}
          {action}
        </header>
      )}
      <div className={cn(padded && 'p-5')}>{children}</div>
    </section>
  );
}

/** Indicateur chiffré du tableau de bord. */
export function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow">{label}</p>
      <p className="mt-4 text-[1.875rem] font-extralight leading-none tracking-[-0.03em] text-ink sm:text-[2.25rem]">
        {value}
      </p>
      {hint && <p className="mt-3 text-[0.75rem] leading-snug text-ash">{hint}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block border border-line bg-paper p-5 transition-colors duration-300 hover:border-ink"
      >
        {body}
      </Link>
    );
  }

  return <div className="border border-line bg-paper p-5">{body}</div>;
}

/** Pastille de statut de commande, lisible en un coup d'œil dans un tableau. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const info = ORDER_STATUS[status];

  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.12em]',
        status === 'LIVREE' && 'border-ink bg-ink text-paper',
        status === 'ANNULEE' && 'border-line text-ash line-through',
        status === 'EN_ATTENTE' && 'border-ink text-ink',
        (status === 'CONFIRMEE' || status === 'PREPARATION' || status === 'EXPEDIEE') &&
          'border-line text-graphite',
      )}
    >
      {info.label}
    </span>
  );
}

/** Conteneur de tableau : impose le défilement horizontal plutôt que le débordement. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5">
      <table className="w-full min-w-[46rem] border-collapse text-left">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-line pb-3 pr-5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-ash',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn('border-b border-line/70 py-3.5 pr-5 text-[0.875rem] text-ink', className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-16 text-center text-[0.875rem] text-ash">
        {message}
      </td>
    </tr>
  );
}
