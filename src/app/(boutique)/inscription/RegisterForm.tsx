'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { registerUnified, type AuthState } from '@/app/(boutique)/_actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';

/**
 * Création de compte.
 *
 * Aucun écran de confirmation : l'action ouvre la session et redirige vers
 * l'espace personnel. Demander de se reconnecter juste après avoir choisi un
 * mot de passe est une friction que rien ne justifie.
 */
export function RegisterForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(registerUnified, {});

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
        <Input label="Prénom" name="firstName" required autoComplete="given-name" />
        <Input label="Nom" name="lastName" required autoComplete="family-name" />
      </div>

      <Input
        label="Téléphone"
        name="phone"
        type="tel"
        inputMode="tel"
        required
        autoComplete="tel"
        placeholder="07 72 61 05 46"
        hint="C'est ce numéro qui identifie vos commandes."
      />

      <Input
        label="Adresse e-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="vous@exemple.com"
      />

      <Input
        label="Mot de passe"
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        hint="Au moins 8 caractères."
      />

      {state.error && (
        <p role="alert" className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="mt-6 text-[0.875rem] text-graphite">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="link-underline text-ink">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" fullWidth disabled={pending}>
      {pending ? 'Création…' : 'Créer mon compte'}
    </Button>
  );
}
