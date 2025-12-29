import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // basic counts
  const [dialectCount, flashcardCount, sentenceCount, statCount, reviewCount, sessionCount] = await Promise.all([
    prisma.dialect.count(),
    prisma.flashcard.count(),
    prisma.sentence.count(),
    prisma.userCardStat.count(),
    prisma.review.count(),
    prisma.reviewSession.count(),
  ]);

  // dialect list with card counts
  const counts = await prisma.$queryRaw<any[]>`
    SELECT d.id AS dialect_id, d.code, d.name, COUNT(f.id) AS cards
    FROM dialects d
    LEFT JOIN flashcards f ON f.dialect_id = d.id
    GROUP BY d.id, d.code, d.name
    ORDER BY d.name ASC;
  `;

  const dialects = counts.map((r) => ({
    id: String(r.dialect_id),
    code: String(r.code),
    name: String(r.name),
    cards: Number(r.cards ?? 0),
  }));

  // user card stat coverage (single user now)
  const statsCount = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*)::bigint AS stats, COUNT(DISTINCT flashcard_id)::bigint AS covered
    FROM user_card_stats;
  `;
  const coverage = {
    stats: Number(statsCount?.[0]?.stats ?? 0),
    coveredFlashcards: Number(statsCount?.[0]?.covered ?? 0),
  };

  res.json({
    summary: {
      dialects: dialectCount,
      flashcards: flashcardCount,
      sentences: sentenceCount,
      userCardStats: statCount,
      reviews: reviewCount,
      sessions: sessionCount,
    },
    dialects,
    coverage,
    recommendations: {
      requireDialects: dialectCount === 0,
      requireFlashcards: flashcardCount === 0,
      requireStats: coverage.stats === 0,
    },
  });
}
