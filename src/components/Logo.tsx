import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Logotype DELUXIA — composé typographiquement plutôt qu'importé en image :
 * il reste net à toutes les tailles, s'adapte au thème sombre sans second
 * fichier, et ne coûte aucune requête réseau.
 */
export function Logo({
  className,
  size = 'md',
  asLink = true,
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
}) {
  const sizes = {
    sm: 'text-[0.8125rem]',
    md: 'text-[1.0625rem] sm:text-[1.1875rem]',
    lg: 'text-[1.5rem] sm:text-[2rem]',
  } as const;

  const mark = <span className={cn('wordmark', sizes[size], className)}>Deluxia</span>;

  if (!asLink) return mark;

  return (
    <Link
      href="/"
      aria-label="DELUXIA — retour à l'accueil"
      className="inline-block transition-opacity duration-500 hover:opacity-60 [transition-timing-function:var(--ease-luxe)]"
    >
      {mark}
    </Link>
  );
}
