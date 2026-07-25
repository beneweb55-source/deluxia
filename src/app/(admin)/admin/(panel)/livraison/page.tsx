import type { Metadata } from 'next';
import type { DeliveryRate } from '@prisma/client';
import { DeliveryManager, type DeliveryRateRow, type MissingWilaya } from '@/components/admin/DeliveryManager';
import { AdminPageHeader, Card, StatTile } from '@/components/admin/ui';
import { formatNumber, formatPrice } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { WILAYAS } from '@/data/wilayas';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Tarifs de livraison' };

/** Wilaya au tarif domicile le plus bas de la liste reçue, ou null si elle est vide. */
function cheapest(rates: DeliveryRate[]): DeliveryRate | null {
  return rates.reduce<DeliveryRate | null>(
    (best, rate) => (best === null || rate.homeFee < best.homeFee ? rate : best),
    null,
  );
}

/** Symétrique de `cheapest`, pour l'autre borne de la grille. */
function dearest(rates: DeliveryRate[]): DeliveryRate | null {
  return rates.reduce<DeliveryRate | null>(
    (best, rate) => (best === null || rate.homeFee > best.homeFee ? rate : best),
    null,
  );
}

export default async function AdminDeliveryPage() {
  const rates = await prisma.deliveryRate.findMany({ orderBy: { code: 'asc' } });

  const served = rates.filter((rate) => rate.isServed);
  const withDesk = served.filter((rate) => rate.hasDesk);
  const lowest = cheapest(served);
  const highest = dearest(served);

  // Le tarif d'Alger est cité en exemple : on le relit dans la grille plutôt que
  // de l'écrire en dur, sinon la page mentirait dès la première modification.
  const alger = rates.find((rate) => rate.code === 16);

  const rows: DeliveryRateRow[] = rates.map((rate) => ({
    code: rate.code,
    name: rate.name,
    homeFee: rate.homeFee,
    deskFee: rate.deskFee,
    hasDesk: rate.hasDesk,
    isServed: rate.isServed,
    returnFee: rate.returnFee,
  }));

  // Wilayas du référentiel absentes de la grille : elles ne sont plus livrables
  // tant qu'elles n'ont pas été rétablies.
  const present = new Set(rates.map((rate) => rate.code));
  const missing: MissingWilaya[] = WILAYAS.filter((wilaya) => !present.has(wilaya.code)).map(
    (wilaya) => ({ code: wilaya.code, name: wilaya.name }),
  );

  return (
    <>
      <AdminPageHeader
        title="Tarifs de livraison"
        description="La grille provient du transporteur ZR Express. Elle se modifie ici, wilaya par wilaya, sans intervention technique : chaque ligne est enregistrée séparément, sans toucher aux autres."
      />

      <Card title="Comment lire cette grille" className="mb-8">
        <ul className="flex flex-col gap-4 text-[0.875rem] leading-relaxed text-graphite">
          <li className="border-l-2 border-line pl-4">
            Un tarif bureau à 0 DA signifie qu&rsquo;aucun bureau de retrait n&rsquo;existe dans la
            wilaya : la case « Bureau dispo. » est alors décochée à l&rsquo;enregistrement, pour que
            la grille ne puisse jamais annoncer un retrait gratuit.
          </li>
          <li className="border-l-2 border-line pl-4">
            Une wilaya non desservie reste visible dans le formulaire de commande, mais la commande
            y est refusée avec un message clair. Nous préférons expliquer plutôt que faire
            disparaître une wilaya de la liste.
          </li>
          {alger && alger.homeFee === alger.deskFee && (
            <li className="border-l-2 border-line pl-4">
              Alger est la seule wilaya où les deux modes sont au même prix :{' '}
              {formatPrice(alger.homeFee)} à domicile comme en bureau.
            </li>
          )}
        </ul>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Wilayas desservies"
          value={formatNumber(served.length)}
          hint={`Sur ${formatNumber(rates.length)} wilayas au total`}
        />
        <StatTile
          label="Avec bureau de retrait"
          value={formatNumber(withDesk.length)}
          hint="Les autres passent obligatoirement par la livraison à domicile"
        />
        <StatTile
          label="Domicile — le plus bas"
          value={lowest ? formatPrice(lowest.homeFee) : '—'}
          hint={lowest ? lowest.name : 'Aucune wilaya desservie'}
        />
        <StatTile
          label="Domicile — le plus élevé"
          value={highest ? formatPrice(highest.homeFee) : '—'}
          hint={highest ? highest.name : 'Aucune wilaya desservie'}
        />
      </div>

      <DeliveryManager rates={rows} missing={missing} />
    </>
  );
}
