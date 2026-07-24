import { describe, expect, it } from 'vitest';

import { isDatabasePageViewStorageEnabled } from '@/lib/database-page-views';

describe('database page-view storage', () => {
  it('is disabled when the flag is absent', () => {
    expect(isDatabasePageViewStorageEnabled({})).toBe(false);
  });

  it('is disabled for every value except the exact string true', () => {
    expect(
      isDatabasePageViewStorageEnabled({
        DATABASE_PAGE_VIEWS_ENABLED: 'false',
      }),
    ).toBe(false);
    expect(
      isDatabasePageViewStorageEnabled({
        DATABASE_PAGE_VIEWS_ENABLED: 'TRUE',
      }),
    ).toBe(false);
  });

  it('is enabled only by explicit opt-in', () => {
    expect(
      isDatabasePageViewStorageEnabled({
        DATABASE_PAGE_VIEWS_ENABLED: 'true',
      }),
    ).toBe(true);
  });
});
