// Shared, bounded-staleness read model for anonymous catalogue pages.

import { unstable_cache } from 'next/cache';

import type { AgentSnapshot } from '@/lib/agent-registry';
import { getAgentSnapshots } from '@/lib/agent-registry';
import { getIntroPoolStatus } from '@/lib/intro-pool';
import type { LeaderboardData } from '@/lib/leaderboard';
import { getLeaderboardData } from '@/lib/leaderboard';
import { log } from '@/lib/logger';
import type { RecentBout } from '@/lib/recent-bouts';
import { getRecentBouts, getRecentBoutsCount } from '@/lib/recent-bouts';

const PUBLIC_READ_REVALIDATE_SECONDS = 60 * 60;

const PUBLIC_READ_MODEL_TAG = 'public-read-model';
const PUBLIC_RECENT_PAGE_SIZE = 20;

type IntroPoolStatus = Awaited<ReturnType<typeof getIntroPoolStatus>>;
type SerializedRecentBout = Omit<RecentBout, 'createdAt'> & {
  createdAt: string;
};

type PublicReadModel = {
  introPool: IntroPoolStatus | null;
  leaderboard: LeaderboardData;
  agents: AgentSnapshot[];
  recent: {
    total: number;
    bouts: SerializedRecentBout[];
  };
};

const emptyLeaderboard = (): LeaderboardData => ({
  all: { pit: [], players: [] },
  week: { pit: [], players: [] },
  day: { pit: [], players: [] },
});

const serializeRecentBout = (bout: RecentBout): SerializedRecentBout => ({
  ...bout,
  createdAt: bout.createdAt.toISOString(),
});

const deserializeRecentBout = (bout: SerializedRecentBout): RecentBout => ({
  ...bout,
  createdAt: new Date(bout.createdAt),
});

const reportFailure = (source: string, result: PromiseRejectedResult) => {
  log.warn('Public read model source unavailable', {
    source,
    error:
      result.reason instanceof Error
        ? result.reason.message
        : String(result.reason),
  });
};

async function loadPublicReadModel(): Promise<PublicReadModel> {
  const [
    introPoolResult,
    leaderboardResult,
    agentsResult,
    recentBoutsResult,
    recentCountResult,
  ] = await Promise.allSettled([
    process.env.CREDITS_ENABLED === 'true'
      ? getIntroPoolStatus()
      : Promise.resolve(null),
    getLeaderboardData(),
    getAgentSnapshots(),
    getRecentBouts(PUBLIC_RECENT_PAGE_SIZE, 0),
    getRecentBoutsCount(),
  ]);

  const results = [
    ['introPool', introPoolResult],
    ['leaderboard', leaderboardResult],
    ['agents', agentsResult],
    ['recentBouts', recentBoutsResult],
    ['recentCount', recentCountResult],
  ] as const;

  for (const [source, result] of results) {
    if (result.status === 'rejected') {
      reportFailure(source, result);
    }
  }

  return {
    introPool:
      introPoolResult.status === 'fulfilled' ? introPoolResult.value : null,
    leaderboard:
      leaderboardResult.status === 'fulfilled'
        ? leaderboardResult.value
        : emptyLeaderboard(),
    agents:
      agentsResult.status === 'fulfilled' ? agentsResult.value : [],
    recent: {
      total:
        recentCountResult.status === 'fulfilled'
          ? recentCountResult.value
          : 0,
      bouts:
        recentBoutsResult.status === 'fulfilled'
          ? recentBoutsResult.value.map(serializeRecentBout)
          : [],
    },
  };
}

const getCachedPublicReadModel = unstable_cache(
  loadPublicReadModel,
  ['public-read-model-v1'],
  {
    revalidate: PUBLIC_READ_REVALIDATE_SECONDS,
    tags: [PUBLIC_READ_MODEL_TAG],
  },
);

type PublicRecentPage = {
  total: number;
  bouts: RecentBout[];
};

type SerializedPublicRecentPage = {
  total: number;
  bouts: SerializedRecentBout[];
};

const recentPageLoaders = new Map<
  string,
  () => Promise<SerializedPublicRecentPage>
>();

const getRecentPageLoader = (limit: number, offset: number) => {
  const key = `${limit}:${offset}`;
  const existing = recentPageLoaders.get(key);
  if (existing) return existing;

  const load = unstable_cache(
    async () => {
      const [bouts, total] = await Promise.all([
        getRecentBouts(limit, offset),
        getRecentBoutsCount(),
      ]);
      return {
        total,
        bouts: bouts.map(serializeRecentBout),
      };
    },
    ['public-recent-bouts-v1', String(limit), String(offset)],
    {
      revalidate: PUBLIC_READ_REVALIDATE_SECONDS,
      tags: [PUBLIC_READ_MODEL_TAG],
    },
  );

  recentPageLoaders.set(key, load);
  return load;
};

export async function getPublicIntroPoolStatus() {
  return (await getCachedPublicReadModel()).introPool;
}

export async function getPublicLeaderboardData() {
  return (await getCachedPublicReadModel()).leaderboard;
}

export async function getPublicAgentSnapshots() {
  return (await getCachedPublicReadModel()).agents;
}

export async function getPublicRecentBoutsPage(
  page: number,
  pageSize: number,
): Promise<PublicRecentPage> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const offset = (safePage - 1) * safePageSize;

  if (safePage === 1 && safePageSize === PUBLIC_RECENT_PAGE_SIZE) {
    const { recent } = await getCachedPublicReadModel();
    return {
      total: recent.total,
      bouts: recent.bouts.map(deserializeRecentBout),
    };
  }

  try {
    const recent = await getRecentPageLoader(safePageSize, offset)();
    return {
      total: recent.total,
      bouts: recent.bouts.map(deserializeRecentBout),
    };
  } catch (error) {
    log.warn('Public recent bouts page unavailable', {
      page: safePage,
      pageSize: safePageSize,
      error: error instanceof Error ? error.message : String(error),
    });
    return { total: 0, bouts: [] };
  }
}
