/**
 * Génère des commandes de démonstration pour tester l'administration.
 * Usage : npx tsx scripts/dev-orders.ts
 * À ne jamais exécuter sur la base de production.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CUSTOMERS = [
  { firstName: 'Amel', lastName: 'Belkacem', phone: '0770112233', wilayaCode: 16, wilayaName: 'Alger', commune: 'Hydra', address: '12 rue des Frères Bouadou' },
  { firstName: 'Nesrine', lastName: 'Haddad', phone: '0661445566', wilayaCode: 31, wilayaName: 'Oran', commune: 'Bir El Djir', address: 'Cité Akid Lotfi, bât. B4' },
  { firstName: 'Lynda', lastName: 'Cherifi', phone: '0555778899', wilayaCode: 15, wilayaName: 'Tizi Ouzou', commune: 'Tizi Ouzou', address: 'Nouvelle ville, îlot 7' },
  { firstName: 'Sarah', lastName: 'Meziane', phone: '0779004455', wilayaCode: 25, wilayaName: 'Constantine', commune: 'El Khroub', address: 'Cité Massinissa, villa 22' },
];

async function main() {
  const variants = await prisma.productVariant.findMany({
    where: { stock: { gt: 1 } },
    take: 8,
    select: {
      id: true, size: true, color: true, productId: true,
      product: { select: { name: true, slug: true, price: true, images: true } },
    },
  });

  if (variants.length === 0) throw new Error('Aucune déclinaison en stock : lancez d’abord `npm run db:seed`.');

  const statuses = ['EN_ATTENTE', 'EN_ATTENTE', 'CONFIRMEE', 'PREPARATION'] as const;
  const now = new Date();
  const prefix = `DLX-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const last = await prisma.order.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  });
  let counter = last ? Number(last.reference.split('-')[2] ?? '0') : 0;

  for (const [index, buyer] of CUSTOMERS.entries()) {
    const picked = variants.slice(index % 3, (index % 3) + 2);
    if (picked.length === 0) continue;

    const items = picked.map((variant) => ({
      productId: variant.productId,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      imageUrl: variant.product.images[0] ?? null,
      size: variant.size,
      color: variant.color,
      unitPrice: variant.product.price,
      quantity: 1,
      lineTotal: variant.product.price,
    }));

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const rate = await prisma.deliveryRate.findUnique({ where: { code: buyer.wilayaCode } });
    const deliveryFee = rate?.homeFee ?? 600;

    counter += 1;

    const customer = await prisma.customer.upsert({
      where: { phone: buyer.phone },
      update: {},
      create: {
        phone: buyer.phone, firstName: buyer.firstName, lastName: buyer.lastName,
        wilayaCode: buyer.wilayaCode, commune: buyer.commune, address: buyer.address,
      },
      select: { id: true },
    });

    await prisma.order.create({
      data: {
        reference: `${prefix}-${String(counter).padStart(4, '0')}`,
        customerId: customer.id,
        firstName: buyer.firstName, lastName: buyer.lastName, phone: buyer.phone,
        wilayaCode: buyer.wilayaCode, wilayaName: buyer.wilayaName,
        commune: buyer.commune, address: buyer.address,
        deliveryType: 'DOMICILE',
        subtotal, deliveryFee, total: subtotal + deliveryFee,
        status: statuses[index % statuses.length],
        items: { create: items },
        events: { create: { status: 'EN_ATTENTE', note: 'Commande de démonstration.' } },
      },
    });

    console.log(`  ✓ ${prefix}-${String(counter).padStart(4, '0')} — ${buyer.firstName} ${buyer.lastName}`);
  }
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
