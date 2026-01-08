import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

const prisma = new PrismaClient({ log: ['warn'] });

async function importCSV() {
  try {
    console.log('Starting CSV import to Neon...\n');

    // 1. Import Dialects
    console.log('1/4 Importing dialects...');
    const dialectsPath = path.join(__dirname, '../../SUPABASE/dialects_rows.csv');
    const dialectsContent = fs.readFileSync(dialectsPath, 'utf-8');
    const dialects = csv.parse(dialectsContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Array<{
      id: string;
      code: string;
      name: string;
      region: string;
      createdAt: string;
    }>;

    let i = 0;
    for (const d of dialects) {
      await prisma.dialect.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id,
          code: d.code,
          name: d.name,
          region: d.region || null,
          createdAt: new Date(d.createdAt),
        },
      });
      i++;
      if (i % 50 === 0 || i === dialects.length) {
        console.log(`   - Dialects progress: ${i}/${dialects.length}`);
      }
    }
    console.log(`   ✓ Imported ${dialects.length} dialects\n`);

    // 2. Import Flashcards
    console.log('2/4 Importing flashcards...');
    const flashcardsPath = path.join(__dirname, '../../SUPABASE/flashcards_rows.csv');
    const flashcardsContent = fs.readFileSync(flashcardsPath, 'utf-8');
    const flashcards = csv.parse(flashcardsContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Array<{
      id: string;
      dialect_id: string;
      lemma: string;
      phonetic: string;
      meaning: string;
      status: 'NEW' | 'LEARNING' | 'REVIEWED';
      tags: string;
      createdAt: string;
      updatedAt: string;
    }>;

    i = 0;
    for (const f of flashcards) {
      const tagsArr = f.tags ? JSON.parse(f.tags) : [];
      await prisma.flashcard.upsert({
        where: { id: f.id },
        update: {},
        create: {
          id: f.id,
          dialectId: f.dialect_id || null,
          lemma: f.lemma,
          phonetic: f.phonetic || null,
          meaning: f.meaning || null,
          status: f.status,
          tags: Array.isArray(tagsArr) ? tagsArr : [],
          createdAt: new Date(f.createdAt),
          updatedAt: new Date(f.updatedAt),
        },
      });
      i++;
      if (i % 200 === 0 || i === flashcards.length) {
        console.log(`   - Flashcards progress: ${i}/${flashcards.length}`);
      }
    }
    console.log(`   ✓ Imported ${flashcards.length} flashcards\n`);

    // 3. Import UserCardStats
    console.log('3/4 Importing user card stats...');
    const statsPath = path.join(__dirname, '../../SUPABASE/user_card_stats_rows.csv');
    const statsContent = fs.readFileSync(statsPath, 'utf-8');
    const stats = csv.parse(statsContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Array<{
      id: string;
      flashcard_id: string;
      ef: string;
      interval_days: string;
      repetitions: string;
      next_review_at: string;
      last_review_at: string;
      current_priority: string;
      status: 'NEW' | 'LEARNING' | 'REVIEWED';
      wrong_count: string;
    }>;

    i = 0;
    for (const s of stats) {
      await prisma.userCardStat.upsert({
        where: { id: s.id },
        update: {},
        create: {
          id: s.id,
          flashcardId: s.flashcard_id,
          ef: parseFloat(s.ef),
          intervalDays: parseInt(s.interval_days, 10),
          repetitions: parseInt(s.repetitions, 10),
          nextReviewAt: s.next_review_at ? new Date(s.next_review_at) : null,
          lastReviewAt: s.last_review_at ? new Date(s.last_review_at) : null,
          currentPriority: parseInt(s.current_priority, 10),
          status: s.status,
          wrongCount: parseInt(s.wrong_count, 10),
        },
      });
      i++;
      if (i % 50 === 0 || i === stats.length) {
        console.log(`   - User stats progress: ${i}/${stats.length}`);
      }
    }
    console.log(`   ✓ Imported ${stats.length} user card stats\n`);

    // 4. Import Reviews
    console.log('4/4 Importing reviews...');
    const reviewsPath = path.join(__dirname, '../../SUPABASE/reviews_rows.csv');
    const reviewsContent = fs.readFileSync(reviewsPath, 'utf-8');
    const reviews = csv.parse(reviewsContent, {
      columns: true,
      skip_empty_lines: true,
    }) as Array<{
      id: string;
      flashcard_id: string;
      session_id: string;
      mode: 'CHOICE' | 'SPELL' | 'MIXED';
      score: string;
      similarity: string;
      quality: string;
      created_at: string;
    }>;

    i = 0;
    for (const r of reviews) {
      await prisma.review.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          flashcardId: r.flashcard_id,
          sessionId: r.session_id || null,
          mode: r.mode,
          score: parseInt(r.score, 10),
          similarity: r.similarity ? parseFloat(r.similarity) : null,
          quality: r.quality ? parseInt(r.quality, 10) : null,
          createdAt: new Date(r.created_at),
        },
      });
      i++;
      if (i % 20 === 0 || i === reviews.length) {
        console.log(`   - Reviews progress: ${i}/${reviews.length}`);
      }
    }
    console.log(`   ✓ Imported ${reviews.length} reviews\n`);

    // Final counts
    console.log('========== IMPORT SUMMARY ==========');
    const dialectCount = await prisma.dialect.count();
    const flashcardCount = await prisma.flashcard.count();
    const statsCount = await prisma.userCardStat.count();
    const reviewCount = await prisma.review.count();

    console.log(`Dialects:      ${dialectCount}`);
    console.log(`Flashcards:    ${flashcardCount}`);
    console.log(`User Stats:    ${statsCount}`);
    console.log(`Reviews:       ${reviewCount}`);
    console.log('====================================\n');
    console.log('✅ CSV import completed successfully!\n');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importCSV();
