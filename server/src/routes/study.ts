import type { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { applySm2, mapScoreToQuality } from '../services/sm2';

export async function studyRoutes(app: FastifyInstance) {
  // Get next cards by priority and dialect
  app.get('/cards/next', async (req) => {
    const query = req.query as any;
    const userId = query.userId as string;
    const dialectId = query.dialectId as string | undefined;
    const limit = Number(query.limit ?? 20);

    const stats = await prisma.$queryRaw<any[]>`
      WITH stats AS (
        SELECT ucs.*, f.dialect_id,
               EXISTS (
                 SELECT 1 FROM reviews r
                 JOIN review_session s ON s.id = r.session_id
                 WHERE r.user_id = ${userId}
                   AND r.flashcard_id = ucs.flashcard_id
                   AND s.type = 'POST_TEST'
                   AND r.score <= 2
               ) AS failed_post_test
        FROM user_card_stats ucs
        JOIN flashcards f ON f.id = ucs.flashcard_id
        WHERE ucs.user_id = ${userId}
          ${dialectId ? prisma.$queryRaw`AND f.dialect_id = ${dialectId}` : prisma.$queryRaw``}
      ), ranked AS (
        SELECT
          stats.flashcard_id,
          stats.user_id,
          stats.ef,
          stats.repetitions,
          stats.next_review_at,
          CASE
            WHEN stats.failed_post_test THEN 1
            WHEN stats.ef <= 1.6 THEN 2
            WHEN stats.next_review_at IS NOT NULL AND now() > stats.next_review_at THEN 3
            WHEN stats.repetitions < 2 THEN 4
            ELSE 4
          END AS priority
        FROM stats
      )
      SELECT f.*, ranked.priority
      FROM ranked
      JOIN flashcards f ON f.id = ranked.flashcard_id
      ORDER BY priority ASC, next_review_at ASC NULLS LAST, ef ASC
      LIMIT ${limit};
    `;

    return { items: stats };
  });

  // Submit a review result
  app.post('/reviews', async (req) => {
    const body = req.body as any;
    const { userId, flashcardId, mode, score, similarity, isPostTest, sessionId } = body;

    const stat = await prisma.userCardStat.findUnique({
      where: {
        userId_flashcardId: { userId, flashcardId },
      },
    }).catch(() => null);

    const base = stat ?? await prisma.userCardStat.create({
      data: { userId, flashcardId },
    });

    const quality = mapScoreToQuality({ mode, score, similarity, isPostTest });
    const updates = applySm2(base, { mode, score, similarity, isPostTest });

    await prisma.userCardStat.update({
      where: { id: base.id },
      data: updates,
    });

    const review = await prisma.review.create({
      data: {
        userId,
        flashcardId,
        sessionId,
        mode,
        score,
        similarity,
        quality,
      },
    });

    return { ok: true, review, stat: updates };
  });

  // Start a post-test session (draw up to 20 recent)
  app.post('/post-test/start', async (req) => {
    const body = req.body as any;
    const { userId } = body;
    const session = await prisma.reviewSession.create({ data: { userId, type: 'POST_TEST' } });

    const today = new Date();
    today.setHours(0,0,0,0);
    const cards = await prisma.userCardStat.findMany({
      where: { userId, lastReviewAt: { gte: today } },
      orderBy: [{ lastReviewAt: 'desc' }],
      take: 20,
      select: { flashcardId: true },
    });

    return { sessionId: session.id, items: cards };
  });
}
