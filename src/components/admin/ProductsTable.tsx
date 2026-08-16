'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { ActionRow, ConfirmDialog, QuickAction } from '@/components/admin/QuickAction';
import { BulkBar, BulkButton, SelectBox, useBulkSelection } from '@/components/admin/BulkSelection';
import { bulkRemoveProducts } from '@/app/(admin)/admin/_actions/suppression';
import { EmptyRow, TableWrap, Td, Th } from '@/components/admin/ui';
import { ProductVisual } from '@/components/ProductVisual';
import {
  CheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from '@/components/icons';
import {
  duplicateProduct,
  quickEditProduct,
  removeProduct,
  toggleProductActive,
  toggleProductFlag,
} from '@/app/(admin)/admin/_actions/catalogue';
import { formatNumber, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

/** En dessous de ce total, le stock est signalé comme faible. */
const LOW_STOCK = 3;

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  sku: string;
  images: string[];
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryName: string;
  categorySlug: string;
}

/**
 * Tableau du catalogue.
 *
 * Chaque ligne porte les gestes du quotidien : ajuster un prix, encaisser un
 * réassort, masquer une pièce épuisée, dupliquer un modèle pour le décliner dans
 * un autre coloris. Ouvrir la fiche complète reste possible, mais n'est plus
 * nécessaire pour ces opérations.
 */
export function ProductsTable({ products, hasFilter }: { products: ProductRow[]; hasFilter: boolean }) {
  const selection = useBulkSelection(products.map((p) => p.id));
  const [asking, setAsking] = useState(false);
  const [askingPromo, setAskingPromo] = useState(false);
  const [promoPct, setPromoPct] = useState('');
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const runDelete = () => {
    setAsking(false);
    startTransition(async () => {
      const result = await bulkRemoveProducts(selection.ids);
      setNotice(result.message);
      selection.clear();
    });
  };

  const runPromo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pct = parseInt(promoPct, 10);
    if (isNaN(pct) || pct < 0 || pct > 99) return;
    
    setAskingPromo(false);
    startTransition(async () => {
      const { applyBulkPromotion } = await import('@/app/(admin)/admin/_actions/promotions');
      const result = await applyBulkPromotion({ type: 'products', ids: selection.ids }, pct);
      if (result.success) setNotice(result.success);
      if (result.error) setNotice(result.error);
      selection.clear();
      setPromoPct('');
    });
  };
  return (
    <>
      {notice && (
        <p role="status" className="mb-4 border-l-2 border-ink pl-4 text-[0.875rem] text-ink">
          {notice}
        </p>
      )}

      <TableWrap>
      <thead>
        <tr>
          <Th className="w-10">
            <SelectBox
              checked={selection.allSelected}
              onChange={selection.toggleAll}
              label="Sélectionner tous les produits"
              disabled={products.length === 0}
            />
          </Th>
          <Th>Produit</Th>
          <Th>Catégorie</Th>
          <Th className="text-right">Prix</Th>
          <Th className="text-right">Stock</Th>
          <Th>Statut</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </thead>

      <tbody>
        {products.length === 0 ? (
          <EmptyRow
            colSpan={7}
            message={
              hasFilter
                ? 'Aucun produit ne correspond à ce filtre.'
                : 'Aucun produit au catalogue. Commencez par en créer un.'
            }
          />
        ) : (
          products.map((product) => (
            <ProductLine
              key={product.id}
              product={product}
              selected={selection.has(product.id)}
              onToggle={() => selection.toggle(product.id)}
              dimmed={pending && selection.has(product.id)}
              setNotice={setNotice}
            />
          ))
        )}
      </tbody>
      </TableWrap>

      <BulkBar
        count={selection.count}
        singular="produit"
        plural="produits"
        onClear={selection.clear}
      >
        <BulkButton variant="ghost" disabled={pending} onClick={() => setAskingPromo(true)}>
          {pending ? 'Application…' : 'Promouvoir'}
        </BulkButton>
        <BulkButton variant="solid" disabled={pending} onClick={() => setAsking(true)}>
          {pending ? 'Suppression…' : 'Supprimer'}
        </BulkButton>
      </BulkBar>

      {asking && (
        <ConfirmDialog
          title={`Supprimer ${selection.count} produit${selection.count > 1 ? 's' : ''} ?`}
          body="Cette action est irréversible. Les produits seront définitivement supprimés de la boutique."
          actionLabel="Tout supprimer"
          onConfirm={runDelete}
          onCancel={() => setAsking(false)}
        />
      )}

      {askingPromo && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={() => setAskingPromo(false)} />
          <form
            onSubmit={runPromo}
            className="relative w-full max-w-md animate-slide-up bg-paper p-7 shadow-[0_20px_70px_rgba(0,0,0,0.2)]"
          >
            <h2 className="text-[1.125rem] font-light tracking-[-0.02em] text-ink">
              Appliquer une remise
            </h2>
            <p className="mt-3 mb-4 text-[0.875rem] leading-relaxed text-graphite">
              Saisissez le pourcentage de réduction à appliquer aux {selection.count} produit{selection.count > 1 ? 's' : ''} sélectionné{selection.count > 1 ? 's' : ''}. Saisissez 0 pour retirer une promotion existante.
            </p>
            <input
              type="number"
              min="0"
              max="99"
              autoFocus
              required
              value={promoPct}
              onChange={(e) => setPromoPct(e.target.value)}
              placeholder="Ex: 20"
              className="h-11 w-full border border-line bg-paper px-3 text-[0.875rem] text-ink outline-none focus:border-ink mb-6"
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setAskingPromo(false)}
                className="h-11 border border-line px-6 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink sm:h-10"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="h-11 border border-ink bg-ink px-6 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ink-soft sm:h-10"
              >
                Appliquer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
function ProductLine({
  product,
  selected,
  onToggle,
  dimmed,
  setNotice,
}: {
  product: ProductRow;
  selected: boolean;
  onToggle: () => void;
  dimmed: boolean;
  setNotice: (msg: string) => void;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [price, setPrice] = useState(String(product.price));
  const [pending, startTransition] = useTransition();

  const savePrice = () => {
    const value = Number(price);
    setEditingPrice(false);

    if (!Number.isFinite(value) || value <= 0 || value === product.price) {
      setPrice(String(product.price));
      return;
    }

    startTransition(async () => {
      await quickEditProduct(product.id, { price: value });
    });
  };

  const adjustStock = (delta: number) =>
    startTransition(async () => {
      await quickEditProduct(product.id, { stockDelta: delta });
    });

  return (
    <tr className={cn((pending || dimmed) && 'opacity-50', selected && 'bg-ink/5')}>
      <Td>
        <SelectBox
          checked={selected}
          onChange={onToggle}
          label={`Sélectionner ${product.name}`}
        />
      </Td>

      <Td>
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-11 shrink-0 overflow-hidden bg-mist">
            <ProductVisual
              name={product.name}
              slug={product.slug}
              images={product.images}
              categorySlug={product.categorySlug}
              sizes="44px"
            />
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/produits/${product.id}`}
              className="link-underline block truncate text-ink"
            >
              {product.name}
            </Link>
            <p className="mt-1 font-mono text-[0.6875rem] text-ash">{product.sku}</p>
          </div>
        </div>
      </Td>

      <Td className="whitespace-nowrap text-graphite">{product.categoryName}</Td>

      {/* ── Prix modifiable sur place ─────────────────────────────────────── */}
      <Td className="text-right">
        {editingPrice ? (
          <input
            type="number"
            min={1}
            step={100}
            autoFocus
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            onBlur={savePrice}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') {
                setPrice(String(product.price));
                setEditingPrice(false);
              }
            }}
            aria-label={`Prix de ${product.name} en dinars`}
            className="w-28 border border-ink bg-paper px-2 py-1.5 text-right text-[1rem] sm:text-[0.875rem] tabular-nums text-ink outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingPrice(true)}
            title="Modifier le prix"
            aria-label={`Modifier le prix de ${product.name}, actuellement ${formatPrice(product.price)}`}
            className="group inline-flex flex-col items-end"
          >
            <span className="whitespace-nowrap tabular-nums text-ink group-hover:underline">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice !== null && product.comparePrice > product.price && (
              <span className="mt-0.5 whitespace-nowrap text-[0.75rem] tabular-nums text-ash line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </button>
        )}
      </Td>

      {/* ── Stock ajustable ───────────────────────────────────────────────── */}
      <Td>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => adjustStock(-1)}
            disabled={product.stock === 0 || pending}
            title="Retirer une pièce de chaque déclinaison"
            aria-label={`Retirer une pièce de chaque déclinaison de ${product.name}`}
            className="inline-flex h-7 w-7 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
          >
            <MinusIcon className="h-3 w-3" />
          </button>

          <span className="min-w-10 text-center tabular-nums">
            {product.stock === 0 ? (
              <span className="text-[0.8125rem] text-graphite">Épuisé</span>
            ) : (
              <>
                <span className="text-ink">{formatNumber(product.stock)}</span>
                {product.stock <= LOW_STOCK && (
                  <span className="mt-0.5 block text-[0.6875rem] text-graphite">Faible</span>
                )}
              </>
            )}
          </span>

          <button
            type="button"
            onClick={() => adjustStock(1)}
            disabled={pending}
            title="Ajouter une pièce à chaque déclinaison"
            aria-label={`Ajouter une pièce à chaque déclinaison de ${product.name}`}
            className="inline-flex h-7 w-7 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
          >
            <PlusIcon className="h-3 w-3" />
          </button>
        </div>
      </Td>

      <Td>
        <span
          className={cn(
            'inline-flex whitespace-nowrap border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.12em]',
            product.isActive ? 'border-ink text-ink' : 'border-line text-graphite',
          )}
        >
          {product.isActive ? 'Visible' : 'Masqué'}
        </span>
        {product.isFeatured && (
          <span className="mt-1.5 block text-[0.6875rem] text-graphite">En vedette</span>
        )}
      </Td>

      <Td className="pr-3">
        <ActionRow>
          <QuickAction
            label={product.isFeatured ? 'Retirer de la vedette' : 'Mettre en vedette sur l’accueil'}
            icon={StarIcon}
            emphasis={product.isFeatured}
            onAction={() => toggleProductFlag(product.id, 'isFeatured', !product.isFeatured)}
          />

          <QuickAction
            label={product.isActive ? 'Masquer de la boutique' : 'Afficher dans la boutique'}
            icon={product.isActive ? EyeIcon : EyeOffIcon}
            onAction={() => toggleProductActive(product.id, !product.isActive)}
          />

          <QuickAction
            label={`Dupliquer ${product.name}`}
            icon={CopyIcon}
            onAction={() => duplicateProduct(product.id)}
            confirm={{
              title: 'Dupliquer ce produit ?',
              body: 'Une copie masquée est créée avec les mêmes déclinaisons et le même stock. Vous pourrez ensuite en changer le coloris et le nom.',
              action: 'Dupliquer',
            }}
          />

          <Link
            href={`/admin/produits/${product.id}`}
            title="Modifier la fiche"
            aria-label={`Modifier la fiche de ${product.name}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink sm:h-9 sm:w-9"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>

          <QuickAction
            label={`Supprimer ${product.name}`}
            icon={TrashIcon}
            onAction={async () => {
              const res = await removeProduct(product.id);
              if (res?.message) setNotice(res.message);
            }}
            confirm={{
              title: `Supprimer ${product.name} ?`,
              body: 'Cette action est irréversible. Le produit sera définitivement supprimé de la boutique.',
              action: 'Supprimer',
            }}
          />
        </ActionRow>
      </Td>
    </tr>
  );
}

/** Confirmation visuelle brève après une action réussie. */
export function SavedHint({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-[0.75rem] text-graphite">
      <CheckIcon className="h-3 w-3" />
      Enregistré
    </span>
  );
}
