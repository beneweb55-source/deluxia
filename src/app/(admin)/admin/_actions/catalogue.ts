'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/format';

/**
 * Actions du catalogue — produits et catégories.
 *
 * Toutes commencent par `requireAdmin()` : une Server Action est un point
 * d'entrée HTTP à part entière, et le fait que le bouton qui l'appelle soit
 * derrière une page protégée ne protège pas l'action elle-même.
 *
 * Les caches des pages publiques sont invalidés à chaque écriture, afin qu'une
 * modification faite dans l'administration soit visible immédiatement sur la
 * boutique — sans attendre l'expiration de la revalidation périodique.
 */

export interface ActionState {
  error?: string;
  success?: string;
}

/** Invalide les pages qui affichent du catalogue. */
function revalidateCatalogue(slug?: string) {
  revalidatePath('/', 'page');
  revalidatePath('/boutique');
  revalidatePath('/collections');
  revalidatePath('/c', 'layout');
  revalidatePath('/chaussures');
  revalidatePath('/sacs');
  revalidatePath('/accessoires');
  revalidatePath('/nouveautes');
  revalidatePath('/promotions');
  if (slug) revalidatePath(`/produit/${slug}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Produits
// ─────────────────────────────────────────────────────────────────────────────

const variantSchema = z.object({
  size: z.string().trim().min(1, 'Taille requise.').max(12),
  color: z.string().trim().min(1, 'Couleur requise.').max(40),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale invalide.')
    .default('#0A0A0A'),
  stock: z.coerce.number().int().min(0).max(9999),
});

const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Le nom est requis.').max(120),
    slug: z.string().trim().max(90).optional(),
    subtitle: z.string().trim().max(160).optional(),
    description: z.string().trim().min(10, 'Décrivez le produit en quelques lignes.').max(4000),
    composition: z.string().trim().max(2000).optional(),
    care: z.string().trim().max(2000).optional(),
    sku: z.string().trim().min(2, 'La référence est requise.').max(40),
    price: z.coerce.number().int().min(1, 'Le prix doit être supérieur à zéro.').max(10_000_000),
    comparePrice: z.coerce.number().int().min(0).max(10_000_000).optional(),
    categoryId: z.string().min(1, 'Choisissez une catégorie.'),
    images: z.array(z.string().trim().max(500)).max(10).default([]),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isNew: z.boolean().default(false),
    position: z.coerce.number().int().min(0).max(9999).default(0),
    variants: z.array(variantSchema).min(1, 'Ajoutez au moins une taille.').max(60),
  })
  .refine((data) => !data.comparePrice || data.comparePrice > data.price, {
    message: 'Le prix barré doit être supérieur au prix de vente.',
    path: ['comparePrice'],
  });

/** Extrait et normalise les champs du formulaire produit. */
function readProductForm(formData: FormData) {
  const rawVariants = formData.get('variants');
  let variants: unknown = [];

  try {
    variants = rawVariants ? JSON.parse(String(rawVariants)) : [];
  } catch {
    variants = [];
  }

  const images = String(formData.get('images') ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const compare = String(formData.get('comparePrice') ?? '').trim();

  return productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    subtitle: formData.get('subtitle') || undefined,
    description: formData.get('description'),
    composition: formData.get('composition') || undefined,
    care: formData.get('care') || undefined,
    sku: formData.get('sku'),
    price: formData.get('price'),
    comparePrice: compare === '' ? undefined : compare,
    categoryId: formData.get('categoryId'),
    images,
    isActive: formData.get('isActive') === 'on',
    isFeatured: formData.get('isFeatured') === 'on',
    isNew: formData.get('isNew') === 'on',
    position: formData.get('position') || 0,
    variants,
  });
}

/** Message clair pour les violations de contrainte d'unicité. */
function uniqueError(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return null;
  const target = String(error.meta?.target ?? '');
  if (target.includes('sku')) return 'Cette référence (SKU) est déjà utilisée par un autre produit.';
  if (target.includes('slug')) return 'Cette adresse URL est déjà utilisée. Modifiez le nom ou le slug.';
  return 'Une valeur unique est déjà utilisée par un autre enregistrement.';
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = readProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  let created: { slug: string };

  try {
    created = await prisma.product.create({
      data: {
        slug,
        name: data.name,
        subtitle: data.subtitle ?? null,
        description: data.description,
        composition: data.composition ?? null,
        care: data.care ?? null,
        sku: data.sku.toUpperCase(),
        price: data.price,
        comparePrice: data.comparePrice ?? null,
        categoryId: data.categoryId,
        images: data.images,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
        isNew: data.isNew,
        position: data.position,
        variants: {
          create: data.variants.map((variant, index) => ({ ...variant, position: index })),
        },
      },
      select: { slug: true },
    });
  } catch (error) {
    const message = uniqueError(error);
    if (message) return { error: message };
    console.error('[admin] création produit', error);
    return { error: "Le produit n'a pas pu être créé." };
  }

  revalidateCatalogue(created.slug);
  redirect('/admin/produits?cree=1');
}

export async function updateProduct(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = readProductForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  const data = parsed.data;
  const slug = slugify(data.slug || data.name);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          slug,
          name: data.name,
          subtitle: data.subtitle ?? null,
          description: data.description,
          composition: data.composition ?? null,
          care: data.care ?? null,
          sku: data.sku.toUpperCase(),
          price: data.price,
          comparePrice: data.comparePrice ?? null,
          categoryId: data.categoryId,
          images: data.images,
          isActive: data.isActive,
          isFeatured: data.isFeatured,
          isNew: data.isNew,
          position: data.position,
        },
      });

      // Les déclinaisons sont remplacées en bloc : c'est le comportement que
      // l'éditeur laisse attendre (on voit la liste complète à l'écran).
      // Les lignes de commande gardent une copie figée du produit, elles ne
      // sont donc pas affectées par cette suppression.
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productVariant.createMany({
        data: data.variants.map((variant, index) => ({
          ...variant,
          productId: id,
          position: index,
        })),
      });
    });
  } catch (error) {
    const message = uniqueError(error);
    if (message) return { error: message };
    console.error('[admin] mise à jour produit', error);
    return { error: "Le produit n'a pas pu être enregistré." };
  }

  revalidateCatalogue(slug);
  return { success: 'Produit enregistré.' };
}

/**
 * Suppression d'un produit.
 * Si le produit apparaît dans des commandes, il est désactivé au lieu d'être
 * supprimé : effacer une référence commandée rendrait l'historique illisible.
 */
export async function deleteProduct(id: string): Promise<void> {
  await requireAdmin();

  const orderedCount = await prisma.orderItem.count({ where: { productId: id } });

  if (orderedCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  revalidateCatalogue();
  redirect('/admin/produits?supprime=1');
}

/** Bascule rapide de la visibilité depuis la liste des produits. */
export async function toggleProductActive(id: string, isActive: boolean): Promise<void> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidateCatalogue();
  revalidatePath('/admin/produits');
}

/** Bascule « produit vedette » ou « nouveauté », directement depuis le tableau. */
export async function toggleProductFlag(
  id: string,
  flag: 'isFeatured' | 'isNew',
  value: boolean,
): Promise<void> {
  await requireAdmin();
  await prisma.product.update({ where: { id }, data: { [flag]: value } });
  revalidateCatalogue();
  revalidatePath('/admin/produits');
}

/**
 * Suppression depuis la liste des produits.
 *
 * Variante de `deleteProduct` qui ne redirige pas : appelée depuis un tableau,
 * une redirection ferait clignoter la page alors qu'on est déjà au bon endroit.
 * Même règle de fond : un produit déjà commandé est masqué, pas effacé, sinon
 * l'historique des commandes deviendrait illisible.
 */
export async function removeProduct(id: string): Promise<void> {
  await requireAdmin();

  const orderedCount = await prisma.orderItem.count({ where: { productId: id } });

  if (orderedCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  revalidateCatalogue();
  revalidatePath('/admin/produits');
}

/**
 * Duplique un produit, déclinaisons comprises.
 *
 * Une boutique de chaussures référence souvent le même modèle en plusieurs
 * coloris : dupliquer puis ajuster prend trente secondes, contre plusieurs
 * minutes de ressaisie. La copie est créée masquée, pour qu'un brouillon
 * incomplet n'apparaisse jamais en boutique.
 */
export async function duplicateProduct(id: string): Promise<void> {
  await requireAdmin();

  const source = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { position: 'asc' } } },
  });

  if (!source) return;

  // Le slug et la référence sont uniques : on cherche le premier suffixe libre
  // plutôt que d'échouer sur une contrainte.
  let suffix = 2;
  let slug = `${source.slug}-${suffix}`;
  let sku = `${source.sku}-${suffix}`;

  while (
    await prisma.product.findFirst({
      where: { OR: [{ slug }, { sku }] },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${source.slug}-${suffix}`;
    sku = `${source.sku}-${suffix}`;
    if (suffix > 50) return; // sécurité : jamais de boucle infinie
  }

  await prisma.product.create({
    data: {
      slug,
      sku,
      name: `${source.name} (copie)`,
      subtitle: source.subtitle,
      description: source.description,
      composition: source.composition,
      care: source.care,
      price: source.price,
      comparePrice: source.comparePrice,
      categoryId: source.categoryId,
      images: source.images,
      isActive: false,
      isFeatured: false,
      isNew: source.isNew,
      position: source.position,
      variants: {
        create: source.variants.map((variant) => ({
          size: variant.size,
          color: variant.color,
          colorHex: variant.colorHex,
          stock: variant.stock,
          position: variant.position,
        })),
      },
    },
  });

  revalidatePath('/admin/produits');
}

