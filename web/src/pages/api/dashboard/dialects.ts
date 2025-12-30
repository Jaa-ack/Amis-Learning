import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { dialectCache } from '@/lib/cache';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // 禁用快取避免 304 導致前端空資料
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    // 嘗試從記憶體快取讀取（減少資料庫查詢）
    const cacheKey = 'dialects_with_counts';
    const cached = dialectCache.get<any>(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

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

    // 前端需要的資料格式：data 包含 dialect 物件
    const result = {
      data: counts.length > 0 ? counts : dialects.map(d => ({
        dialect_id: d.id,
        id: d.id,
        code: d.code,
        name: d.name,
        cards: 0
      })),
      dialects,
      counts
    };
    
    // 存入快取（10 分鐘，dialect 資料很少變動）
    dialectCache.set(cacheKey, result, 600);

    console.log(`[API] /dashboard/dialects returned ${dialects.length} dialects`);
    res.json(result);
  } catch (error) {
    console.error('Dialects API error:', error);
    res.status(500).json({ error: 'Failed to fetch dialects' });
  }
}
