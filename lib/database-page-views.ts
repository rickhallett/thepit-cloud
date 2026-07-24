// Explicit gate for the optional first-party Postgres page-view archive.

type DatabasePageViewEnvironment = {
  DATABASE_PAGE_VIEWS_ENABLED?: string;
};

export function isDatabasePageViewStorageEnabled(
  source: DatabasePageViewEnvironment = {
    DATABASE_PAGE_VIEWS_ENABLED:
      process.env.DATABASE_PAGE_VIEWS_ENABLED,
  },
) {
  return source.DATABASE_PAGE_VIEWS_ENABLED === 'true';
}
