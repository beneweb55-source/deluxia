'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/format';
import type { ActionState } from './catalogue';

/** Invalide les pages affectées par les collections. */
function revalidateCollections() {
  revalidatePath('/', 'layout');
  revalidatePath('/', 'page');
  revalidatePath('/collections');
  revalidatePath('/c', 'layout');
}

const collectionSchema = z.object({
  name: z.string().trim().min(2, 'Le nom est requis.').max(60),
  slug: z.string().trim().max(60).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  position: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveCollection(
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = collectionSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    imageUrl: formData.get('imageUrl') || undefined,
    position: formData.get('position') || 0,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  const data = parsed.data;
  const payload = {
    name: data.name,
    slug: slugify(data.slug || data.name),
    imageUrl: data.imageUrl || null,
    position: data.position,
  };

  try {
    if (id) await prisma.collection.update({ where: { id }, data: payload });
    else await prisma.collection.create({ data: payload });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Cette adresse URL est déjà utilisée.' };
    }
    return { error: "La collection n'a pas pu être enregistrée." };
  }

  revalidateCollections();
  revalidatePath('/admin/collections');
  return { success: id ? 'Collection mise à jour.' : 'Collection créée.' };
}

export async function deleteCollection(id: string): Promise<void> {
  await requireAdmin();

  const categoryCount = await prisma.category.count({ where: { collectionId: id } });
  if (categoryCount > 0) {
    redirect('/admin/collections?erreur=non-vide');
  }

  await prisma.collection.delete({ where: { id } });
  revalidateCollections();
  redirect('/admin/collections?supprime=1');
}
