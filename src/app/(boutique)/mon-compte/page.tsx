import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ProductVisual } from '@/components/ProductVisual';
import { ButtonLink } from '@/components/ui/Button';
import { PasswordForm, ProfileForm } from '@/components/account/AccountForms';
import { logoutUnified } from '@/app/(boutique)/_actions/auth';
import { getSessionCustomer } from '@/lib/customerAuth';
import { prisma } from '@/lib/prisma';
import { formatDate, formatPrice } from '@/lib/format';
import { DELIVERY_LABEL, ORDER_STATUS } from '@/lib/order-status';

export const metadata: Metadata = {
  title: 'Mon compte',
  description: 'Vos commandes et vos informations DELUXIA.',
  robots: { index: false, follow: false },
};

/** L'espace client dépend de la session : il ne peut pas être mis en cache. */
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const session = await getSessionCustomer();

  // Le middleware n'a vérifié que la présence du cookie ; c'est ici que la
  // session est réellement validée.
  if (!session) redirect('/connexion?suite=%2Fmon-compte');

  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      wilayaCode: true,
      commune: true,
      address: true,
      totalOrders: true,
      totalSpent: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          reference: true,
          status: true,
          createdAt: true,
          total: true,
          deliveryType: true,
          wilayaName: true,
          commune: true,
          items: {
            select: {
              productName: true,
              productSlug: true,
              imageUrl: true,
              size: true,
              color: true,
              quantity: true,
            },
          },
        },
      },
    },
  });

  if (!customer) redirect('/connexion');

  return (
    <>
      <PageHeader
        eyebrow="Espace personnel"
        title={`Bonjour, ${customer.firstName}`}
        description="Retrouvez vos commandes et tenez vos coordonnées à jour — elles pré-remplissent le tunnel de commande."
        crumbs={[{ name: 'Mon compte', href: '/mon-compte' }]}
      />

      <div className="shell pb-(--spacing-section)">
        {/* ── Résumé ─────────────────────────────────────────────────────── */}
        <dl className="grid grid-cols-2 gap-px border-y border-line lg:grid-cols-4">
          {[
            { label: 'Commandes', value: String(customer.totalOrders) },
            { label: 'Total dépensé', value: formatPrice(customer.totalSpent) },
            {
              label: 'Cliente depuis',
              value: formatDate(customer.createdAt),
            },
            { label: 'Téléphone', value: customer.phone },
          ].map((item) => (
            <div key={item.label} className="py-7">
              <dt className="eyebrow">{item.label}</dt>
              <dd className="mt-3 text-[1.125rem] font-light text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>

        {/* ── Commandes ──────────────────────────────────────────────────── */}
        <section aria-labelledby="mes-commandes" className="mt-14">
          <h2 id="mes-commandes" className="text-[1.375rem] font-light tracking-[-0.02em] text-ink">
            Mes commandes
          </h2>

          {customer.orders.length === 0 ? (
            <div className="mt-7 flex flex-col items-center border border-line px-6 py-16 text-center">
              <span className="h-px w-12 bg-line" />
              <p className="mt-7 text-[1.125rem] font-light text-ink">Aucune commande pour l'instant</p>
              <p className="mt-3 max-w-md text-[0.875rem] leading-relaxed text-graphite">
                Vos futures commandes apparaîtront ici, avec leur suivi.
              </p>
              <ButtonLink href="/boutique" className="mt-8">
                Découvrir la collection
              </ButtonLink>
            </div>
          ) : (
            <ul className="mt-7 space-y-4">
              {customer.orders.map((order) => {
                const status = ORDER_STATUS[order.status];
                const units = order.items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <li key={order.id} className="border border-line">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
                      <div>
                        <p className="font-mono text-[0.9375rem] text-ink">{order.reference}</p>
                        <p className="mt-1.5 text-[0.75rem] text-ash">
                          {formatDate(order.createdAt)} · {units} article{units > 1 ? 's' : ''} ·{' '}
                          {DELIVERY_LABEL[order.deliveryType]}
                        </p>
                        <p className="mt-1 text-[0.75rem] text-ash">
                          {order.commune}, {order.wilayaName}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[1.0625rem] font-light text-ink">{formatPrice(order.total)}</p>
                        <p className="mt-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-graphite">
                          {status.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6">
                      <ul className="flex flex-wrap gap-3">
                        {order.items.slice(0, 5).map((item, index) => (
                          <li
                            key={`${item.productSlug}-${item.size}-${item.color}-${index}`}
                            className="flex items-center gap-3"
                          >
                            <Link
                              href={`/produit/${item.productSlug}`}
                              className="relative aspect-4/5 w-12 shrink-0 overflow-hidden bg-mist"
                              aria-label={item.productName}
                            >
                              <ProductVisual
                                name={item.productName}
                                slug={item.productSlug}
                                images={item.imageUrl ? [item.imageUrl] : null}
                                sizes="48px"
                              />
                            </Link>
                            <span className="text-[0.75rem] leading-snug text-graphite">
                              {item.productName}
                              <br />
                              <span className="text-ash">
                                T. {item.size} · {item.color} · ×{item.quantity}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>

                      {order.items.length > 5 && (
                        <span className="text-[0.75rem] text-ash">
                          et {order.items.length - 5} autre{order.items.length - 5 > 1 ? 's' : ''}
                        </span>
                      )}

                      <Link
                        href={`/commande/confirmation/${order.reference}`}
                        className="link-underline ml-auto text-[0.6875rem] uppercase tracking-[0.16em] text-ink"
                      >
                        Voir le détail
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Réglages ───────────────────────────────────────────────────── */}
        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <section aria-labelledby="mes-infos">
            <h2 id="mes-infos" className="text-[1.375rem] font-light tracking-[-0.02em] text-ink">
              Mes informations
            </h2>
            <div className="mt-7 border border-line p-6 sm:p-8">
              <ProfileForm
                profile={{
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email,
                  phone: customer.phone,
                  wilayaCode: customer.wilayaCode,
                  commune: customer.commune,
                  address: customer.address,
                }}
              />
            </div>
          </section>

          <section aria-labelledby="mot-de-passe">
            <h2 id="mot-de-passe" className="text-[1.375rem] font-light tracking-[-0.02em] text-ink">
              Mot de passe
            </h2>
            <div className="mt-7 border border-line p-6 sm:p-8">
              <PasswordForm />
            </div>

            <form action={logoutUnified} className="mt-8">
              <button
                type="submit"
                className="link-underline text-[0.6875rem] uppercase tracking-[0.16em] text-graphite transition-colors hover:text-ink"
              >
                Se déconnecter
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
