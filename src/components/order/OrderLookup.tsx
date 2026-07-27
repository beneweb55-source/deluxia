'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { OrderDetail } from '@/components/order/OrderDetail';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { BRAND } from '@/lib/brand';
import { PIXEL_CURRENCY, trackPixel } from '@/lib/pixel';
import type { PublicOrder } from '@/lib/order-status';

const SESSION_KEY = 'deluxia.lastOrder';

/**
 * Consultation d'une commande.
 *
 * Deux usages :
 *  ▸ Page de confirmation — la référence est connue et le téléphone a été
 *    mémorisé lors de la validation : la commande s'affiche sans rien saisir.
 *  ▸ Suivi de commande — le visiteur saisit référence et téléphone.
 *
 * Le téléphone est toujours exigé côté serveur ; le mémoriser en session ne fait
 * qu'éviter de le retaper, sans jamais affaiblir le contrôle.
 */
export function OrderLookup({
  reference: fixedReference,
  celebrate = false,
}: {
  reference?: string;
  celebrate?: boolean;
}) {
  const [reference, setReference] = useState(fixedReference ?? '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  const lookup = useCallback(async (ref: string, tel: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/commande/${encodeURIComponent(ref.trim().toUpperCase())}?tel=${encodeURIComponent(tel)}`,
      );

      if (!response.ok) {
        setOrder(null);
        setError(
          'Aucune commande ne correspond à cette référence et à ce numéro. Vérifiez les deux, ou appelez-nous.',
        );
        return;
      }

      const data = (await response.json()) as { order: PublicOrder };
      setOrder(data.order);
    } catch {
      setError('Connexion interrompue. Réessayez dans un instant.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tentative automatique juste après la validation d'une commande.
  useEffect(() => {
    if (!fixedReference || autoTried) return;
    setAutoTried(true);

    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;

      const stored = JSON.parse(raw) as { reference?: string; phone?: string };
      if (stored.reference === fixedReference && stored.phone) {
        setPhone(stored.phone);
        void lookup(fixedReference, stored.phone);
      }
    } catch {
      // Session illisible : on retombe sur la saisie manuelle.
    }
  }, [fixedReference, autoTried, lookup]);

  // Événement d'achat Meta Pixel — uniquement sur la page de confirmation
  // (`celebrate`), et une seule fois par commande : la référence sert de verrou
  // en sessionStorage pour qu'un rafraîchissement ne compte pas deux ventes.
  useEffect(() => {
    if (!celebrate || !order) return;

    const flag = `deluxia.purchaseTracked.${order.reference}`;
    try {
      if (sessionStorage.getItem(flag)) return;
      sessionStorage.setItem(flag, '1');
    } catch {
      // sessionStorage indisponible (navigation privée) : on émet quand même,
      // quitte à risquer un doublon très rare, plutôt que de perdre la vente.
    }

    trackPixel('Purchase', {
      value: order.total,
      currency: PIXEL_CURRENCY,
      content_type: 'product',
      contents: order.items.map((item) => ({
        id: item.productSlug,
        quantity: item.quantity,
        item_price: item.unitPrice,
      })),
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }, [celebrate, order]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reference.trim() || !phone.trim()) {
      setError('Renseignez la référence et le numéro de téléphone de la commande.');
      return;
    }
    void lookup(reference, phone);
  };

  if (order) {
    return <OrderDetail order={order} celebrate={celebrate} />;
  }

  return (
    <div className="shell-tight pb-(--spacing-section)">
      <div className="border border-line p-7 sm:p-10">
        {celebrate && fixedReference && (
          <div className="mb-8 border-b border-line pb-8">
            <p className="eyebrow">Commande enregistrée</p>
            <p className="mt-3 font-mono text-[1.25rem] text-ink">{fixedReference}</p>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-graphite">
              Notez cette référence. Saisissez le numéro de téléphone utilisé pour la commande afin
              d'afficher le récapitulatif détaillé.
            </p>
          </div>
        )}

        <form onSubmit={submit} noValidate>
          {!fixedReference && (
            <Input
              label="Référence de commande"
              required
              placeholder="DLX-2607-0001"
              autoComplete="off"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />
          )}

          <Input
            label="Téléphone de la commande"
            type="tel"
            inputMode="tel"
            required
            placeholder="07 72 61 05 46"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />

          {error && (
            <p role="alert" className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] leading-relaxed text-ink">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth disabled={loading}>
            {loading ? 'Recherche…' : 'Afficher ma commande'}
          </Button>
        </form>

        <div className="mt-8 border-t border-line pt-6">
          <p className="text-[0.8125rem] leading-relaxed text-graphite">
            Référence égarée ? Appelez-nous au{' '}
            <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-ink">
              {BRAND.phoneDisplay}
            </a>{' '}
            avec le nom et le numéro utilisés lors de la commande.
          </p>
          <ButtonLink href="/boutique" variant="quiet" size="sm" className="-ml-1 mt-4">
            ← Retour à la boutique
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
