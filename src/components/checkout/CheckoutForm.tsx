'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ProductVisual } from '@/components/ProductVisual';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { CheckIcon, MinusIcon, PlusIcon, ShieldIcon, TruckIcon } from '@/components/icons';
import { useCart } from '@/components/providers/CartProvider';
import { formatPrice } from '@/lib/format';
import { formatPhoneInput, orderSchema, type OrderFormFields } from '@/lib/order-schema';
import { findOption, quoteDelivery, type DeliveryOption } from '@/lib/delivery-quote';
import { getCommunes } from '@/data/wilayas';
import { PIXEL_CURRENCY, trackPixel } from '@/lib/pixel';
import { cn } from '@/lib/utils';

const EMPTY: OrderFormFields = {
  firstName: '',
  lastName: '',
  phone: '',
  phoneAlt: undefined,
  wilayaCode: 0,
  commune: '',
  address: '',
  deliveryType: 'DOMICILE',
  notes: undefined,
};

type Errors = Partial<Record<keyof OrderFormFields | 'global', string>>;

/**
 * Commande en une seule page.
 *
 * Décisions structurantes :
 *  ▸ **Une seule étape.** Chaque page intermédiaire d'un tunnel fait perdre des
 *    commandes ; tout tient ici, avec le récapitulatif visible en permanence.
 *  ▸ **Pas de compte.** Le nom, le téléphone et l'adresse suffisent ; c'est ce
 *    que le livreur utilisera de toute façon.
 *  ▸ **Frais recalculés à chaque changement** de wilaya ou de mode, et affichés
 *    immédiatement : le total finalisé ne réserve aucune surprise.
 */
