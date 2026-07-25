'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  changeCustomerPassword,
  updateCustomerProfile,
  type AccountState,
} from '@/app/(boutique)/_actions/account';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { WILAYAS, getCommunes } from '@/data/wilayas';
import { useState } from 'react';

/** Retour visuel commun aux deux formulaires. */
function Feedback({ state }: { state: AccountState }) {
  if (!state.error && !state.success) return null;

  return (
    <p
      role={state.error ? 'alert' : undefined}
      className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] leading-relaxed text-ink"
    >
      {state.error ?? state.success}
    </p>
  );
}

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" fullWidth disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export interface ProfileValues {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  wilayaCode: number | null;
  commune: string | null;
  address: string | null;
}

/**
 * Coordonnées de la cliente.
 *
 * Ces informations pré-remplissent le tunnel de commande : les tenir à jour ici
 * fait gagner une minute à chaque achat, ce qui est tout l'intérêt du compte.
 */
export function ProfileForm({ profile }: { profile: ProfileValues }) {
  const [state, formAction] = useActionState<AccountState, FormData>(updateCustomerProfile, {});

  // La liste des communes dépend de la wilaya : elle est donc pilotée par l'état.
  const [wilayaCode, setWilayaCode] = useState(profile.wilayaCode ?? 0);
  const communes = getCommunes(wilayaCode);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <Feedback state={state} />

      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Input label="Prénom" name="firstName" required defaultValue={profile.firstName} autoComplete="given-name" />
        <Input label="Nom" name="lastName" required defaultValue={profile.lastName} autoComplete="family-name" />
        <Input
          label="Téléphone"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          defaultValue={profile.phone}
          autoComplete="tel"
        />
        <Input
          label="Adresse e-mail"
          name="email"
          type="email"
          defaultValue={profile.email ?? ''}
          autoComplete="email"
          hint="Facultative. Elle sert uniquement à vous recontacter."
        />

        <Select
          label="Wilaya"
          name="wilayaCode"
          value={wilayaCode || ''}
          onChange={(event) => setWilayaCode(Number(event.target.value))}
        >
          <option value="">Non renseignée</option>
          {WILAYAS.map((wilaya) => (
            <option key={wilaya.code} value={wilaya.code}>
              {String(wilaya.code).padStart(2, '0')} — {wilaya.name}
            </option>
          ))}
        </Select>

        <Select
          label="Commune"
          name="commune"
          defaultValue={profile.commune ?? ''}
          disabled={communes.length === 0}
          key={wilayaCode}
        >
          <option value="">
            {communes.length === 0 ? "Choisissez d'abord une wilaya" : 'Non renseignée'}
          </option>
          {communes.map((commune) => (
            <option key={commune} value={commune}>
              {commune}
            </option>
          ))}
        </Select>
      </div>

      <Textarea
        label="Adresse de livraison"
        name="address"
        rows={3}
        defaultValue={profile.address ?? ''}
        placeholder="Rue, quartier, point de repère…"
        hint="Pré-remplie automatiquement lors de vos prochaines commandes."
      />

      <SubmitButton label="Enregistrer mes informations" pendingLabel="Enregistrement…" />
    </form>
  );
}

/** Changement de mot de passe. */
export function PasswordForm() {
  const [state, formAction] = useActionState<AccountState, FormData>(changeCustomerPassword, {});

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <Feedback state={state} />

      <Input
        label="Mot de passe actuel"
        name="current"
        type="password"
        required
        autoComplete="current-password"
      />
      <Input
        label="Nouveau mot de passe"
        name="next"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        hint="Au moins 8 caractères."
      />
      <Input
        label="Confirmer le nouveau mot de passe"
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
      />

      <SubmitButton label="Modifier le mot de passe" pendingLabel="Modification…" />
    </form>
  );
}
