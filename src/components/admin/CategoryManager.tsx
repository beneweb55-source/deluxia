'use client';

import { useActionState, useCallback, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import {
  saveCategory,
  type ActionState,
} from '@/app/(admin)/admin/_actions/catalogue';
import { Card } from '@/components/admin/ui';
import { ConfirmDialog } from '@/components/admin/QuickAction';
import { BulkBar, BulkButton, SelectBox, useBulkSelection } from '@/components/admin/BulkSelection';
import { bulkDeleteCategories } from '@/app/(admin)/admin/_actions/suppression';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { cn } from '@/lib/utils';
import { SingleImageUploader } from '@/components/admin/ImageUploader';

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  imageUrl: string | null;
  collectionId: string | null;
  position: number;
  isActive: boolean;
  productCount: number;
}

/** Valeur d'`editingId` réservée au mode création. */
const NEW = 'nouveau';

export interface CollectionRow {
  id: string;
  name: string;
  slug: string;
}

export function CategoryManager({ categories, collections }: { categories: CategoryRow[], collections: CollectionRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  // La sélection porte sur toutes les catégories, quelle que soit la collection
  // qui les affiche : on peut donc en cocher dans plusieurs blocs à la fois.
  const selection = useBulkSelection(categories.map((c) => c.id));

  const chosen = categories.filter((c) => selection.has(c.id));
  const productTotal = chosen.reduce((sum, c) => sum + c.productCount, 0);

  const runDelete = () => {
    setAsking(false);
    startTransition(async () => {
      const result = await bulkDeleteCategories(selection.ids);
      setNotice(result.message);
      selection.clear();
    });
  };

  // Stable, pour que l'effet du formulaire ne se déclenche que sur un vrai succès.
  const handleSaved = useCallback((message: string) => {
    setNotice(message);
    setEditingId(null);
  }, []);

  const openForm = (id: string) => {
    setNotice(null);
    setEditingId(id);
  };

  const editing =
    editingId && editingId !== NEW ? categories.find((item) => item.id === editingId) : undefined;

  // Une catégorie supprimée dans un autre onglet laisserait `editingId` pointer
  // dans le vide : on n'ouvre le formulaire que si la cible existe encore.
  const formOpen = editingId === NEW || (editingId !== null && editing !== undefined);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {notice ? (
          <p role="status" className="border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
            {notice}
          </p>
        ) : (
          <p className="text-[0.8125rem] text-graphite">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''} au catalogue.
          </p>
        )}

        <Button
          type="button"
          size="sm"
          variant={editingId === NEW ? 'ghost' : 'primary'}
          onClick={() => (editingId === NEW ? setEditingId(null) : openForm(NEW))}
        >
          {editingId === NEW ? 'Annuler' : 'Nouvelle catégorie'}
        </Button>
      </div>

      {editingId !== null && formOpen && (
        <Card title={editing ? `Modifier — ${editing.name}` : 'Nouvelle catégorie'}>
          <CategoryForm
            key={editingId}
            categoryId={editingId === NEW ? null : editingId}
            category={editing}
            collections={collections}
            onSaved={handleSaved}
            onCancel={() => setEditingId(null)}
          />
        </Card>
      )}

      {collections.map((col) => {
        const items = categories.filter((category) => category.collectionId === col.id);

        return (
          <Card key={col.id} title={col.name} padded={false}>
            {items.length === 0 ? (
              <p className="px-5 py-10 text-center text-[0.875rem] text-ash">
                Aucune catégorie dans cet univers pour le moment.
              </p>
            ) : (
              <ul>
                {items.map((category) => (
                  <li
                    key={category.id}
                    className={cn(
                      'flex flex-wrap items-center gap-4 border-b border-line/70 px-5 py-4 last:border-b-0',
                      selection.has(category.id) && 'bg-ink/5',
                      pending && selection.has(category.id) && 'opacity-50',
                    )}
                  >
                    <SelectBox
                      checked={selection.has(category.id)}
                      onChange={() => selection.toggle(category.id)}
                      label={`Sélectionner la catégorie ${category.name}`}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-3 text-[0.9375rem] text-ink">
                        {category.name}
                        <span
                          className={cn(
                            'inline-flex whitespace-nowrap border px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.12em]',
                            category.isActive ? 'border-ink text-ink' : 'border-line text-ash',
                          )}
                        >
                          {category.isActive ? 'Visible' : 'Masquée'}
                        </span>
                      </p>
                      <p className="mt-1 text-[0.75rem] text-ash">
                        /{category.slug} · position {category.position} · {category.productCount}{' '}
                        produit{category.productCount > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openForm(category.id)}
                      >
                        Modifier
                      </Button>

                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}

      <BulkBar
        count={selection.count}
        singular="catégorie"
        plural="catégories"
        onClear={selection.clear}
      >
        <BulkButton variant="solid" disabled={pending} onClick={() => setAsking(true)}>
          {pending ? 'Suppression…' : 'Supprimer'}
        </BulkButton>
      </BulkBar>

      {asking && (
        <ConfirmDialog
          title={`Supprimer ${selection.count} catégorie${selection.count > 1 ? 's' : ''} ?`}
          body={
            productTotal === 0
              ? 'Ces catégories ne contiennent aucun produit. Rien d’autre ne sera supprimé.'
              : `Cette action supprime aussi ${productTotal} produit${productTotal > 1 ? 's' : ''}. Ceux qui figurent déjà dans une commande sont masqués plutôt qu’effacés, afin que l’historique reste lisible. Cette action est irréversible.`
          }
          actionLabel="Tout supprimer"
          onConfirm={runDelete}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  );
}

function CategoryForm({
  categoryId,
  category,
  collections,
  onSaved,
  onCancel,
}: {
  categoryId: string | null;
  category: CategoryRow | undefined;
  collections: CollectionRow[];
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const action = saveCategory.bind(null, categoryId);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  // La confirmation est remontée à la liste, qui referme le formulaire :
  // le gérant voit immédiatement la catégorie à sa place dans l'univers.
  useEffect(() => {
    if (state.success) onSaved(state.success);
  }, [state.success, onSaved]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Input
          label="Nom"
          name="name"
          required
          maxLength={60}
          defaultValue={category?.name ?? ''}
          autoFocus
        />
        <Input
          label="Adresse URL"
          name="slug"
          maxLength={60}
          defaultValue={category?.slug ?? ''}
          hint="Laissez vide pour la déduire du nom."
        />
        <Input
          label="Accroche"
          name="tagline"
          maxLength={120}
          defaultValue={category?.tagline ?? ''}
        />
        <Select label="Collection" name="collectionId" required defaultValue={category?.collectionId ?? collections[0]?.id}>
          {collections.map((col) => (
            <option key={col.id} value={col.id}>
              {col.name}
            </option>
          ))}
        </Select>
      </div>

      <Textarea
        label="Description"
        name="description"
        maxLength={1000}
        rows={3}
        defaultValue={category?.description ?? ''}
      />

      <SingleImageUploader
        initial={category?.imageUrl ?? ''}
        label="Photo de la catégorie"
      />

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Input
          label="Position"
          name="position"
          type="number"
          min={0}
          max={999}
          defaultValue={category?.position ?? 0}
          hint="Ordre d’affichage, du plus petit au plus grand."
        />

        <label className="mb-6 flex cursor-pointer items-center gap-3 self-end text-[0.875rem] text-ink sm:mb-10">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={category?.isActive ?? true}
            className="size-4 accent-ink"
          />
          Visible dans la boutique
        </label>
      </div>

      {state.error && (
        <p role="alert" className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton isNew={categoryId === null} />
        <Button type="button" variant="quiet" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Enregistrement…' : isNew ? 'Créer la catégorie' : 'Enregistrer'}
    </Button>
  );
}

