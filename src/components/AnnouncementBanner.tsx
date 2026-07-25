import { prisma } from '@/lib/prisma';

/**
 * Bandeau d'annonce affiché en haut de la boutique.
 * Le texte est modifiable depuis le panel d'administration.
 */
export async function AnnouncementBanner() {
  const setting = await prisma.setting.findUnique({
    where: { key: 'announcement' },
  });

  if (!setting?.value) {
    return null;
  }

  return (
    <div className="bg-ink px-4 py-2.5 text-center text-[0.75rem] font-medium tracking-wide text-paper sm:text-[0.8125rem]">
      {String(setting.value)}
    </div>
  );
}
