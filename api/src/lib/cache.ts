import { getSql, ensureSchema } from './db';
import type { SummaryData } from './types';

const initialized = new Set<string>();

async function init(databaseUrl: string) {
  if (initialized.has(databaseUrl)) return;
  await ensureSchema(databaseUrl);
  initialized.add(databaseUrl);
}

export async function getCachedSummary(articleId: string, databaseUrl: string): Promise<SummaryData | null> {
  try {
    const sql = getSql(databaseUrl);
    if (!sql) return null;
    await init(databaseUrl);
    const rows = await sql`SELECT summary FROM article_cache WHERE article_id = ${articleId}`;
    return rows.length ? (rows[0].summary as SummaryData) : null;
  } catch {
    return null;
  }
}

export async function setCachedSummary(articleId: string, data: SummaryData, databaseUrl: string): Promise<void> {
  try {
    const sql = getSql(databaseUrl);
    if (!sql) return;
    await init(databaseUrl);
    await sql`
      INSERT INTO article_cache (article_id, summary)
      VALUES (${articleId}, ${JSON.stringify(data)})
      ON CONFLICT (article_id)
      DO UPDATE SET summary = EXCLUDED.summary, updated_at = NOW()
    `;
  } catch { /* silent */ }
}
