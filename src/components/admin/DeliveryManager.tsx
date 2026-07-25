'use client';

import { useActionState, useMemo, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { ActionRow, QuickAction } from '@/components/admin/QuickAction';
import { Card, EmptyRow, TableWrap, Td, Th } from '@/components/admin/ui';
import { RefreshIcon, TrashIcon } from '@/components/icons';
import {
  bulkAdjustDeliveryFees,
  createDeliveryRate,
  deleteDeliveryRate,
  patchDeliveryRate,
  restoreDeliveryRates,
} from '@/app/(admin)/admin/_actions/gestion';
import type { ActionState } from '@/app/(admin)/admin/_actions/catalogue';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface DeliveryRateRow {
  code: number;
  name: string;
  homeFee: number;
  deskFee: number;
  hasDesk: boolean;
  isServed: boolean;
  returnFee: number;
}

/** Wilaya absente de la grille, restaurable depuis le référentiel. */
export interface MissingWilaya {
  code: number;
  name: string;
}

const CONTROL =
  'w-full appearance-none border border-line bg-paper px-3 py-2.5 text-[1rem] sm:text-[0.875rem] text-ink ' +
  'outline-none transition-colors duration-300 focus:border-ink ' +
  '[&>option]:bg-paper [&>option]:text-ink';

/**
 * Gestion de la grille de livraison.
 *
 * Trois niveaux d'intervention, du plus courant au plus rare :
 *  1. corriger un tarif isolé — saisie directe dans le tableau, enregistrée en
 *     quittant le champ, sans bouton ;
 *  2. répercuter une hausse du transporteur — ajustement groupé en pourcentage
 *     ou en montant, sur les 58 lignes à la fois ;
 *  3. réparer une manipulation — restauration depuis la grille ZR Express
 *     d'origine, ligne par ligne ou en totalité.
 */
export function DeliveryManager({
  rates,
  missing,
}: {
  rates: DeliveryRateRow[];
  missing: MissingWilaya[];
}) {
  const [query, setQuery] = useState('');
  const [onlyServed, setOnlyServed] = useState(false);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rates.filter((rate) => {
      if (onlyServed && !rate.isServed) return false;
      if (!term) return true;
      return rate.name.toLowerCase().includes(term) || String(rate.code).includes(term);
    });
  }, [rates, query, onlyServed]);

  return (
    <>
      <AddWilaya missing={missing} />

      <BulkAdjust />

      {missing.length > 0 && <MissingRates missing={missing} />}

      <Card className="mt-6" padded={false}>
        <div className="flex flex-wrap items-center gap-4 border-b border-line p-5">
          <div className="min-w-48 flex-1">
            <label htmlFor="recherche-wilaya" className="sr-only">
              Rechercher une wilaya
            </label>
            <input
              id="recherche-wilaya"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher une wilaya ou un code…"
              className={CONTROL}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={onlyServed}
              onChange={(event) => setOnlyServed(event.target.checked)}
              className="size-4 accent-ink"
            />
            <span className="text-[0.8125rem] text-graphite">Desservies uniquement</span>
          </label>

          <span className="text-[0.75rem] text-ash">
            {visible.length} / {rates.length} wilayas
          </span>
        </div>

        <div className="p-5">
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-14">Code</Th>
                <Th>Wilaya</Th>
                <Th className="text-right">Domicile</Th>
                <Th className="text-right">Bureau</Th>
                <Th className="text-center">Bureau dispo.</Th>
                <Th className="text-center">Desservie</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>

            <tbody>
              {visible.length === 0 ? (
                <EmptyRow colSpan={7} message="Aucune wilaya ne correspond à cette recherche." />
              ) : (
                visible.map((rate) => <RateLine key={rate.code} rate={rate} />)
              )}
            </tbody>
          </TableWrap>
        </div>
      </Card>
    </>
  );
}

