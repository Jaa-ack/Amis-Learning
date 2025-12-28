import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.,!?;:]/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { dialectId, text, translation } = req.body;
  const sentence = await prisma.sentence.create({ data: { dialectId, text, translation } });

  const parts = text.split(/\s+/).map((p: string) => normalize(p)).filter(Boolean);
  const links: { flashcardId: string; startIndex: number; endIndex: number }[] = [];
  let i = 0; let cursor = 0;
  for (const raw of parts) {
    const start = text.indexOf(raw, cursor);
    const end = start + raw.length;
    cursor = end;
    const exact = await prisma.flashcard.findFirst({ where: { dialectId, lemma: raw }, select: { id: true } });
    if (exact) { links.push({ flashcardId: exact.id, startIndex: start, endIndex: end }); continue; }
    const candidates = await prisma.$queryRaw<{ id: string; lemma: string; sim: number }[]>`
      SELECT id, lemma, similarity(lemma, ${raw}) AS sim
      FROM flashcards WHERE dialect_id = ${dialectId}
      ORDER BY sim DESC LIMIT 1;
    `;
    const best = candidates[0];
    if (best && best.sim >= 0.85) links.push({ flashcardId: best.id, startIndex: start, endIndex: end });
  }
  for (const l of links) {
    await prisma.sentenceWordLink.upsert({
      where: { sentenceId_flashcardId_startIndex_endIndex: { sentenceId: sentence.id, flashcardId: l.flashcardId, startIndex: l.startIndex, endIndex: l.endIndex } },
      update: {},
      create: { sentenceId: sentence.id, flashcardId: l.flashcardId, startIndex: l.startIndex, endIndex: l.endIndex },
    });
  }
  res.json({ sentence, links });
}
