'use client';

import { useEffect, useState, useTransition } from 'react';
import type { OrderStatus } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { PrintIcon } from '@/components/icons';
import { saveOrderNote, updateOrderStatus } from '@/app/(admin)/admin/_actions/gestion';
import { ORDER_STATUS, ORDER_STEPS } from '@/lib/order-status';
import { cn } from '@/lib/utils';

/**
 * Pilotage d'une commande depuis l'administration.
 *
 * Le changement de statut est direct — un clic, pas de formulaire à valider :
 * le gérant traite ses commandes le téléphone à l'oreille, chaque étape
 * supplémentaire lui coûte du temps. L'annulation fait exception : elle est
 * irréversible côté stock, elle demande donc une confirmation explicite.
 */
export function OrderStatusControl({
  orderId,
  current,
  adminNote,
}: {
  orderId: string;
  current: OrderStatus;
  adminNote: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [askCancel, setAskCancel] = useState(false);
  const [note, setNote] = useState(adminNote ?? '');
  const [saved, setSaved] = useState(false);

  // L'indicateur « Enregistré » s'efface seul : il confirme sans encombrer.
  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const cancelled = current === 'ANNULEE';

  function applyStatus(status: OrderStatus) {
    startTransition(async () => {
      await updateOrderStatus(orderId, status);
      setAskCancel(false);
    });
  }

  function persistNote() {
    startTransition(async () => {
      await saveOrderNote(orderId, note);
      setSaved(true);
    });
  }

  return (
    <div className="no-print space-y-8">
      {/* ── Statut ────────────────────────────────────────────────────────── */}
      <div>
        {/* h3 : la carte « Gestion » qui enveloppe ce bloc porte déjà un h2. */}
        <h3 className="eyebrow text-ink">Statut</h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {ORDER_STEPS.map((step) => {
            const active = current === step;

            return (
              <Button
                key={step}
                type="button"
                size="sm"
                variant={active ? 'primary' : 'ghost'}
                // Le statut courant n'est pas `disabled` : il serait rendu à 40 %
                // d'opacité, or c'est justement l'information à lire en premier.
                // Le clic est neutralisé côté client, et l'action est de toute
                // façon sans effet lorsque le statut ne change pas.
                disabled={isPending}
                onClick={() => {
                  if (!active) applyStatus(step);
                }}
                aria-current={active ? 'true' : undefined}
                className={cn(active ? 'cursor-default' : 'text-graphite')}
              >
                {ORDER_STATUS[step].label}
              </Button>
            );
          })}
        </div>

        <div className="mt-5 border-t border-line pt-5">
          {cancelled ? (
            <p className="text-[0.8125rem] leading-relaxed text-graphite">
              Cette commande est annulée. Les articles ont été remis en stock ; choisissez un
              statut ci-dessus pour la réactiver.
            </p>
          ) : askCancel ? (
            <div>
              <p role="alert" className="text-[0.875rem] text-ink">
                Confirmer l&rsquo;annulation ?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  disabled={isPending}
                  onClick={() => applyStatus('ANNULEE')}
                >
                  Annuler la commande
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  disabled={isPending}
                  onClick={() => setAskCancel(false)}
                >
                  Retour
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => setAskCancel(true)}
            >
              Annuler la commande
            </Button>
          )}

          {!cancelled && (
            <p className="mt-3 text-[0.75rem] leading-relaxed text-ash">
              L&rsquo;annulation remet automatiquement les articles de la commande en stock.
            </p>
          )}
        </div>
      </div>

      {/* ── Note interne ──────────────────────────────────────────────────── */}
      <div className="border-t border-line pt-8">
        <Textarea
          label="Note interne"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={4}
          hint="Visible par l’équipe uniquement, jamais par le client."
          disabled={isPending}
        />

        <div className="mt-1 flex flex-wrap items-center gap-4">
          <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={persistNote}>
            Enregistrer la note
          </Button>
          <span
            aria-live="polite"
            className={cn(
              'text-[0.75rem] text-graphite transition-opacity duration-300',
              saved ? 'opacity-100' : 'opacity-0',
            )}
          >
            {saved ? 'Enregistré' : ' '}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Bouton d'impression du bon de préparation — client, car il touche à `window`. */
export function PrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="no-print"
      onClick={() => window.print()}
    >
      <PrintIcon className="h-3.5 w-3.5" />
      Imprimer
    </Button>
  );
}
