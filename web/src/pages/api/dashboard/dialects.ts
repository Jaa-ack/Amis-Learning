import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const data = await prisma.$queryRaw<any[]>`
    SELECT d.id AS dialect_id, d.name, COUNT(f.id) AS cards
    FROM dialects d
    LEFT JOIN flashcards f ON f.dialect_id = d.id
    GROUP BY d.id, d.name
    ORDER BY d.name ASC;
  `;
  res.json({ data });
}
