'use client';

import { useId, type ComponentProps, type ReactNode } from 'react';
import { CheckIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/* Champs de formulaire — souligné plutôt qu'encadré : la ligne unique est plus
   sobre qu'une boîte et donne au checkout un aspect « papier à lettres ».

   Le corps est de 16 px sur mobile, 15 px seulement à partir du petit écran.
   En dessous de 16 px, Safari iOS zoome automatiquement à la mise au point du
   champ : la page saute, se recadre, et la cliente doit pincer pour revenir.
   Sur un tunnel de commande rempli au pouce, c'est rédhibitoire. */

const CONTROL =
  'w-full bg-transparent border-0 border-b pb-3 pt-1 text-[1rem] sm:text-[0.9375rem] text-ink ' +
  'placeholder:text-ash/70 transition-colors duration-300 outline-none ' +
  'disabled:opacity-40 disabled:cursor-not-allowed';

/* Trois états visuels, distingués par l'épaisseur et la teinte du filet.
   La charte étant strictement noir et blanc, on ne peut pas s'appuyer sur le
   rouge et le vert — ce qui tombe bien : 8 % des hommes les confondent, et
   WCAG 1.4.1 interdit de faire porter une information par la seule couleur.
   L'erreur est donc doublée d'un texte, et la validité d'une coche. */
const CONTROL_IDLE = 'border-line focus:border-ink';
const CONTROL_ERROR = 'border-ink border-b-2';
const CONTROL_VALID = 'border-ink/40 focus:border-ink';

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  /** Vrai lorsque le champ a été rempli correctement. */
  valid?: boolean;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldShell({
  label,
  htmlFor,
  error,
  hint,
  valid,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={htmlFor} className="eyebrow mb-2.5 flex items-center gap-2 text-ink">
        <span>
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-ash">
              *
            </span>
          )}
        </span>

        {/* Confirmation discrète : elle rassure sans féliciter pour une saisie
            banale. Décorative — l'information reste portée par le champ lui-même. */}
        {valid && !error && (
          <CheckIcon aria-hidden="true" className="h-3 w-3 shrink-0 text-ink" strokeWidth="2.4" />
        )}
      </label>

      {children}

      <div className="relative mt-2">
        <p
          id={`${htmlFor}-error`}
          role={error ? 'alert' : undefined}
          className={cn(
            'text-[0.75rem] leading-snug transition-opacity duration-300',
            error ? 'text-ink opacity-100' : 'opacity-0',
          )}
        >
          {error || '\u00A0'}
        </p>

        {hint && !error && (
          <p className="absolute inset-x-0 top-0 text-[0.75rem] leading-snug text-ash">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}

/** Classe du contrôle selon son état de validation. */
function controlClass(error?: string, valid?: boolean): string {
  if (error) return cn(CONTROL, CONTROL_ERROR);
  if (valid) return cn(CONTROL, CONTROL_VALID);
  return cn(CONTROL, CONTROL_IDLE);
}

type InputProps = Omit<ComponentProps<'input'>, 'className'> & {
  label: string;
  error?: string;
  hint?: string;
  valid?: boolean;
  className?: string;
};

export function Input({ label, error, hint, valid, className, id, required, ...rest }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      valid={valid}
      required={required}
      className={className}
    >
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={controlClass(error, valid)}
        {...rest}
      />
    </FieldShell>
  );
}

type TextareaProps = Omit<ComponentProps<'textarea'>, 'className'> & {
  label: string;
  error?: string;
  hint?: string;
  valid?: boolean;
  className?: string;
};

export function Textarea({
  label,
  error,
  hint,
  valid,
  className,
  id,
  required,
  ...rest
}: TextareaProps) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      valid={valid}
      required={required}
      className={className}
    >
      <textarea
        id={fieldId}
        required={required}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(controlClass(error, valid), 'resize-none')}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectProps = Omit<ComponentProps<'select'>, 'className'> & {
  label: string;
  error?: string;
  hint?: string;
  valid?: boolean;
  className?: string;
};

export function Select({
  label,
  error,
  hint,
  valid,
  className,
  id,
  required,
  children,
  ...rest
}: SelectProps) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      error={error}
      hint={hint}
      valid={valid}
      required={required}
      className={className}
    >
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={cn(
            controlClass(error, valid),
            'appearance-none pr-8 cursor-pointer',
            // Le select natif hérite du fond du système : on force le nôtre
            // pour que la liste déroulante reste lisible en thème sombre.
            '[&>option]:bg-paper [&>option]:text-ink',
          )}
          {...rest}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-0 top-1/2 h-2 w-3 -translate-y-1/2 text-ash"
        >
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>
    </FieldShell>
  );
}
