'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { ProductVisual } from '@/components/ProductVisual';
import { Button } from '@/components/ui/Button';
import { CheckIcon, PrintIcon } from '@/components/icons';
import { BRAND } from '@/lib/brand';
import { formatDateTime, formatPhone, formatPrice } from '@/lib/format';
import { DELIVERY_LABEL, ORDER_STATUS, ORDER_STEPS, type PublicOrder } from '@/lib/order-status';
import { cn } from '@/lib/utils';

/**
 * Récapitulatif de commande, partagé par la page de confirmation et le suivi.
 *
 * La mise en page est pensée pour l'impression autant que pour l'écran : les
 * feuilles de style d'impression (voir `globals.css`) masquent la navigation et
 * les boutons, si bien qu'un « Imprimer » produit un bon de commande propre —
 * utile au client comme au gérant.
 */
export function OrderDetail({ order, celebrate = false }: { order: PublicOrder; celebrate?: boolean }) {
  const status = ORDER_STATUS[order.status];
  const cancelled = order.status === 'ANNULEE';

  return (
    <div className="shell pb-(--spacing-section)">
      {celebrate && (
        <div className="mb-10 flex flex-col items-center border border-ink px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink">
            <CheckIcon className="h-5 w-5 text-ink" />
          </span>
          <h2 className="mt-6 text-[1.5rem] font-light tracking-[-0.02em] text-ink sm:text-[1.875rem]">
            Merci, votre commande est enregistrée.
          </h2>
          <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-graphite">
            Nous vous appelons prochainement au {formatPhone(order.phone)} pour la confirmer. Aucun
            paiement ne vous sera demandé avant la réception du colis.
          </p>
        </div>
      )}

      <div className="print-sheet border border-line">
        {/* ── En-tête ─────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line px-6 py-7 sm:px-9">
          <div>
            <Logo size="sm" asLink={false} />
            <p className="mt-3 text-[0.75rem] text-ash">
              {BRAND.phoneDisplay} · {BRAND.email}
            </p>
          </div>

          <div className="text-right">
            <p className="eyebrow">Référence</p>
            <p className="mt-2 font-mono text-[1.0625rem] text-ink">{order.reference}</p>
            <p className="mt-1.5 text-[0.75rem] text-ash">{formatDateTime(order.createdAt)}</p>
          </div>
        </header>

        {/* ── Suivi ───────────────────────────────────────────────────────── */}
        <section aria-label="Statut de la commande" className="border-b border-line px-6 py-7 sm:px-9">
          {cancelled ? (
            <div className="border-l-2 border-ink pl-5">
              <p className="text-[0.9375rem] text-ink">{status.label}</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-graphite">
                {status.description}
              </p>
            </div>
          ) : (
            <>
              <ol className="flex flex-wrap gap-y-6">
                {ORDER_STEPS.map((step, index) => {
                  const stepInfo = ORDER_STATUS[step];
                  const reached = status.step >= stepInfo.step;
                  const current = status.step === stepInfo.step;

                  return (
                    <li key={step} className="flex min-w-[7rem] flex-1 flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                            reached ? 'border-ink bg-ink text-paper' : 'border-line',
                          )}
                        >
                          {reached && <CheckIcon className="h-2.5 w-2.5" strokeWidth="2.4" />}
                        </span>
                        {index < ORDER_STEPS.length - 1 && (
                          <span
                            aria-hidden="true"
                            className={cn('h-px flex-1', reached ? 'bg-ink' : 'bg-line')}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          'pr-3 text-[0.6875rem] uppercase tracking-[0.12em]',
                          current ? 'text-ink' : reached ? 'text-graphite' : 'text-ash',
                        )}
                      >
                        {stepInfo.label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <p className="mt-7 text-[0.875rem] leading-relaxed text-graphite">
                {status.description}
              </p>
            </>
          )}
        </section>

        {/* ── Articles ────────────────────────────────────────────────────── */}
        <section aria-label="Articles commandés" className="px-6 sm:px-9">
          <ul>
            {order.items.map((item, index) => (
              <li
                key={`${item.productSlug}-${item.size}-${item.color}-${index}`}
                className="flex gap-5 border-b border-line py-5"
              >
                <Link
                  href={`/produit/${item.productSlug}`}
                  className="relative aspect-4/5 w-16 shrink-0 overflow-hidden bg-mist"
                >
                  <ProductVisual
                    name={item.productName}
                    slug={item.productSlug}
                    images={item.imageUrl ? [item.imageUrl] : null}
                    sizes="64px"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] leading-snug text-ink">{item.productName}</p>
                  <p className="mt-1.5 text-[0.75rem] text-ash">
                    Taille {item.size} · {item.color} · ×{item.quantity}
                  </p>
                </div>

                <span className="shrink-0 text-[0.9375rem] text-ink">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Totaux ──────────────────────────────────────────────────────── */}
        <section className="grid gap-8 px-6 py-7 sm:grid-cols-2 sm:px-9">
          <div>
            <h3 className="eyebrow text-ink">Livraison</h3>
            <address className="mt-4 space-y-1 text-[0.875rem] not-italic leading-relaxed text-graphite">
              <p className="text-ink">
                {order.firstName} {order.lastName}
              </p>
              <p>{formatPhone(order.phone)}</p>
              {order.phoneAlt && <p>{formatPhone(order.phoneAlt)}</p>}
              <p className="pt-2">{order.address}</p>
              <p>
                {order.commune}, {order.wilayaName}
              </p>
              <p className="pt-2 text-ink">{DELIVERY_LABEL[order.deliveryType]}</p>
            </address>

            {order.notes && (
              <div className="mt-6">
                <h3 className="eyebrow text-ink">Note</h3>
                <p className="mt-3 text-[0.875rem] leading-relaxed text-graphite">{order.notes}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="eyebrow text-ink">Montant</h3>
            <dl className="mt-4 space-y-3 text-[0.875rem]">
              <div className="flex justify-between">
                <dt className="text-graphite">Sous-total</dt>
                <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graphite">Livraison</dt>
                <dd className="text-ink">{formatPrice(order.deliveryFee)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <dt className="eyebrow text-ink">Total à payer</dt>
                <dd className="text-[1.25rem] font-light text-ink">{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <p className="mt-5 border-t border-line pt-4 text-[0.75rem] leading-relaxed text-ash">
              Paiement en espèces au livreur, à la réception du colis. Préparez si possible
              l'appoint.
            </p>
          </div>
        </section>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div className="no-print mt-8 flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => window.print()}>
          <PrintIcon className="h-3.5 w-3.5" />
          Imprimer le récapitulatif
        </Button>
        <a
          href={`tel:${BRAND.phoneE164}`}
          className="link-underline px-2 text-[0.6875rem] uppercase tracking-[0.16em] text-graphite hover:text-ink"
        >
          Une question ? {BRAND.phoneDisplay}
        </a>
      </div>
    </div>
  );
}
