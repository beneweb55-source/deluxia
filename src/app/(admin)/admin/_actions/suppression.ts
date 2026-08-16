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

  await prisma.product.deleteMany({ where: { id: { in: selection } } });

  revalidateAll();

  return {
    supprimes: selection.length,
    masques: 0,
    message: `${selection.length} produit${selection.length > 1 ? 's' : ''} supprimé${selection.length > 1 ? 's' : ''}.`,
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

  await prisma.category.deleteMany({ where: { id: { in: selection } } });

  revalidateAll();

  const parts = [`${selection.length} catégorie${selection.length > 1 ? 's' : ''} supprimée${selection.length > 1 ? 's' : ''}`];
  if (productResult.supprimes > 0) parts.push(`${productResult.supprimes} produit${productResult.supprimes > 1 ? 's' : ''} supprimé${productResult.supprimes > 1 ? 's' : ''}`);

  return { supprimes: selection.length, masques: 0, message: parts.join(', ') + '.' };
}

/** Variante interne : même logique produit, sans revalidation intermédiaire. */
async function bulkRemoveProductsInternal(ids: string[]): Promise<DeletionResult> {
  if (ids.length === 0) return { supprimes: 0, masques: 0, message: '' };

  await prisma.product.deleteMany({ where: { id: { in: ids } } });

  return { supprimes: ids.length, masques: 0, message: '' };
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

  await prisma.collection.deleteMany({ where: { id: { in: selection } } });

  revalidateAll();

  const parts = [`${selection.length} collection${selection.length > 1 ? 's' : ''} supprimée${selection.length > 1 ? 's' : ''}`];
  if (categoryResult.message) parts.push(categoryResult.message.replace(/\.$/, ''));

  return { supprimes: selection.length, masques: 0, message: parts.join(', ') + '.' };
}
