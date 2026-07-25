'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/**
 * Suppressions groupées et en cascade.
 *
 * Regroupées ici parce qu'elles partagent une même règle de sûreté : une
 * suppression descend toujours la hiérarchie dans le bon ordre
 * — produits, puis catégories, puis collection — car les relations Prisma sont
 * en `Restrict` et refusent d'effacer un parent encore référencé.
 *
 * Ce que la suppression d'un produit déjà commandé ne casse pas : chaque ligne
 * de commande conserve une copie figée du nom, de la taille, de la couleur et
 * du prix. Le lien vers la fiche produit disparaît, l'historique reste lisible
 * et les totaux restent justes.
 */

/** Rafraîchit tout ce qui dépend du catalogue. */
function revalidateAll() {
  revalidatePath('/', 'layout');
  revalidatePath('/admin/produits');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/collections');
}

/** Borne de sécurité : une sélection plus large vient forcément d'une erreur. */
const MAX_SELECTION = 200;

export interface DeletionResult {
  supprimes: number;
  masques: number;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Produits
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supprime plusieurs produits d'un coup.
 *
 * Un produit déjà commandé est **masqué** plutôt que supprimé : la gérante
 * consulte encore ces fiches depuis l'historique des commandes, et les effacer
 * casserait ce lien. Le compte rendu distingue les deux cas pour qu'elle sache
 * exactement ce qui s'est passé.
 */
export async function bulkRemoveProducts(ids: string[]): Promise<DeletionResult> {
  await requireAdmin();

  const selection = ids.slice(0, MAX_SELECTION);
  if (selection.length === 0) return { supprimes: 0, masques: 0, message: 'Aucun produit sélectionné.' };

  const ordered = await prisma.orderItem.findMany({
    where: { productId: { in: selection } },
    select: { productId: true },
    distinct: ['productId'],
  });

  const orderedIds = new Set(ordered.map((item) => item.productId).filter(Boolean) as string[]);
  const deletable = selection.filter((id) => !orderedIds.has(id));

  if (orderedIds.size > 0) {
    await prisma.product.updateMany({
      where: { id: { in: [...orderedIds] } },
      data: { isActive: false },
    });
  }

  if (deletable.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: deletable } } });
  }

  revalidateAll();

  const parts: string[] = [];
  if (deletable.length > 0) parts.push(`${deletable.length} produit${deletable.length > 1 ? 's' : ''} supprimé${deletable.length > 1 ? 's' : ''}`);
  if (orderedIds.size > 0) parts.push(`${orderedIds.size} masqué${orderedIds.size > 1 ? 's' : ''} car déjà commandé${orderedIds.size > 1 ? 's' : ''}`);

  return {
    supprimes: deletable.length,
    masques: orderedIds.size,
    message: parts.join(', ') + '.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supprime plusieurs catégories, produits compris.
 *
 * Contrairement à la suppression unitaire — qui refuse d'effacer une catégorie
 * non vide — cette action est explicitement destructrice : elle n'est déclenchée
 * qu'après un dialogue annonçant le nombre exact de produits concernés.
 */
export async function bulkDeleteCategories(ids: string[]): Promise<DeletionResult> {
  await requireAdmin();

  const selection = ids.slice(0, MAX_SELECTION);
  if (selection.length === 0) return { supprimes: 0, masques: 0, message: 'Aucune catégorie sélectionnée.' };

  const products = await prisma.product.findMany({
    where: { categoryId: { in: selection } },
    select: { id: true },
  });

  const productResult = await bulkRemoveProductsInternal(products.map((p) => p.id));

  // Une catégorie qui contient encore des produits masqués ne peut pas être
  // effacée : on la désactive, ce qui la retire de la boutique sans rien perdre.
  const remaining = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { categoryId: { in: selection } },
    _count: { _all: true },
  });

  const blocked = new Set(remaining.map((row) => row.categoryId));
  const deletable = selection.filter((id) => !blocked.has(id));

  if (blocked.size > 0) {
    await prisma.category.updateMany({ where: { id: { in: [...blocked] } }, data: { isActive: false } });
  }
  if (deletable.length > 0) {
    await prisma.category.deleteMany({ where: { id: { in: deletable } } });
  }

  revalidateAll();

  const parts = [`${deletable.length} catégorie${deletable.length > 1 ? 's' : ''} supprimée${deletable.length > 1 ? 's' : ''}`];
  if (blocked.size > 0) parts.push(`${blocked.size} masquée${blocked.size > 1 ? 's' : ''} (produits déjà commandés)`);
  if (productResult.supprimes > 0) parts.push(`${productResult.supprimes} produit${productResult.supprimes > 1 ? 's' : ''} supprimé${productResult.supprimes > 1 ? 's' : ''}`);
  if (productResult.masques > 0) parts.push(`${productResult.masques} produit${productResult.masques > 1 ? 's' : ''} masqué${productResult.masques > 1 ? 's' : ''}`);

  return { supprimes: deletable.length, masques: blocked.size, message: parts.join(', ') + '.' };
}

