import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Service des visuels stockés en base.
 *
 * L'identifiant désigne un contenu qui ne change jamais : téléverser une
 * nouvelle image crée un nouvel enregistrement, elle n'écrase pas la précédente.
 * La réponse peut donc être déclarée `immutable` et mise en cache un an — le
 * navigateur et le CDN ne redemanderont plus jamais le fichier, ce qui annule
 * le surcoût du stockage en base.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^[a-z0-9]+$/i.test(id)) {
    return new NextResponse('Introuvable', { status: 404 });
  }

  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { data: true, mimeType: true, size: true },
  });

  if (!asset) return new NextResponse('Introuvable', { status: 404 });

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      'Content-Type': asset.mimeType,
      'Content-Length': String(asset.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      // Le contenu est renvoyé tel quel : on interdit au navigateur de deviner
      // un autre type, ce qui neutralise les fichiers déguisés en image.
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
