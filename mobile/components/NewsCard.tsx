import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import type { NewsItem } from '@/lib/types';
import { CATEGORY_COLORS } from '@/lib/types';
import type { SummaryData } from '@/lib/types';

interface Props {
  item: NewsItem;
  summary?: SummaryData;
  summaryLoading?: boolean;
  summaryError?: string;
  onSummaryPress: () => void;
}

export function NewsCard({ item, summary, summaryLoading, summaryError, onSummaryPress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const accentColor = CATEGORY_COLORS[item.category];

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor(diff / 60000);
    if (h > 24) return `${Math.floor(h / 24)}g`;
    if (h > 0) return `${h}s`;
    return `${m}dk`;
  };

  const handleSummaryPress = () => {
    if (!summary && !summaryLoading) onSummaryPress();
    setExpanded(prev => !prev);
  };

  return (
    <View style={styles.card}>
      {/* Source + time */}
      <View style={styles.meta}>
        <Text style={[styles.source, { color: accentColor }]}>{item.source.toUpperCase()}</Text>
        <Text style={styles.time}>{timeAgo(item.publishedAt)}</Text>
      </View>

      {/* Title + Description + Thumbnail */}
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/article',
          params: {
            id: item.id,
            title: item.title,
            description: item.description,
            url: item.url,
            source: item.source,
            category: item.category,
            publishedAt: item.publishedAt,
            imageUrl: item.imageUrl ?? '',
          },
        })}
        activeOpacity={0.8}
      >
        <View style={styles.contentRow}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.description && (
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            )}
          </View>
          {!!item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Action bar */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: accentColor }]}
          onPress={handleSummaryPress}
          activeOpacity={0.7}
        >
          {summaryLoading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Text style={[styles.actionText, { color: accentColor }]}>
              {expanded && summary ? '▾ Özet' : '▸ Özet'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Summary panel */}
      {expanded && (
        <View style={styles.panel}>
          {summaryError ? (
            <Text style={styles.errorText}>{summaryError}</Text>
          ) : summaryLoading ? (
            <View style={styles.skeleton}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: '80%' }]} />
              <View style={[styles.skeletonLine, { width: '60%' }]} />
            </View>
          ) : summary ? (
            <>
              <Text style={[styles.panelTitle, { color: accentColor }]}>
                {summary.translatedTitle}
              </Text>
              <Text style={styles.panelSummary}>{summary.summary}</Text>
              {summary.keyPoints.length > 0 && (
                <View style={styles.keyPoints}>
                  {summary.keyPoints.map((point, i) => (
                    <Text key={i} style={styles.keyPoint}>• {point}</Text>
                  ))}
                </View>
              )}
            </>
          ) : null}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  contentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: '#e4f5e0',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#1a2f1e',
    flexShrink: 0,
  },
  description: {
    color: '#6b8f72',
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 2,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  panel: {
    backgroundColor: '#0d1f11',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#2d5a35',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 20,
  },
  panelSummary: {
    color: '#b8d4bc',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  keyPoints: {
    gap: 4,
  },
  keyPoint: {
    color: '#7aab82',
    fontSize: 12,
    lineHeight: 18,
  },
  skeleton: {
    gap: 8,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#1a2f1e',
    borderRadius: 2,
    width: '100%',
  },
  errorText: {
    color: '#e07070',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#0f2014',
    marginTop: 4,
  },
});
