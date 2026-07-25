'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { loginUnified, type AuthState } from '@/app/(boutique)/_actions/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { BRAND } from '@/lib/brand';

export function LoginForm({ suite }: { suite?: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(loginUnified, {});

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {suite && <input type="hidden" name="suite" value={suite} />}

      <Input
        label="E-mail ou téléphone"
        name="identifier"
        type="text"
        required
        autoComplete="username"
        autoFocus
        placeholder="07 72 61 05 46 ou vous@exemple.com"
      />

      <Input
        label="Mot de passe"
        name="password"
        type="password"
        required
        autoComplete="current-password"
      />

      {state.error && (
        <p role="alert" className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="mt-6 text-[0.75rem] leading-relaxed text-ash">
        Mot de passe oublié ? Appelez-nous au{' '}
        <a href={`tel:${BRAND.phoneE164}`} className="link-underline text-graphite">
          {BRAND.phoneDisplay}
        </a>
        , nous réinitialisons votre accès.
      </p>

      <p className="mt-4 text-[0.875rem] text-graphite">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="link-underline text-ink">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" fullWidth disabled={pending}>
      {pending ? 'Connexion…' : 'Se connecter'}
    </Button>
  );
}
