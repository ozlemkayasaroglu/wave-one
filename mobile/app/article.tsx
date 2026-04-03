import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchSummary } from '@/lib/api';
import { localGet, localSet } from '@/lib/localCache';
import type { NewsItem, SummaryData } from '@/lib/types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/types';

export default function ArticleScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    description: string;
    url: string;
    source: string;
    category: string;
    publishedAt: string;
  }>();

  const item: NewsItem = {
    id: params.id,
    title: params.title,
    description: params.description,
    url: params.url,
    source: params.source,
    category: params.category as NewsItem['category'],
    publishedAt: params.publishedAt,
  };

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accentColor = CATEGORY_COLORS[item.category] || '#4caf8c';

  useEffect(() => {
    loadSummary();
  }, [item.id]);

  async function loadSummary() {
    const cached = await localGet<SummaryData>(`summary_${item.id}`);
    if (cached) { setSummary(cached); return; }

    setLoading(true);
    try {
      const data = await fetchSummary(item);
      setSummary(data);
      localSet(`summary_${item.id}`, data).catch(() => {});
    } catch {
      setError('Özet yüklenemedi');
    } finally {
      setLoading(false);
    }
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} gün önce`;
    if (h > 0) return `${h} saat önce`;
    return `${Math.floor(diff / 60000)} dakika önce`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Nav bar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={[styles.categoryBadge, { color: accentColor }]}>
          {CATEGORY_LABELS[item.category]}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Source + time */}
        <View style={styles.meta}>
          <Text style={[styles.source, { color: accentColor }]}>{item.source.toUpperCase()}</Text>
          <Text style={styles.time}>{timeAgo(item.publishedAt)}</Text>
        </View>

        {/* Original title */}
        <Text style={styles.originalTitle}>{item.title}</Text>

        {/* Summary section */}
        <View style={styles.summarySection}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={styles.loadingText}>Türkçe özet hazırlanıyor...</Text>
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : summary ? (
            <>
              <Text style={[styles.translatedTitle, { color: accentColor }]}>
                {summary.translatedTitle}
              </Text>
              <Text style={styles.summaryText}>{summary.summary}</Text>
              {summary.keyPoints.length > 0 && (
                <View style={styles.keyPoints}>
                  <Text style={styles.keyPointsLabel}>Önemli Noktalar</Text>
                  {summary.keyPoints.map((point, i) => (
                    <View key={i} style={styles.keyPointRow}>
                      <Text style={[styles.keyPointDot, { color: accentColor }]}>▸</Text>
                      <Text style={styles.keyPointText}>{point}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </View>

        {/* Description */}
        {!!item.description && (
          <View style={styles.descSection}>
            <Text style={styles.descLabel}>AÇIKLAMA</Text>
            <Text style={styles.descText}>{item.description}</Text>
          </View>
        )}

        {/* Open article button */}
        <TouchableOpacity
          style={[styles.openBtn, { borderColor: accentColor }]}
          onPress={() => Linking.openURL(item.url)}
          activeOpacity={0.8}
        >
          <Text style={[styles.openBtnText, { color: accentColor }]}>
            Kaynağa Git ↗
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060f09',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f2014',
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    color: '#4caf8c',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  content: {
    padding: 20,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  source: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  time: {
    fontSize: 11,
    color: '#4a6650',
    fontFamily: 'monospace',
  },
  originalTitle: {
    color: '#6b8f72',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  summarySection: {
    backgroundColor: '#0d1f11',
    borderRadius: 4,
    padding: 16,
    borderLeftWidth: 2,
    borderLeftColor: '#2d5a35',
    marginBottom: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#4a6650',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#e07070',
    fontSize: 13,
  },
  translatedTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 12,
  },
  summaryText: {
    color: '#b8d4bc',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  keyPoints: {
    gap: 8,
  },
  keyPointsLabel: {
    color: '#4a6650',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  keyPointRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  keyPointDot: {
    fontSize: 12,
    marginTop: 1,
  },
  keyPointText: {
    color: '#7aab82',
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  descSection: {
    marginBottom: 24,
  },
  descLabel: {
    color: '#3a5a42',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  descText: {
    color: '#5a7a62',
    fontSize: 13,
    lineHeight: 20,
  },
  openBtn: {
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: 14,
    alignItems: 'center',
  },
  openBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
});
