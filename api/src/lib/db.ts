import { neon, NeonQueryFunction } from '@neondatabase/serverless';

const sqlCache = new Map<string, NeonQueryFunction<false, false>>();

export function getSql(databaseUrl: string): NeonQueryFunction<false, false> | null {
  if (!databaseUrl) return null;
  if (!sqlCache.has(databaseUrl)) {
    sqlCache.set(databaseUrl, neon(databaseUrl));
  }
  return sqlCache.get(databaseUrl)!;
}

export async function ensureSchema(databaseUrl: string): Promise<void> {
  const sql = getSql(databaseUrl);
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS article_cache (
      article_id  TEXT PRIMARY KEY,
      summary     JSONB,
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt          TEXT NOT NULL,
      plan          TEXT NOT NULL DEFAULT 'none',
      plan_started_at TIMESTAMPTZ,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
