import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { fetchNews } from './lib/rss';
import { getCachedSummary, setCachedSummary } from './lib/cache';
import { getSql, ensureSchema } from './lib/db';
import { hashPassword, verifyPassword, signToken } from './lib/auth';
import { CATEGORIES } from './lib/types';
import type { Category, Period } from './lib/types';
import Groq from 'groq-sdk';

type Env = {
  GROQ_API_KEY: string;
  DATABASE_URL: string;
  NEWSDATA_API_KEY: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', service: 'wave-one-api' }));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, plan } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Email ve şifre gerekli' }, 400);

    const sql = getSql(c.env.DATABASE_URL);
    if (!sql) return c.json({ error: 'DB bağlantısı yok' }, 500);
    await ensureSchema(c.env.DATABASE_URL);

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) return c.json({ error: 'Bu email zaten kayıtlı' }, 409);

    const { hash, salt } = hashPassword(password);
    const rows = await sql`
      INSERT INTO users (email, password_hash, salt, plan, plan_started_at)
      VALUES (${email.toLowerCase()}, ${hash}, ${salt}, ${plan ?? 'trial'}, NOW())
      RETURNING id, email, plan
    `;
    const user = rows[0];
    const secret = c.env.JWT_SECRET;
    if (!secret) return c.json({ error: 'JWT_SECRET missing' }, 500);
    const token = await signToken({ userId: user.id, email: user.email }, secret);
    return c.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err) {
    console.error('Register error:', err);
    return c.json({ error: 'Kayıt başarısız' }, 500);
  }
});

app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Email ve şifre gerekli' }, 400);

    const sql = getSql(c.env.DATABASE_URL);
    if (!sql) return c.json({ error: 'DB bağlantısı yok' }, 500);
    await ensureSchema(c.env.DATABASE_URL);

    const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase()}`;
    if (rows.length === 0) return c.json({ error: 'Email veya şifre hatalı' }, 401);

    const user = rows[0];
    const valid = verifyPassword(password, user.password_hash, user.salt);
    if (!valid) return c.json({ error: 'Email veya şifre hatalı' }, 401);

    const token = await signToken({ userId: user.id, email: user.email }, c.env.JWT_SECRET);
    return c.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (err) {
    console.error('Login error:', err);
    return c.json({ error: 'Giriş başarısız' }, 500);
  }
});

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
    const items = await fetchNews(category, period, c.env.NEWSDATA_API_KEY);
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

// ── Generate Social Post ──────────────────────────────────────────────────────
app.post('/api/generate-post', async (c) => {
  try {
    const { platform, title, summary, keyPoints } = await c.req.json();
    if (!platform || !title) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const groq = new Groq({ apiKey: c.env.GROQ_API_KEY });

    const platformPrompts: Record<string, string> = {
      linkedin: `Sen bir profesyonel LinkedIn içerik yazarısın. Aşağıdaki haberi, profesyonel bir LinkedIn gönderisi olarak Türkçe yaz.
Ton: profesyonel, bilgilendirici, düşündürücü.
Format: kısa paragraflar, 2-3 emoji, sonda 3-5 hashtag.
Uzunluk: 150-250 kelime.`,
      instagram: `Sen bir Instagram içerik yazarısın. Aşağıdaki haberi, ilgi çekici bir Instagram gönderisi olarak Türkçe yaz.
Ton: enerjik, erişilebilir, ilgi çekici.
Format: kısa ve akıcı, 4-6 emoji, sonda 8-10 hashtag.
Uzunluk: 80-120 kelime.`,
      twitter: `Sen bir Twitter/X içerik yazarısın. Aşağıdaki haberi, etkileyici bir tweet olarak Türkçe yaz.
Ton: özlü, keskin, dikkat çekici.
Format: tek paragraf, 1-2 emoji, 2-3 hashtag.
Uzunluk: maksimum 280 karakter.`,
    };

    const platformPrompt = platformPrompts[platform];
    if (!platformPrompt) return c.json({ error: 'Invalid platform' }, 400);

    const keyPointsText = Array.isArray(keyPoints) && keyPoints.length > 0
      ? `\nÖnemli noktalar: ${keyPoints.join(', ')}`
      : '';

    const prompt = `${platformPrompt}

Haber başlığı: ${title}
Özet: ${summary ?? ''}${keyPointsText}

Sadece gönderi metnini döndür, başka açıklama ekleme.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? '';
    return c.json({ content });
  } catch (err) {
    console.error('Generate post error:', err);
    return c.json({ error: 'Post generation failed' }, 500);
  }
});

export default app;