/** Variante interne : même logique produit, sans revalidation intermédiaire. */
async function bulkRemoveProductsInternal(ids: string[]): Promise<DeletionResult> {
  if (ids.length === 0) return { supprimes: 0, masques: 0, message: '' };

  const ordered = await prisma.orderItem.findMany({
    where: { productId: { in: ids } },
    select: { productId: true },
    distinct: ['productId'],
  });

  const orderedIds = new Set(ordered.map((item) => item.productId).filter(Boolean) as string[]);
  const deletable = ids.filter((id) => !orderedIds.has(id));

  if (orderedIds.size > 0) {
    await prisma.product.updateMany({ where: { id: { in: [...orderedIds] } }, data: { isActive: false } });
  }
  if (deletable.length > 0) {
    await prisma.product.deleteMany({ where: { id: { in: deletable } } });
  }

  return { supprimes: deletable.length, masques: orderedIds.size, message: '' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Collections
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Supprime des collections entières : catégories et produits compris.
 *
 * C'est l'action la plus destructrice de l'administration. Elle descend la
 * hiérarchie dans l'ordre imposé par les contraintes de clés étrangères, et
 * conserve — masqués — les produits qui apparaissent dans une commande.
 */
export async function bulkDeleteCollections(ids: string[]): Promise<DeletionResult> {
  await requireAdmin();

  const selection = ids.slice(0, MAX_SELECTION);
  if (selection.length === 0) return { supprimes: 0, masques: 0, message: 'Aucune collection sélectionnée.' };

  const categories = await prisma.category.findMany({
    where: { collectionId: { in: selection } },
    select: { id: true },
  });

  const categoryResult =
    categories.length > 0
      ? await bulkDeleteCategories(categories.map((c) => c.id))
      : { supprimes: 0, masques: 0, message: '' };

  // Une collection dont une catégorie a dû être conservée ne peut pas être
  // effacée non plus : elle est alors désactivée.
  const stillLinked = await prisma.category.groupBy({
    by: ['collectionId'],
    where: { collectionId: { in: selection } },
    _count: { _all: true },
  });

  const blocked = new Set(stillLinked.map((row) => row.collectionId).filter(Boolean) as string[]);
  const deletable = selection.filter((id) => !blocked.has(id));

  if (blocked.size > 0) {
    await prisma.collection.updateMany({ where: { id: { in: [...blocked] } }, data: { isActive: false } });
  }
  if (deletable.length > 0) {
    await prisma.collection.deleteMany({ where: { id: { in: deletable } } });
  }

  revalidateAll();

  const parts = [`${deletable.length} collection${deletable.length > 1 ? 's' : ''} supprimée${deletable.length > 1 ? 's' : ''}`];
  if (blocked.size > 0) parts.push(`${blocked.size} masquée${blocked.size > 1 ? 's' : ''}`);
  if (categoryResult.supprimes > 0) parts.push(`${categoryResult.supprimes} catégorie${categoryResult.supprimes > 1 ? 's' : ''}`);
  if (categoryResult.message) parts.push(categoryResult.message.replace(/\.$/, ''));

  return { supprimes: deletable.length, masques: blocked.size, message: parts.join(', ') + '.' };
}
