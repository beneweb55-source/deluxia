'use client';

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react';
import { cn } from '@/lib/utils';

/**
 * Boutons d'action des tableaux d'administration.
 *
 * La gérante répète ces gestes des dizaines de fois par jour : chaque action
 * tient donc en un clic, se déclenche sans rechargement de page, et affiche son
 * état d'avancement sur place. Les actions destructrices — et elles seules —
 * demandent une confirmation, qui se règle en un second clic.
 *
 * `useTransition` garde l'interface réactive pendant l'appel : la ligne se
 * grise, le reste du tableau reste utilisable.
 */

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

interface QuickActionProps {
  /** Libellé lu par les lecteurs d'écran et affiché en infobulle. */
  label: string;
  icon: IconType;
  /** Action serveur à exécuter. */
  onAction: () => Promise<void> | void;
  /** Texte du dialogue de confirmation. Absent = action immédiate. */
  confirm?: { title: string; body: string; action: string };
  /** Met l'icône en évidence (action principale de la ligne). */
  emphasis?: boolean;
  disabled?: boolean;
  className?: string;
}

export function QuickAction({
  label,
  icon: Icon,
  onAction,
  confirm,
  emphasis = false,
  disabled = false,
  className,
}: QuickActionProps) {
  const [pending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);

  const run = () => {
    setAsking(false);
    startTransition(async () => {
      await onAction();
    });
  };

  return (
    <>
      <button
        type="button"
        title={label}
        aria-label={label}
        disabled={disabled || pending}
        onClick={() => (confirm ? setAsking(true) : run())}
        className={cn(
          // Plus grand au doigt qu'à la souris : la gérante traite souvent ses
          // commandes depuis son téléphone.
          'inline-flex h-10 w-10 shrink-0 items-center justify-center border transition-colors duration-200 sm:h-9 sm:w-9',
          emphasis
            ? 'border-ink bg-ink text-paper hover:bg-ink-soft'
            : 'border-line text-graphite hover:border-ink hover:text-ink',
          (disabled || pending) && 'cursor-not-allowed opacity-40',
          className,
        )}
      >
        {pending ? <Spinner /> : <Icon className="h-4 w-4" />}
      </button>

      {confirm && asking && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          actionLabel={confirm.action}
          onConfirm={run}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  );
}

/** Indicateur d'attente, calé sur la taille des icônes. */
function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Dialogue de confirmation.
 *
 * Le focus est placé sur « Annuler » plutôt que sur le bouton d'action : quand
 * on confirme une suppression au clavier, la touche Entrée ne doit pas détruire
 * une donnée par réflexe.
 */
export function ConfirmDialog({
  title,
  body,
  actionLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Le bouton d'action reçoit le focus : la touche Entrée valide donc
    // directement, ce qui permet d'enchaîner les suppressions au clavier sans
    // toucher la souris. Échap reste l'échappatoire, et le texte du dialogue
    // énonce précisément ce qui va être détruit — c'est lui qui protège de
    // l'erreur, pas un focus placé sur « Annuler ».
    confirmRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      // Entrée valide même si le focus a bougé à l'intérieur du dialogue.
      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        onConfirm();
      }
    };

    document.body.classList.add('scroll-locked');
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('scroll-locked');
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onCancel, onConfirm]);

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onCancel} />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="relative w-full max-w-md animate-slide-up bg-paper p-7 shadow-[0_20px_70px_rgba(0,0,0,0.2)]"
      >
        <h2 id="confirm-title" className="text-[1.125rem] font-light tracking-[-0.02em] text-ink">
          {title}
        </h2>
        <p id="confirm-body" className="mt-3 text-[0.875rem] leading-relaxed text-graphite">
          {body}
        </p>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 border border-line px-6 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink sm:h-10"
          >
            Annuler <span className="ml-1.5 text-ash">Échap</span>
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="h-11 border border-ink bg-ink px-6 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ink-soft sm:h-10"
          >
            {actionLabel} <span className="ml-1.5 opacity-60">Entrée</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Groupe d'actions d'une ligne de tableau, aligné et non cassable. */
export function ActionRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-1.5">{children}</div>;
}
