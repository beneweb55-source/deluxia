'use client';

import { useActionState, useId, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ActionState,
} from '@/app/(admin)/admin/_actions/catalogue';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { CloseIcon, PlusIcon } from '@/components/icons';
import { formatNumber } from '@/lib/format';

/* Éditeur de produit — création et modification partagent le même formulaire :
   les champs sont identiques, seule l'action liée change. */

interface VariantInput {
  size: string;
  color: string;
  colorHex: string;
  stock: number;
}

/* Une clé interne suit chaque ligne de déclinaison. Sans elle, React réutilise
   les champs par position et le curseur saute d'une ligne à l'autre après une
   suppression. Elle n'est jamais envoyée au serveur. */
type VariantRow = VariantInput & { key: string };

interface ProductFormProps {
  categories: Array<{ id: string; name: string; collection: { name: string } | null }>;
  product?: {
    id: string;
    name: string;
    slug: string;
    subtitle: string | null;
    description: string;
    composition: string | null;
    care: string | null;
    sku: string;
    price: number;
    comparePrice: number | null;
    categoryId: string;
    images: string[];
    isActive: boolean;
    isFeatured: boolean;
    isNew: boolean;
    position: number;
    variants: VariantInput[];
  };
}

const BLANK_VARIANT: VariantInput = { size: '', color: 'Noir', colorHex: '#0A0A0A', stock: 0 };

/** Le socle de pointures d'une paire de femme : le geste le plus courant. */
const POINTURES = ['36', '37', '38', '39', '40', '41'];

