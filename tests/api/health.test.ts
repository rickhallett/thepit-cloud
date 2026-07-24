import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    execute: vi.fn(),
  },
}));

vi.mock('@/db', () => ({
  db: mockDb,
}));

vi.mock('@/lib/api-logging', () => ({
  withLogging: (handler: (request: Request) => Promise<Response>) => handler,
}));

const requestFor = (path: string) =>
  new Request(`https://thepit.cloud${path}`);

describe('health endpoints', () => {
  beforeEach(() => {
    vi.resetModules();
    mockDb.execute.mockReset();
  });

  it('reports process liveness without querying the database', async () => {
    mockDb.execute.mockRejectedValue(new Error('quota exceeded'));
    const { GET } = await import('@/app/api/health/route');

    const response = await GET(requestFor('/api/health'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.database).toBeUndefined();
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('reports database readiness separately', async () => {
    mockDb.execute.mockResolvedValue([]);
    const { GET } = await import('@/app/api/readiness/route');

    const response = await GET(requestFor('/api/readiness'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ready');
    expect(body.database.status).toBe('ok');
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when the database is not ready', async () => {
    mockDb.execute.mockRejectedValue(new Error('quota exceeded'));
    const { GET } = await import('@/app/api/readiness/route');

    const response = await GET(requestFor('/api/readiness'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('not_ready');
    expect(body.database.status).toBe('error');
  });
});
