import { useState, useEffect, useCallback } from 'react';
import { fetchNews } from '@/lib/api';
import type { NewsItem, Category, Period } from '@/lib/types';

export function useFeed(category: Category, period: Period = 'daily') {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchNews(category, period);
      setItems(data);
    } catch {
      setError('Haberler yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, period]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, refreshing, refresh: () => load(true) };
}
