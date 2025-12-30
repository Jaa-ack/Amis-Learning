import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { dialectId, text, translation } = req.body;

  // 驗證必填欄位
  if (!dialectId || !text) {
    return res.status(400).json({ error: '請提供 dialectId 和 text' });
  }

  // 驗證格式
  const trimmedText = text.trim();
  if (!trimmedText) {
    return res.status(400).json({ error: '例句不能為空白' });
  }

  if (trimmedText.length > 500) {
    return res.status(400).json({ error: '例句長度不能超過 500 個字元' });
  }
  
  try {
    // 驗證語別是否存在
    const dialectExists = await prisma.dialect.findUnique({ where: { id: dialectId } });
    if (!dialectExists) {
      return res.status(400).json({ error: '指定的語別不存在' });
    }

    // 建立例句
    const sentence = await prisma.sentence.create({
      data: { 
        dialectId, 
        text: trimmedText, 
        translation: translation?.trim() || null 
      }
    });
    
    console.log(`[CMS] Created sentence: ${sentence.text.substring(0, 30)}... (${sentence.id})`);
    res.json({ sentence, success: true });
  } catch (error: any) {
    console.error('Create sentence error:', error);
    res.status(500).json({ 
      error: '資料庫錯誤，請稍後再試',
      details: error.message 
    });
  }
}
