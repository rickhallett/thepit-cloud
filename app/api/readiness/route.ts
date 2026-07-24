import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { withLogging } from '@/lib/api-logging';

export const runtime = 'nodejs';

/** Dependency readiness check for deliberate diagnostics and deployment gates. */
async function rawGET() {
  let dbStatus: 'ok' | 'error' = 'error';
  let dbLatencyMs = -1;

  if (db) {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      dbStatus = 'ok';
      dbLatencyMs = Date.now() - start;
    } catch {
      dbLatencyMs = Date.now() - start;
    }
  }

  const ready = dbStatus === 'ok';

  return Response.json(
    {
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}

export const GET = withLogging(rawGET, 'readiness');
