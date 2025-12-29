import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // 禁用快取避免 304 導致前端空資料
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // 1) 提供 Study 頁面需要的方言清單（id, code, name）
  const dialects = await prisma.dialect.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  });

  // 2) 額外提供每個方言的字卡數量（儀表板可用）
  const raw = await prisma.$queryRaw<any[]>`
    SELECT d.id AS dialect_id, d.name, COUNT(f.id) AS cards
    FROM dialects d
    LEFT JOIN flashcards f ON f.dialect_id = d.id
    GROUP BY d.id, d.name
    ORDER BY d.name ASC;
  `;
  const counts = raw.map((row) => ({
    dialect_id: String(row.dialect_id ?? ''),
    name: String(row.name ?? ''),
    cards: Number(row.cards ?? 0),
  }));

  res.json({ dialects, counts });
}