/** Une ligne de wilaya, entièrement modifiable sur place. */
function RateLine({ rate }: { rate: DeliveryRateRow }) {
  const [pending, startTransition] = useTransition();

  const patch = (data: Parameters<typeof patchDeliveryRate>[1]) =>
    startTransition(async () => {
      await patchDeliveryRate(rate.code, data);
    });

  return (
    <tr className={cn(pending && 'opacity-50', !rate.isServed && 'text-ash')}>
      <Td className="tabular-nums text-ash">{String(rate.code).padStart(2, '0')}</Td>

      <Td>
        <span className={cn('block whitespace-nowrap', rate.isServed ? 'text-ink' : 'text-ash')}>
          {rate.name}
        </span>
        <span className="mt-0.5 block whitespace-nowrap text-[0.75rem] text-graphite">
          Retour {formatPrice(rate.returnFee)}
        </span>
      </Td>

      <Td className="text-right">
        <FeeInput
          label={`Tarif à domicile — ${rate.name}`}
          value={rate.homeFee}
          disabled={!rate.isServed}
          onCommit={(homeFee) => patch({ homeFee })}
        />
      </Td>

      <Td className="text-right">
        <FeeInput
          label={`Tarif en bureau — ${rate.name}`}
          value={rate.deskFee}
          disabled={!rate.isServed || !rate.hasDesk}
          onCommit={(deskFee) => patch({ deskFee })}
        />
        {!rate.hasDesk && rate.isServed && (
          <span className="mt-1 block whitespace-nowrap text-[0.6875rem] text-graphite">
            Aucun bureau
          </span>
        )}
      </Td>

      <Td className="text-center">
        <input
          type="checkbox"
          checked={rate.hasDesk}
          disabled={!rate.isServed}
          onChange={(event) =>
            patch({
              hasDesk: event.target.checked,
              // Réactiver un bureau dont le tarif est à zéro ne servirait à rien :
              // on repart du tarif domicile, que la gérante ajuste ensuite.
              ...(event.target.checked && rate.deskFee === 0 ? { deskFee: rate.homeFee } : {}),
            })
          }
          aria-label={`Bureau de retrait disponible — ${rate.name}`}
          className="size-4 accent-ink disabled:opacity-30"
        />
      </Td>

      <Td className="text-center">
        <input
          type="checkbox"
          checked={rate.isServed}
          onChange={(event) => patch({ isServed: event.target.checked })}
          aria-label={`Wilaya desservie — ${rate.name}`}
          className="size-4 accent-ink"
        />
      </Td>

      <Td>
        <ActionRow>
          <QuickAction
            label={`Rétablir le tarif d'origine — ${rate.name}`}
            icon={RefreshIcon}
            onAction={async () => {
              await restoreDeliveryRates([rate.code]);
            }}
            confirm={{
              title: `Rétablir ${rate.name} ?`,
              body: 'Les tarifs, les délais et la disponibilité du bureau reprennent les valeurs de la grille ZR Express d’origine.',
              action: 'Rétablir',
            }}
          />

          <QuickAction
            label={`Retirer ${rate.name} de la grille`}
            icon={TrashIcon}
            onAction={() => deleteDeliveryRate(rate.code)}
            confirm={{
              title: `Retirer ${rate.name} ?`,
              body: 'La wilaya disparaît du formulaire de commande et aucune livraison n’y sera possible. Vous pourrez la rétablir à tout moment.',
              action: 'Retirer',
            }}
          />
        </ActionRow>
      </Td>
    </tr>
  );
}

/**
 * Champ de tarif enregistré à la sortie du champ.
 *
 * Pas de bouton « Enregistrer » : corriger 58 lignes en cliquant deux fois par
 * ligne serait décourageant. La touche Échap rétablit la valeur d'origine.
 */
