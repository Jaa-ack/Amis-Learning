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
 * Fallback connection builder from individual env vars
 * Used when DATABASE_URL is not available (common in Vercel)
 */
function getServerlessFallbackUrl(): string | null {
  const password = process.env.SUPABASE_PASSWORD;
  const ref = process.env.SUPABASE_REF || 'komwtkwhfvhuswfwvnwu';
  const region = process.env.SUPABASE_REGION || 'ap-south-1';
  
  // Only build fallback if we have a password
  if (!password) return null;
  
  const pooledUser = `postgres.${ref}`;
  return `postgresql://${pooledUser}:${password}@aws-0-${region}.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require`;
}

let effectiveUrl = process.env.DATABASE_URL;

// If DATABASE_URL is a direct connection (5432), convert to pooling (6543)
if (effectiveUrl?.includes(':5432')) {
  const pooled = buildPoolingUrlFromDirect(effectiveUrl);
  if (pooled) {
    effectiveUrl = pooled;
  }
}

// If DATABASE_URL is missing or invalid, try serverless fallback
// This handles Vercel deployments where env var references fail
if (!effectiveUrl || !effectiveUrl.includes('postgresql://')) {
  const fallback = getServerlessFallbackUrl();
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

// Diagnostics logging (remove in production if verbose logs are unwanted)
if (typeof window === 'undefined') {
  // 伺服器端才會執行
  if (!effectiveUrl) {
    console.warn('[Prisma] ⚠️ DATABASE_URL not resolved - queries may fail');
  } else {
    const preview = effectiveUrl.substring(0, 60) + '...';
    console.log(`[Prisma] ✓ Connected to ${preview}`);
  }
}
