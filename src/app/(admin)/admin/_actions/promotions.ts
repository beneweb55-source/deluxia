'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export type PromotionTarget =
  | { type: 'all' }
  | { type: 'collection'; id: string }
  | { type: 'category'; id: string }
  | { type: 'products'; ids: string[] };

export interface ActionState {
  error?: string;
  success?: string;
}

function revalidateCatalogue() {
  revalidatePath('/', 'page');
  revalidatePath('/boutique');
  revalidatePath('/collections');
  revalidatePath('/c', 'layout');
  revalidatePath('/chaussures');
  revalidatePath('/sacs');
  revalidatePath('/accessoires');
  revalidatePath('/nouveautes');
  revalidatePath('/promotions');
}

export async function applyBulkPromotion(
  target: PromotionTarget,
  percentage: number,
): Promise<ActionState> {
  await requireAdmin();

  if (percentage < 0 || percentage > 99) {
    return { error: 'Le pourcentage doit être compris entre 0 et 99.' };
  }

  let ids: string[] = [];

  try {
    if (target.type === 'products') {
      ids = target.ids;
    } else if (target.type === 'category') {
      const products = await prisma.product.findMany({
        where: { categoryId: target.id },
        select: { id: true },
      });
      ids = products.map((p) => p.id);
    } else if (target.type === 'collection') {
      const products = await prisma.product.findMany({
        where: { category: { collectionId: target.id } },
        select: { id: true },
      });
      ids = products.map((p) => p.id);
    } else if (target.type === 'all') {
      const products = await prisma.product.findMany({ select: { id: true } });
      ids = products.map((p) => p.id);
    }

    if (ids.length === 0) {
      return { error: 'Aucun produit ne correspond à cette cible.' };
    }

    if (percentage === 0) {
      // Retirer la promotion
      await prisma.$executeRaw`
        UPDATE products
        SET price = "comparePrice", "comparePrice" = NULL
        WHERE "comparePrice" IS NOT NULL AND id IN (${Prisma.join(ids)})
      `;
    } else {
      // Appliquer la promotion
      await prisma.$executeRaw`
        UPDATE products
        SET 
          "comparePrice" = CASE WHEN "comparePrice" IS NULL THEN price ELSE "comparePrice" END,
          price = CAST(ROUND(COALESCE("comparePrice", price) * (1 - ${percentage}::numeric / 100.0)) AS INTEGER)
        WHERE id IN (${Prisma.join(ids)})
      `;
    }

    revalidateCatalogue();
    revalidatePath('/admin/produits');
    
    return { 
      success: percentage === 0 
        ? `Les promotions ont été retirées sur ${ids.length} produit(s).` 
        : `Une promotion de -${percentage}% a été appliquée sur ${ids.length} produit(s).` 
    };  } catch (error) {
    console.error('[admin] erreur application promotion', error);
    return { error: "Une erreur est survenue lors de l'application de la promotion." };
  }
}
