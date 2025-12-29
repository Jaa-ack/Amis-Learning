import type { FastifyInstance } from 'fastify';
import { prisma } from '../index';

export async function dictionaryRoutes(app: FastifyInstance) {
  app.get('/dictionary/search', async (req) => {
    const q = (req.query as any).q as string;
    const dialectId = (req.query as any).dialectId as string | undefined;
    if (!q) return { items: [] };

    let items: any[];

    if (dialectId) {
      items = await prisma.$queryRaw<any[]>`
        SELECT id, lemma, meaning, dialect_id,
               similarity(lemma, ${q}) AS sim
        FROM flashcards
        WHERE dialect_id = ${dialectId}
        ORDER BY sim DESC
        LIMIT 50;
      `;
    } else {
      items = await prisma.$queryRaw<any[]>`
        SELECT id, lemma, meaning, dialect_id,
               similarity(lemma, ${q}) AS sim
        FROM flashcards
        ORDER BY sim DESC
        LIMIT 50;
      `;
    }

    return { items };
  });
}
