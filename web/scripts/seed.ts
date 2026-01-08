import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a demo dialect if not exists
  const dialect = await prisma.dialect.upsert({
    where: { code: 'amis' },
    update: {},
    create: {
      code: 'amis',
      name: '阿美語',
      region: 'TW'
    }
  });

  // Create a demo flashcard if not exists
  await prisma.flashcard.upsert({
    where: { dialectId_lemma: { dialectId: dialect.id, lemma: 'kako' } },
    update: {},
    create: {
      dialectId: dialect.id,
      lemma: 'kako',
      meaning: '說',
      tags: ['常用','動詞']
    }
  });

  console.log('✅ Seed 完成：已建立方言與範例單字');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
