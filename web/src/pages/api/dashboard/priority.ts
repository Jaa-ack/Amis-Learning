import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // 優化版查詢：使用 LEFT JOIN 替代 EXISTS，避免重複掃描
    const data = await prisma.$queryRaw<any[]>`
      WITH failed_tests AS (
        SELECT DISTINCT r.flashcard_id
        FROM reviews r
        INNER JOIN review_session s ON s.id = r.session_id
        WHERE s.type = 'POST_TEST' AND r.score <= 2
      )
      SELECT
        ucs.flashcard_id,
        ucs.ef,
        ucs.repetitions,
        ucs.interval_days,
        ucs.next_review_at,
        ucs.status,
        f.lemma,
        f.meaning,
        CASE
          WHEN ft.flashcard_id IS NOT NULL THEN 1
          WHEN ucs.ef <= 1.6 THEN 2
          WHEN ucs.next_review_at IS NOT NULL AND now() > ucs.next_review_at THEN 3
          WHEN ucs.repetitions < 2 THEN 4
          ELSE 4
        END AS priority
      FROM user_card_stats ucs
      INNER JOIN flashcards f ON f.id = ucs.flashcard_id
      LEFT JOIN failed_tests ft ON ft.flashcard_id = ucs.flashcard_id
      ORDER BY priority ASC, next_review_at ASC NULLS LAST, ef ASC;
    `;
    res.json({ data });
  } catch (error) {
    console.error('Priority API error:', error);
    res.status(500).json({ error: 'Failed to fetch priority queue' });
  }
}
