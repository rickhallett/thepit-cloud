import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  unstableCache,
  getIntroPoolStatus,
  getLeaderboardData,
  getAgentSnapshots,
  getRecentBouts,
  getRecentBoutsCount,
} = vi.hoisted(() => ({
  unstableCache: vi.fn(),
  getIntroPoolStatus: vi.fn(),
  getLeaderboardData: vi.fn(),
  getAgentSnapshots: vi.fn(),
  getRecentBouts: vi.fn(),
  getRecentBoutsCount: vi.fn(),
}));

vi.mock('next/cache', () => ({
  unstable_cache: unstableCache,
}));

vi.mock('@/lib/intro-pool', () => ({
  getIntroPoolStatus,
}));

vi.mock('@/lib/leaderboard', () => ({
  getLeaderboardData,
}));

vi.mock('@/lib/agent-registry', () => ({
  getAgentSnapshots,
}));

vi.mock('@/lib/recent-bouts', () => ({
  getRecentBouts,
  getRecentBoutsCount,
}));

const introPool = {
  remainingMicro: 9_900,
  remainingCredits: 99,
  halfLifeDays: 3,
  initialCredits: 15_000,
  startedAt: '2026-07-24T08:00:00.000Z',
  exhausted: false,
};

const leaderboard = {
  all: { pit: [], players: [] },
  week: { pit: [], players: [] },
  day: { pit: [], players: [] },
};

const agents = [
  {
    id: 'preset:test:one',
    name: 'One',
    presetId: 'test',
    presetName: 'Test',
    tier: 'free' as const,
    systemPrompt: 'Test',
    responseLength: 'standard',
    responseFormat: 'plain',
  },
];

const recentBouts = [
  {
    id: 'bout-1',
    presetId: 'test',
    presetName: 'Test',
    topic: 'Caching',
    agentNames: ['One', 'Two'],
    shareLine: null,
    turnCount: 4,
    reactionCount: 0,
    createdAt: new Date('2026-07-24T08:00:00.000Z'),
  },
];

const loadReadModel = () => import('@/lib/public-read-model');

describe('public read model', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('CREDITS_ENABLED', 'true');
    unstableCache.mockReset();
    getIntroPoolStatus.mockReset();
    getLeaderboardData.mockReset();
    getAgentSnapshots.mockReset();
    getRecentBouts.mockReset();
    getRecentBoutsCount.mockReset();

    unstableCache.mockImplementation(
      (load: () => Promise<unknown>) => {
        let cached: Promise<unknown> | undefined;
        return () => {
          cached ??= load();
          return cached;
        };
      },
    );

    getIntroPoolStatus.mockResolvedValue(introPool);
    getLeaderboardData.mockResolvedValue(leaderboard);
    getAgentSnapshots.mockResolvedValue(agents);
    getRecentBouts.mockResolvedValue(recentBouts);
    getRecentBoutsCount.mockResolvedValue(1);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shares one hourly snapshot across public page reads', async () => {
    const {
      getPublicIntroPoolStatus,
      getPublicLeaderboardData,
      getPublicAgentSnapshots,
      getPublicRecentBoutsPage,
    } = await loadReadModel();

    await getPublicIntroPoolStatus();
    await getPublicLeaderboardData();
    await getPublicAgentSnapshots();
    const recent = await getPublicRecentBoutsPage(1, 20);

    expect(recent).toEqual({ total: 1, bouts: recentBouts });
    expect(getIntroPoolStatus).toHaveBeenCalledTimes(1);
    expect(getLeaderboardData).toHaveBeenCalledTimes(1);
    expect(getAgentSnapshots).toHaveBeenCalledTimes(1);
    expect(getRecentBouts).toHaveBeenCalledTimes(1);
    expect(getRecentBoutsCount).toHaveBeenCalledTimes(1);
    expect(unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ['public-read-model-v1'],
      {
        revalidate: 60 * 60,
        tags: ['public-read-model'],
      },
    );
  });

  it('returns safe public fallbacks when the database is unavailable', async () => {
    getIntroPoolStatus.mockRejectedValue(new Error('quota exceeded'));
    getLeaderboardData.mockRejectedValue(new Error('quota exceeded'));
    getAgentSnapshots.mockRejectedValue(new Error('quota exceeded'));
    getRecentBouts.mockRejectedValue(new Error('quota exceeded'));
    getRecentBoutsCount.mockRejectedValue(new Error('quota exceeded'));

    const {
      getPublicIntroPoolStatus,
      getPublicLeaderboardData,
      getPublicAgentSnapshots,
      getPublicRecentBoutsPage,
    } = await loadReadModel();

    await expect(getPublicIntroPoolStatus()).resolves.toBeNull();
    await expect(getPublicLeaderboardData()).resolves.toEqual(leaderboard);
    await expect(getPublicAgentSnapshots()).resolves.toEqual([]);
    await expect(getPublicRecentBoutsPage(1, 20)).resolves.toEqual({
      total: 0,
      bouts: [],
    });
  });

  it('caches additional recent pages independently for one hour', async () => {
    const { getPublicRecentBoutsPage } = await loadReadModel();

    await getPublicRecentBoutsPage(2, 20);
    await getPublicRecentBoutsPage(2, 20);

    expect(getRecentBouts).toHaveBeenCalledTimes(1);
    expect(getRecentBouts).toHaveBeenCalledWith(20, 20);
    expect(getRecentBoutsCount).toHaveBeenCalledTimes(1);
    expect(unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      ['public-recent-bouts-v1', '20', '20'],
      {
        revalidate: 60 * 60,
        tags: ['public-read-model'],
      },
    );
  });
});
