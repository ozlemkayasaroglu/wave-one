import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Header } from '@/components/Header';
import { CategoryTab } from '@/components/CategoryTab';
import { NewsCard } from '@/components/NewsCard';
import { useFeed } from '@/hooks/useFeed';
import { useSummary } from '@/hooks/useSummary';
import type { Category, NewsItem } from '@/lib/types';

export default function HomeScreen() {
  const [category, setCategory] = useState<Category>('software');
  const { items, loading, error, refreshing, refresh } = useFeed(category);
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
      <Header />
      <CategoryTab active={category} onChange={handleCategoryChange} />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator color="#4caf8c" size="large" />
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
              tintColor="#4caf8c"
              colors={['#4caf8c']}
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
