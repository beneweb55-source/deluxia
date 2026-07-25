import { prisma, withRetry } from '@/lib/prisma';

/**
 * Bandeau d'annonce affiché en haut de la boutique.
 *
 * Ce composant serveur s'affiche dans le layout, donc sur **toutes** les pages,
 * y compris celles rendues à la requête (connexion, inscription, espace client).
 * Sa lecture de la base doit donc être tolérante à la panne : au réveil d'une
 * base serverless endormie, une requête non gardée ferait tomber la page entière
 * en « erreur serveur ». Ici, le pire cas est l'absence de bandeau — jamais un
 * crash. C'était précisément la cause des 500 sur /connexion et /inscription.
 */
export async function AnnouncementBanner() {
  let value: unknown = null;

  try {
    const setting = await withRetry(() =>
      prisma.setting.findUnique({ where: { key: 'announcement' } }),
    );
    value = setting?.value ?? null;
  } catch (error) {
    console.error('[annonce] lecture impossible, bandeau masqué', error);
    return null;
  }

  // La valeur est un champ JSON : on n'affiche que si c'est bien une chaîne non
  // vide, pour ne jamais rendre « [object Object] » ni un bandeau blanc.
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;

  return (
    <div className="bg-ink px-4 py-2.5 text-center text-[0.75rem] font-medium tracking-wide text-paper sm:text-[0.8125rem]">
      {text}
    </div>
  );
}
