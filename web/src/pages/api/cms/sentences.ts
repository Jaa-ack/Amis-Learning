import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.,!?;:]/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { dialectId, text, translation, linkedWordIds } = req.body;
  
  try {
    const sentence = await prisma.sentence.create({ data: { dialectId, text, translation } });

    // 如果有手動指定的連結單字，使用手動連結
    if (linkedWordIds && Array.isArray(linkedWordIds) && linkedWordIds.length > 0) {
      for (const flashcardId of linkedWordIds) {
        const flashcard = await prisma.flashcard.findUnique({
          where: { id: flashcardId },
          select: { lemma: true },
        });
        
        if (flashcard) {
          // 在句子中尋找單字的位置
          const normalizedText = text.toLowerCase();
          const normalizedLemma = flashcard.lemma.toLowerCase();
          let searchPos = 0;
          let foundIndex = normalizedText.indexOf(normalizedLemma, searchPos);
          
          while (foundIndex !== -1) {
            await prisma.sentenceWordLink.create({
              data: {
                sentenceId: sentence.id,
                flashcardId: flashcardId,
                startIndex: foundIndex,
                endIndex: foundIndex + flashcard.lemma.length,
              },
            });
            searchPos = foundIndex + 1;
            foundIndex = normalizedText.indexOf(normalizedLemma, searchPos);
          }
        }
      }
      return res.json({ sentence, manualLinks: linkedWordIds.length });
    }

    // 原有的自動連結邏輯
    const parts = text.split(/\s+/).map((p: string) => normalize(p)).filter(Boolean);
    const links: { flashcardId: string; startIndex: number; endIndex: number }[] = [];
    let cursor = 0;
    
    for (const raw of parts) {
      const start = text.indexOf(raw, cursor);
      const end = start + raw.length;
      cursor = end;
      const exact = await prisma.flashcard.findFirst({ where: { dialectId, lemma: raw }, select: { id: true } });
      if (exact) { 
        links.push({ flashcardId: exact.id, startIndex: start, endIndex: end }); 
        continue; 
      }
      const candidates = await prisma.$queryRaw<{ id: string; lemma: string; sim: number }[]>`
        SELECT id, lemma, similarity(lemma, ${raw}) AS sim
        FROM flashcards WHERE dialect_id = ${dialectId}
        ORDER BY sim DESC LIMIT 1;
      `;
      const best = candidates[0];
      if (best && best.sim >= 0.85) {
        links.push({ flashcardId: best.id, startIndex: start, endIndex: end });
      }
    }
    
    for (const l of links) {
      await prisma.sentenceWordLink.upsert({
        where: { 
          sentenceId_flashcardId_startIndex_endIndex: { 
            sentenceId: sentence.id, 
            flashcardId: l.flashcardId, 
            startIndex: l.startIndex, 
            endIndex: l.endIndex 
          } 
        },
        update: {},
        create: { 
          sentenceId: sentence.id, 
          flashcardId: l.flashcardId, 
          startIndex: l.startIndex, 
          endIndex: l.endIndex 
        },
      });
    }
    res.json({ sentence, links });
  } catch (error) {
    console.error('Create sentence error:', error);
    res.status(500).json({ error: 'Failed to create sentence' });
  }
}