/**
 * Correction rapide du prix et du stock depuis le tableau.
 *
 * Le stock se règle par déclinaison. `stockDelta` s'applique à toutes les
 * déclinaisons du produit : c'est ce qu'on veut après un réassort, où la même
 * quantité arrive dans chaque pointure.
 */
export async function quickEditProduct(
  id: string,
  patch: { price?: number; stockDelta?: number },
): Promise<void> {
  await requireAdmin();

  if (patch.price !== undefined && Number.isFinite(patch.price) && patch.price > 0) {
    await prisma.product.update({
      where: { id },
      data: { price: Math.round(patch.price) },
    });
  }

  if (patch.stockDelta) {
    const delta = Math.round(patch.stockDelta);

    if (delta > 0) {
      await prisma.productVariant.updateMany({
        where: { productId: id },
        data: { stock: { increment: delta } },
      });
    } else {
      // `gte` évite qu'une déclinaison tombe en stock négatif.
      await prisma.productVariant.updateMany({
        where: { productId: id, stock: { gte: -delta } },
        data: { stock: { increment: delta } },
      });
    }
  }

  revalidateCatalogue();
  revalidatePath('/admin/produits');
}

// ─────────────────────────────────────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Le nom est requis.').max(60),
  slug: z.string().trim().max(60).optional(),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  collectionId: z.string().min(1, 'Choisissez une collection.'),
  position: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

