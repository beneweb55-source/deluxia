import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

/**
 * Réception d'un visuel produit.
 *
 * Le navigateur redimensionne et convertit déjà l'image avant l'envoi
 * (voir `ImageUploader`), ce qui évite d'installer une bibliothèque de
 * traitement d'images côté serveur et divise par dix le volume transféré — un
 * point qui compte sur une connexion mobile algérienne.
 *
 * Le serveur ne fait donc pas confiance au navigateur pour autant : il
 * revérifie le type déclaré, la taille, et lit les dimensions réelles dans
 * l'en-tête du fichier plutôt que dans les champs du formulaire.
 */

/** Plafond de sécurité, largement au-dessus de ce que produit la compression. */
const MAX_BYTES = 4 * 1024 * 1024; // 4 Mo

const ALLOWED = new Set(['image/webp', 'image/jpeg', 'image/png', 'image/avif']);

export async function POST(request: Request) {
  const admin = await getSessionUser();
  if (!admin) return NextResponse.json({ message: 'Accès refusé.' }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ message: 'Envoi illisible.' }, { status: 400 });
  }

  const file = form.get('file');

  if (!file || typeof file === 'string' || typeof (file as File).arrayBuffer !== 'function') {
    return NextResponse.json({ message: 'Aucun fichier reçu.' }, { status: 400 });
  }

  const uploadedFile = file as File;

  if (!ALLOWED.has(uploadedFile.type)) {
    return NextResponse.json(
      { message: 'Format non pris en charge. Utilisez JPEG, PNG ou WebP.' },
      { status: 415 },
    );
  }

  if (uploadedFile.size === 0 || uploadedFile.size > MAX_BYTES) {
    return NextResponse.json(
      { message: 'Image trop lourde (4 Mo maximum après compression).' },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await uploadedFile.arrayBuffer());
  const dimensions = readDimensions(bytes, uploadedFile.type);

  if (!dimensions) {
    return NextResponse.json(
      { message: "Ce fichier n'est pas une image valide." },
      { status: 415 },
    );
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      filename: sanitizeName(uploadedFile.name),
      mimeType: uploadedFile.type,
      width: dimensions.width,
      height: dimensions.height,
      size: bytes.byteLength,
      data: bytes,
    },
    select: { id: true, width: true, height: true, size: true },
  });

  return NextResponse.json(
    {
      url: `/api/media/${asset.id}`,
      width: asset.width,
      height: asset.height,
      size: asset.size,
    },
    { status: 201 },
  );
}

/** Retire tout ce qui pourrait poser problème dans un nom de fichier affiché. */
function sanitizeName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, '').slice(0, 120) || 'visuel';
}

/**
 * Lit les dimensions dans l'en-tête binaire du fichier.
 *
 * C'est aussi une validation de format : un fichier qui prétend être une image
 * mais dont l'en-tête ne correspond à rien de connu est rejeté, ce qui empêche
 * de stocker n'importe quoi en se contentant de renommer l'extension.
 */
function readDimensions(buffer: Buffer, mimeType: string): { width: number; height: number } | null {
  try {
    if (mimeType === 'image/png' && buffer.length > 24) {
      // Signature PNG, puis le chunk IHDR contient largeur et hauteur.
      if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }

    if (mimeType === 'image/webp' && buffer.length > 30) {
      if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
      const format = buffer.toString('ascii', 12, 16);

      // WebP simple (compression avec perte).
      if (format === 'VP8 ') {
        return {
          width: buffer.readUInt16LE(26) & 0x3fff,
          height: buffer.readUInt16LE(28) & 0x3fff,
        };
      }

      // WebP sans perte.
      if (format === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }

      // WebP étendu (transparence, animation…).
      if (format === 'VP8X') {
        const width = 1 + (buffer[24]! | (buffer[25]! << 8) | (buffer[26]! << 16));
        const height = 1 + (buffer[27]! | (buffer[28]! << 8) | (buffer[29]! << 16));
        return { width, height };
      }

      return null;
    }

    if (mimeType === 'image/jpeg' && buffer.length > 4) {
      if (buffer.readUInt16BE(0) !== 0xffd8) return null;

      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }

        const marker = buffer[offset + 1]!;
        // Marqueurs SOF, qui portent les dimensions de l'image.
        const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

        if (isSof) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
        }

        offset += 2 + buffer.readUInt16BE(offset + 2);
      }
      return null;
    }

    // AVIF : l'en-tête est complexe et son analyse n'apporterait rien ici. Le
    // navigateur a déjà validé le fichier en le décodant pour le compresser.
    if (mimeType === 'image/avif') return { width: 0, height: 0 };

    return null;
  } catch {
    return null;
  }
}
