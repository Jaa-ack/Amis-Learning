import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { dialectId, lemma, meaning, tags } = req.body;
  const dup = await prisma.flashcard.findFirst({ where: { dialectId, lemma } });
  if (dup) return res.status(409).json({ error: 'Duplicate lemma in dialect' });
  const card = await prisma.flashcard.create({ data: { dialectId, lemma, meaning, tags: tags ?? [] } });
  res.json({ card });
}