function readCategoryForm(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || undefined,
    tagline: formData.get('tagline') || undefined,
    description: formData.get('description') || undefined,
    imageUrl: formData.get('imageUrl') || undefined,
    collectionId: formData.get('collectionId'),
    position: formData.get('position') || 0,
    isActive: formData.get('isActive') === 'on',
  });
}

export async function saveCategory(
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = readCategoryForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.' };

  const data = parsed.data;
  const payload = {
    name: data.name,
    slug: slugify(data.slug || data.name),
    tagline: data.tagline ?? null,
    description: data.description ?? null,
    imageUrl: data.imageUrl || null,
    collectionId: data.collectionId,
    position: data.position,
    isActive: data.isActive,
  };

  try {
    if (id) await prisma.category.update({ where: { id }, data: payload });
    else await prisma.category.create({ data: payload });
  } catch (error) {
    const message = uniqueError(error);
    if (message) return { error: message };
    console.error('[admin] enregistrement catégorie', error);
    return { error: "La catégorie n'a pas pu être enregistrée." };
  }

  revalidateCatalogue();
  revalidatePath('/admin/categories');
  return { success: id ? 'Catégorie mise à jour.' : 'Catégorie créée.' };
}

/** Une catégorie contenant des produits ne peut pas être supprimée. */
export async function deleteCategory(id: string): Promise<void> {
  await requireAdmin();

  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    redirect('/admin/categories?erreur=non-vide');
  }

  await prisma.category.delete({ where: { id } });
  revalidateCatalogue();
  redirect('/admin/categories?supprime=1');
}
