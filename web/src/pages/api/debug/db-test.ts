import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tests: any = {
    timestamp: new Date().toISOString(),
    environment: {
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL_ENV,
      database_url_set: !!process.env.DATABASE_URL,
      direct_url_set: !!process.env.DIRECT_URL,
      supabase_password_set: !!process.env.SUPABASE_PASSWORD,
      supabase_ref: process.env.SUPABASE_REF || 'not set',
      supabase_region: process.env.SUPABASE_REGION || 'not set',
    },
    tests: {
      prisma_client_initialized: !!prisma,
    }
  };

  // Test 1: Simple query
  try {
    const dialectCount = await prisma.dialect.count();
    tests.tests.dialect_count = dialectCount;
    tests.tests.query_test = 'SUCCESS';
  } catch (error: any) {
    tests.tests.query_test = 'FAILED';
    tests.tests.query_error = error.message;
    tests.tests.query_error_code = error.code;
  }

  // Test 2: Raw query
  try {
    const result = await prisma.$queryRaw<any[]>`SELECT 1 as test`;
    tests.tests.raw_query_test = result.length > 0 ? 'SUCCESS' : 'FAILED';
  } catch (error: any) {
    tests.tests.raw_query_test = 'FAILED';
    tests.tests.raw_query_error = error.message;
  }

  // Test 3: List dialects
  try {
    const dialects = await prisma.dialect.findMany({
      select: { id: true, name: true, code: true },
      take: 5
    });
    tests.tests.dialects_sample = dialects;
    tests.tests.dialect_fetch = 'SUCCESS';
  } catch (error: any) {
    tests.tests.dialect_fetch = 'FAILED';
    tests.tests.dialect_fetch_error = error.message;
  }

  // Test 4: Connection info
  try {
    await prisma.$connect();
    tests.tests.connection_test = 'SUCCESS';
  } catch (error: any) {
    tests.tests.connection_test = 'FAILED';
    tests.tests.connection_error = error.message;
  }

  const allTestsPassed = Object.values(tests.tests)
    .filter(v => typeof v === 'string' || typeof v === 'boolean')
    .every(v => v === 'SUCCESS' || v === true);

  tests.overall_status = allTestsPassed ? 'HEALTHY' : 'ISSUES_DETECTED';

  res.json(tests);
}
