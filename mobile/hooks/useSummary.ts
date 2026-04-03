import { useState, useCallback } from 'react';
import { fetchSummary } from '@/lib/api';
import { localGet, localSet } from '@/lib/localCache';
import type { NewsItem, SummaryData } from '@/lib/types';

export function useSummary() {
  const [summaries, setSummaries] = useState<Record<string, SummaryData>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getSummary = useCallback(async (item: NewsItem) => {
    const id = item.id;
    if (summaries[id] || loading[id]) return;

    // Check local cache first
    const cached = await localGet<SummaryData>(`summary_${id}`);
    if (cached) {
      setSummaries(prev => ({ ...prev, [id]: cached }));
      return;
    }

    setLoading(prev => ({ ...prev, [id]: true }));
    setErrors(prev => ({ ...prev, [id]: '' }));

    try {
      const data = await fetchSummary(item);
      setSummaries(prev => ({ ...prev, [id]: data }));
      localSet(`summary_${id}`, data).catch(() => {});
    } catch {
      setErrors(prev => ({ ...prev, [id]: 'Özet alınamadı' }));
    } finally {
      setLoading(prev => ({ ...prev, [id]: false }));
    }
  }, [summaries, loading]);

  return { summaries, loading, errors, getSummary };
}
