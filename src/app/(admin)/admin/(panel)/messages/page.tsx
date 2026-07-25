import type { Metadata } from 'next';
import { deleteMessage, markMessageRead } from '@/app/(admin)/admin/_actions/gestion';
import { AdminPageHeader, Card } from '@/components/admin/ui';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatNumber, formatPhone } from '@/lib/format';
import { prisma } from '@/lib/prisma';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Messages' };

export default async function MessagesPage() {
  const [messages, unread] = await Promise.all([
    prisma.contactMessage.findMany({
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  const description =
    unread === 0
      ? 'Tous les messages ont été lus.'
      : unread === 1
        ? '1 message non lu.'
        : `${formatNumber(unread)} messages non lus.`;

  return (
    <>
      <AdminPageHeader title="Messages" description={description} />

      {messages.length === 0 ? (
        // L'état vide est écrit ici plutôt que repris de la boutique : celui de la
        // boutique porte la classe `.reveal`, dont l'observateur n'est monté que
        // dans le groupe (boutique). Il resterait donc invisible dans l'administration.
        <Card>
          <div className="flex flex-col items-center px-8 py-16 text-center">
            <span aria-hidden="true" className="h-px w-12 bg-line" />
            <p className="mt-7 text-[1.125rem] font-light text-ink">Aucun message</p>
            <p className="mt-3 max-w-md text-[0.875rem] leading-relaxed text-graphite">
              Les demandes envoyées depuis le formulaire de contact apparaîtront ici.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {messages.map((message) => (
            <Card
              key={message.id}
              // Le modificateur « ! » est nécessaire : `cn` concatène sans fusionner,
              // et la bordure claire de Card l'emporterait sinon dans la feuille de style.
              className={cn(!message.isRead && 'border-ink!')}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2.5 text-[1rem] font-light text-ink">
                    {!message.isRead && (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink"
                        />
                        <span className="sr-only">Non lu.</span>
                      </>
                    )}
                    {message.subject}
                  </h2>

                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-graphite">
                    <span>{message.name}</span>
                    <a href={`tel:${message.phone}`} className="link-underline">
                      {formatPhone(message.phone)}
                    </a>
                    {message.email && (
                      <a href={`mailto:${message.email}`} className="link-underline">
                        {message.email}
                      </a>
                    )}
                  </p>
                </div>

                <p className="text-[0.75rem] whitespace-nowrap text-ash">
                  {formatDateTime(message.createdAt)}
                </p>
              </div>

              <p className="mt-5 text-[0.875rem] leading-relaxed whitespace-pre-line text-ink-soft">
                {message.message}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-4">
                <form action={markMessageRead.bind(null, message.id, !message.isRead)}>
                  <Button type="submit" variant="ghost" size="sm">
                    {message.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
                  </Button>
                </form>

                <form action={deleteMessage.bind(null, message.id)}>
                  <Button type="submit" variant="quiet" size="sm">
                    Supprimer
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
