import type { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

type TestResult = { name: string; status: 'SUCCESS' | 'FAILED'; [key: string]: any };

function tryBuildAltHost(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (!host.includes('pooler.supabase.com')) return null;
    // 將 aws-0 切換為 aws-1 或反向
    if (host.startsWith('aws-0-')) {
      u.hostname = host.replace('aws-0-', 'aws-1-');
      return u.toString();
    }
    if (host.startsWith('aws-1-')) {
      u.hostname = host.replace('aws-1-', 'aws-0-');
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const url = process.env.DATABASE_URL;
  const results: any = {
    url_set: !!url,
    tests: [] as TestResult[],
    env: {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      supabase_ref: process.env.SUPABASE_REF || null,
      supabase_region: process.env.SUPABASE_REGION || null,
    }
  };

  if (!url) {
    return res.status(500).json({ error: 'DATABASE_URL not set' });
  }

  // Test 1: current URL
  try {
    const c1 = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    await c1.connect();
    const r1 = await c1.query('SELECT current_user as user, inet_server_addr() as host, inet_server_port() as port, version() as version');
    await c1.end();
    results.tests.push({ name: 'current_url', status: 'SUCCESS', details: r1.rows[0] });
  } catch (e: any) {
    results.tests.push({ name: 'current_url', status: 'FAILED', error: e.message });
  }

  // Test 2: alternate host
  const alt = tryBuildAltHost(url);
  if (alt) {
    try {
      const c2 = new Client({ connectionString: alt, ssl: { rejectUnauthorized: false } });
      await c2.connect();
      const r2 = await c2.query('SELECT current_user as user, inet_server_addr() as host, inet_server_port() as port');
      await c2.end();
      results.tests.push({ name: 'alternate_pooler_host', status: 'SUCCESS', details: r2.rows[0], alt_used: alt });
    } catch (e: any) {
      results.tests.push({ name: 'alternate_pooler_host', status: 'FAILED', error: e.message, alt_used: alt });
    }
  }

  const ok = results.tests.some((t: TestResult) => t.status === 'SUCCESS');
  results.overall = ok ? 'HEALTHY' : 'ISSUES_DETECTED';
  return res.json(results);
}
