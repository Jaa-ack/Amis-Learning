import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 將所有引號統一為直引號 (')
 * 支援：
 *   - 左右單引號 (' ') → '
 *   - 左右雙引號 (" ") → '
 *   - 中文引號 (「」『』) → '
 */
function normalizeQuotes(text: string): string {
  if (!text) return text;

  return text
    // 左右單引號 → 直引號
    .replace(/[\u2018\u2019]/g, "'")
    // 左右雙引號 → 直引號
    .replace(/[\u201C\u201D]/g, "'")
    // 中文引號 → 直引號
    .replace(/[「」『』]/g, "'");
}

async function main() {
  console.log('🔄 開始統一資料庫中的引號符號...\n');

  try {
    // 1. 更新 flashcard meaning
    console.log('📚 處理 Flashcard meaning...');
    const flashcards = await prisma.flashcard.findMany({
      select: { id: true, meaning: true },
    });

    let flashcardUpdateCount = 0;
    for (const card of flashcards) {
      if (card.meaning) {
        const normalized = normalizeQuotes(card.meaning);
        if (normalized !== card.meaning) {
          await prisma.flashcard.update({
            where: { id: card.id },
            data: { meaning: normalized },
          });
          flashcardUpdateCount++;
          console.log(
            `  ✏️  ${card.meaning} → ${normalized}`
          );
        }
      }
    }
    console.log(`  ✅ 更新 ${flashcardUpdateCount} 筆 Flashcard\n`);

    // 2. 更新 sentence text
    console.log('📖 處理 Sentence text...');
    const sentences = await prisma.sentence.findMany({
      select: { id: true, text: true, translation: true },
    });

    let sentenceUpdateCount = 0;
    for (const sent of sentences) {
      const normalizedText = normalizeQuotes(sent.text);
      const normalizedTranslation = sent.translation
        ? normalizeQuotes(sent.translation)
        : sent.translation;

      if (
        normalizedText !== sent.text ||
        normalizedTranslation !== sent.translation
      ) {
        await prisma.sentence.update({
          where: { id: sent.id },
          data: {
            text: normalizedText,
            translation: normalizedTranslation,
          },
        });
        sentenceUpdateCount++;
        console.log(
          `  ✏️  Text: ${sent.text} → ${normalizedText}`
        );
        if (sent.translation) {
          console.log(
            `      Translation: ${sent.translation} → ${normalizedTranslation}`
          );
        }
      }
    }
    console.log(`  ✅ 更新 ${sentenceUpdateCount} 筆 Sentence\n`);

    console.log('✨ 引號統一完成！');
    console.log(`   - Flashcard: ${flashcardUpdateCount} 筆更新`);
    console.log(`   - Sentence: ${sentenceUpdateCount} 筆更新`);
    console.log(`   - 總計: ${flashcardUpdateCount + sentenceUpdateCount} 筆更新`);

    if (flashcardUpdateCount + sentenceUpdateCount === 0) {
      console.log('\n✅ 資料庫中的引號已經統一，無需更新');
    }
  } catch (error) {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
