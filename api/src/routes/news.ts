import { Router, Request, Response } from 'express';
import { fetchNews } from '../lib/rss';
import type { Category, Period } from '../lib/types';
import { CATEGORIES } from '../lib/types';

const router = Router();

const PERIODS: Period[] = ['daily', 'weekly', 'monthly'];

// Simple in-memory cache — 5 min TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();

router.get('/', async (req: Request, res: Response) => {
  const category = req.query.category as Category;
  const period = (req.query.period as Period) || 'daily';

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  if (!PERIODS.includes(period)) {
    return res.status(400).json({ error: 'Invalid period' });
  }

  const key = `${category}:${period}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.data);
  }

  try {
    const items = await fetchNews(category, period);
    const data = { items, category, period, fetchedAt: new Date().toISOString() };
    cache.set(key, { data, expiresAt: Date.now() + 5 * 60 * 1000 });
    return res.json(data);
  } catch (err) {
    console.error('News fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch news' });
  }
});

export default router;