function FeeInput({
  label,
  value,
  disabled,
  onCommit,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));

  // La valeur peut changer côté serveur (ajustement groupé, restauration) :
  // on resynchronise sans écraser une saisie en cours.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setDraft(String(value));
      return;
    }
    if (Math.round(parsed) !== value) onCommit(Math.round(parsed));
  };

  return (
    <input
      type="number"
      min={0}
      step={50}
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          setDraft(String(value));
          event.currentTarget.blur();
        }
      }}
      aria-label={label}
      className="w-24 border border-line bg-paper px-2 py-1.5 text-right text-[1rem] sm:text-[0.875rem] tabular-nums text-ink outline-none transition-colors focus:border-ink disabled:opacity-40"
    />
  );
}

/**
 * Ajout d'une wilaya à la grille.
 *
 * Le code de wilaya sert d'identifiant : choisir un code déjà présent met la
 * ligne à jour au lieu d'en créer une seconde. Sélectionner une wilaya absente
 * pré-remplit son nom, pour éviter les fautes de frappe sur des noms qui
 * s'écrivent de plusieurs façons (Béjaïa, Bejaia, Bedjaia…).
 */
function AddWilaya({ missing }: { missing: MissingWilaya[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createDeliveryRate, {});
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const chooseCode = (value: string) => {
    setCode(value);
    const match = missing.find((wilaya) => String(wilaya.code) === value);
    if (match) setName(match.name);
  };

  return (
    <Card
      title="Ajouter une wilaya"
      action={
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="link-underline text-[0.75rem] uppercase tracking-[0.14em] text-graphite hover:text-ink"
        >
          {open ? 'Fermer' : 'Ouvrir'}
        </button>
      }
    >
      {!open ? (
        <p className="text-[0.875rem] leading-relaxed text-graphite">
          Pour rétablir une wilaya retirée par erreur, ou couvrir une zone que le transporteur vient
          d&rsquo;ouvrir.
        </p>
      ) : (
        <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="ajout-code" className="eyebrow mb-2 block text-ink">
              Code
            </label>
            {missing.length > 0 ? (
              <select
                id="ajout-code"
                name="code"
                required
                value={code}
                onChange={(event) => chooseCode(event.target.value)}
                className={CONTROL}
              >
                <option value="">Choisir…</option>
                {missing.map((wilaya) => (
                  <option key={wilaya.code} value={wilaya.code}>
                    {String(wilaya.code).padStart(2, '0')} — {wilaya.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="ajout-code"
                type="number"
                name="code"
                min={1}
                max={58}
                required
                value={code}
                onChange={(event) => chooseCode(event.target.value)}
                placeholder="1 à 58"
                className={CONTROL}
              />
            )}
          </div>

          <div>
            <label htmlFor="ajout-nom" className="eyebrow mb-2 block text-ink">
              Nom
            </label>
            <input
              id="ajout-nom"
              type="text"
              name="name"
              required
              maxLength={60}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tindouf"
              className={CONTROL}
            />
          </div>

          <div>
            <label htmlFor="ajout-domicile" className="eyebrow mb-2 block text-ink">
              Domicile (DA)
            </label>
            <input
              id="ajout-domicile"
              type="number"
              name="homeFee"
              min={0}
              step={50}
              required
              defaultValue={900}
              className={CONTROL}
            />
          </div>

          <div>
            <label htmlFor="ajout-bureau" className="eyebrow mb-2 block text-ink">
              Bureau (DA)
            </label>
            <input
              id="ajout-bureau"
              type="number"
              name="deskFee"
              min={0}
              step={50}
              required
              defaultValue={0}
              className={CONTROL}
            />
            <p className="mt-2 text-[0.75rem] leading-snug text-graphite">
              0 = pas de bureau de retrait.
            </p>
          </div>

          <div className="flex flex-col justify-end gap-3">
            <label className="flex cursor-pointer items-center gap-2.5">
              <input type="checkbox" name="isServed" defaultChecked className="size-4 accent-ink" />
              <span className="text-[0.8125rem] text-graphite">Desservie</span>
            </label>
            <AddSubmit />
          </div>

          {(state.error || state.success) && (
            <p
              role={state.error ? 'alert' : 'status'}
              className="border-l-2 border-ink pl-4 text-[0.8125rem] text-ink sm:col-span-2 lg:col-span-5"
            >
              {state.error ?? state.success}
            </p>
          )}
        </form>
      )}
    </Card>
  );
}

function AddSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 border border-ink bg-ink px-6 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-80 disabled:opacity-40"
    >
      {pending ? 'Ajout…' : 'Ajouter'}
    </button>
  );
}

/** Ajustement de toute la grille en une opération. */
function BulkAdjust() {
  const [state, formAction] = useActionState<ActionState, FormData>(bulkAdjustDeliveryFees, {});
  const [mode, setMode] = useState<'percent' | 'amount' | 'set'>('percent');

  return (
    <Card title="Ajuster toute la grille">
      <p className="mb-6 max-w-2xl text-[0.875rem] leading-relaxed text-graphite">
        Quand le transporteur révise ses prix, il les révise partout. Cette opération applique le
        même changement à toutes les wilayas d&rsquo;un coup — plutôt que 58 corrections à la main.
      </p>

      <form action={formAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="bulk-mode" className="eyebrow mb-2 block text-ink">
            Opération
          </label>
          <select
            id="bulk-mode"
            name="mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as typeof mode)}
            className={CONTROL}
          >
            <option value="percent">Augmenter ou baisser de … %</option>
            <option value="amount">Ajouter ou retirer … DA</option>
            <option value="set">Fixer tous les tarifs à … DA</option>
          </select>
        </div>

        <div>
          <label htmlFor="bulk-value" className="eyebrow mb-2 block text-ink">
            {mode === 'percent' ? 'Pourcentage' : 'Montant en DA'}
          </label>
          <input
            id="bulk-value"
            type="number"
            name="value"
            defaultValue={mode === 'set' ? 500 : 10}
            step={mode === 'percent' ? 1 : 50}
            required
            className={CONTROL}
          />
        </div>

        <div>
          <label htmlFor="bulk-target" className="eyebrow mb-2 block text-ink">
            Appliquer à
          </label>
          <select id="bulk-target" name="target" defaultValue="both" className={CONTROL}>
            <option value="both">Domicile et bureau</option>
            <option value="home">Domicile seulement</option>
            <option value="desk">Bureau seulement</option>
          </select>
        </div>

        <div className="flex flex-col justify-end gap-3">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" name="servedOnly" defaultChecked className="size-4 accent-ink" />
            <span className="text-[0.8125rem] text-graphite">Wilayas desservies</span>
          </label>
          <BulkSubmit />
        </div>

        {(state.error || state.success) && (
          <p
            role={state.error ? 'alert' : 'status'}
            className="border-l-2 border-ink pl-4 text-[0.8125rem] text-ink sm:col-span-2 lg:col-span-4"
          >
            {state.error ?? state.success}
          </p>
        )}
      </form>
    </Card>
  );
}

function BulkSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 border border-ink bg-ink px-6 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-80 disabled:opacity-40"
    >
      {pending ? 'Application…' : 'Appliquer'}
    </button>
  );
}

/** Wilayas retirées de la grille, avec restauration en un clic. */
function MissingRates({ missing }: { missing: MissingWilaya[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card title="Wilayas absentes de la grille" className="mt-6">
      <p className="mb-5 text-[0.875rem] leading-relaxed text-graphite">
        Ces wilayas ne figurent plus dans la grille : aucune livraison n&rsquo;y est possible. Vous
        pouvez les rétablir avec leurs tarifs ZR Express d&rsquo;origine.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {missing.map((wilaya) => (
          <button
            key={wilaya.code}
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => void (await restoreDeliveryRates([wilaya.code])))}
            className="inline-flex items-center gap-2 border border-line px-3 py-2 text-[0.8125rem] text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            {String(wilaya.code).padStart(2, '0')} — {wilaya.name}
          </button>
        ))}

        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => void (await restoreDeliveryRates()))}
          className="ml-auto h-10 border border-ink bg-ink px-5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {pending ? 'Restauration…' : 'Tout rétablir'}
        </button>
      </div>
    </Card>
  );
}
