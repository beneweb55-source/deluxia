'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import type { DeliveryType, OrderStatus } from '@prisma/client';
import { ActionRow, ConfirmDialog, QuickAction } from '@/components/admin/QuickAction';
import { EmptyRow, StatusBadge, TableWrap, Td, Th } from '@/components/admin/ui';
import { ArrowRightIcon, CheckIcon, CloseIcon, EyeIcon, PhoneIcon } from '@/components/icons';
import {
  advanceOrderStatus,
  bulkUpdateOrderStatus,
  updateOrderStatus,
} from '@/app/(admin)/admin/_actions/gestion';
import { formatDateTime, formatPhone, formatPrice } from '@/lib/format';
import { DELIVERY_LABEL, ORDER_STATUS } from '@/lib/order-status';
import { cn } from '@/lib/utils';

export interface OrderRow {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  phone: string;
  commune: string;
  wilayaName: string;
  deliveryType: DeliveryType;
  total: number;
  status: OrderStatus;
  createdAt: string;
  units: number;
}

/** Statuts sur lesquels « étape suivante » n'a plus de sens. */
const TERMINAL: OrderStatus[] = ['LIVREE', 'ANNULEE'];

/**
 * Tableau des commandes, avec traitement au clavier et à la souris sans quitter
 * la page.
 *
 * Le geste dimensionnant est le traitement matinal : une dizaine de commandes
 * reçues la veille, à confirmer les unes après les autres. D'où deux dispositifs
 * complémentaires — une action « étape suivante » sur chaque ligne, et une
 * sélection multiple pour confirmer un lot d'un seul coup.
 */
