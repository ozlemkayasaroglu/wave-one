import type { NewsItem, Category, Period } from './types';

interface NewsDataArticle {
  article_id: string;
  title: string;
  description: string | null;
  link: string;
  image_url: string | null;
  pubDate: string;
  source_name: string;
}

interface NewsDataResponse {
  status: string;
  results: NewsDataArticle[];
}

function stripHtml(str: string): string {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 12);
}


const CATEGORY_PARAMS: Record<Category, { category?: string; q?: string }> = {
  law: { q: 'law OR legal OR court' },
  health: { category: 'health' },
  education: { category: 'education' },
  politics: { category: 'politics' },
  economy: { q: 'economy OR economics OR finance OR market' },
};

export async function fetchNews(category: Category, _period: Period, apiKey: string): Promise<NewsItem[]> {
  const params = CATEGORY_PARAMS[category];

  const url = new URL('https://newsdata.io/api/1/news');
  if (params.category) url.searchParams.set('category', params.category);
  if (params.q) url.searchParams.set('q', params.q);
  url.searchParams.set('language', 'en');
  url.searchParams.set('removeduplicate', '1');
  url.searchParams.set('apikey', apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data: NewsDataResponse = await res.json();
  if (data.status !== 'success' || !Array.isArray(data.results)) return [];

  return data.results.map((a) => ({
    id: a.article_id ? simpleHash(a.article_id) : simpleHash(a.link),
    title: a.title,
    description: a.description ? stripHtml(a.description).slice(0, 300) : '',
    url: a.link,
    source: a.source_name,
    category,
    publishedAt: new Date(a.pubDate).toISOString(),
    imageUrl: a.image_url ?? undefined,
  }));
}
