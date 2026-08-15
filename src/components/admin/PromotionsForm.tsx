'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/admin/ui';
import { applyBulkPromotion, type PromotionTarget } from '@/app/(admin)/admin/_actions/promotions';
import { useRouter } from 'next/navigation';

export function PromotionsForm({
  collections,
  categories,
}: {
  collections: { id: string; name: string }[];
  categories: { id: string; name: string; collectionName?: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [targetType, setTargetType] = useState<'all' | 'collection' | 'category'>('all');
  const [selectedId, setSelectedId] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const pct = parseInt(percentage, 10);
    if (isNaN(pct) || pct < 0 || pct > 99) {
      setError('Le pourcentage doit être compris entre 0 et 99.');
      return;
    }

    let target: PromotionTarget;
    if (targetType === 'all') {
      target = { type: 'all' };
    } else if (targetType === 'collection') {
      if (!selectedId) return setError('Veuillez sélectionner une collection.');
      target = { type: 'collection', id: selectedId };
    } else {
      if (!selectedId) return setError('Veuillez sélectionner une catégorie.');
      target = { type: 'category', id: selectedId };
    }

    startTransition(async () => {
      const result = await applyBulkPromotion(target, pct);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess(result.success);
        setPercentage('');
        router.refresh();
      }
    });
  };

  return (
    <Card className="max-w-2xl" padded>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {error && (
          <div className="border-l-2 border-red-500 bg-red-500/10 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="border-l-2 border-ink bg-ink/5 p-3 text-sm text-ink">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-ink">Type de cible</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="targetType"
                value="all"
                checked={targetType === 'all'}
                onChange={() => { setTargetType('all'); setSelectedId(''); }}
                className="accent-ink"
              />
              Tout le catalogue
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="targetType"
                value="collection"
                checked={targetType === 'collection'}
                onChange={() => { setTargetType('collection'); setSelectedId(''); }}
                className="accent-ink"
              />
              Collection
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="targetType"
                value="category"
                checked={targetType === 'category'}
                onChange={() => { setTargetType('category'); setSelectedId(''); }}
                className="accent-ink"
              />
              Catégorie
            </label>
          </div>
        </div>

        {targetType === 'collection' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="collection" className="text-sm font-medium text-ink">Sélectionnez la collection</label>
            <select
              id="collection"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-11 w-full border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">-- Choisir une collection --</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'category' && (
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="text-sm font-medium text-ink">Sélectionnez la catégorie</label>
            <select
              id="category"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-11 w-full border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">-- Choisir une catégorie --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.collectionName ? `(${c.collectionName})` : ''}
                </option>              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="percentage" className="text-sm font-medium text-ink">
            Pourcentage de remise (%)
          </label>
          <div className="flex gap-2 items-center">
            <input
              id="percentage"
              type="number"
              min="0"
              max="99"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Ex: 20"
              className="h-11 w-32 border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-ink"
              required
            />
            <span className="text-sm text-graphite">
              Saisissez 0 pour retirer les promotions existantes sur cette cible.
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-4 inline-flex h-11 items-center justify-center border border-ink bg-ink px-6 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {pending ? 'Application...' : 'Appliquer la promotion'}
        </button>
      </form>
    </Card>
  );
}
