import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // basic counts
  const [dialectCount, flashcardCount, sentenceCount, userCount, statCount, reviewCount, sessionCount] = await Promise.all([
    prisma.dialect.count(),
    prisma.flashcard.count(),
    prisma.sentence.count(),
    prisma.user.count(),
    prisma.userCardStat.count(),
    prisma.review.count(),
    prisma.reviewSession.count(),
  ]);

  // demo user existence
  const demoUser = await prisma.user.findUnique({
    where: { id: 'demo-user' },
    select: { id: true, email: true, name: true },
  });

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

  // user stat coverage for demo-user
  const demoStats = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*)::bigint AS stats, COUNT(DISTINCT flashcard_id)::bigint AS covered
    FROM user_card_stats
    WHERE user_id = 'demo-user';
  `;
  const coverage = {
    stats: Number(demoStats?.[0]?.stats ?? 0),
    coveredFlashcards: Number(demoStats?.[0]?.covered ?? 0),
  };

  res.json({
    summary: {
      dialects: dialectCount,
      flashcards: flashcardCount,
      sentences: sentenceCount,
      users: userCount,
      userCardStats: statCount,
      reviews: reviewCount,
      sessions: sessionCount,
    },
    demoUser: demoUser ?? null,
    dialects,
    demoCoverage: coverage,
    recommendations: {
      requireDialects: dialectCount === 0,
      requireFlashcards: flashcardCount === 0,
      requireDemoUser: !demoUser,
      requireDemoStats: coverage.stats === 0,
    },
  });
}
