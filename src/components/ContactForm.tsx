'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Field';
import { CheckIcon } from '@/components/icons';

const SUBJECTS = [
  'Question sur un article',
  'Disponibilité d’une pointure',
  'Suivi de commande',
  'Demande d’échange',
  'Demande de remboursement',
  'Autre',
] as const;

type Status = 'idle' | 'sending' | 'done';

/**
 * Formulaire de contact.
 *
 * Il passe par une route d'API plutôt que par une Server Action : la page de
 * contact n'a aucune raison d'être rendue dynamiquement, et une Server Action
 * la ferait basculer côté serveur à chaque visite pour un formulaire utilisé
 * une fois sur cent.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;

    const formData = new FormData(event.currentTarget);
    setStatus('sending');
    setErrors({});
    setGlobalError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      const data = (await response.json()) as {
        message?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok) {
        setErrors(data.fieldErrors ?? {});
        setGlobalError(data.message ?? 'Envoi impossible pour le moment.');
        setStatus('idle');
        return;
      }

      setConfirmation(data.message ?? 'Message envoyé.');
      setStatus('done');
    } catch {
      setGlobalError('Connexion interrompue. Vérifiez votre réseau et réessayez.');
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className="border border-ink p-8 sm:p-10">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ink">
          <CheckIcon className="h-5 w-5 text-ink" />
        </span>
        <h2 className="mt-6 text-[1.25rem] font-light tracking-[-0.02em] text-ink">
          Merci, votre message est parti.
        </h2>
        <p className="mt-3 text-[0.875rem] leading-relaxed text-graphite">{confirmation}</p>
        <Button
          variant="outline"
          className="mt-8"
          onClick={() => {
            setStatus('idle');
            setConfirmation('');
          }}
        >
          Écrire un autre message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Input label="Nom" name="name" required autoComplete="name" error={errors.name} />
        <Input
          label="Téléphone"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          autoComplete="tel"
          placeholder="07 72 61 05 46"
          error={errors.phone}
        />
      </div>

      <Input
        label="Adresse e-mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Facultatif"
        hint="Nous répondons par téléphone en priorité."
        error={errors.email}
      />

      <Select label="Sujet" name="subject" required defaultValue={SUBJECTS[0]} error={errors.subject}>
        {SUBJECTS.map((subject) => (
          <option key={subject} value={subject}>
            {subject}
          </option>
        ))}
      </Select>

      <Textarea
        label="Votre message"
        name="message"
        rows={6}
        required
        placeholder="Référence de commande, modèle concerné, pointure…"
        error={errors.message}
      />

      {globalError && (
        <p role="alert" className="mb-6 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          {globalError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === 'sending'}>
        {status === 'sending' ? 'Envoi…' : 'Envoyer le message'}
      </Button>
    </form>
  );
}
