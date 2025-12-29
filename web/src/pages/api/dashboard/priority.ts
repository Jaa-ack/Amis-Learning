import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await prisma.$queryRaw<any[]>`
      WITH stats AS (
        SELECT ucs.*, f.dialect_id, f.lemma, f.meaning, f.status AS card_status,
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
          stats.interval_days,
          stats.next_review_at,
          stats.status AS status,
          stats.lemma,
          stats.meaning,
          CASE
            WHEN stats.failed_post_test THEN 1
            WHEN stats.ef <= 1.6 THEN 2
            WHEN stats.next_review_at IS NOT NULL AND now() > stats.next_review_at THEN 3
            WHEN stats.repetitions < 2 THEN 4
            ELSE 4
          END AS priority
        FROM stats
      )
      SELECT * FROM ranked
      ORDER BY priority ASC, next_review_at ASC NULLS LAST, ef ASC;
    `;
    res.json({ data });
  } catch (error) {
    console.error('Priority API error:', error);
    res.status(500).json({ error: 'Failed to fetch priority queue' });
  }
}
