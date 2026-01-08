const { PrismaClient } = require('../node_modules/@prisma/client');
const p = new PrismaClient({ log: ['warn'] });
(async () => {
  try {
    const [d, f, s, stats, reviews] = await Promise.all([
      p.dialect.count(),
      p.flashcard.count(),
      p.sentence.count(),
      p.userCardStat.count(),
      p.review.count(),
    ]);
    console.log(JSON.stringify({ dialects: d, flashcards: f, sentences: s, userCardStats: stats, reviews }));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();
