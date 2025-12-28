import { PrismaClient } from '@prisma/client';

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

const rawUrl = process.env.DATABASE_URL;
const shouldForcePooling = process.env.VERCEL === '1' || process.env.FORCE_SUPABASE_POOLING === '1';

const effectiveUrl =
  shouldForcePooling && rawUrl ? (buildPoolingUrlFromDirect(rawUrl) || rawUrl) : rawUrl;

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
