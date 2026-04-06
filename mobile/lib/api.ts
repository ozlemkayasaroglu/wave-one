import type { NewsItem, SummaryData, Category, Period, SocialPlatform } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  plan: string;
}

export async function register(email: string, password: string, plan: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, plan }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Kayıt başarısız');
  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Giriş başarısız');
  return data;
}

export async function fetchNews(category: Category, period: Period = 'daily'): Promise<NewsItem[]> {
  const res = await fetch(`${API_BASE}/api/news?category=${category}&period=${period}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  const data = await res.json();
  return data.items as NewsItem[];
}

export async function generatePost(
  platform: SocialPlatform,
  title: string,
  summary: string,
  keyPoints: string[],
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/generate-post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, title, summary, keyPoints }),
  });
  if (!res.ok) throw new Error('Failed to generate post');
  const data = await res.json();
  return data.content as string;
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
