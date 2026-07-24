import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { recordPageView, serverTrack } = vi.hoisted(() => ({
  recordPageView: vi.fn(),
  serverTrack: vi.fn(),
}));

vi.mock('@/lib/hash', () => ({
  sha256Hex: vi.fn().mockResolvedValue('hashed-ip'),
}));

vi.mock('@/lib/logger', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api-utils', () => ({
  API_ERRORS: {
    FORBIDDEN: { code: 'forbidden' },
    INTERNAL: { code: 'internal' },
  },
  errorResponse: (error: unknown, status: number) =>
    Response.json(error, { status }),
  parseValidBody: async () => ({
    data: {
      path: '/',
      sessionId: 'session-1',
      clientIp: '192.0.2.1',
      referrer: '',
      userAgent: 'test',
      country: 'GB',
      utm: '',
      userId: null,
      copyVariant: null,
      visitNumber: 1,
      daysSinceLastVisit: null,
      isNewSession: true,
      referralCode: null,
    },
  }),
}));

vi.mock('@/lib/api-schemas', () => ({
  pageViewSchema: {},
}));

vi.mock('@/lib/api-logging', () => ({
  withLogging: (handler: (request: Request) => Promise<Response>) => handler,
}));

vi.mock('@/lib/posthog-server', () => ({
  serverTrack,
}));

vi.mock('@/lib/submissions', () => ({
  recordPageView,
}));

const makeRequest = () =>
  new Request('https://thepit.cloud/api/pv', {
    method: 'POST',
    headers: {
      'x-pv-secret': 'test-secret',
    },
  });

describe('page-view analytics route', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('PV_INTERNAL_SECRET', 'test-secret');
    vi.stubEnv('DATABASE_PAGE_VIEWS_ENABLED', 'false');
    recordPageView.mockReset();
    serverTrack.mockReset();
    recordPageView.mockResolvedValue(undefined);
    serverTrack.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps PostHog events while database storage is disabled', async () => {
    const { POST } = await import('@/app/api/pv/route');

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(recordPageView).not.toHaveBeenCalled();
    expect(serverTrack).toHaveBeenCalledWith(
      'anon_session-1',
      'session_started',
      expect.objectContaining({ landing_page: '/' }),
    );
  });

  it('writes the optional database archive only after explicit opt-in', async () => {
    vi.stubEnv('DATABASE_PAGE_VIEWS_ENABLED', 'true');
    const { POST } = await import('@/app/api/pv/route');

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    expect(recordPageView).toHaveBeenCalledTimes(1);
    expect(serverTrack).toHaveBeenCalledTimes(1);
  });
});
