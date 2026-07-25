import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusControl, PrintButton } from '@/components/admin/OrderStatusControl';
import { AdminPageHeader, Card, StatusBadge, TableWrap, Td, Th } from '@/components/admin/ui';
import { ProductVisual } from '@/components/ProductVisual';
import { PhoneIcon } from '@/components/icons';
import { BRAND } from '@/lib/brand';
import { formatDateTime, formatPhone, formatPrice } from '@/lib/format';
import { DELIVERY_LABEL, ORDER_STATUS } from '@/lib/order-status';
import { prisma } from '@/lib/prisma';

/* Le statut peut changer à chaque appel téléphonique : cette page ne doit jamais
   être servie depuis un cache, sous peine de faire travailler le gérant sur un
   état périmé. */
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { reference: true } });

  return { title: order?.reference ?? 'Commande introuvable' };
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'desc' } },
      customer: { select: { totalOrders: true, totalSpent: true } },
    },
  });

  if (!order) notFound();

  const status = ORDER_STATUS[order.status];
  const customer = order.customer;
  const loyal = customer !== null && customer.totalOrders > 1;

  return (
    <div className="print-sheet">
      {/* Rappel de l'expéditeur : le bon imprimé quitte l'écran et doit se
          suffire à lui-même une fois glissé dans le colis. */}
      <div className="print-only mb-6">
        <p className="text-[1rem] tracking-[0.2em] text-ink">{BRAND.name}</p>
        <p className="mt-1 text-[0.75rem] text-graphite">
          {BRAND.phoneDisplay} · {BRAND.email}
        </p>
      </div>

      <AdminPageHeader
        title={order.reference}
        description={`Reçue le ${formatDateTime(order.createdAt)} · ${status.label}`}
        actions={
          <>
            <StatusBadge status={order.status} />
            <a
              href={`tel:${order.phone}`}
              className="no-print inline-flex h-9 items-center gap-2 border border-line px-4 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors duration-300 hover:border-ink"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              Appeler le client
            </a>
            <PrintButton />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* ── Colonne principale ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card title="Articles">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Produit</Th>
                  <Th>Taille · couleur</Th>
                  <Th className="text-right">Prix unitaire</Th>
                  <Th className="text-right">Qté</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="relative aspect-4/5 w-11 shrink-0 overflow-hidden bg-mist">
                          <ProductVisual
                            name={item.productName}
                            slug={item.productSlug}
                            images={item.imageUrl ? [item.imageUrl] : null}
                            sizes="44px"
                          />
                        </span>
                        <Link
                          href={`/produit/${item.productSlug}`}
                          className="link-underline leading-snug"
                        >
                          {item.productName}
                        </Link>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-graphite">
                      {item.size} · {item.color}
                    </Td>
                    <Td className="whitespace-nowrap text-right text-graphite">
                      {formatPrice(item.unitPrice)}
                    </Td>
                    <Td className="text-right">×{item.quantity}</Td>
                    <Td className="whitespace-nowrap text-right">{formatPrice(item.lineTotal)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <dl className="ml-auto mt-6 max-w-xs space-y-3 text-[0.875rem]">
              <div className="flex justify-between gap-6">
                <dt className="text-graphite">Sous-total</dt>
                <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-graphite">Livraison</dt>
                <dd className="text-ink">{formatPrice(order.deliveryFee)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between gap-6">
                  <dt className="text-graphite">Remise</dt>
                  <dd className="text-ink">− {formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-6 border-t border-line pt-4">
                <dt className="eyebrow text-ink">Total à encaisser</dt>
                <dd className="text-[1.5rem] font-light leading-none text-ink">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>

            <p className="mt-4 text-right text-[0.75rem] text-ash">
              Paiement à la livraison, en espèces.
            </p>
          </Card>

          <Card title="Suivi">
            {order.events.length === 0 ? (
              <p className="py-6 text-center text-[0.875rem] text-ash">
                Aucun événement enregistré pour l&rsquo;instant.
              </p>
            ) : (
              <ol className="space-y-6 border-l border-line pl-6">
                {order.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[1.75rem] top-1.5 h-2 w-2 rounded-full bg-ink"
                    />
                    <p className="text-[0.875rem] text-ink">{ORDER_STATUS[event.status].label}</p>
                    {event.note && (
                      <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-graphite">
                        {event.note}
                      </p>
                    )}
                    <p className="mt-1.5 text-[0.75rem] text-ash">
                      {formatDateTime(event.createdAt)}
                      {event.author ? ` · ${event.author}` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* ── Colonne latérale ────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card title="Client">
            <div className="space-y-4 text-[0.875rem] leading-relaxed">
              <p className="text-ink">
                {order.firstName} {order.lastName}
              </p>

              <div className="space-y-1">
                <a href={`tel:${order.phone}`} className="link-underline block text-ink">
                  {formatPhone(order.phone)}
                </a>
                {order.phoneAlt && (
                  <a href={`tel:${order.phoneAlt}`} className="link-underline block text-graphite">
                    {formatPhone(order.phoneAlt)}
                  </a>
                )}
              </div>

              <address className="space-y-1 not-italic text-graphite">
                <p>{order.address}</p>
                <p>
                  {order.commune}, {order.wilayaName} ({order.wilayaCode})
                </p>
              </address>

              <p className="border-t border-line pt-4 text-ink">
                {DELIVERY_LABEL[order.deliveryType]}
              </p>

              {order.notes && (
                <div className="border-t border-line pt-4">
                  <p className="eyebrow text-ink">Note du client</p>
                  <p className="mt-2 text-graphite">{order.notes}</p>
                </div>
              )}

              {loyal && (
                <p className="border-t border-line pt-4 text-[0.8125rem] text-graphite">
                  Client fidèle : {customer.totalOrders} commandes, {formatPrice(customer.totalSpent)}{' '}
                  au total.
                </p>
              )}
            </div>
          </Card>

          <Card title="Gestion" className="no-print">
            <OrderStatusControl
              orderId={order.id}
              current={order.status}
              adminNote={order.adminNote}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
