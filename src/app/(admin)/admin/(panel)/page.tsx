import Link from 'next/link';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';
import { BarList, TrendChart, type SeriesPoint } from '@/components/admin/Charts';
import {
  AdminPageHeader,
  Card,
  EmptyRow,
  StatTile,
  StatusBadge,
  TableWrap,
  Td,
  Th,
} from '@/components/admin/ui';
import { formatDate, formatDateTime, formatNumber, formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Tableau de bord',
};

// Les indicateurs sont consultés pendant la journée de travail : aucune mise en
// cache ne doit s'intercaler entre la base et l'écran du gérant.
export const dynamic = 'force-dynamic';

const TREND_DAYS = 30;

/** Clé de regroupement journalier calculée sur l'heure locale, pas sur UTC :
 *  une commande passée à 23 h à Alger doit rester sur la journée du gérant. */
function dayKey(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayLabel(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${day}/${month}`;
}

export default async function AdminDashboardPage() {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfTrend = new Date(startOfToday);
  startOfTrend.setDate(startOfTrend.getDate() - (TREND_DAYS - 1));

  const [
    monthRevenue,
    todayOrders,
    pendingOrders,
    activeProducts,
    customers,
    stockTotal,
    trendOrders,
    latestOrders,
    bestSellers,
    topWilayas,
    lowStock,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'ANNULEE' }, createdAt: { gte: startOfMonth } },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { status: 'EN_ATTENTE' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.customer.count(),
    prisma.productVariant.aggregate({ _sum: { stock: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfTrend }, status: { not: 'ANNULEE' } },
      select: { createdAt: true, total: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        reference: true,
        firstName: true,
        lastName: true,
        wilayaName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    // Les classements écartent les commandes annulées, comme le chiffre
    // d'affaires : une annulation ne doit pas hisser un modèle en tête des
    // ventes ni faire passer une wilaya pour un bon marché.
    prisma.orderItem.groupBy({
      by: ['productName'],
      where: { order: { status: { not: 'ANNULEE' } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 6,
    }),
    prisma.order.groupBy({
      by: ['wilayaName'],
      where: { status: { not: 'ANNULEE' } },
      _count: { _all: true },
      orderBy: { _count: { wilayaName: 'desc' } },
      take: 6,
    }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 2 }, product: { isActive: true } },
      select: {
        id: true,
        size: true,
        color: true,
        stock: true,
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { stock: 'asc' },
      take: 8,
    }),
  ]);

  // La série doit couvrir les 30 jours, y compris ceux sans commande : un trou
  // dans la courbe se lirait à tort comme une absence de données.
  const revenueByDay = new Map<string, number>();
  for (const order of trendOrders) {
    const key = dayKey(order.createdAt);
    revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.total);
  }

  const trend: SeriesPoint[] = Array.from({ length: TREND_DAYS }, (_, offset) => {
    const day = new Date(startOfTrend);
    day.setDate(day.getDate() + offset);
    return { label: dayLabel(day), value: revenueByDay.get(dayKey(day)) ?? 0 };
  });

  const bestSellersData: SeriesPoint[] = bestSellers.map((row) => ({
    label: row.productName,
    value: row._sum.quantity ?? 0,
  }));

  const wilayasData: SeriesPoint[] = topWilayas.map((row) => ({
    label: row.wilayaName,
    value: row._count._all,
  }));

  return (
    <>
      <AdminPageHeader
        title="Tableau de bord"
        description={`Situation de la boutique au ${formatDate(now)}. Tous les chiffres sont lus en direct dans la base.`}
        actions={
          <ButtonLink href="/admin/produits/nouveau" size="sm">
            Ajouter un produit
          </ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Chiffre d’affaires du mois"
          value={formatPrice(monthRevenue._sum.total ?? 0)}
          hint="Commandes annulées exclues"
        />
        <StatTile
          label="Commandes aujourd’hui"
          value={formatNumber(todayOrders)}
          hint="Depuis minuit"
        />
        <StatTile
          label="En attente"
          value={formatNumber(pendingOrders)}
          hint="À confirmer par téléphone"
          href="/admin/commandes?statut=EN_ATTENTE"
        />
        <StatTile
          label="Clients"
          value={formatNumber(customers)}
          hint={`${formatNumber(activeProducts)} produits actifs · ${formatNumber(stockTotal._sum.stock ?? 0)} pièces en stock`}
        />
      </div>

      <Card title="Chiffre d’affaires, 30 derniers jours" className="mt-6">
        <TrendChart data={trend} formatValue={formatPrice} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Meilleures ventes">
          <BarList
            data={bestSellersData}
            formatValue={(value) => `${formatNumber(value)} vendu${value > 1 ? 's' : ''}`}
            emptyMessage="Aucune vente enregistrée pour le moment."
          />
        </Card>

        <Card title="Wilayas les plus actives">
          <BarList
            data={wilayasData}
            formatValue={(value) => `${formatNumber(value)} commande${value > 1 ? 's' : ''}`}
            emptyMessage="Aucune commande enregistrée pour le moment."
          />
        </Card>
      </div>

      <Card
        title="Dernières commandes"
        className="mt-6"
        action={
          <Link href="/admin/commandes" className="link-underline text-[0.8125rem] text-graphite">
            Toutes les commandes
          </Link>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>Référence</Th>
              <Th>Client</Th>
              <Th>Wilaya</Th>
              <Th className="text-right">Montant</Th>
              <Th>Statut</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody>
            {latestOrders.length === 0 ? (
              <EmptyRow colSpan={6} message="Aucune commande pour le moment." />
            ) : (
              latestOrders.map((order) => (
                <tr key={order.id}>
                  <Td>
                    <Link href={`/admin/commandes/${order.id}`} className="link-underline">
                      {order.reference}
                    </Link>
                  </Td>
                  <Td>
                    {order.firstName} {order.lastName}
                  </Td>
                  <Td className="text-graphite">{order.wilayaName}</Td>
                  <Td className="whitespace-nowrap text-right">{formatPrice(order.total)}</Td>
                  <Td>
                    <StatusBadge status={order.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-graphite">
                    {formatDateTime(order.createdAt)}
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </Card>

      <Card title="Stock faible" className="mt-6">
        {lowStock.length === 0 ? (
          <p className="py-10 text-center text-[0.875rem] text-graphite">
            Aucune déclinaison à deux pièces ou moins. Le stock est sain.
          </p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <Th>Produit</Th>
                <Th>Taille</Th>
                <Th>Couleur</Th>
                <Th className="text-right">Stock</Th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((variant) => (
                <tr key={variant.id}>
                  <Td>
                    <Link href={`/admin/produits/${variant.product.id}`} className="link-underline">
                      {variant.product.name}
                    </Link>
                  </Td>
                  <Td className="text-graphite">{variant.size}</Td>
                  <Td className="text-graphite">{variant.color}</Td>
                  <Td className="whitespace-nowrap text-right">
                    {variant.stock === 0
                      ? 'Épuisé'
                      : `${formatNumber(variant.stock)} pièce${variant.stock > 1 ? 's' : ''}`}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </>
  );
}
