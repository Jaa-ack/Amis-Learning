import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    // 啟用 PostgreSQL pg_trgm 擴充，供 similarity() 等函式使用
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    res.json({ ok: true, message: 'pg_trgm 已啟用（或本來就存在）' });
  } catch (error: any) {
    console.error('Enable pg_trgm error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}
