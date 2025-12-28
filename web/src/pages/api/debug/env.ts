import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  const response = {
    database_url_set: !!databaseUrl,
    database_url_preview: databaseUrl ? databaseUrl.substring(0, 60) + '...' : 'NOT SET',
    direct_url_set: !!directUrl,
    direct_url_preview: directUrl ? directUrl.substring(0, 60) + '...' : 'NOT SET',
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString(),
    diagnosis: {
      hasDatabase: !!databaseUrl,
      hasDirectUrl: !!directUrl,
      databaseUrlValid: databaseUrl?.includes('postgresql') ?? false,
      directUrlValid: directUrl?.includes('postgresql') ?? false,
    },
  };

  res.json(response);
}
