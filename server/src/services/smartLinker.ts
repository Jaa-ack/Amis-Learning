import { prisma } from '../index';

export async function smartLinkSentence(sentenceId: string, dialectId: string, text: string, tolerance = 0.85) {
  // Simple tokenization: split by spaces; in production use ICU/segmenter
  const tokens = tokenize(text);
  const links: { flashcardId: string; startIndex: number; endIndex: number }[] = [];

  for (const token of tokens) {
    const exact = await prisma.flashcard.findFirst({
      where: { dialectId, lemma: token.value },
      select: { id: true },
    });
    if (exact) {
      links.push({ flashcardId: exact.id, startIndex: token.start, endIndex: token.end });
      continue;
    }
    // Fuzzy search via pg_trgm similarity using raw SQL
    const candidates = await prisma.$queryRaw<{ id: string; lemma: string; sim: number }[]>`
      SELECT id, lemma, similarity(lemma, ${token.value}) AS sim
      FROM flashcards
      WHERE dialect_id = ${dialectId}
      ORDER BY sim DESC
      LIMIT 1;
    `;
    const best = candidates[0];
    if (best && best.sim >= tolerance) {
      links.push({ flashcardId: best.id, startIndex: token.start, endIndex: token.end });
    }
  }

  // Persist links
  for (const l of links) {
    await prisma.sentenceWordLink.upsert({
      where: {
        sentenceId_flashcardId_startIndex_endIndex: {
          sentenceId,
          flashcardId: l.flashcardId,
          startIndex: l.startIndex,
          endIndex: l.endIndex,
        },
      },
      update: {},
      create: {
        sentenceId,
        flashcardId: l.flashcardId,
        startIndex: l.startIndex,
        endIndex: l.endIndex,
      },
    });
  }
  return links;
}

function tokenize(text: string) {
  const tokens: { value: string; start: number; end: number }[] = [];
  let i = 0;
  for (const part of text.split(/\s+/)) {
    const start = text.indexOf(part, i);
    tokens.push({ value: normalize(part), start, end: start + part.length });
    i = start + part.length;
  }
  return tokens.filter(t => t.value.length > 0);
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.,!?;:]/g, '');
}
