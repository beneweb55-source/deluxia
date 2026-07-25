'use client';

import Link from 'next/link';
import { ProductVisual } from '@/components/ProductVisual';
import { ButtonLink } from '@/components/ui/Button';
import { MinusIcon, PlusIcon, ShieldIcon, TruckIcon } from '@/components/icons';
import { useCart } from '@/components/providers/CartProvider';
import { formatPrice } from '@/lib/format';
import { MIN_HOME_FEE, SERVED_COUNT } from '@/data/wilayas';

/**
 * Page panier — vue détaillée, complémentaire du tiroir latéral.
 *
 * La livraison est annoncée « calculée à l'étape suivante » plutôt qu'estimée :
 * un montant provisoire qui augmente au checkout est la façon la plus sûre de
 * perdre une commande déjà acquise.
 */
export function CartView() {
  const cart = useCart();

  // Pendant la relecture du stockage local, on réserve la hauteur plutôt que
  // d'afficher brièvement « panier vide » à un visiteur qui a des articles.
  if (!cart.ready) {
    return <div className="shell min-h-[40vh] pb-(--spacing-section)" aria-hidden="true" />;
  }

  if (cart.lines.length === 0) {
    return (
      <div className="shell pb-(--spacing-section)">
        <div className="flex flex-col items-center border border-line px-8 py-24 text-center">
          <span className="h-px w-12 bg-line" />
          <p className="mt-7 text-[1.375rem] font-light text-ink">Votre panier est vide</p>
          <p className="mt-3 max-w-md text-[0.875rem] leading-relaxed text-graphite">
            Parcourez la collection : chaussures et sacs choisis pièce par pièce, livrés dans{' '}
            {SERVED_COUNT} wilayas et réglés à la réception.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/boutique">Découvrir la collection</ButtonLink>
            <ButtonLink href="/nouveautes" variant="outline">
              Voir les nouveautés
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell grid gap-12 pb-(--spacing-section) lg:grid-cols-[1fr_22rem] lg:gap-16">
      {/* ── Articles ─────────────────────────────────────────────────────── */}
      <section aria-label="Articles du panier">
        <ul className="border-t border-line">
          {cart.lines.map((line) => {
            const atMax = line.quantity >= line.stock;

            return (
              <li key={line.key} className="flex gap-5 border-b border-line py-7 sm:gap-7">
                <Link
                  href={`/produit/${line.slug}`}
                  className="relative aspect-4/5 w-24 shrink-0 overflow-hidden bg-mist sm:w-32"
                >
                  <ProductVisual
                    name={line.name}
                    slug={line.slug}
                    images={line.imageUrl ? [line.imageUrl] : null}
                    categorySlug={line.categorySlug}
                    sizes="128px"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1">
                    <Link
                      href={`/produit/${line.slug}`}
                      className="text-[1rem] leading-snug text-ink transition-opacity hover:opacity-60"
                    >
                      {line.name}
                    </Link>
                    <span className="text-[1rem] text-ink">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[0.8125rem] text-ash">
                    Taille {line.size} · {line.color}
                    {line.quantity > 1 && ` · ${formatPrice(line.unitPrice)} l'unité`}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-5">
                    <div className="flex items-center border border-line">
                      <button
                        type="button"
                        onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                        aria-label={line.quantity === 1 ? "Retirer l'article" : 'Diminuer la quantité'}
                        className="flex h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-50"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <span aria-live="polite" className="w-10 text-center text-[0.875rem] text-ink">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                        disabled={atMax}
                        aria-label="Augmenter la quantité"
                        className="flex h-10 w-10 items-center justify-center text-ink transition-opacity hover:opacity-50 disabled:opacity-25"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => cart.remove(line.key)}
                      className="link-underline text-[0.6875rem] uppercase tracking-[0.14em] text-ash hover:text-ink"
                    >
                      Retirer
                    </button>
                  </div>

                  {atMax && (
                    <p className="mt-3 text-[0.75rem] text-graphite">
                      Il ne reste que {line.stock} pièce{line.stock > 1 ? 's' : ''} dans cette taille.
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-7">
          <ButtonLink href="/boutique" variant="quiet" size="sm" className="-ml-1">
            ← Continuer mes achats
          </ButtonLink>
          <button
            type="button"
            onClick={cart.clear}
            className="link-underline text-[0.6875rem] uppercase tracking-[0.14em] text-ash hover:text-ink"
          >
            Vider le panier
          </button>
        </div>
      </section>

      {/* ── Récapitulatif ────────────────────────────────────────────────── */}
      <aside aria-label="Récapitulatif" className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-line p-7">
          <h2 className="eyebrow text-ink">Récapitulatif</h2>

          <dl className="mt-7 space-y-4 text-[0.875rem]">
            <div className="flex justify-between">
              <dt className="text-graphite">
                Sous-total ({cart.count} article{cart.count > 1 ? 's' : ''})
              </dt>
              <dd className="text-ink">{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-graphite">Livraison</dt>
              <dd className="text-ash">dès {formatPrice(MIN_HOME_FEE)}</dd>
            </div>
          </dl>

          <p className="mt-5 border-t border-line pt-5 text-[0.75rem] leading-relaxed text-ash">
            Les frais de livraison dépendent de votre wilaya et du mode choisi. Le montant exact
            s'affiche à l'étape suivante, avant toute validation.
          </p>

          <ButtonLink href="/commande" size="lg" fullWidth className="mt-7">
            Passer commande
          </ButtonLink>

          <ul className="mt-7 space-y-3.5 border-t border-line pt-6">
            <li className="flex gap-3">
              <ShieldIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <span className="text-[0.75rem] leading-relaxed text-graphite">
                Paiement à la livraison — aucune carte bancaire.
              </span>
            </li>
            <li className="flex gap-3">
              <TruckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              <span className="text-[0.75rem] leading-relaxed text-graphite">
                Livraison à domicile ou en bureau, dans {SERVED_COUNT} wilayas.
              </span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
