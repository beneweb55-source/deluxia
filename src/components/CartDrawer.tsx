'use client';

import Link from 'next/link';
import { ProductVisual } from '@/components/ProductVisual';
import { Drawer } from '@/components/ui/Drawer';
import { ButtonLink } from '@/components/ui/Button';
import { MinusIcon, PlusIcon } from '@/components/icons';
import { useCart, type CartLine } from '@/components/providers/CartProvider';
import { formatPrice } from '@/lib/format';
import { MIN_HOME_FEE } from '@/data/wilayas';

/**
 * Mini-panier latéral — s'ouvre à chaque ajout, sans rechargement de page.
 * Le montant de la livraison n'est volontairement pas estimé ici : il dépend de
 * la wilaya, et afficher un montant approximatif puis le corriger au checkout
 * est la première cause d'abandon de panier.
 */
export function CartDrawer() {
  const cart = useCart();

  return (
    <Drawer
      open={cart.isOpen}
      onClose={cart.close}
      title={cart.count > 0 ? `Panier — ${cart.count} article${cart.count > 1 ? 's' : ''}` : 'Panier'}
      footer={
        cart.lines.length > 0 ? (
          <div>
            <div className="flex items-baseline justify-between">
              <span className="eyebrow text-ink">Sous-total</span>
              <span className="text-[1.125rem] text-ink">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="mt-2 text-[0.75rem] leading-relaxed text-ash">
              Livraison à partir de {formatPrice(MIN_HOME_FEE)}, calculée selon votre wilaya à
              l'étape suivante. Paiement à la réception.
            </p>

            <ButtonLink href="/commande" fullWidth size="lg" className="mt-5" onClick={cart.close}>
              Commander
            </ButtonLink>
            <ButtonLink
              href="/panier"
              variant="quiet"
              fullWidth
              size="sm"
              className="mt-1"
              onClick={cart.close}
            >
              Voir le panier
            </ButtonLink>
          </div>
        ) : undefined
      }
    >
      {cart.lines.length === 0 ? (
        <EmptyCart onClose={cart.close} />
      ) : (
        <ul className="divide-y divide-line px-6">
          {cart.lines.map((line) => (
            <CartRow key={line.key} line={line} />
          ))}
        </ul>
      )}
    </Drawer>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const cart = useCart();
  const atMax = line.quantity >= line.stock;

  return (
    <li className="flex gap-4 py-5">
      <Link
        href={`/produit/${line.slug}`}
        onClick={cart.close}
        className="relative aspect-4/5 w-20 shrink-0 overflow-hidden bg-mist"
      >
        <ProductVisual
          name={line.name}
          slug={line.slug}
          images={line.imageUrl ? [line.imageUrl] : null}
          categorySlug={line.categorySlug}
          sizes="80px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/produit/${line.slug}`}
            onClick={cart.close}
            className="text-[0.875rem] leading-snug text-ink transition-opacity hover:opacity-60"
          >
            {line.name}
          </Link>
          <span className="shrink-0 text-[0.875rem] text-ink">
            {formatPrice(line.unitPrice * line.quantity)}
          </span>
        </div>

        <p className="mt-1 text-[0.75rem] text-ash">
          Taille {line.size} · {line.color}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
              aria-label={line.quantity === 1 ? 'Retirer l\'article' : 'Diminuer la quantité'}
              className="flex h-8 w-8 items-center justify-center text-ink transition-opacity hover:opacity-50"
            >
              <MinusIcon className="h-3 w-3" />
            </button>
            <span aria-live="polite" className="w-8 text-center text-[0.8125rem] text-ink">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
              disabled={atMax}
              aria-label="Augmenter la quantité"
              className="flex h-8 w-8 items-center justify-center text-ink transition-opacity hover:opacity-50 disabled:opacity-25"
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
          <p className="mt-2 text-[0.6875rem] text-graphite">
            Stock maximal atteint pour cette taille.
          </p>
        )}
      </div>
    </li>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <div className="h-px w-12 bg-line" />
      <p className="mt-6 text-[1.125rem] font-light text-ink">Votre panier est vide</p>
      <p className="mt-2 max-w-[16rem] text-[0.8125rem] leading-relaxed text-graphite">
        Chaussures et sacs sélectionnés pièce par pièce.
      </p>
      <ButtonLink href="/boutique" variant="outline" className="mt-7" onClick={onClose}>
        Découvrir la collection
      </ButtonLink>
    </div>
  );
}
