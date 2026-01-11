import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

// 引號正規化函數（不轉小寫）
function normalizeQuotes(s: string): string {
  return s
    // 將各種單引號符號統一轉換為半形單引號 '
    .replace(/[''‛‚`´]/g, "'")
    // 將全形雙引號轉換為半形雙引號
    .replace(/[""„‟]/g, '"');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { dialectId, lemma, meaning, tags } = req.body;

  // 驗證必填欄位
  if (!dialectId || !lemma) {
    return res.status(400).json({ error: '請提供 dialectId 和 lemma' });
  }

  // 驗證格式
  const trimmedLemma = lemma.trim();
  if (!trimmedLemma) {
    return res.status(400).json({ error: '單字不能為空白' });
  }

  if (trimmedLemma.length > 100) {
    return res.status(400).json({ error: '單字長度不能超過 100 個字元' });
  }

  try {
    // 檢查重複
    const dup = await prisma.flashcard.findFirst({ 
      where: { 
        dialectId, 
        lemma: trimmedLemma 
      } 
    });
    
    if (dup) {
      return res.status(409).json({ 
        error: `此單字「${trimmedLemma}」已存在於該語別中`,
        duplicate: true,
        existingCard: { id: dup.id, lemma: dup.lemma, meaning: dup.meaning }
      });
    }

    // 驗證語別是否存在
    const dialectExists = await prisma.dialect.findUnique({ where: { id: dialectId } });
    if (!dialectExists) {
      return res.status(400).json({ error: '指定的語別不存在' });
    }

    // 建立單字
    const card = await prisma.flashcard.create({ 
      data: { 
        dialectId, 
        lemma: normalizeQuotes(trimmedLemma), 
        meaning: meaning?.trim() ? normalizeQuotes(meaning.trim()) : null, 
        tags: tags ?? [] 
      } 
    });
    
    console.log(`[CMS] Created flashcard: ${card.lemma} (${card.id})`);
    res.json({ card, success: true });
  } catch (error: any) {
    console.error('Create flashcard error:', error);
    res.status(500).json({ 
      error: '資料庫錯誤，請稍後再試',
      details: error.message 
    });
  }
}
