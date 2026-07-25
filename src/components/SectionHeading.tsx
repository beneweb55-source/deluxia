import Link from 'next/link';
import { ArrowRightIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * En-tête de section — surtitre, titre, lien optionnel.
 * Systématiser cet en-tête donne au site son rythme vertical : chaque section
 * s'ouvre exactement de la même manière, ce qui rend la page prévisible et calme.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'Tout voir',
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'reveal flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-3 text-title font-light text-ink">{title}</h2>
        {description && (
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-graphite">
            {description}
          </p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-ink"
        >
          <span className="link-underline">{linkLabel}</span>
          <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-500 [transition-timing-function:var(--ease-luxe)] group-hover:translate-x-1.5" />
        </Link>
      )}
    </div>
  );
}
