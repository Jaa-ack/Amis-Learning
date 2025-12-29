import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { dialectId, text, translation } = req.body;
  
  try {
    const sentence = await prisma.sentence.create({
      data: { dialectId, text, translation }
    });
    res.json({ sentence });
  } catch (error) {
    console.error('Create sentence error:', error);
    res.status(500).json({ error: 'Failed to create sentence' });
  }
}
