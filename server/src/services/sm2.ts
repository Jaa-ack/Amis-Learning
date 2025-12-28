import { UserCardStat } from '@prisma/client';

export type Attempt = {
  mode: 'CHOICE' | 'SPELL' | 'MIXED';
  score: number; // 1-4 per spec
  similarity?: number; // 0-100 for SPELL
  isPostTest?: boolean;
};

export function mapScoreToQuality(attempt: Attempt): number {
  if (attempt.mode === 'CHOICE') {
    return attempt.score === 4 ? 5 : 3; // 4→5; 2→3
  }
  if (attempt.mode === 'SPELL') {
    const sim = attempt.similarity ?? 0;
    if (sim >= 100) return 5;
    if (sim >= 85) return 4;
    if (sim >= 70) return 3;
    return 2;
  }
  return 3;
}

export function applySm2(state: UserCardStat, attempt: Attempt): Partial<UserCardStat> {
  const quality = mapScoreToQuality(attempt);
  let repetitions = state.repetitions;
  let intervalDays = state.intervalDays;
  let ef = state.ef;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * ef);
    }
    repetitions = repetitions + 1;
  }

  const q = Math.max(0, Math.min(5, quality));
  ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (ef < 1.3) ef = 1.3;

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  let currentPriority = 4;
  if (attempt.isPostTest && quality < 3) {
    currentPriority = 1;
  } else if (ef <= 1.6) {
    currentPriority = 2;
  } else if (new Date() > nextReviewAt) {
    currentPriority = 3;
  } else if (repetitions < 2) {
    currentPriority = 4;
  } else {
    currentPriority = 4;
  }

  return {
    ef,
    intervalDays,
    repetitions,
    nextReviewAt,
    currentPriority,
    lastReviewAt: new Date(),
  };
}
