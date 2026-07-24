import { withLogging } from '@/lib/api-logging';

export const runtime = 'nodejs';

const startedAt = new Date().toISOString();

/** Process liveness check for uptime monitors and pitctl. */
async function rawGET() {
  const body = {
    status: 'ok',
    startedAt,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export const GET = withLogging(rawGET, 'health');
