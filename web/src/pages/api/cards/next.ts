import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const dialectId = req.query.dialectId as string | undefined;
  const limit = Number((req.query.limit as string) ?? '20');

  let items: any[];

  if (dialectId) {
    items = await prisma.$queryRaw<any[]>`
      WITH stats AS (
        SELECT ucs.*, f.dialect_id,
               EXISTS (
                 SELECT 1 FROM reviews r
                 JOIN review_session s ON s.id = r.session_id
                 WHERE r.flashcard_id = ucs.flashcard_id
                   AND s.type = 'POST_TEST'
                   AND r.score <= 2
               ) AS failed_post_test
        FROM user_card_stats ucs
        JOIN flashcards f ON f.id = ucs.flashcard_id
        WHERE f.dialect_id = ${dialectId}
      ), ranked AS (
        SELECT
          stats.flashcard_id,
          stats.ef,
          stats.repetitions,
          stats.next_review_at,
          CASE
            WHEN stats.failed_post_test THEN 1
            WHEN stats.ef <= 1.6 THEN 2
            WHEN stats.next_review_at IS NOT NULL AND now() > stats.next_review_at THEN 3
            WHEN stats.repetitions < 2 THEN 4
            ELSE 4
          END AS priority
        FROM stats
      )
      SELECT f.*, ranked.priority
      FROM ranked
      JOIN flashcards f ON f.id = ranked.flashcard_id
      ORDER BY priority ASC, next_review_at ASC NULLS LAST, ef ASC
      LIMIT ${limit};
    `;
  } else {
    items = await prisma.$queryRaw<any[]>`
      WITH stats AS (
        SELECT ucs.*, f.dialect_id,
               EXISTS (
                 SELECT 1 FROM reviews r
                 JOIN review_session s ON s.id = r.session_id
                 WHERE r.flashcard_id = ucs.flashcard_id
                   AND s.type = 'POST_TEST'
                   AND r.score <= 2
               ) AS failed_post_test
        FROM user_card_stats ucs
        JOIN flashcards f ON f.id = ucs.flashcard_id
      ), ranked AS (
        SELECT
          stats.flashcard_id,
          stats.ef,
          stats.repetitions,
          stats.next_review_at,
          CASE
            WHEN stats.failed_post_test THEN 1
            WHEN stats.ef <= 1.6 THEN 2
            WHEN stats.next_review_at IS NOT NULL AND now() > stats.next_review_at THEN 3
            WHEN stats.repetitions < 2 THEN 4
            ELSE 4
          END AS priority
        FROM stats
      )
      SELECT f.*, ranked.priority
      FROM ranked
      JOIN flashcards f ON f.id = ranked.flashcard_id
      ORDER BY priority ASC, next_review_at ASC NULLS LAST, ef ASC
      LIMIT ${limit};
    `;
  }

  res.json({ items });
}
