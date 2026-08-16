'use client';

import Image from 'next/image';
import { useCallback, useId, useRef, useState, type DragEvent } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, TrashIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * Téléversement des visuels produit.
 *
 * Le champ est un `<input type="file">` natif : sur ordinateur il ouvre
 * l'explorateur du système, sur mobile il propose la galerie et l'appareil
 * photo. L'attribut `capture` est volontairement omis — le préciser forcerait
 * l'appareil photo et empêcherait de choisir une photo déjà prise, ce qui est
 * pourtant le cas le plus fréquent.
 *
 * Chaque image est **redimensionnée et convertie en WebP par le navigateur**
 * avant l'envoi. Une photo de téléphone de 4 Mo devient un fichier de 150 à
 * 300 Ko : l'envoi devient supportable en 3G, et la base ne gonfle pas.
 */

/** Côté le plus long après redimensionnement. Au-delà, l'œil ne voit plus rien. */
const MAX_EDGE = 1600;
const QUALITY = 0.85;
const MAX_IMAGES = 8;

interface UploadState {
  name: string;
  status: 'compression' | 'envoi' | 'erreur';
  message?: string;
}

export function ImageUploader({
  name = 'images',
  initial = [],
  productName,
}: {
  /** Nom du champ transmis au formulaire. */
  name?: string;
  initial?: string[];
  productName: string;
}) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      const room = MAX_IMAGES - urls.length;
      if (room <= 0) {
        setError(`Maximum ${MAX_IMAGES} visuels par produit.`);
        return;
      }

      const selected = Array.from(files)
        .filter((file) => file.type.startsWith('image/') || file.name.toLowerCase().match(/\.hei[cf]$/))
        .slice(0, room);

      if (selected.length === 0) {
        setError('Choisissez des fichiers image (JPEG, PNG, WebP, HEIC).');
        return;
      }

      for (const file of selected) {
        setUploads((current) => [...current, { name: file.name, status: 'compression' }]);

        try {
          const compressed = await compress(file);

          setUploads((current) =>
            current.map((item) =>
              item.name === file.name ? { ...item, status: 'envoi' } : item,
            ),
          );

          const body = new FormData();
          body.append('file', compressed, compressed.name);

          const response = await fetch('/api/admin/media', { method: 'POST', body });
          let data: { url?: string; message?: string } = {};

          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
          }

          if (!response.ok || !data.url) {
            throw new Error(
              data.message ??
                (response.status === 413
                  ? 'Image trop lourde (4 Mo maximum).'
                  : `Erreur serveur (${response.status})`),
            );
          }

          setUrls((current) => [...current, data.url!]);
          setUploads((current) => current.filter((item) => item.name !== file.name));
        } catch (cause) {
          const message = cause instanceof Error ? cause.message : 'Envoi impossible.';
          setUploads((current) =>
            current.map((item) =>
              item.name === file.name ? { ...item, status: 'erreur', message } : item,
            ),
          );
        }
      }

      // Réinitialise le champ pour permettre de re-sélectionner le même fichier.
      if (inputRef.current) inputRef.current.value = '';
    },
    [urls.length],
  );

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= urls.length) return;

    setUrls((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      if (moved) next.splice(target, 0, moved);
      return next;
    });
  };

  const remove = (index: number) => setUrls((current) => current.filter((_, i) => i !== index));

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  };

  return (
    <div>
      {/* La valeur transmise au serveur : une URL par ligne, format déjà
          attendu par l'action d'enregistrement du produit. */}
      <input type="hidden" name={name} value={urls.join('\n')} />

      {/* ── Zone de dépôt ─────────────────────────────────────────────────── */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border border-dashed p-6 text-center transition-colors duration-200',
          dragging ? 'border-ink bg-mist' : 'border-line',
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
        />

        <label
          htmlFor={inputId}
          className="inline-flex h-11 cursor-pointer items-center gap-2.5 border border-ink bg-ink px-6 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-paper transition-opacity hover:opacity-80"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Ajouter des photos
        </label>

        <p className="mt-4 text-[0.8125rem] leading-relaxed text-graphite">
          Depuis votre téléphone, choisissez dans la galerie ou prenez la photo directement.
          <span className="hidden sm:inline"> Sur ordinateur, vous pouvez aussi déposer les fichiers ici.</span>
        </p>
        <p className="mt-1.5 text-[0.75rem] text-ash">
          {urls.length} / {MAX_IMAGES} visuels · JPEG, PNG, WebP, HEIC · compression automatique
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          {error}
        </p>
      )}

      {/* ── Envois en cours ───────────────────────────────────────────────── */}
      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2">
          {uploads.map((upload) => (
            <li
              key={upload.name}
              className="flex items-center justify-between gap-4 border border-line px-4 py-2.5 text-[0.8125rem]"
            >
              <span className="truncate text-graphite">{upload.name}</span>
              <span className={cn('shrink-0', upload.status === 'erreur' ? 'text-ink' : 'text-ash')}>
                {upload.status === 'compression' && 'Compression…'}
                {upload.status === 'envoi' && 'Envoi…'}
                {upload.status === 'erreur' && (upload.message ?? 'Échec')}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* ── Visuels enregistrés ───────────────────────────────────────────── */}
      {urls.length > 0 && (
        <>
          <p className="mt-7 text-[0.8125rem] text-graphite">
            Le premier visuel sert de photo principale dans la boutique. Utilisez les flèches pour
            changer l&rsquo;ordre.
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {urls.map((url, index) => (
              <li key={url} className="group relative">
                <div className="relative aspect-4/5 overflow-hidden bg-mist">
                  <Image
                    src={url}
                    alt={`${productName} — visuel ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 45vw, 20vw"
                    className="object-cover"
                    unoptimized
                  />

                  {index === 0 && (
                    <span className="absolute left-2 top-2 bg-ink px-2 py-1 text-[0.5625rem] font-medium uppercase tracking-[0.14em] text-paper">
                      Principale
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-1">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Déplacer le visuel ${index + 1} vers la gauche`}
                      className="inline-flex h-8 w-8 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === urls.length - 1}
                      aria-label={`Déplacer le visuel ${index + 1} vers la droite`}
                      className="inline-flex h-8 w-8 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
                    >
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`Retirer le visuel ${index + 1}`}
                    className="inline-flex h-8 w-8 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {urls.length === 0 && uploads.length === 0 && (
        <p className="mt-5 border-l-2 border-line pl-4 text-[0.8125rem] leading-relaxed text-graphite">
          Sans photo, la boutique affiche une composition DELUXIA générée automatiquement. Le produit
          reste vendable — mais une vraie photo convertit toujours mieux.
        </p>
      )}
    </div>
  );
}

/**
 * Redimensionne et convertit une image dans le navigateur.
 *
 * `createImageBitmap` décode l'image hors du fil principal, ce qui évite de
 * figer l'interface sur une photo de 12 mégapixels. En cas d'échec — format
 * exotique, navigateur ancien — le fichier d'origine est envoyé tel quel : mieux
 * vaut un envoi plus lourd qu'un téléversement impossible.
 */
async function compress(file: File): Promise<File> {
  try {
    let sourceFile = file;
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().match(/\.hei[cf]$/);

    if (isHeic) {
      const heic2any = (await import('heic2any')).default;
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0]! : convertedBlob;
      const baseName = file.name.replace(/\.hei[cf]$/i, '.jpg');
      sourceFile = new File([blob], baseName, { type: 'image/jpeg' });
    }

    const bitmap = await createImageBitmap(sourceFile);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', QUALITY);
    });

    // Un navigateur sans encodeur WebP (ex: anciens iPhone) renvoie du PNG.
    // Dans ce cas, on bascule sur une compression JPEG classique.
    if (!blob || blob.type !== 'image/webp') {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', QUALITY);
      });
    }

    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, '') || 'visuel';
    const ext = blob.type === 'image/jpeg' ? 'jpg' : 'webp';
    return new File([blob], `${base}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SingleImageUploader — version mono-image pour collections et catégories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Téléversement d'un visuel unique (collection ou catégorie).
 *
 * Même mécanisme que `ImageUploader` : compression WebP côté navigateur puis
 * envoi vers `/api/admin/media`. La différence est qu'on gère une seule URL
 * au lieu d'un tableau, sans réordonnement.
 */
export function SingleImageUploader({
  name = 'imageUrl',
  initial = '',
  label = 'Photo',
}: {
  /** Nom du champ transmis au formulaire. */
  name?: string;
  /** URL de l'image existante, ou vide. */
  initial?: string;
  /** Libellé affiché au-dessus de la zone. */
  label?: string;
}) {
  const [url, setUrl] = useState<string>(initial);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);

      const file = Array.from(files).find(
        (f) => f.type.startsWith('image/') || f.name.toLowerCase().match(/\.hei[cf]$/),
      );
      if (!file) {
        setError('Choisissez un fichier image (JPEG, PNG, WebP, HEIC).');
        return;
      }

      setUpload({ name: file.name, status: 'compression' });

      try {
        const compressed = await compress(file);

        setUpload({ name: file.name, status: 'envoi' });

        const body = new FormData();
        body.append('file', compressed, compressed.name);

        const response = await fetch('/api/admin/media', { method: 'POST', body });
        let data: { url?: string; message?: string } = {};

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        }

        if (!response.ok || !data.url) {
          throw new Error(
            data.message ??
              (response.status === 413
                ? 'Image trop lourde (4 Mo maximum).'
                : `Erreur serveur (${response.status})`),
          );
        }

        setUrl(data.url);
        setUpload(null);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Envoi impossible.';
        setUpload({ name: file.name, status: 'erreur', message });
      }

      if (inputRef.current) inputRef.current.value = '';
    },
    [],
  );

  const remove = () => setUrl('');

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  };

  return (
    <div>
      <input type="hidden" name={name} value={url} />

      <p className="mb-2 text-[0.8125rem] font-medium text-ink">{label}</p>

      {/* ── Visuel existant ──────────────────────────────────────────────── */}
      {url ? (
        <div className="relative inline-block">
          <div className="relative aspect-4/5 w-40 overflow-hidden bg-mist sm:w-48">
            <Image
              src={url}
              alt={label}
              fill
              sizes="12rem"
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="mt-2 flex gap-1">
            <label
              htmlFor={inputId}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 border border-line px-3 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-graphite transition-colors hover:border-ink hover:text-ink"
            >
              Remplacer
            </label>
            <button
              type="button"
              onClick={remove}
              aria-label="Retirer la photo"
              className="inline-flex h-8 w-8 items-center justify-center border border-line text-graphite transition-colors hover:border-ink hover:text-ink"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
            onChange={(event) => void handleFiles(event.target.files)}
            className="sr-only"
          />
        </div>
      ) : (
        /* ── Zone de dépôt ─────────────────────────────────────────────── */
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'border border-dashed p-5 text-center transition-colors duration-200',
            dragging ? 'border-ink bg-mist' : 'border-line',
          )}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
            onChange={(event) => void handleFiles(event.target.files)}
            className="sr-only"
          />

          <label
            htmlFor={inputId}
            className="inline-flex h-10 cursor-pointer items-center gap-2 border border-ink bg-ink px-5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-80"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Ajouter une photo
          </label>

          <p className="mt-3 text-[0.75rem] text-ash">
            JPEG, PNG, WebP, HEIC · compression automatique
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 border-l-2 border-ink pl-4 text-[0.8125rem] text-ink">
          {error}
        </p>
      )}

      {upload && (
        <p className="mt-3 text-[0.8125rem] text-ash">
          {upload.status === 'compression' && 'Compression…'}
          {upload.status === 'envoi' && 'Envoi…'}
          {upload.status === 'erreur' && (upload.message ?? 'Échec')}
        </p>
      )}

      {!url && !upload && (
        <p className="mt-3 text-[0.75rem] text-graphite">
          Sans photo, la boutique affiche un visuel généré automatiquement.
        </p>
      )}
    </div>
  );
}

