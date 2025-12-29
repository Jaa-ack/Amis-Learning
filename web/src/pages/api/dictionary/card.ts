import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'PATCH') {
      const { id, dialectId, lemma, meaning, tags } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required' });

      const data: any = {};
      if (dialectId !== undefined) data.dialectId = dialectId || null;
      if (lemma !== undefined) data.lemma = lemma;
      if (meaning !== undefined) data.meaning = meaning;
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
