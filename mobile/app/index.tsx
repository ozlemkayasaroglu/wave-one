import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Header } from '@/components/Header';
import { CategoryTab } from '@/components/CategoryTab';
import { NewsCard } from '@/components/NewsCard';
import { useFeed } from '@/hooks/useFeed';
import { useSummary } from '@/hooks/useSummary';
import type { Category, NewsItem, Period } from '@/lib/types';
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/types';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily', label: 'Bugün' },
  { key: 'weekly', label: 'Bu Hafta' },
  { key: 'monthly', label: 'Bu Ay' },
];

export default function HomeScreen() {
  const [category, setCategory] = useState<Category>('law');
  const [period, setPeriod] = useState<Period>('daily');
  const [userCategories, setUserCategories] = useState<Category[]>(CATEGORIES);

  useEffect(() => {
    async function loadCategories() {
      const saved = await SecureStore.getItemAsync('waveone_categories');
      if (saved) {
        const parsed: Category[] = JSON.parse(saved);
        if (parsed.length > 0) {
          setUserCategories(parsed);
          setCategory(parsed[0]);
        }
      } else {
        const single = await SecureStore.getItemAsync('waveone_category');
        if (single && CATEGORIES.includes(single as Category)) {
          setUserCategories([single as Category]);
          setCategory(single as Category);
        }
      }
    }
    loadCategories();
  }, []);
  const accentColor = CATEGORY_COLORS[category];
  const { items, loading, error, refreshing, refresh } = useFeed(category, period);
  const { summaries, loading: summaryLoading, errors: summaryErrors, getSummary } = useSummary();

  const handleCategoryChange = useCallback((cat: Category) => {
    setCategory(cat);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: NewsItem }) => (
      <NewsCard
        item={item}
        summary={summaries[item.id]}
        summaryLoading={summaryLoading[item.id]}
        summaryError={summaryErrors[item.id]}
        onSummaryPress={() => getSummary(item)}
      />
    ),
    [summaries, summaryLoading, summaryErrors, getSummary]
  );

  return (
    <View style={styles.container}>
      <Header accentColor={accentColor} />
      <CategoryTab active={category} onChange={handleCategoryChange} categories={userCategories} />

      {/* Period filter */}
      <View style={styles.periodBar}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[
              styles.periodBtn,
              period === p.key && { borderColor: accentColor, backgroundColor: accentColor + '18' },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.periodLabel,
              period === p.key && { color: accentColor },
            ]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color={accentColor} size="large" />
          <Text style={styles.loadingText}>Haberler yükleniyor...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={accentColor}
              colors={[accentColor]}
            />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Bu dönemde haber bulunamadı</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060f09',
  },
  periodBar: {
    flexDirection: 'row',
    backgroundColor: '#060f09',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#0f2014',
  },
  periodBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#1a3520',
    borderRadius: 2,
  },
  periodBtnActive: {
    borderColor: '#4caf8c',
    backgroundColor: '#0d2516',
  },
  periodLabel: {
    color: '#4a6650',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  periodLabelActive: {
    color: '#4caf8c',
  },
  list: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#4a6650',
    marginTop: 12,
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 1,
  },
  errorText: {
    color: '#e07070',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  emptyText: {
    color: '#4a6650',
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 13,
  },
});
