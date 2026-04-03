import { getSql, ensureSchema } from './db';
import type { SummaryData } from './types';

let initialized = false;

async function init() {
  if (initialized) return;
  await ensureSchema();
  initialized = true;
}

export async function getCachedSummary(articleId: string): Promise<SummaryData | null> {
  try {
    const sql = getSql();
    if (!sql) return null;
    await init();
    const rows = await sql`SELECT summary FROM article_cache WHERE article_id = ${articleId}`;
    return rows.length ? (rows[0].summary as SummaryData) : null;
  } catch {
    return null;
  }
}

export async function setCachedSummary(articleId: string, data: SummaryData): Promise<void> {
  try {
    const sql = getSql();
    if (!sql) return;
    await init();
    await sql`
      INSERT INTO article_cache (article_id, summary)
      VALUES (${articleId}, ${JSON.stringify(data)})
      ON CONFLICT (article_id)
      DO UPDATE SET summary = EXCLUDED.summary, updated_at = NOW()
    `;
  } catch { /* silent */ }
}
