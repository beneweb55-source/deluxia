import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import {
  AdminPageHeader,
  Card,
  EmptyRow,
  StatTile,
  TableWrap,
  Td,
  Th,
} from '@/components/admin/ui';
import { getWilaya } from '@/data/wilayas';
import { formatDate, formatNumber, formatPhone, formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';

/* Le fichier client évolue à chaque commande : aucune mise en cache. */
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Clients' };

const TRIS = {
  recents: 'Les plus récents',
  depense: 'Total dépensé',
  commandes: 'Nombre de commandes',
} as const;

type Tri = keyof typeof TRIS;

/** Seuil au-delà duquel un client est considéré comme fidèle. */
const SEUIL_FIDELE = 2;

/* Les options natives héritent des couleurs du système sur certains navigateurs :
   on les repeint pour qu'elles restent lisibles en thème sombre. */
const CONTROL =
  'w-full appearance-none border border-line bg-paper px-3 py-2.5 text-[1rem] sm:text-[0.875rem] text-ink ' +
  'placeholder:text-ash/70 outline-none transition-colors duration-300 focus:border-ink ' +
  '[&>option]:bg-paper [&>option]:text-ink';

/** Un paramètre d'URL peut être répété ; seule la première valeur nous intéresse. */
function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return (value[0] ?? '').trim();
  return (value ?? '').trim();
}

function parseTri(value: string): Tri {
  return value === 'depense' || value === 'commandes' ? value : 'recents';
}

const ORDER_BY: Record<Tri, Prisma.CustomerOrderByWithRelationInput[]> = {
  recents: [{ createdAt: 'desc' }],
  depense: [{ totalSpent: 'desc' }, { createdAt: 'desc' }],
  commandes: [{ totalOrders: 'desc' }, { totalSpent: 'desc' }],
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; tri?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = firstParam(params.q).slice(0, 60);
  const tri = parseTri(firstParam(params.tri));

  /* La recherche porte sur le nom ou le téléphone : on retire les espaces de
     saisie du numéro, la base ne stocke que des chiffres. */
  const digits = q.replace(/\D/g, '');
  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          ...(digits ? [{ phone: { contains: digits } }] : []),
        ],
      }
    : {};

  const [customers, totalClients, fideles, agregats, meilleur] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: ORDER_BY[tri],
      take: 200,
      include: {
        orders: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
    prisma.customer.count(),
    prisma.customer.count({ where: { totalOrders: { gte: SEUIL_FIDELE } } }),
    prisma.customer.aggregate({ _sum: { totalSpent: true, totalOrders: true } }),
    prisma.customer.findFirst({
      orderBy: { totalSpent: 'desc' },
      select: { firstName: true, lastName: true, totalSpent: true },
    }),
  ]);

  const depenseTotale = agregats._sum.totalSpent ?? 0;
  const commandesTotales = agregats._sum.totalOrders ?? 0;
  const panierMoyen = commandesTotales > 0 ? Math.round(depenseTotale / commandesTotales) : 0;

  /* Un client sans achat ne mérite pas le titre : la tuile reste vide tant que
     personne n'a dépensé. */
  const meilleurDepensier = meilleur && meilleur.totalSpent > 0 ? meilleur : null;

  const description =
    totalClients > 0
      ? `${formatNumber(totalClients)} client${totalClients > 1 ? 's' : ''} enregistré${
          totalClients > 1 ? 's' : ''
        }, pour un panier moyen de ${formatPrice(panierMoyen)}.`
      : 'Aucun client enregistré pour le moment.';

  return (
    <>
      <AdminPageHeader title="Clients" description={description} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Clients au total" value={formatNumber(totalClients)} />
        <StatTile
          label="Clients fidèles"
          value={formatNumber(fideles)}
          hint={`Au moins ${SEUIL_FIDELE} commandes passées`}
        />
        <StatTile
          label="Panier moyen"
          value={formatPrice(panierMoyen)}
          hint={`Sur ${formatNumber(commandesTotales)} commande${commandesTotales > 1 ? 's' : ''}`}
        />
        <StatTile
          label="Meilleur client"
          value={meilleurDepensier ? formatPrice(meilleurDepensier.totalSpent) : '—'}
          hint={
            meilleurDepensier
              ? `${meilleurDepensier.firstName} ${meilleurDepensier.lastName}`
              : 'Aucune dépense enregistrée'
          }
        />
      </div>

      <Card className="mt-4">
        <form method="get" action="/admin/clients" className="flex flex-wrap items-end gap-4">
          <div className="min-w-[14rem] flex-1">
            <label htmlFor="filtre-q" className="eyebrow mb-2 block text-ink">
              Recherche
            </label>
            <input
              id="filtre-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Nom ou téléphone"
              className={CONTROL}
            />
          </div>

          <div className="min-w-[12rem]">
            <label htmlFor="filtre-tri" className="eyebrow mb-2 block text-ink">
              Trier par
            </label>
            <select id="filtre-tri" name="tri" defaultValue={tri} className={CONTROL}>
              {Object.entries(TRIS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="submit"
              className="border border-ink bg-ink px-6 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity duration-300 hover:opacity-80"
            >
              Filtrer
            </button>
            {(q || tri !== 'recents') && (
              <Link href="/admin/clients" className="link-underline text-[0.8125rem] text-graphite">
                Réinitialiser
              </Link>
            )}
          </div>
        </form>
      </Card>

      <Card
        className="mt-4"
        title={`${formatNumber(customers.length)} client${customers.length > 1 ? 's' : ''} affiché${
          customers.length > 1 ? 's' : ''
        }`}
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>Client</Th>
              <Th>Localisation</Th>
              <Th className="text-right">Commandes</Th>
              <Th className="text-right">Total dépensé</Th>
              <Th>Dernière commande</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <EmptyRow
                colSpan={6}
                message={
                  q ? `Aucun client ne correspond à « ${q} ».` : 'Aucun client enregistré pour le moment.'
                }
              />
            ) : (
              customers.map((c) => {
                const wilaya = getWilaya(c.wilayaCode);
                const derniere = c.orders[0]?.createdAt;
                const lieu = [c.commune, wilaya?.name].filter(Boolean).join(', ');

                return (
                  <tr key={c.id}>
                    <Td>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {c.firstName} {c.lastName}
                        </span>
                        {c.totalOrders >= SEUIL_FIDELE && (
                          <span className="border border-line px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-graphite">
                            Fidèle
                          </span>
                        )}
                      </span>
                      <a
                        href={`tel:${c.phone}`}
                        className="link-underline mt-1 block text-[0.8125rem] text-graphite"
                      >
                        {formatPhone(c.phone)}
                      </a>
                    </Td>
                    <Td className="text-graphite">{lieu || <span className="text-ash">—</span>}</Td>
                    <Td className="text-right tabular-nums">{formatNumber(c.totalOrders)}</Td>
                    <Td className="text-right tabular-nums">{formatPrice(c.totalSpent)}</Td>
                    <Td className="whitespace-nowrap text-graphite">
                      {derniere ? formatDate(derniere) : <span className="text-ash">—</span>}
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/commandes?q=${encodeURIComponent(c.phone)}`}
                        className="link-underline whitespace-nowrap text-[0.8125rem]"
                      >
                        Voir les commandes
                      </Link>
                    </Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </TableWrap>
      </Card>
    </>
  );
}
