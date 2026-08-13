'use client';

import { useActionState, useCallback, useEffect, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { saveCollection } from '@/app/(admin)/admin/_actions/collections';
import { bulkDeleteCollections } from '@/app/(admin)/admin/_actions/suppression';
import type { ActionState } from '@/app/(admin)/admin/_actions/catalogue';
import { Card } from '@/components/admin/ui';
import { ConfirmDialog } from '@/components/admin/QuickAction';
import { BulkBar, BulkButton, SelectBox, useBulkSelection } from '@/components/admin/BulkSelection';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { cn } from '@/lib/utils';
import { SingleImageUploader } from '@/components/admin/ImageUploader';

export interface CollectionRow {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  position: number;
  categoryCount: number;
  productCount: number;
}

const NEW = 'nouveau';

/**
 * Gestion des collections.
 *
 * Supprimer une collection efface aussi ses catégories et leurs produits : le
 * dialogue de confirmation annonce donc les trois nombres avant d'agir. C'est
 * l'action la plus destructrice de l'administration, et la seule protection
 * utile est de dire précisément ce qui va disparaître — pas de multiplier les
 * clics.
 */
export function CollectionManager({ collections }: { collections: CollectionRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  const selection = useBulkSelection(collections.map((c) => c.id));

  const handleSaved = useCallback((message: string) => {
    setNotice(message);
    setEditingId(null);
  }, []);

  const openForm = (id: string) => {
    setNotice(null);
    setEditingId(id);
  };

  const editing =
    editingId && editingId !== NEW ? collections.find((item) => item.id === editingId) : undefined;
  const formOpen = editingId === NEW || (editingId !== null && editing !== undefined);

  // Portée exacte de la suppression, calculée à partir des lignes affichées.
  const chosen = collections.filter((c) => selection.has(c.id));
  const categoryTotal = chosen.reduce((sum, c) => sum + c.categoryCount, 0);
  const productTotal = chosen.reduce((sum, c) => sum + c.productCount, 0);

  const runDelete = () => {
    setAsking(false);
    startTransition(async () => {
      const result = await bulkDeleteCollections(selection.ids);
      setNotice(result.message);
      selection.clear();
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {notice ? (
          <p role="status" className="border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
            {notice}
          </p>
        ) : (
          <p className="text-[0.8125rem] text-graphite">
            {collections.length} collection{collections.length > 1 ? 's' : ''}.
          </p>
        )}

        <Button
          type="button"
          size="sm"
          variant={editingId === NEW ? 'ghost' : 'primary'}
          onClick={() => (editingId === NEW ? setEditingId(null) : openForm(NEW))}
        >
          {editingId === NEW ? 'Annuler' : 'Nouvelle collection'}
        </Button>
      </div>

      {editingId !== null && formOpen && (
        <Card title={editing ? `Modifier — ${editing.name}` : 'Nouvelle collection'}>
          <CollectionForm
            key={editingId}
            collectionId={editingId === NEW ? null : editingId}
            collection={editing}
            onSaved={handleSaved}
            onCancel={() => setEditingId(null)}
          />
        </Card>
      )}

      <Card title="Collections" padded={false}>
        {collections.length === 0 ? (
          <p className="px-5 py-10 text-center text-[0.875rem] text-ash">
            Aucune collection pour le moment.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-line px-5 py-3">
              <SelectBox
                checked={selection.allSelected}
                onChange={selection.toggleAll}
                label="Sélectionner toutes les collections"
              />
              <span className="text-[0.75rem] text-ash">Tout sélectionner</span>
            </div>

            <ul>
              {collections.map((col) => (
                <li
                  key={col.id}
                  className={cn(
                    'flex flex-wrap items-center gap-4 border-b border-line/70 px-5 py-4 last:border-b-0',
                    selection.has(col.id) && 'bg-ink/5',
                    pending && selection.has(col.id) && 'opacity-50',
                  )}
                >
                  <SelectBox
                    checked={selection.has(col.id)}
                    onChange={() => selection.toggle(col.id)}
                    label={`Sélectionner la collection ${col.name}`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-[0.9375rem] text-ink">{col.name}</p>
                    <p className="mt-1 text-[0.75rem] text-ash">
                      /{col.slug} · position {col.position} · {col.categoryCount} catégorie
                      {col.categoryCount > 1 ? 's' : ''} · {col.productCount} produit
                      {col.productCount > 1 ? 's' : ''}
                    </p>
                  </div>

                  <Button type="button" size="sm" variant="ghost" onClick={() => openForm(col.id)}>
                    Modifier
                  </Button>
                </li>
              ))}
            </ul>

            <BulkBar
              count={selection.count}
              singular="collection"
              plural="collections"
              onClear={selection.clear}
            >
              <BulkButton variant="solid" disabled={pending} onClick={() => setAsking(true)}>
                {pending ? 'Suppression…' : 'Supprimer'}
              </BulkButton>
            </BulkBar>
          </>
        )}
      </Card>

      {asking && (
        <ConfirmDialog
          title={`Supprimer ${selection.count} collection${selection.count > 1 ? 's' : ''} ?`}
          body={
            categoryTotal + productTotal === 0
              ? 'Ces collections sont vides. Rien d’autre ne sera supprimé.'
              : `Cette action supprime aussi ${categoryTotal} catégorie${categoryTotal > 1 ? 's' : ''} et ${productTotal} produit${productTotal > 1 ? 's' : ''}. Les produits figurant déjà dans une commande sont masqués plutôt qu’effacés, afin que l’historique reste lisible. Cette action est irréversible.`
          }
          actionLabel="Tout supprimer"
          onConfirm={runDelete}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  );
}

function CollectionForm({
  collectionId,
  collection,
  onSaved,
  onCancel,
}: {
  collectionId: string | null;
  collection: CollectionRow | undefined;
  onSaved: (message: string) => void;
  onCancel: () => void;
}) {
  const action = saveCollection.bind(null, collectionId);
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  useEffect(() => {
    if (state.success) onSaved(state.success);
  }, [state.success, onSaved]);

  return (
    // Entrée depuis n'importe quel champ envoie le formulaire : c'est le
    // comportement natif, conservé ici parce qu'il n'y a aucun champ multiligne.
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Input
          label="Nom"
          name="name"
          required
          maxLength={60}
          defaultValue={collection?.name ?? ''}
          autoFocus
        />
        <Input
          label="Adresse URL"
          name="slug"
          maxLength={60}
          defaultValue={collection?.slug ?? ''}
          hint="Laissez vide pour la déduire du nom."
        />
      </div>

      <SingleImageUploader
        initial={collection?.imageUrl ?? ''}
        label="Photo de la collection"
      />

      <Input
        label="Position"
        name="position"
        type="number"
        min={0}
        max={999}
        defaultValue={collection?.position ?? 0}
        hint="Ordre d’affichage dans le menu, du plus petit au plus grand."
      />

      {state.error && (
        <p role="alert" className="border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton isNew={collectionId === null} />
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
      {pending ? 'Enregistrement…' : isNew ? 'Créer la collection' : 'Enregistrer'}
    </Button>
  );
}
