'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/app/(admin)/admin/_actions/catalogue';
import { changePassword, updateProfile, updateSettings } from '@/app/(admin)/admin/_actions/gestion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

/* Formulaires de la page Paramètres. Chacun possède son propre état : enregistrer
   son profil ne doit pas effacer le message de confirmation du mot de passe. */

/** Retour de l'action, en réussite comme en échec. */
function Feedback({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return <p className="mb-6 border-l-2 border-line pl-4 text-[0.8125rem] text-graphite">{state.success}</p>;
  }

  return null;
}

/** Séparé pour que `useFormStatus` observe bien le formulaire parent. */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? 'Enregistrement…' : label}
    </Button>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Input label="Nom" name="name" defaultValue={name} required maxLength={60} autoComplete="name" />

      <Input
        label="Adresse e-mail"
        name="email"
        type="email"
        defaultValue={email}
        required
        autoComplete="username"
      />

      <Feedback state={state} />
      <div>
        <SubmitButton label="Enregistrer" />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
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
        minLength={10}
        autoComplete="new-password"
        hint="Dix caractères au minimum. La modification déconnecte vos autres appareils."
      />

      <Input
        label="Confirmer le nouveau mot de passe"
        name="confirm"
        type="password"
        required
        minLength={10}
        autoComplete="new-password"
      />

      <Feedback state={state} />
      <div>
        <SubmitButton label="Modifier le mot de passe" />
      </div>
    </form>
  );
}

export function StoreSettingsForm({ announcement }: { announcement: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateSettings, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Input
        label="Bandeau d'annonce"
        name="announcement"
        defaultValue={announcement}
        maxLength={160}
        hint="Affiché en haut de la boutique, 160 caractères au maximum. Un champ vidé conserve l'annonce précédente."
        placeholder="Livraison dans toute l'Algérie, paiement à la réception."
      />

      <Feedback state={state} />
      <div>
        <SubmitButton label="Enregistrer" />
      </div>
    </form>
  );
}
