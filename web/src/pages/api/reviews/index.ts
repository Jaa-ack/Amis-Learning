import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

function mapScoreToQuality(mode: string, score: number, similarity?: number) {
  if (mode === 'CHOICE') return score === 4 ? 5 : 3;
  if (mode === 'SPELL') {
    const sim = similarity ?? 0;
    if (sim >= 100) return 5;
    if (sim >= 85) return 4;
    if (sim >= 70) return 3;
    return 2;
  }
  return 3;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { flashcardId, mode, score, similarity, isPostTest, sessionId } = req.body;

  const stat = await prisma.userCardStat.findUnique({
    where: { flashcardId },
  }).catch(() => null);
  const base = stat ?? await prisma.userCardStat.create({ data: { flashcardId } });

  const quality = mapScoreToQuality(mode, score, similarity);
  let repetitions = base.repetitions;
  let intervalDays = base.intervalDays;
  let ef = base.ef;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ef);
    repetitions += 1;
  }
  const q = Math.max(0, Math.min(5, quality));
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  let currentPriority = 4;
  if (isPostTest && quality < 3) currentPriority = 1;
  else if (ef <= 1.6) currentPriority = 2;
  else if (new Date() > nextReviewAt) currentPriority = 3;
  else if (repetitions < 2) currentPriority = 4;

  const updated = await prisma.userCardStat.update({
    where: { id: base.id },
    data: { ef, intervalDays, repetitions, nextReviewAt, currentPriority, lastReviewAt: new Date() },
  });
  const review = await prisma.review.create({
    data: { flashcardId, sessionId, mode, score, similarity, quality },
  });
  res.json({ ok: true, review, stat: updated });
}
