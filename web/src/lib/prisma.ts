import { PrismaClient } from '@prisma/client';

/**
 * Converts Direct Connection (5432) to Connection Pooling (6543)
 * Extracts ref from db.{ref}.supabase.co and rebuilds with pooler host
 */
function buildPoolingUrlFromDirect(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname; // db.<ref>.supabase.co
    const port = u.port;
    if (!host.endsWith('.supabase.co') || port !== '5432') return null;
    const match = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
    if (!match) return null;
    const ref = match[1];
    const username = u.username || 'postgres';
    const password = u.password;
    if (!password) return null;
    const region = process.env.SUPABASE_REGION || 'ap-northeast-1';
    const poolingHost = `aws-0-${region}.pooler.supabase.com`;
    const dbName = u.pathname.replace(/^\//, '') || 'postgres';
    const params = u.searchParams;
    params.set('pgbouncer', 'true');
    params.set('connection_limit', '1');
    const search = params.toString();
    const pooledUser = username.includes('.') ? username : `${username}.${ref}`;
    return `postgresql://${pooledUser}:${password}@${poolingHost}:6543/${dbName}?${search}`;
  } catch {
    return null;
  }
}

/**
 * Hardcoded fallback for Vercel environment when DATABASE_URL is not set
 * Uses known project ref: komwtkwhfvhuswfwvnwu
 */
function getVercelFallbackUrl(): string | null {
  // Only in Vercel production
  if (process.env.VERCEL !== '1') return null;
  
  const password = process.env.SUPABASE_PASSWORD;
  const ref = process.env.SUPABASE_REF || 'komwtkwhfvhuswfwvnwu';
  const region = process.env.SUPABASE_REGION || 'ap-northeast-1';
  
  // If we have a password, use it for pooling connection
  if (password) {
    const pooledUser = `postgres.${ref}`;
    return `postgresql://${pooledUser}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`;
  }
  
  return null;
}

let effectiveUrl = process.env.DATABASE_URL;

// If DATABASE_URL is a direct connection (5432), convert to pooling (6543)
if (effectiveUrl?.includes(':5432')) {
  const pooled = buildPoolingUrlFromDirect(effectiveUrl);
  if (pooled) {
    effectiveUrl = pooled;
  }
}

// On Vercel, if DATABASE_URL is still not set or looks wrong, try fallback
if ((process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') && !effectiveUrl) {
  const fallback = getVercelFallbackUrl();
  if (fallback) {
    effectiveUrl = fallback;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient(
    effectiveUrl ? { datasources: { db: { url: effectiveUrl } } } : undefined
  );

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
