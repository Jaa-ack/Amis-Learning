import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { userId } = req.body;
  const session = await prisma.reviewSession.create({ data: { userId, type: 'POST_TEST' } });
  const today = new Date();
  today.setHours(0,0,0,0);
  const cards = await prisma.userCardStat.findMany({
    where: { userId, lastReviewAt: { gte: today } },
    orderBy: [{ lastReviewAt: 'desc' }],
    take: 20,
    select: { flashcardId: true },
  });
  res.json({ sessionId: session.id, items: cards });
}
