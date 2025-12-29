import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 禁用快取避免 304 導致前端拿不到資料
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const dialectId = req.query.dialectId as string | undefined;
  const limit = Number((req.query.limit as string) ?? '20');

  let items: any[];

  // 優化版查詢：使用 LEFT JOIN 替代 EXISTS，減少子查詢掃描
  if (dialectId) {
    items = await prisma.$queryRaw<any[]>`
      WITH failed_tests AS (
        SELECT DISTINCT r.flashcard_id
        FROM reviews r
        INNER JOIN review_session s ON s.id = r.session_id
        WHERE s.type = 'POST_TEST' AND r.score <= 2
      )
      SELECT 
        f.*,
        CASE
          WHEN ft.flashcard_id IS NOT NULL THEN 1
          WHEN ucs.ef <= 1.6 THEN 2
          WHEN ucs.next_review_at IS NOT NULL AND now() > ucs.next_review_at THEN 3
          WHEN ucs.repetitions < 2 THEN 4
          ELSE 4
        END AS priority
      FROM flashcards f
      LEFT JOIN user_card_stats ucs ON ucs.flashcard_id = f.id
      LEFT JOIN failed_tests ft ON ft.flashcard_id = f.id
      WHERE f.dialect_id = ${dialectId}
      ORDER BY 
        priority ASC, 
        ucs.next_review_at ASC NULLS LAST, 
        ucs.ef ASC
      LIMIT ${limit};
    `;
  } else {
    items = await prisma.$queryRaw<any[]>`
      WITH failed_tests AS (
        SELECT DISTINCT r.flashcard_id
        FROM reviews r
        INNER JOIN review_session s ON s.id = r.session_id
        WHERE s.type = 'POST_TEST' AND r.score <= 2
      )
      SELECT 
        f.*,
        CASE
          WHEN ft.flashcard_id IS NOT NULL THEN 1
          WHEN ucs.ef <= 1.6 THEN 2
          WHEN ucs.next_review_at IS NOT NULL AND now() > ucs.next_review_at THEN 3
          WHEN ucs.repetitions < 2 THEN 4
          ELSE 4
        END AS priority
      FROM flashcards f
      LEFT JOIN user_card_stats ucs ON ucs.flashcard_id = f.id
      LEFT JOIN failed_tests ft ON ft.flashcard_id = f.id
      ORDER BY 
        priority ASC, 
        ucs.next_review_at ASC NULLS LAST, 
        ucs.ef ASC
      LIMIT ${limit};
    `;
  }

  // 若沒有任何複習紀錄，回退為「最近建立的單字」以避免空畫面
  if (!items || items.length === 0) {
    items = await prisma.flashcard.findMany({
      where: dialectId ? { dialectId } : {},
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
    });
  }

  res.json({ items });
}
