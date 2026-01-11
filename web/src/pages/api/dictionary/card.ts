import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

// 引號正規化函數（不轉小寫）
function normalizeQuotes(s: string): string {
  return s
    // 將各種單引號符號統一轉換為半形單引號 '
    .replace(/[''‛‚`´]/g, "'")
    // 將全形雙引號轉換為半形雙引號
    .replace(/[""„‟]/g, '"');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'PATCH') {
      const { id, dialectId, lemma, meaning, tags } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const data: any = {};
      if (dialectId !== undefined) data.dialectId = dialectId || null;
      if (lemma !== undefined) data.lemma = normalizeQuotes(lemma);
      if (meaning !== undefined) data.meaning = meaning ? normalizeQuotes(meaning) : meaning;
      if (tags !== undefined) data.tags = Array.isArray(tags) ? tags : [];

      const updated = await prisma.flashcard.update({
        where: { id },
        data,
      });
      return res.json({ flashcard: updated });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'id is required' });
      await prisma.flashcard.delete({ where: { id } });
      return res.json({ ok: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error('Dictionary card API error:', error);
    return res.status(500).json({ error: 'Dictionary card API failed' });
  }
}
