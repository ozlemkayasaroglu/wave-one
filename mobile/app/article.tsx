import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  Clipboard,
  Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchSummary, generatePost } from '@/lib/api';
import { localGet, localSet } from '@/lib/localCache';
import type { NewsItem, SummaryData, SocialPlatform } from '@/lib/types';
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
    imageUrl?: string;
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

  const [postPlatform, setPostPlatform] = useState<SocialPlatform | null>(null);
  const [postContent, setPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState('');
  const [copied, setCopied] = useState(false);

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

  async function handleGeneratePost(platform: SocialPlatform) {
    if (postPlatform === platform && postContent) {
      setPostPlatform(null);
      setPostContent('');
      return;
    }
    setPostPlatform(platform);
    setPostContent('');
    setPostError('');
    setCopied(false);
    setPostLoading(true);
    try {
      const content = await generatePost(
        platform,
        summary?.translatedTitle ?? item.title,
        summary?.summary ?? item.description,
        summary?.keyPoints ?? [],
      );
      setPostContent(content);
    } catch {
      setPostError('Post oluşturulamadı');
    } finally {
      setPostLoading(false);
    }
  }

  function copyPost() {
    Clipboard.setString(postContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* Hero image */}
        {!!params.imageUrl && (
          <Image
            source={{ uri: params.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

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

        {/* Social post generation */}
        {summary && (
          <View style={styles.socialSection}>
            <Text style={styles.socialLabel}>SOSYAL MEDYA POSTU OLUŞTUR</Text>
            <View style={styles.socialBtns}>
              {([
                { platform: 'linkedin' as SocialPlatform, label: 'LinkedIn', color: '#0a66c2' },
                { platform: 'instagram' as SocialPlatform, label: 'Instagram', color: '#e1306c' },
                { platform: 'twitter' as SocialPlatform, label: 'X / Twitter', color: '#e7e9ea' },
              ]).map(({ platform, label, color }) => (
                <TouchableOpacity
                  key={platform}
                  style={[
                    styles.socialBtn,
                    { borderColor: color },
                    postPlatform === platform && { backgroundColor: '#0d1f11' },
                  ]}
                  onPress={() => handleGeneratePost(platform)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.socialBtnText, { color }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {postLoading && (
              <View style={styles.postLoadingRow}>
                <ActivityIndicator size="small" color={accentColor} />
                <Text style={styles.postLoadingText}>Post hazırlanıyor...</Text>
              </View>
            )}

            {postError ? (
              <Text style={styles.postError}>{postError}</Text>
            ) : postContent ? (
              <View style={styles.postPanel}>
                <Text style={styles.postContent}>{postContent}</Text>
                <TouchableOpacity
                  style={[styles.copyBtn, { borderColor: accentColor }]}
                  onPress={copyPost}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.copyBtnText, { color: accentColor }]}>
                    {copied ? '✓ Kopyalandı' : 'Kopyala'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
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
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 4,
    backgroundColor: '#1a2f1e',
    marginBottom: 16,
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
  socialSection: {
    marginBottom: 24,
  },
  socialLabel: {
    color: '#3a5a42',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  socialBtns: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  socialBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 2,
  },
  socialBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  postLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  postLoadingText: {
    color: '#4a6650',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  postError: {
    color: '#e07070',
    fontSize: 13,
    marginTop: 10,
  },
  postPanel: {
    backgroundColor: '#0d1f11',
    borderRadius: 4,
    padding: 14,
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#2d5a35',
  },
  postContent: {
    color: '#b8d4bc',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 12,
  },
  copyBtn: {
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
