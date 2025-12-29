import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const dialectId = req.query.dialectId as string | undefined;

    const items = await prisma.flashcard.findMany({
      where: dialectId ? { dialectId } : {},
      select: {
        id: true,
        lemma: true,
        meaning: true,
        phonetic: true,
        dialectId: true,
        dialect: { select: { name: true } },
        tags: true,
      },
      orderBy: {
        lemma: 'asc',
      },
    });

    res.json({
      items: items.map(item => ({
        id: item.id,
        lemma: item.lemma,
        meaning: item.meaning,
        phonetic: item.phonetic,
        dialect_id: item.dialectId,
        dialect_name: item.dialect?.name || '未分類',
        tags: item.tags,
      })),
    });
  } catch (error) {
    console.error('Dictionary API error:', error);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
}
