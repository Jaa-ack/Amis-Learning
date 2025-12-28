import type { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function dashboardRoutes(app: FastifyInstance) {
  app.get('/dashboard/dialects', async () => {
    const data = await prisma.$queryRaw<any[]>`
      SELECT d.id AS dialect_id, d.name, COUNT(f.id) AS cards
      FROM dialects d
      LEFT JOIN flashcards f ON f.dialect_id = d.id
      GROUP BY d.id, d.name
      ORDER BY d.name ASC;
    `;
    return { data };
  });

  app.get('/dashboard/priority', async (req) => {
    const userId = (req.query as any).userId as string;
    const data = await prisma.$queryRaw<any[]>`
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
      SELECT * FROM ranked
      ORDER BY priority ASC, next_review_at ASC NULLS LAST, ef ASC;
    `;
    return { data };
  });
}