export function OrdersTable({ orders, hasFilter }: { orders: OrderRow[]; hasFilter: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [askingCancel, setAskingCancel] = useState(false);

  // Seules les commandes encore ouvertes se prêtent à une action groupée.
  const actionable = useMemo(
    () => orders.filter((order) => !TERMINAL.includes(order.status)),
    [orders],
  );

  const selectedIds = useMemo(
    () => actionable.filter((order) => selected.has(order.id)).map((order) => order.id),
    [actionable, selected],
  );

  const allSelected = actionable.length > 0 && selectedIds.length === actionable.length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(actionable.map((order) => order.id)));

  const runBulk = (status: OrderStatus) => {
    setAskingCancel(false);
    startTransition(async () => {
      await bulkUpdateOrderStatus(selectedIds, status);
      setSelected(new Set());
    });
  };

  return (
    <>
      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10 pl-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                disabled={actionable.length === 0}
                aria-label="Tout sélectionner"
                className="size-4 accent-ink disabled:opacity-30"
              />
            </Th>
            <Th>Référence</Th>
            <Th>Client</Th>
            <Th>Destination</Th>
            <Th className="text-right">Art.</Th>
            <Th className="text-right">Total</Th>
            <Th>Statut</Th>
            <Th>Date</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 ? (
            <EmptyRow
              colSpan={9}
              message={
                hasFilter
                  ? 'Aucune commande ne correspond à ces critères.'
                  : 'Aucune commande enregistrée pour le moment.'
              }
            />
          ) : (
            orders.map((order) => {
              const isTerminal = TERMINAL.includes(order.status);
              const isPending = order.status === 'EN_ATTENTE';

              return (
                <tr
                  key={order.id}
                  className={cn(
                    // Les commandes en attente réclament un appel de confirmation :
                    // elles doivent ressortir sans recourir à la couleur.
                    isPending && 'bg-mist',
                    selected.has(order.id) && 'bg-ink/5',
                  )}
                >
                  <Td className="pl-3">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => toggle(order.id)}
                      disabled={isTerminal}
                      aria-label={`Sélectionner la commande ${order.reference}`}
                      className="size-4 accent-ink disabled:opacity-30"
                    />
                  </Td>

                  <Td>
                    <Link
                      href={`/admin/commandes/${order.id}`}
                      className="link-underline font-mono text-[0.8125rem] text-ink"
                    >
                      {order.reference}
                    </Link>
                  </Td>

                  <Td>
                    <span className="block whitespace-nowrap text-ink">
                      {order.firstName} {order.lastName}
                    </span>
                    <a
                      href={`tel:${order.phone}`}
                      className="mt-0.5 block whitespace-nowrap text-[0.75rem] text-graphite transition-colors hover:text-ink"
                    >
                      {formatPhone(order.phone)}
                    </a>
                  </Td>

                  <Td>
                    <span className="block whitespace-nowrap text-[0.8125rem] text-ink">
                      {order.commune}
                    </span>
                    <span className="mt-0.5 block whitespace-nowrap text-[0.75rem] text-graphite">
                      {order.wilayaName} · {DELIVERY_LABEL[order.deliveryType]}
                    </span>
                  </Td>

                  <Td className="text-right tabular-nums">{order.units}</Td>
                  <Td className="whitespace-nowrap text-right tabular-nums">
                    {formatPrice(order.total)}
                  </Td>
                  <Td>
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-[0.8125rem] text-graphite">
                    {formatDateTime(order.createdAt)}
                  </Td>

                  <Td className="pr-3">
                    <ActionRow>
                      {isPending && (
                        <QuickAction
                          label={`Confirmer la commande ${order.reference}`}
                          icon={CheckIcon}
                          emphasis
                          onAction={() => updateOrderStatus(order.id, 'CONFIRMEE')}
                        />
                      )}

                      {!isTerminal && !isPending && (
                        <QuickAction
                          label={`Passer à l'étape suivante — ${ORDER_STATUS[order.status].label}`}
                          icon={ArrowRightIcon}
                          emphasis
                          onAction={() => advanceOrderStatus(order.id)}
                        />
                      )}

                      <a
                        href={`tel:${order.phone}`}
                        title={`Appeler ${order.firstName}`}
                        aria-label={`Appeler ${order.firstName} ${order.lastName}`}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink sm:h-9 sm:w-9"
                      >
                        <PhoneIcon className="h-4 w-4" />
                      </a>

                      <Link
                        href={`/admin/commandes/${order.id}`}
                        title="Voir le détail"
                        aria-label={`Voir le détail de la commande ${order.reference}`}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink sm:h-9 sm:w-9"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>

                      {!isTerminal && (
                        <QuickAction
                          label={`Annuler la commande ${order.reference}`}
                          icon={CloseIcon}
                          onAction={() => updateOrderStatus(order.id, 'ANNULEE')}
                          confirm={{
                            title: `Annuler ${order.reference} ?`,
                            body: 'Les articles retournent immédiatement en stock et la cliente ne sera pas livrée. Cette commande restera visible dans l’historique.',
                            action: 'Annuler la commande',
                          }}
                        />
                      )}
                    </ActionRow>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableWrap>

      {/* ── Barre d'actions groupées ─────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-0 z-30 -mx-5 mt-4 border-t border-ink bg-paper px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[0.875rem] text-ink">
              {selectedIds.length} commande{selectedIds.length > 1 ? 's' : ''} sélectionnée
              {selectedIds.length > 1 ? 's' : ''}
            </p>

            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="link-underline text-[0.75rem] text-graphite hover:text-ink"
            >
              Tout désélectionner
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => runBulk('CONFIRMEE')}
                className="h-10 border border-ink bg-ink px-5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                {pending ? 'Traitement…' : 'Confirmer'}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => runBulk('PREPARATION')}
                className="h-10 border border-line px-5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:opacity-40"
              >
                En préparation
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => runBulk('EXPEDIEE')}
                className="h-10 border border-line px-5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink disabled:opacity-40"
              >
                Expédier
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setAskingCancel(true)}
                className="h-10 border border-line px-5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {askingCancel && (
        <ConfirmDialog
          title={`Annuler ${selectedIds.length} commande${selectedIds.length > 1 ? 's' : ''} ?`}
          body="Les articles de chaque commande retournent en stock. Les clientes concernées ne seront pas livrées."
          actionLabel="Tout annuler"
          onConfirm={() => runBulk('ANNULEE')}
          onCancel={() => setAskingCancel(false)}
        />
      )}
    </>
  );
}
