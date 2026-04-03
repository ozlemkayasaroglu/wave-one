import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchNews } from './lib/rss';
import { getCachedSummary, setCachedSummary } from './lib/cache';
import { CATEGORIES } from './lib/types';
import type { Category, Period } from './lib/types';
import Groq from 'groq-sdk';

type Env = {
  GROQ_API_KEY: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', service: 'wave-one-api' }));

// ── News ──────────────────────────────────────────────────────────────────────
const PERIODS: Period[] = ['daily', 'weekly', 'monthly'];
const newsCache = new Map<string, { data: unknown; expiresAt: number }>();

app.get('/api/news', async (c) => {
  const category = c.req.query('category') as Category;
  const period = (c.req.query('period') as Period) || 'daily';

  if (!CATEGORIES.includes(category)) {
    return c.json({ error: 'Invalid category' }, 400);
  }
  if (!PERIODS.includes(period)) {
    return c.json({ error: 'Invalid period' }, 400);
  }

  const key = `${category}:${period}`;
  const cached = newsCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return c.json(cached.data);
  }

  try {
    const items = await fetchNews(category, period);
    const data = { items, category, period, fetchedAt: new Date().toISOString() };
    newsCache.set(key, { data, expiresAt: Date.now() + 5 * 60 * 1000 });
    return c.json(data);
  } catch (err) {
    console.error('News fetch error:', err);
    return c.json({ error: 'Failed to fetch news' }, 500);
  }
});

// ── Summarize ─────────────────────────────────────────────────────────────────
async function fetchArticleText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WaveOne/1.0)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);
  } catch {
    return '';
  }
}

app.post('/api/summarize', async (c) => {
  try {
    const { url, title, description, articleId } = await c.req.json();
    if (!articleId || (!url && !title)) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const dbUrl = c.env.DATABASE_URL;

    // 1. Cache check
    const cached = await getCachedSummary(articleId, dbUrl);
    if (cached) return c.json({ ...cached, cached: true });

    // 2. Fetch article text
    const articleText = url ? await fetchArticleText(url) : '';
    const content = articleText.length > 200 ? articleText : (description ?? title ?? '');

    // 3. Groq summarization
    const groq = new Groq({ apiKey: c.env.GROQ_API_KEY });

    const prompt = `Sen bir Türkçe profesyonel haber editörüsün. Makaleyi analiz et ve SADECE geçerli JSON döndür.

{
  "translatedTitle": "başlığın doğal Türkçe çevirisi",
  "summary": "2-3 cümlelik akıcı Türkçe özet",
  "keyPoints": ["önemli nokta 1", "önemli nokta 2", "önemli nokta 3"],
  "category": "Hukuk veya Sağlık veya Eğitim veya Yazılım"
}

Başlık: ${title}
İçerik: ${content.slice(0, 2500)}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500,
    });

    const text = completion.choices[0]?.message?.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]);
    const data = {
      translatedTitle: parsed.translatedTitle ?? title,
      summary: parsed.summary ?? '',
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      category: parsed.category ?? '',
    };

    // 4. Cache async
    setCachedSummary(articleId, data, dbUrl).catch(() => {});

    return c.json({ ...data, cached: false });
  } catch (err) {
    console.error('Summarize error:', err);
    return c.json({ error: 'Summarization failed' }, 500);
  }
});

export default app;
