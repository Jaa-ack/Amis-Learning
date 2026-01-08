import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 掃描資料庫中的引號符號...\n');

  // 掃描 flashcard 的 meaning
  const flashcards = await prisma.flashcard.findMany({
    where: {
      meaning: {
        contains: "'",
      },
    },
    select: {
      id: true,
      lemma: true,
      meaning: true,
    },
    take: 100,
  });

  // 掃描 sentence 的 text 和 translation
  const sentences = await prisma.sentence.findMany({
    where: {
      OR: [
        {
          text: {
            contains: "'",
          },
        },
        {
          translation: {
            contains: "'",
          },
        },
      ],
    },
    select: {
      id: true,
      text: true,
      translation: true,
    },
    take: 100,
  });

  // 收集所有不同的引號符號
  const quoteSet = new Set<string>();

  // 定義所有可能的引號符號
  const possibleQuotes = [
    "'",       // 直引號 (U+0027)
    '\u2018',  // 左單引號 (U+2018)
    '\u2019',  // 右單引號 (U+2019)
    '"',       // 直引號 (U+0022)
    '\u201C',  // 左雙引號 (U+201C)
    '\u201D',  // 右雙引號 (U+201D)
    '「',      // 中文左引號
    '」',      // 中文右引號
    '『',      // 中文單引號左
    '』',      // 中文單引號右
  ];

  // 檢查 flashcard meaning
  if (flashcards.length > 0) {
    console.log(`📚 檢查 Flashcard (共 ${flashcards.length} 筆包含引號):`);
    flashcards.forEach((card) => {
      possibleQuotes.forEach((quote) => {
        if (card.meaning?.includes(quote)) {
          quoteSet.add(quote);
          console.log(`  - "${card.lemma}": ${card.meaning}`);
          console.log(`    包含符號: ${quote} (U+${quote.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`);
        }
      });
    });
  } else {
    console.log('✅ Flashcard meaning 中未發現引號');
  }

  // 檢查 sentence
  if (sentences.length > 0) {
    console.log(`\n📖 檢查 Sentence (共 ${sentences.length} 筆包含引號):`);
    sentences.forEach((sent) => {
      possibleQuotes.forEach((quote) => {
        const hasInText = sent.text?.includes(quote);
        const hasInTranslation = sent.translation?.includes(quote);
        if (hasInText || hasInTranslation) {
          quoteSet.add(quote);
          if (hasInText) {
            console.log(`  - Text: ${sent.text}`);
            console.log(`    包含符號: ${quote} (U+${quote.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`);
          }
          if (hasInTranslation) {
            console.log(`  - Translation: ${sent.translation}`);
            console.log(`    包含符號: ${quote} (U+${quote.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`);
          }
        }
      });
    });
  } else {
    console.log('✅ Sentence 中未發現引號');
  }

  if (quoteSet.size === 0) {
    console.log('\n✅ 未發現任何引號符號需要統一');
  } else {
    console.log(`\n📊 偵測到的引號符號 (${quoteSet.size} 種):`);
    quoteSet.forEach((quote) => {
      console.log(`  - "${quote}" (U+${quote.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
