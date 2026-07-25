import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/order-schema';

/**
 * Consultation d'une commande — utilisée par la page de confirmation et par le
 * suivi de commande.
 *
 * La référence seule ne suffit pas : le numéro de téléphone du destinataire doit
 * correspondre. Les références étant séquentielles (DLX-2607-0001, 0002…), s'en
 * contenter permettrait à n'importe qui de parcourir les commandes des autres et
 * d'en lire les coordonnées.
 *
 * En cas d'échec, la réponse est toujours la même — 404 — que la référence
 * n'existe pas ou que le numéro ne corresponde pas : rien ne permet de deviner
 * quelles références sont valides.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const { reference } = await params;
  const phoneParam = new URL(request.url).searchParams.get('tel') ?? '';
  const phone = normalizePhone(phoneParam);

  if (!phone || !/^DLX-\d{4}-\d{4}$/.test(reference)) {
    return NextResponse.json({ message: 'Commande introuvable.' }, { status: 404 });
  }

  const order = await prisma.order.findFirst({
    where: { reference, phone },
    select: {
      reference: true,
      status: true,
      createdAt: true,
      firstName: true,
      lastName: true,
      phone: true,
      phoneAlt: true,
      wilayaName: true,
      commune: true,
      address: true,
      notes: true,
      deliveryType: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      items: {
        select: {
          productName: true,
          productSlug: true,
          imageUrl: true,
          size: true,
          color: true,
          unitPrice: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ message: 'Commande introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ order }, { headers: { 'Cache-Control': 'no-store' } });
}
