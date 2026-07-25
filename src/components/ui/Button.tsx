import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'outline' | 'ghost' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'group relative inline-flex items-center justify-center gap-2.5 overflow-hidden ' +
  'font-medium uppercase tracking-[0.16em] text-center align-middle ' +
  'transition-[color,background-color,border-color,opacity] duration-500 ' +
  '[transition-timing-function:var(--ease-luxe)] ' +
  'disabled:pointer-events-none disabled:opacity-40 select-none';

const VARIANTS: Record<Variant, string> = {
  // Noir plein — l'action principale. Le survol éclaircit d'un cran seulement.
  primary: 'bg-ink text-paper border border-ink hover:bg-ink-soft hover:border-ink-soft',
  // Contour fin — action secondaire. Se remplit au survol.
  outline: 'bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper',
  // Filet gris discret — actions tertiaires dans les zones denses.
  ghost: 'bg-transparent text-ink border border-line hover:border-ink',
  // Sans cadre — pour les listes et les barres d'outils.
  quiet: 'bg-transparent text-graphite border border-transparent hover:text-ink',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.625rem]',
  md: 'h-12 px-7 text-[0.6875rem]',
  lg: 'h-14 px-10 text-[0.75rem]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

function classesFor({ variant = 'primary', size = 'md', fullWidth, className }: CommonProps) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

type ButtonProps = CommonProps & Omit<ComponentProps<'button'>, 'className' | 'children'>;

export function Button({ variant, size, fullWidth, className, children, ...rest }: ButtonProps) {
  return (
    <button className={classesFor({ variant, size, fullWidth, className, children })} {...rest}>
      <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
    </button>
  );
}

type ButtonLinkProps = CommonProps & Omit<ComponentProps<typeof Link>, 'className' | 'children'>;

/** Même apparence que `Button`, mais rend un vrai lien (navigation, SEO, clic milieu). */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classesFor({ variant, size, fullWidth, className, children })} {...rest}>
      <span className="relative z-10 inline-flex items-center gap-2.5">{children}</span>
    </Link>
  );
}
