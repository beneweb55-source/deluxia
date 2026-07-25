import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const collections = [
  {
    slug: 'chaussures',
    name: 'Chaussures',
    tagline: 'Sneakers, bottines, escarpins et sandales',
    description: 'Des modèles portables au quotidien comme le soir. Cuirs souples, semelles confortables, pointures du 36 au 41.',
    position: 0,
    cats: ['sneakers', 'bottines', 'escarpins', 'sandales']
  },
  {
    slug: 'sacs',
    name: 'Sacs',
    tagline: 'Sacs à main, épaule, bandoulière et sacs à dos',
    description: 'Des formes structurées qui tiennent dans le temps. Doublure soignée, coutures régulières, fermetures testées.',
    position: 1,
    cats: ['sacs-a-main', 'bandoulieres', 'cabas-tote', 'sacs-a-dos']
  },
  {
    slug: 'accessoires',
    name: 'Accessoires',
    tagline: 'Pochettes, portefeuilles et petite maroquinerie',
    description: 'Les pièces qui complètent une tenue — et le cadeau qui ne se trompe jamais.',
    position: 2,
    cats: ['pochettes', 'portefeuilles', 'pochettes-portefeuilles', 'pochettes-et-portefeuilles']
  }
];

async function main() {
  console.log('🌱 Seeding collections...');
  for (const col of collections) {
    const { cats, ...data } = col;
    
    // Create collection
    const created = await prisma.collection.upsert({
      where: { slug: col.slug },
      update: data,
      create: data,
    });
    
    console.log(`✅ Collection ${created.name} created/updated (ID: ${created.id})`);
    
    // Update categories
    for (const catSlug of cats) {
      const category = await prisma.category.findUnique({ where: { slug: catSlug } });
      if (category) {
        await prisma.category.update({
          where: { id: category.id },
          data: { collectionId: created.id }
        });
        console.log(`   🔗 Linked category ${category.name} to ${created.name}`);
      }
    }
  }
  console.log('✅ Done seeding collections!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
