import type { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { smartLinkSentence } from '../services/smartLinker';

export async function cmsRoutes(app: FastifyInstance) {
  app.post('/cms/flashcards', async (req, reply) => {
    const { dialectId, lemma, meaning, phonetic, tags } = req.body as any;
    const dup = await prisma.flashcard.findFirst({ where: { dialectId, lemma } });
    if (dup) return reply.status(409).send({ error: 'Duplicate lemma in dialect' });
    const card = await prisma.flashcard.create({
      data: { dialectId, lemma, meaning, phonetic, tags: tags ?? [] },
    });
    return { card };
  });

  app.post('/cms/sentences', async (req) => {
    const { dialectId, text, translation } = req.body as any;
    const sentence = await prisma.sentence.create({
      data: { dialectId, text, translation },
    });
    const links = await smartLinkSentence(sentence.id, dialectId, text);
    return { sentence, links };
  });
}
