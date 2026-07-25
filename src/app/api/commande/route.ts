import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { orderSchema } from '@/lib/order-schema';
import { getDeliveryOptions } from '@/lib/delivery-rates';
import { findOption, quoteDelivery } from '@/lib/delivery-quote';

/**
 * Création d'une commande.
 *
 * Principe directeur : **rien de ce qui vient du navigateur n'est utilisé pour
 * calculer un montant.** Le client n'envoie que des identifiants et des
 * quantités ; prix, frais de livraison et total sont entièrement recalculés ici
 * à partir de la base et de la grille tarifaire. Un panier modifié dans la
 * console du navigateur ne change donc pas un dinar au montant enregistré.
 *
 * Le stock est décrémenté dans la même transaction que la création de la
 * commande : deux clients qui achètent la dernière paire au même instant ne
 * peuvent pas réussir tous les deux.
 */

/** Référence lisible : DLX-AAMM-NNNN (année, mois, compteur mensuel). */
async function nextReference(tx: Prisma.TransactionClient): Promise<string> {
  const now = new Date();
  const prefix = `DLX-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const last = await tx.order.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });

  const lastNumber = last ? Number(last.reference.split('-')[2] ?? '0') : 0;
  return `${prefix}-${String(lastNumber + 1).padStart(4, '0')}`;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Requête illisible.' }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(payload);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return NextResponse.json(
      { message: 'Certaines informations sont incomplètes.', fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // La grille tarifaire est relue en base à chaque commande : c'est elle qui
  // fait foi, jamais ce que le navigateur a calculé ni ce qu'il a envoyé.
  const options = await getDeliveryOptions();
  const wilaya = findOption(options, input.wilayaCode);
  const quote = quoteDelivery(wilaya, input.deliveryType);

  if (!wilaya || quote.unavailable) {
    return NextResponse.json(
      {
        message:
          "Nous ne livrons pas encore cette wilaya. Appelez-nous, nous chercherons une solution.",
        fieldErrors: { wilayaCode: 'Wilaya non desservie.' },
      },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      // ── 1. Relecture des déclinaisons commandées ─────────────────────────
      const variants = await tx.productVariant.findMany({
        where: { id: { in: input.items.map((item) => item.variantId) } },
        select: {
          id: true,
          size: true,
          color: true,
          stock: true,
          productId: true,
          product: {
            select: { id: true, name: true, slug: true, price: true, images: true, isActive: true },
          },
        },
      });

      const byId = new Map(variants.map((variant) => [variant.id, variant]));

      // ── 2. Construction des lignes à partir des prix de la base ──────────
      const lines = input.items.map((item) => {
        const variant = byId.get(item.variantId);

        if (!variant || variant.productId !== item.productId || !variant.product.isActive) {
          throw new OrderError("Un article de votre panier n'est plus disponible.");
        }
        if (variant.stock < item.quantity) {
          throw new OrderError(
            `« ${variant.product.name} » en taille ${variant.size} n'est plus disponible en quantité suffisante.`,
          );
        }

        return {
          variantId: variant.id,
          productId: variant.product.id,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          imageUrl: variant.product.images[0] ?? null,
          size: variant.size,
          color: variant.color,
          unitPrice: variant.product.price,
          quantity: item.quantity,
          lineTotal: variant.product.price * item.quantity,
        };
      });

      const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
      const total = subtotal + quote.fee;

      // ── 3. Décrément du stock, conditionné à la disponibilité ────────────
      for (const line of lines) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });

        // 0 ligne modifiée = le stock est passé sous la quantité entre-temps.
        if (updated.count !== 1) {
          throw new OrderError(
            `« ${line.productName} » en taille ${line.size} vient d'être épuisé. Ajustez votre panier.`,
          );
        }
      }

      // ── 4. Fiche client (créée ou mise à jour) ───────────────────────────
      const customer = await tx.customer.upsert({
        where: { phone: input.phone },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          wilayaCode: input.wilayaCode,
          commune: input.commune,
          address: input.address,
          totalOrders: { increment: 1 },
          totalSpent: { increment: total },
        },
        create: {
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
          wilayaCode: input.wilayaCode,
          commune: input.commune,
          address: input.address,
          totalOrders: 1,
          totalSpent: total,
        },
        select: { id: true },
      });

      // ── 5. Commande ──────────────────────────────────────────────────────
      return tx.order.create({
        data: {
          reference: await nextReference(tx),
          customerId: customer.id,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          phoneAlt: input.phoneAlt ?? null,
          wilayaCode: wilaya.code,
          wilayaName: wilaya.name,
          commune: input.commune,
          address: input.address,
          notes: input.notes ?? null,
          // `quote.mode` et non `input.deliveryType` : si la wilaya n'a pas de
          // bureau, le mode a été corrigé en « domicile » par le calculateur.
          deliveryType: quote.mode,
          subtotal,
          deliveryFee: quote.fee,
          total,
          items: {
            create: lines.map(({ variantId: _variantId, ...line }) => line),
          },
          events: {
            create: { status: 'EN_ATTENTE', note: 'Commande reçue depuis le site.' },
          },
        },
        select: { reference: true, total: true },
      });
    });

    return NextResponse.json({ reference: order.reference, total: order.total }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error('[commande] échec de création', error);
    return NextResponse.json(
      { message: "La commande n'a pas pu être enregistrée. Réessayez ou appelez-nous." },
      { status: 500 },
    );
  }
}

/** Erreur métier destinée à être affichée telle quelle au client. */
class OrderError extends Error {}
