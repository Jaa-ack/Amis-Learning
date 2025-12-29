import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

type Json = {
  ok: boolean;
  timestamp: string;
  emptyTables: string[];
  tables: Record<string, { count: number; sample?: any[] }>
} | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Json>) {
  const limit = Math.max(1, Math.min(10, Number(req.query.limit) || 3));

  try {
    // Users
    const usersCount = await prisma.user.count();
    const users = usersCount > 0 ? await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, createdAt: true },
    }) : [];

    // User Preferences
    const prefsCount = await prisma.userPreference.count();
    const prefs = prefsCount > 0 ? await prisma.userPreference.findMany({
      take: limit,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        userId: true,
        dailyNewTarget: true,
        reviewRatio: true,
        dialectFilter: true,
        spellingTolerance: true,
      },
    }) : [];

    // Dialects with counts
    const dialectsCount = await prisma.dialect.count();
    const dialects = dialectsCount > 0 ? await prisma.dialect.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        name: true,
        region: true,
        createdAt: true,
        _count: { select: { flashcards: true, sentences: true } },
      },
    }) : [];

    // Flashcards
    const cardsCount = await prisma.flashcard.count();
    const cards = cardsCount > 0 ? await prisma.flashcard.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        dialectId: true,
        lemma: true,
        phonetic: true,
        meaning: true,
        status: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    }) : [];

    // Sentences
    const sentencesCount = await prisma.sentence.count();
    const sentences = sentencesCount > 0 ? await prisma.sentence.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, dialectId: true, text: true, translation: true, createdAt: true },
    }) : [];

    // Sentence-Word Links
    const linksCount = await prisma.sentenceWordLink.count();
    const links = linksCount > 0 ? await prisma.sentenceWordLink.findMany({
      take: limit,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        sentenceId: true,
        flashcardId: true,
        startIndex: true,
        endIndex: true,
      },
    }) : [];

    // User Card Stats
    const statsCount = await prisma.userCardStat.count();
    const stats = statsCount > 0 ? await prisma.userCardStat.findMany({
      take: limit,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        userId: true,
        flashcardId: true,
        status: true,
        currentPriority: true,
        ef: true,
        intervalDays: true,
        repetitions: true,
        nextReviewAt: true,
        lastReviewAt: true,
      },
    }) : [];

    // Review Sessions
    const sessionsCount = await prisma.reviewSession.count();
    const sessions = sessionsCount > 0 ? await prisma.reviewSession.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, userId: true, type: true, createdAt: true },
    }) : [];

    // Reviews
    const reviewsCount = await prisma.review.count();
    const reviews = reviewsCount > 0 ? await prisma.review.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        flashcardId: true,
        sessionId: true,
        mode: true,
        score: true,
        similarity: true,
        quality: true,
        createdAt: true,
      },
    }) : [];

    const tables = {
      users: { count: usersCount, sample: users },
      user_preferences: { count: prefsCount, sample: prefs },
      dialects: { count: dialectsCount, sample: dialects },
      flashcards: { count: cardsCount, sample: cards },
      sentences: { count: sentencesCount, sample: sentences },
      sentence_word_links: { count: linksCount, sample: links },
      user_card_stats: { count: statsCount, sample: stats },
      review_session: { count: sessionsCount, sample: sessions },
      reviews: { count: reviewsCount, sample: reviews },
    } as const;

    const emptyTables = Object.entries(tables)
      .filter(([, v]) => v.count === 0)
      .map(([k]) => k);

    res.status(200).json({
      ok: true,
      timestamp: new Date().toISOString(),
      emptyTables,
      tables: tables as any,
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error?.message || 'Unknown error' });
  }
}