export function CheckoutForm({ options }: { options: DeliveryOption[] }) {
  const cart = useCart();
  const router = useRouter();

  const [values, setValues] = useState<OrderFormFields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  /**
   * Champs déjà quittés une fois par la cliente.
   *
   * C'est la clé du bon dosage de la validation en direct : signaler « e-mail
   * invalide » alors qu'elle vient de taper la première lettre est agressif et
   * fait douter. On attend donc qu'elle quitte le champ pour le juger — mais
   * une fois qu'il est marqué en erreur, on le revalide à chaque frappe, pour
   * que le message disparaisse à la seconde où la saisie devient correcte.
   */
  const [touched, setTouched] = useState<Partial<Record<keyof OrderFormFields, boolean>>>({});

  // La grille vient du serveur, où elle a été lue en base. Le même calcul est
  // rejoué à la création de la commande : l'affichage ne peut pas mentir.
  const wilaya = findOption(options, values.wilayaCode);
  const quote = quoteDelivery(wilaya, values.deliveryType);
  const total = cart.subtotal + quote.fee;

  const servedCount = useMemo(() => options.filter((o) => o.isServed).length, [options]);
  const communes = useMemo(() => getCommunes(values.wilayaCode), [values.wilayaCode]);

  /**
   * Correction automatique du mode de livraison : dès qu'une wilaya sans bureau
   * est choisie, on repasse à « domicile ». Le champ ne peut donc jamais rester
   * dans un état que le serveur refuserait.
   */
  useEffect(() => {
    if (values.deliveryType === 'STOPDESK' && wilaya && !wilaya.hasDesk) {
      setValues((current) => ({ ...current, deliveryType: 'DOMICILE' }));
    }
  }, [wilaya, values.deliveryType]);

  /**
   * InitiateCheckout (Meta Pixel) — émis une seule fois, dès que le panier
   * hydraté contient au moins un article. Le verrou `useRef` évite de recompter
   * l'entrée dans le tunnel à chaque frappe. No-op si le tracking est inactif.
   */
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || !cart.ready || cart.count === 0) return;
    checkoutTracked.current = true;

    trackPixel('InitiateCheckout', {
      value: cart.subtotal,
      currency: PIXEL_CURRENCY,
      num_items: cart.count,
      content_type: 'product',
      contents: cart.lines.map((line) => ({
        id: line.slug,
        quantity: line.quantity,
        item_price: line.unitPrice,
      })),
    });
  }, [cart.ready, cart.count, cart.subtotal, cart.lines]);

  /**
   * Valide un champ isolé contre le schéma partagé avec le serveur.
   *
   * Réutiliser `orderSchema.shape` garantit qu'un champ accepté ici sera accepté
   * par l'API : il n'existe pas de seconde définition des règles à maintenir.
   * Les champs facultatifs vides sont considérés valides.
   */
  const validateField = (key: keyof OrderFormFields, value: unknown): string | undefined => {
    const shape = orderSchema.shape as Record<string, { safeParse: (v: unknown) => { success: boolean; error?: { issues: Array<{ message: string }> } } }>;
    const fieldSchema = shape[key];
    if (!fieldSchema) return undefined;

    if ((key === 'phoneAlt' || key === 'notes') && !String(value ?? '').trim()) return undefined;

    const result = fieldSchema.safeParse(value);
    return result.success ? undefined : result.error?.issues[0]?.message;
  };

  const update = <K extends keyof OrderFormFields>(key: K, value: OrderFormFields[K]) => {
    setValues((current) => ({ ...current, [key]: value }));

    setErrors((current) => ({
      ...current,
      // Un champ déjà signalé se revalide à chaque frappe ; les autres sont
      // simplement nettoyés, on ne les juge pas avant qu'elle les ait quittés.
      [key]: touched[key] ? validateField(key, value) : undefined,
      global: undefined,
    }));
  };

  /** Premier jugement d'un champ : au moment où la cliente le quitte. */
  const blur = <K extends keyof OrderFormFields>(key: K) => {
    setTouched((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: validateField(key, values[key]) }));
  };

  /** Vrai si le champ a été renseigné et passe la validation. */
  const isValid = (key: keyof OrderFormFields): boolean => {
    if (!touched[key] || errors[key]) return false;
    const value = values[key];
    if (value === undefined || value === null || value === '' || value === 0) return false;
    return validateField(key, value) === undefined;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || cart.lines.length === 0) return;

    const payload = {
      ...values,
      // Les champs facultatifs vides doivent être absents, pas des chaînes vides.
      phoneAlt: values.phoneAlt?.trim() ? values.phoneAlt : undefined,
      notes: values.notes?.trim() ? values.notes : undefined,
      items: cart.lines.map((line) => ({
        productId: line.productId,
        variantId: line.variantId,
        quantity: line.quantity,
      })),
    };

    // Première validation côté navigateur : réponse immédiate, aucun aller-retour
    // réseau pour une faute de frappe. Le serveur revalide de toute façon.
    const parsed = orderSchema.safeParse(payload);

    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === 'string' && !(field in next)) {
          next[field as keyof Errors] = issue.message;
        }
      }
      setErrors(next);

      // Amène le premier champ fautif dans le champ de vision.
      const firstField = Object.keys(next)[0];
      document.getElementById(`field-${firstField}`)?.scrollIntoView({ block: 'center' });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        reference?: string;
        message?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !data.reference) {
        setErrors({ ...(data.fieldErrors as Errors), global: data.message ?? 'Commande impossible.' });
        setSubmitting(false);
        return;
      }

      // Le téléphone sert de clé de consultation de la commande : il est conservé
      // pour la session afin que la page de confirmation puisse l'afficher sans
      // redemander l'information.
      try {
        sessionStorage.setItem(
          'deluxia.lastOrder',
          JSON.stringify({ reference: data.reference, phone: parsed.data.phone }),
        );
      } catch {
        // Stockage refusé : la page de confirmation demandera le numéro.
      }

      cart.clear();
      router.push(`/commande/confirmation/${data.reference}`);
    } catch {
      setErrors({ global: 'Connexion interrompue. Vérifiez votre réseau et réessayez.' });
      setSubmitting(false);
    }
  };

  if (!cart.ready) {
    return <div className="shell min-h-[40vh] pb-(--spacing-section)" aria-hidden="true" />;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="shell pb-(--spacing-section)">
        <div className="flex flex-col items-center border border-line px-8 py-24 text-center">
          <span className="h-px w-12 bg-line" />
          <p className="mt-7 text-[1.375rem] font-light text-ink">Aucun article à commander</p>
          <p className="mt-3 max-w-md text-[0.875rem] leading-relaxed text-graphite">
            Ajoutez un article à votre panier pour passer commande.
          </p>
          <ButtonLink href="/boutique" className="mt-9">
            Découvrir la collection
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="shell grid gap-12 pb-(--spacing-section) lg:grid-cols-[1fr_23rem] lg:gap-16"
    >
      <div className="min-w-0">
        {/* ── 1. Coordonnées ────────────────────────────────────────────── */}
        <Step number="01" title="Vos coordonnées">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Input
              id="field-firstName"
              label="Prénom"
              required
              autoComplete="given-name"
              value={values.firstName}
              error={errors.firstName}
              onBlur={() => blur('firstName')}
              valid={isValid('firstName')}
              onChange={(event) => update('firstName', event.target.value)}
            />
            <Input
              id="field-lastName"
              label="Nom"
              required
              autoComplete="family-name"
              value={values.lastName}
              error={errors.lastName}
              onBlur={() => blur('lastName')}
              valid={isValid('lastName')}
              onChange={(event) => update('lastName', event.target.value)}
            />
            <Input
              id="field-phone"
              label="Téléphone"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel"
              placeholder="07 72 61 05 46"
              value={values.phone}
              error={errors.phone}
              onBlur={() => blur('phone')}
              valid={isValid('phone')}
              onChange={(event) => update('phone', formatPhoneInput(event.target.value))}
            />
            <Input
              id="field-phoneAlt"
              label="Téléphone secondaire"
              type="tel"
              inputMode="tel"
              placeholder="Facultatif"
              hint="Utile si le livreur ne parvient pas à vous joindre."
              value={values.phoneAlt ?? ''}
              error={errors.phoneAlt}
              onBlur={() => blur('phoneAlt')}
              valid={isValid('phoneAlt')}
              onChange={(event) => update('phoneAlt', formatPhoneInput(event.target.value))}
            />
          </div>
        </Step>

        {/* ── 2. Livraison ──────────────────────────────────────────────── */}
        <Step number="02" title="Livraison">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Select
              id="field-wilayaCode"
              label="Wilaya"
              required
              value={values.wilayaCode || ''}
              error={errors.wilayaCode}
              valid={isValid('wilayaCode')}
              onChange={(event) => {
                setTouched((current) => ({ ...current, wilayaCode: true }));
                update('wilayaCode', Number(event.target.value));
                update('commune', '');
              }}
            >
              <option value="">Choisir une wilaya</option>
              {options.map((entry) => (
                <option key={entry.code} value={entry.code} disabled={!entry.isServed}>
                  {String(entry.code).padStart(2, '0')} — {entry.name}
                  {!entry.isServed ? ' (non desservie)' : ''}
                </option>
              ))}
            </Select>

            <Select
              id="field-commune"
              label="Commune"
              required
              disabled={communes.length === 0}
              value={values.commune}
              error={errors.commune}
              onBlur={() => blur('commune')}
              valid={isValid('commune')}
              onChange={(event) => update('commune', event.target.value)}
            >
              <option value="">
                {communes.length === 0 ? "Choisissez d'abord une wilaya" : 'Choisir une commune'}
              </option>
              {communes.map((commune) => (
                <option key={commune} value={commune}>
                  {commune}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            id="field-address"
            label="Adresse complète"
            required
            rows={3}
            placeholder="Rue, quartier, numéro d'immeuble, point de repère…"
            hint="Plus l'adresse est précise, plus la livraison est rapide."
            value={values.address}
            error={errors.address}
            onBlur={() => blur('address')}
            valid={isValid('address')}
            onChange={(event) => update('address', event.target.value)}
          />

          {/* ── Mode de livraison ───────────────────────────────────────── */}
          <fieldset className="mt-4" id="field-deliveryType" role="radiogroup" aria-labelledby="legend-deliveryType">
            <legend id="legend-deliveryType" className="eyebrow mb-4 text-ink">Mode de livraison</legend>

            <div className="grid gap-3 sm:grid-cols-2">
              <DeliveryOption
                selected={quote.mode === 'DOMICILE'}
                onSelect={() => update('deliveryType', 'DOMICILE')}
                title="À domicile"
                description="Le livreur vous remet le colis à l'adresse indiquée."
                price={wilaya?.isServed ? wilaya.homeFee : null}
              />

              {/* Masquée exactement dans les cas où la grille ZR Express
                  indiquait 0 DA — c'est-à-dire là où il n'existe aucun bureau. */}
              {wilaya?.hasDesk && (
                <DeliveryOption
                  selected={quote.mode === 'STOPDESK'}
                  onSelect={() => update('deliveryType', 'STOPDESK')}
                  title="En bureau"
                  description="Vous retirez le colis au bureau du transporteur."
                  price={wilaya.deskFee}
                />
              )}
            </div>

            {wilaya && !wilaya.hasDesk && wilaya.isServed && (
              <p className="mt-4 border-l-2 border-ink pl-4 text-[0.8125rem] leading-relaxed text-graphite">
                Aucun bureau de retrait n'existe dans la wilaya de {wilaya.name}. Votre commande sera
                livrée à domicile.
              </p>
            )}

            {wilaya && !wilaya.isServed && (
              <p className="mt-4 border-l-2 border-ink pl-4 text-[0.8125rem] leading-relaxed text-ink">
                Notre transporteur ne dessert pas encore {wilaya.name}. Appelez-nous : nous
                cherchons une solution au cas par cas.
              </p>
            )}
          </fieldset>
        </Step>

        {/* ── 3. Paiement ───────────────────────────────────────────────── */}
        <Step number="03" title="Paiement" last>
          <div className="flex items-start gap-4 border border-ink p-5">
            <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
            <div>
              <p className="text-[0.9375rem] text-ink">Paiement à la livraison</p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-graphite">
                Vous réglez en espèces au livreur, au moment où le colis vous est remis. Aucune
                carte bancaire, aucun versement à l'avance.
              </p>
            </div>
          </div>

          <Textarea
            id="field-notes"
            label="Note pour la préparation"
            rows={3}
            placeholder="Horaire de disponibilité, précision sur la taille, cadeau…"
            className="mt-8"
            value={values.notes ?? ''}
            error={errors.notes}
            onBlur={() => blur('notes')}
            onChange={(event) => update('notes', event.target.value)}
          />
        </Step>
      </div>

      {/* ── Récapitulatif ────────────────────────────────────────────────── */}
      <aside aria-label="Récapitulatif de la commande" className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line">
          <div className="border-b border-line px-6 py-5">
            <h2 className="eyebrow text-ink">
              Votre commande · {cart.count} article{cart.count > 1 ? 's' : ''}
            </h2>
          </div>

          <ul className="max-h-72 overflow-y-auto px-6">
            {cart.lines.map((line) => {
              const atMax = line.quantity >= line.stock;

              return (
                <li key={line.key} className="flex gap-4 border-b border-line py-4 last:border-b-0">
                  <div className="relative aspect-4/5 w-14 shrink-0 overflow-hidden bg-mist">
                    <ProductVisual
                      name={line.name}
                      slug={line.slug}
                      images={line.imageUrl ? [line.imageUrl] : null}
                      categorySlug={line.categorySlug}
                      sizes="56px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] leading-snug text-ink">{line.name}</p>
                    <p className="mt-1 text-[0.75rem] text-ash">
                      T. {line.size} · {line.color}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                          aria-label={line.quantity === 1 ? "Retirer l'article" : 'Diminuer la quantité'}
                          className="flex h-7 w-7 items-center justify-center text-ink transition-opacity hover:opacity-50"
                        >
                          <MinusIcon className="h-2.5 w-2.5" />
                        </button>
                        <span aria-live="polite" className="w-6 text-center text-[0.75rem] text-ink">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                          disabled={atMax}
                          aria-label="Augmenter la quantité"
                          className="flex h-7 w-7 items-center justify-center text-ink transition-opacity hover:opacity-50 disabled:opacity-25"
                        >
                          <PlusIcon className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      <span className="shrink-0 text-[0.8125rem] text-ink">
                        {formatPrice(line.unitPrice * line.quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => cart.remove(line.key)}
                      className="mt-1.5 text-[0.625rem] uppercase tracking-[0.14em] text-ash transition-colors hover:text-ink"
                    >
                      Retirer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <dl className="space-y-3 border-t border-line px-6 py-5 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-graphite">Sous-total</dt>
              <dd className="text-ink">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite">Livraison</dt>
              <dd className={cn('text-ink', !wilaya && 'text-ash')}>
                {wilaya?.isServed ? formatPrice(quote.fee) : '—'}
              </dd>
            </div>
          </dl>

          <div className="flex items-baseline justify-between border-t border-line px-6 py-5">
            <span className="eyebrow text-ink">Total à payer</span>
            {/* Tant qu'aucune wilaya desservie n'est choisie, les frais sont
                inconnus : on n'annonce donc pas un total qui augmentera ensuite.
                Le tiret reste aligné sur la ligne « Livraison » juste au-dessus. */}
            <span className="text-[1.375rem] font-light text-ink">
              {wilaya?.isServed ? formatPrice(total) : '—'}
            </span>
          </div>

          <div className="border-t border-line px-6 py-5">
            {errors.global && (
              <p role="alert" className="mb-4 border-l-2 border-ink pl-4 text-[0.8125rem] leading-relaxed text-ink">
                {errors.global}
              </p>
            )}

            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting ? 'Envoi en cours…' : 'Confirmer la commande'}
            </Button>

            <p className="mt-4 text-[0.6875rem] leading-relaxed text-ash">
              En confirmant, vous acceptez nos{' '}
              <Link href="/cgv" className="link-underline text-graphite">
                conditions générales de vente
              </Link>
              . Aucun paiement n'est prélevé maintenant.
            </p>

            <ul className="mt-5 space-y-3 border-t border-line pt-5">
              <li className="flex gap-3">
                <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                <span className="text-[0.75rem] leading-relaxed text-graphite">
                  Nous vous appelons pour confirmer avant expédition.
                </span>
              </li>
              <li className="flex gap-3">
                <TruckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink" />
                <span className="text-[0.75rem] leading-relaxed text-graphite">
                  Livraison dans {servedCount} wilayas.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Step({
  number,
  title,
  children,
  last = false,
}: {
  number: string;
  title: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <section className={cn('pb-10', !last && 'mb-10 border-b border-line')}>
      <div className="mb-8 flex items-baseline gap-4">
        <span className="text-[0.6875rem] font-medium tracking-[0.16em] text-ash">{number}</span>
        <h2 className="text-[1.25rem] font-light tracking-[-0.02em] text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DeliveryOption({
  selected,
  onSelect,
  title,
  description,
  price,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  price: number | null;
}) {
  return (
    <button
      type="button"
      role="radio"
      onClick={onSelect}
      aria-checked={selected}
      className={cn(
        'flex flex-col items-start border p-5 text-left transition-colors duration-300',
        selected ? 'border-ink' : 'border-line hover:border-graphite',
      )}
    >
      <span className="flex w-full items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
              selected ? 'border-ink' : 'border-line',
            )}
          >
            {selected && <span className="h-2 w-2 rounded-full bg-ink" />}
          </span>
          <span className="text-[0.9375rem] text-ink">{title}</span>
        </span>
        <span className="shrink-0 text-[0.875rem] text-ink">
          {price === null ? '—' : formatPrice(price)}
        </span>
      </span>
      <span className="mt-2.5 pl-7 text-[0.75rem] leading-relaxed text-graphite">{description}</span>
    </button>
  );
}
