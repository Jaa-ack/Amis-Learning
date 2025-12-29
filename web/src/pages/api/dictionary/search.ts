import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = (req.query.q as string) ?? '';
  const dialectId = req.query.dialectId as string | undefined;
  if (!q) return res.json({ items: [] });

  let items: any[];

  if (dialectId) {
    items = await prisma.$queryRaw<any[]>`
      SELECT id, lemma, meaning, dialect_id, similarity(lemma, ${q}) AS sim
      FROM flashcards
      WHERE dialect_id = ${dialectId}
      ORDER BY sim DESC
      LIMIT 50;
    `;
  } else {
    items = await prisma.$queryRaw<any[]>`
      SELECT id, lemma, meaning, dialect_id, similarity(lemma, ${q}) AS sim
      FROM flashcards
      ORDER BY sim DESC
      LIMIT 50;
    `;
  }

  res.json({ items });
}
