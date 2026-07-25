'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRightIcon, CheckIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * Inscription à la newsletter. Les adresses sont enregistrées dès aujourd'hui ;
 * l'envoi des campagnes est prévu en V2 — la base sera donc déjà constituée.
 */
export function NewsletterForm({ className }: { className?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'sending') return;

    setStatus('sending');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setStatus('error');
        setMessage(data.message ?? 'Inscription impossible pour le moment.');
        return;
      }

      setStatus('done');
      setMessage(data.message ?? 'Merci, votre inscription est enregistrée.');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Vérifiez votre connexion et réessayez.');
    }
  };

  if (status === 'done') {
    return (
      <div className={cn('flex items-center gap-3 border-b border-ink pb-4', className)}>
        <CheckIcon className="h-4 w-4 shrink-0 text-ink" />
        <p className="text-[0.875rem] text-ink">{message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={cn('flex flex-col', className)} noValidate>
      <div className="flex items-center gap-3 border-b border-line pb-4 transition-colors duration-300 focus-within:border-ink">
        <label htmlFor="newsletter-email" className="sr-only">
          Adresse e-mail
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          placeholder="votre@email.com"
          aria-describedby="newsletter-status"
          className="w-full bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-ash/70"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="shrink-0 p-1 text-ink transition-opacity duration-300 hover:opacity-55 disabled:opacity-30"
          aria-label="S'inscrire à la newsletter"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>

      <p
        id="newsletter-status"
        role={status === 'error' ? 'alert' : undefined}
        className={cn(
          'mt-3 text-[0.75rem] transition-opacity duration-300',
          status === 'error' ? 'text-ink opacity-100' : 'opacity-0',
        )}
      >
        {message || ' '}
      </p>
    </form>
  );
}