export function ProductForm({ categories, product }: ProductFormProps) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  const [variants, setVariants] = useState<VariantRow[]>(() =>
    (product?.variants ?? [BLANK_VARIANT]).map((variant, index) => ({
      ...variant,
      key: `v${index}`,
    })),
  );

  const nextKey = useRef(variants.length);

  function makeKey() {
    nextKey.current += 1;
    return `v${nextKey.current}`;
  }

  /* La dernière ligne sert de modèle : on enchaîne presque toujours les tailles
     d'un même coloris avant de passer au suivant. */
  const lastRow = variants[variants.length - 1];
  const currentColor = lastRow?.color ?? BLANK_VARIANT.color;
  const currentHex = lastRow?.colorHex ?? BLANK_VARIANT.colorHex;

  function updateVariant(key: string, patch: Partial<VariantInput>) {
    setVariants((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeVariant(key: string) {
    setVariants((rows) => rows.filter((row) => row.key !== key));
  }

  function addVariant() {
    setVariants((rows) => [
      ...rows,
      { size: '', color: currentColor, colorHex: currentHex, stock: 0, key: makeKey() },
    ]);
  }

  function addSizeRun() {
    setVariants((rows) => {
      // Les lignes encore vides sont écartées : elles n'ont pas de valeur et
      // feraient échouer la validation du serveur.
      const kept = rows.filter((row) => row.size.trim() !== '');
      const already = new Set(
        kept
          .filter((row) => row.color.trim().toLowerCase() === currentColor.trim().toLowerCase())
          .map((row) => row.size.trim()),
      );

      const added = POINTURES.filter((size) => !already.has(size)).map((size) => ({
        size,
        color: currentColor,
        colorHex: currentHex,
        stock: 0,
        key: makeKey(),
      }));

      return [...kept, ...added];
    });
  }

  const totalStock = variants.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);

  const payload = variants.map((row) => ({
    size: row.size,
    color: row.color,
    colorHex: row.colorHex,
    stock: row.stock,
  }));

  return (
    <>
      <form action={formAction} className="flex flex-col gap-10">
        <Section title="Informations">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Input
              label="Nom du produit"
              name="name"
              required
              maxLength={120}
              defaultValue={product?.name}
              placeholder="Escarpin Vérone"
              className="sm:col-span-2"
            />

            <Input
              label="Adresse URL (slug)"
              name="slug"
              maxLength={90}
              defaultValue={product?.slug}
              hint="Laissez vide pour la déduire du nom."
              placeholder="escarpin-verone"
            />

            <Input
              label="Référence (SKU)"
              name="sku"
              required
              maxLength={40}
              defaultValue={product?.sku}
              placeholder="DLX-CH-0001"
            />

            <Input
              label="Accroche"
              name="subtitle"
              maxLength={160}
              defaultValue={product?.subtitle ?? ''}
              hint="Une ligne affichée sous le nom sur la fiche produit."
              placeholder="Cuir de veau, talon 85 mm"
              className="sm:col-span-2"
            />

            <Select
              label="Catégorie"
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ''}
            >
              <option value="" disabled>
                Choisissez une catégorie
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} — {category.collection?.name ?? 'Sans collection'}
                </option>
              ))}
            </Select>

            <Input
              label="Position d'affichage"
              name="position"
              type="number"
              min={0}
              max={9999}
              step={1}
              defaultValue={product?.position ?? 0}
              hint="Les petits nombres apparaissent en premier."
            />

            <Textarea
              label="Description"
              name="description"
              required
              rows={6}
              maxLength={4000}
              defaultValue={product?.description}
              hint="Dix caractères au minimum. Décrivez la matière, la ligne, l'usage."
              className="sm:col-span-2"
            />

            <Textarea
              label="Composition"
              name="composition"
              rows={4}
              maxLength={2000}
              defaultValue={product?.composition ?? ''}
              placeholder="Dessus cuir de veau, doublure cuir, semelle cuir"
            />

            <Textarea
              label="Entretien"
              name="care"
              rows={4}
              maxLength={2000}
              defaultValue={product?.care ?? ''}
              placeholder="Nettoyer avec un chiffon doux, conserver dans sa housse"
            />
          </div>
        </Section>

        <Section title="Prix" description="Les montants sont en dinars algériens, sans décimale.">
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            <Input
              label="Prix de vente"
              name="price"
              type="number"
              required
              min={1}
              step={1}
              defaultValue={product?.price}
              placeholder="24900"
            />

            <Input
              label="Prix barré"
              name="comparePrice"
              type="number"
              min={0}
              step={1}
              defaultValue={product?.comparePrice ?? ''}
              hint="Laissez vide hors promotion. Doit dépasser le prix de vente."
              placeholder="32000"
            />
          </div>
        </Section>

        <Section
          title="Visuels"
          description="Les photos sont compressées automatiquement avant l'envoi : inutile de les préparer, prenez-les directement au téléphone."
        >
          <ImageUploader initial={product?.images ?? []} productName={product?.name ?? 'Nouveau produit'} />
        </Section>

        <Section
          title="Déclinaisons"
          description="Une ligne par couple taille et couleur. Le stock se décompte à la commande."
        >
          <input type="hidden" name="variants" value={JSON.stringify(payload)} />

          <div className="flex flex-col gap-3">
            <div className="hidden gap-3 sm:grid sm:grid-cols-[5rem_1fr_3rem_6rem_2.5rem]">
              <p className="eyebrow text-ash">Taille</p>
              <p className="eyebrow text-ash">Couleur</p>
              <p className="eyebrow text-ash">Teinte</p>
              <p className="eyebrow text-ash">Stock</p>
              <span className="sr-only">Action</span>
            </div>

            {variants.map((row) => {
              const repere = row.size.trim() || 'sans taille';

              return (
                <div
                  key={row.key}
                  className="grid grid-cols-2 gap-3 border-b border-line pb-3 sm:grid-cols-[5rem_1fr_3rem_6rem_2.5rem] sm:items-center sm:border-0 sm:pb-0"
                >
                  <RowField label="Taille">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      value={row.size}
                      onChange={(event) => updateVariant(row.key, { size: event.target.value })}
                      aria-label="Taille"
                      placeholder="38"
                      className={ROW_CONTROL}
                    />
                  </RowField>

                  <RowField label="Couleur">
                    <input
                      type="text"
                      maxLength={40}
                      value={row.color}
                      onChange={(event) => updateVariant(row.key, { color: event.target.value })}
                      aria-label="Nom de la couleur"
                      placeholder="Noir"
                      className={ROW_CONTROL}
                    />
                  </RowField>

                  <RowField label="Teinte">
                    <input
                      type="color"
                      value={row.colorHex}
                      onChange={(event) => updateVariant(row.key, { colorHex: event.target.value })}
                      aria-label={`Teinte affichée pour la taille ${repere}`}
                      className="h-10 w-full cursor-pointer border border-line bg-transparent p-1"
                    />
                  </RowField>

                  <RowField label="Stock">
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      step={1}
                      value={row.stock}
                      onChange={(event) =>
                        updateVariant(row.key, { stock: Number(event.target.value) || 0 })
                      }
                      aria-label="Stock disponible"
                      className={ROW_CONTROL}
                    />
                  </RowField>

                  <button
                    type="button"
                    onClick={() => removeVariant(row.key)}
                    disabled={variants.length === 1}
                    aria-label={`Retirer la déclinaison ${repere} ${row.color}`}
                    className="inline-flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors duration-300 hover:border-ink disabled:opacity-30"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={addVariant}>
              <PlusIcon className="h-3 w-3" />
              Ajouter une taille
            </Button>

            <Button type="button" variant="outline" size="sm" onClick={addSizeRun}>
              Ajouter les pointures 36 à 41
            </Button>

            <p className="text-[0.75rem] text-graphite">
              {formatNumber(variants.length)}{' '}
              {variants.length > 1 ? 'déclinaisons' : 'déclinaison'} — {formatNumber(totalStock)}{' '}
              {totalStock > 1 ? 'pièces en stock' : 'pièce en stock'}
            </p>
          </div>
        </Section>

        <Section title="Visibilité">
          <div className="flex flex-col gap-4">
            <Check
              name="isActive"
              label="Visible sur la boutique"
              defaultChecked={product?.isActive ?? true}
            />
            <Check
              name="isFeatured"
              label="Mettre en avant sur l'accueil"
              defaultChecked={product?.isFeatured ?? false}
            />
            <Check
              name="isNew"
              label="Signaler comme nouveauté"
              defaultChecked={product?.isNew ?? false}
            />
          </div>
        </Section>

        {state.error && (
          <p role="alert" className="border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
            {state.error}
          </p>
        )}

        {state.success && (
          <p className="border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">{state.success}</p>
        )}

        <div className="flex justify-end border-t border-line pt-8">
          <SubmitButton />
        </div>
      </form>

      {product && (
        <div className="mt-10 border-t border-line pt-8">
          <h2 className="eyebrow text-ink">Suppression</h2>
          <p className="mt-3 max-w-2xl text-[0.8125rem] leading-relaxed text-graphite">
            Un produit déjà commandé n'est pas effacé : il est retiré de la boutique et conservé,
            afin que les commandes passées restent lisibles. Un produit jamais commandé est supprimé
            définitivement.
          </p>

          <form action={deleteProduct.bind(null, product.id)} className="mt-5">
            <Button type="submit" variant="ghost" size="sm">
              Supprimer ce produit
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

/* Les lignes de déclinaisons sont trop denses pour les champs de la boutique :
   même filet souligné, mais sans libellé ni zone de message. */
const ROW_CONTROL =
  'w-full border-0 border-b border-line bg-transparent pb-2 pt-1 text-[0.875rem] text-ink ' +
  'placeholder:text-ash/70 outline-none transition-colors duration-300 focus:border-ink';

function RowField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.8125rem] text-ash sm:hidden">{label}</label>
      {children}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="eyebrow text-ink">{title}</h2>
      {description && <p className="mt-2 text-[0.8125rem] text-graphite">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  const id = useId();

  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 cursor-pointer accent-[var(--color-ink)]"
      />
      <label htmlFor={id} className="cursor-pointer text-[0.875rem] text-ink">
        {label}
      </label>
    </div>
  );
}

/** Séparé pour que `useFormStatus` observe bien le formulaire parent. */
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? 'Enregistrement…' : 'Enregistrer le produit'}
    </Button>
  );
}

