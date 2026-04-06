import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import type { Category } from '@/lib/types';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/types';

interface Props {
  active: Category;
  onChange: (cat: Category) => void;
  categories?: Category[];
}

export function CategoryTab({ active, onChange, categories = CATEGORIES }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => {
        const isActive = cat === active;
        const color = CATEGORY_COLORS[cat];
        return (
          <TouchableOpacity
            key={cat}
            onPress={() => onChange(cat)}
            style={[
              styles.tab,
              isActive && { borderBottomColor: color, borderBottomWidth: 2 },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? color : '#4a6650' },
              ]}
            >
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#060f09',
    borderBottomWidth: 1,
    borderBottomColor: '#0f2014',
  },
  container: {
    paddingHorizontal: 16,
    gap: 4,
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
});
