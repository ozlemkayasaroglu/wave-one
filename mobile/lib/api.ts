import type { NewsItem, SummaryData, Category, Period } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchNews(category: Category, period: Period = 'daily'): Promise<NewsItem[]> {
  const res = await fetch(`${API_BASE}/api/news?category=${category}&period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  const data = await res.json();
  return data.items as NewsItem[];
}

export async function fetchSummary(item: NewsItem): Promise<SummaryData> {
  const res = await fetch(`${API_BASE}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articleId: item.id,
      url: item.url,
      title: item.title,
      description: item.description,
    }),
  });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}
