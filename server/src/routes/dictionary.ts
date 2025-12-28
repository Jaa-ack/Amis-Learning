import type { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function dictionaryRoutes(app: FastifyInstance) {
  app.get('/dictionary/search', async (req) => {
    const q = (req.query as any).q as string;
    const dialectId = (req.query as any).dialectId as string | undefined;
    if (!q) return { items: [] };

    const items = await prisma.$queryRaw<any[]>`
      SELECT id, lemma, meaning, dialect_id,
             similarity(lemma, ${q}) AS sim
      FROM flashcards
      ${dialectId ? prisma.$queryRaw`WHERE dialect_id = ${dialectId}` : prisma.$queryRaw``}
      ORDER BY sim DESC
      LIMIT 50;
    `;
    return { items };
  });
}
