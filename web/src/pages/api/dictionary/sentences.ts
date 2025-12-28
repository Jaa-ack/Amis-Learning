import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const flashcardId = req.query.flashcardId as string;

    if (!flashcardId) {
      return res.status(400).json({ error: 'flashcardId is required' });
    }

    const links = await prisma.sentenceWordLink.findMany({
      where: { flashcardId },
      include: {
        sentence: {
          select: {
            id: true,
            text: true,
            translation: true,
          },
        },
      },
    });

    const sentences = links.map(link => link.sentence);

    res.json({ sentences });
  } catch (error) {
    console.error('Sentences API error:', error);
    res.status(500).json({ error: 'Failed to fetch sentences' });
  }
}
