import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const supabasePassword = process.env.SUPABASE_PASSWORD;
  const supabaseRef = process.env.SUPABASE_REF;
  const supabaseRegion = process.env.SUPABASE_REGION;

  const response = {
    // Main environment URLs
    database_url_set: !!databaseUrl,
    database_url_preview: databaseUrl ? databaseUrl.substring(0, 60) + '...' : 'NOT SET',
    direct_url_set: !!directUrl,
    direct_url_preview: directUrl ? directUrl.substring(0, 60) + '...' : 'NOT SET',
    
    // Fallback configuration
    supabase_password_set: !!supabasePassword,
    supabase_ref: supabaseRef || 'komwtkwhfvhuswfwvnwu (default)',
    supabase_region: supabaseRegion || 'ap-northeast-1 (default)',
    
    // Runtime environment
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString(),
    
    diagnosis: {
      hasDatabase: !!databaseUrl,
      hasDirectUrl: !!directUrl,
      databaseUrlValid: databaseUrl?.includes('postgresql') ?? false,
      directUrlValid: directUrl?.includes('postgresql') ?? false,
      canBuildFallback: !!supabasePassword,
      fallbackReady: !!supabasePassword && (!!supabaseRef || true),
    },
  };

  res.json(response);
}
