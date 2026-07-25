import type { Metadata } from 'next';
import Link from 'next/link';
import type { OrderStatus, Prisma } from '@prisma/client';
import { AdminPageHeader, Card, StatTile } from '@/components/admin/ui';
import { OrdersTable, type OrderRow } from '@/components/admin/OrdersTable';
import { formatNumber, formatPrice } from '@/lib/format';
import { ORDER_STATUS, ORDER_STEPS } from '@/lib/order-status';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Commandes',
};

// Le gérant travaille sur des données qui changent à chaque appel client :
// aucune mise en cache ne serait acceptable ici.
export const dynamic = 'force-dynamic';

const MAX_ROWS = 200;

const ALL_STATUSES = Object.keys(ORDER_STATUS) as OrderStatus[];

const CONTROL =
  'w-full appearance-none border border-line bg-paper px-3 py-2.5 text-[1rem] sm:text-[0.875rem] text-ink ' +
  'placeholder:text-ash outline-none transition-colors duration-300 focus:border-ink ' +
  '[&>option]:bg-paper [&>option]:text-ink';

/** Un paramètre d'URL peut être répété ; seule la première valeur nous intéresse. */
function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? '').trim();
  return (value ?? '').trim();
}

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; statut?: string | string[]; wilaya?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = firstParam(params.q).slice(0, 60);
  const wilaya = firstParam(params.wilaya);
  const statut = ALL_STATUSES.find((value) => value === firstParam(params.statut));

  const where: Prisma.OrderWhereInput = {};
  if (statut) where.status = statut;
  if (wilaya) where.wilayaName = wilaya;
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
    ];
  }

  const hasFilter = Boolean(q || wilaya || statut);

  const [statusGroups, wilayaGroups, matching, encaissable, orders] = await Promise.all([
    // Compteurs volontairement calculés hors filtre : les tuiles servent de
    // navigation entre statuts, elles doivent rester stables quel que soit le tri.
    prisma.order.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.order.groupBy({ by: ['wilayaName'], orderBy: { wilayaName: 'asc' } }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { AND: [where, { status: { not: 'ANNULEE' } }] },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ROWS,
      select: {
        id: true,
        reference: true,
        firstName: true,
        lastName: true,
        phone: true,
        commune: true,
        wilayaName: true,
        deliveryType: true,
        total: true,
        status: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
    }),
  ]);

  const countByStatus = new Map<OrderStatus, number>(
    statusGroups.map((group) => [group.status, group._count._all]),
  );

  const encaissableTotal = encaissable._sum.total ?? 0;

  // Les dates sont sérialisées avant de franchir la frontière client : un objet
  // Date ne traverse pas la limite serveur/client sans perdre son type.
  const rows: OrderRow[] = orders.map((order) => ({
    id: order.id,
    reference: order.reference,
    firstName: order.firstName,
    lastName: order.lastName,
    phone: order.phone,
    commune: order.commune,
    wilayaName: order.wilayaName,
    deliveryType: order.deliveryType,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    units: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }));

  const description = [
    `${formatNumber(matching)} commande${matching > 1 ? 's' : ''}${hasFilter ? ' pour ce filtre' : ''}`,
    `${formatPrice(encaissableTotal)} encaissables, annulations exclues`,
    matching > MAX_ROWS ? `Seules les ${MAX_ROWS} plus récentes sont affichées.` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <AdminPageHeader title="Commandes" description={description} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {ORDER_STEPS.map((status) => (
          <StatTile
            key={status}
            label={ORDER_STATUS[status].label}
            value={formatNumber(countByStatus.get(status) ?? 0)}
            hint={statut === status ? 'Filtre actif' : undefined}
            href={`/admin/commandes?statut=${status}`}
          />
        ))}
      </div>

      <Card className="mt-6">
        <form method="get" action="/admin/commandes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label htmlFor="filtre-q" className="eyebrow mb-2 block text-ink">
              Recherche
            </label>
            <input
              id="filtre-q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Référence, nom ou téléphone"
              className={CONTROL}
            />
          </div>

          <div>
            <label htmlFor="filtre-statut" className="eyebrow mb-2 block text-ink">
              Statut
            </label>
            <select id="filtre-statut" name="statut" defaultValue={statut ?? ''} className={CONTROL}>
              <option value="">Tous les statuts</option>
              {ALL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS[status].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtre-wilaya" className="eyebrow mb-2 block text-ink">
              Wilaya
            </label>
            <select id="filtre-wilaya" name="wilaya" defaultValue={wilaya} className={CONTROL}>
              <option value="">Toutes les wilayas</option>
              {wilayaGroups.map((group) => (
                <option key={group.wilayaName} value={group.wilayaName}>
                  {group.wilayaName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-5 sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="border border-ink bg-ink px-6 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity duration-300 hover:opacity-80"
            >
              Filtrer
            </button>
            {hasFilter && (
              <Link href="/admin/commandes" className="link-underline text-[0.8125rem] text-graphite">
                Réinitialiser
              </Link>
            )}
          </div>
        </form>
      </Card>

      <Card className="mt-6" padded={false}>
        <div className="p-5">
          <OrdersTable orders={rows} hasFilter={hasFilter} />
        </div>
      </Card>
    </>
  );
}
