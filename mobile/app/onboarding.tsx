import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Dimensions,
  TouchableOpacity, FlatList, ViewToken, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { T } from '@/lib/theme';
import type { Category } from '@/lib/types';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    tag: 'WELCOME',
    title: 'Your professional\nnews terminal.',
    body: 'Wave:one delivers sector-specific news briefings for legal, health, education, and software professionals — in Turkish, powered by AI.',
    accent: '#d4a853',
  },
  {
    id: '2',
    tag: 'AI-POWERED',
    title: 'Every article,\nsummarized.',
    body: 'Tap any article to get an instant Turkish summary with key points — no more reading through walls of English text to find what matters.',
    accent: '#9070c0',
  },
];

const PROFESSIONS: { category: Category; label: string; sublabel: string; accent: string }[] = [
  { category: 'law',       label: 'Hukuk',    sublabel: 'Avukat · Hakim · Savcı',              accent: '#c9a050' },
  { category: 'health',    label: 'Sağlık',   sublabel: 'Doktor · Hemşire · Sağlık Çalışanı',  accent: '#6b9e7a' },
  { category: 'education', label: 'Eğitim',   sublabel: 'Öğretmen · Akademisyen',              accent: '#7090c0' },
  { category: 'politics',  label: 'Siyaset',  sublabel: 'Siyasetçi · Analist · Gazeteci',      accent: '#c06070' },
  { category: 'economy',   label: 'Ekonomi',  sublabel: 'Ekonomist · Finans Uzmanı · Banker',  accent: '#50a0c9' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [selected, setSelected] = useState<Category[]>([]);
  const ref = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setActiveIndex(viewableItems[0].index);
  }).current;

  async function finish() {
    await SecureStore.setItemAsync('waveone_onboarded', '1');
    if (selected.length > 0) {
      await SecureStore.setItemAsync('waveone_category', selected[0]);
      await SecureStore.setItemAsync('waveone_categories', JSON.stringify(selected));
    }
    router.replace('/paywall');
  }

  function toggleCategory(cat: Category) {
    setSelected(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      if (prev.length >= 3) return prev;
      return [...prev, cat];
    });
  }

  function next() {
    if (activeIndex < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      setShowPicker(true);
    }
  }

  if (showPicker) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 }]}>
        <Text style={styles.pickerTag}>ALAN SEÇİMİ</Text>
        <Text style={styles.logo}>
          WAVE<Text style={{ color: T.accent }}>:ONE</Text>
        </Text>
        <Text style={styles.pickerTitle}>Hangi alanda{'\n'}haber almak istersiniz?</Text>
        <Text style={styles.pickerBody}>
          En fazla 3 alan seçebilirsiniz.{' '}
          <Text style={{ color: T.accent }}>{selected.length}/3</Text>
        </Text>

        <ScrollView style={styles.professionList} showsVerticalScrollIndicator={false}>
          {PROFESSIONS.map((p) => (
            <TouchableOpacity
              key={p.category}
              style={[
                styles.professionCard,
                selected.includes(p.category) && { borderColor: p.accent, backgroundColor: '#0d1f11' },
                !selected.includes(p.category) && selected.length >= 3 && { opacity: 0.4 },
              ]}
              onPress={() => toggleCategory(p.category)}
              activeOpacity={0.8}
              disabled={!selected.includes(p.category) && selected.length >= 3}
            >
              <View style={[styles.professionDot, { backgroundColor: p.accent }]} />
              <View style={styles.professionTexts}>
                <Text style={[styles.professionLabel, selected.includes(p.category) && { color: p.accent }]}>
                  {p.label}
                </Text>
                <Text style={styles.professionSublabel}>{p.sublabel}</Text>
              </View>
              {selected.includes(p.category) && (
                <Text style={[styles.checkmark, { color: p.accent }]}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[styles.cta, selected.length === 0 && styles.ctaDisabled]}
          onPress={finish}
          activeOpacity={0.85}
          disabled={selected.length === 0}
        >
          <Text style={styles.ctaText}>Başla</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <TouchableOpacity
        style={[styles.skip, { top: insets.top + 16 }]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>Atla</Text>
      </TouchableOpacity>

      <FlatList
        ref={ref}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={[styles.tag, { color: item.accent }]}>{item.tag}</Text>
            <Text style={styles.logo}>
              WAVE<Text style={{ color: item.accent }}>:ONE</Text>
            </Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex && { backgroundColor: T.accent, width: 20 },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.cta} onPress={next} activeOpacity={0.85}>
        <Text style={styles.ctaText}>
          {activeIndex < SLIDES.length - 1 ? 'Devam' : 'Alan Seç'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    alignItems: 'center',
  },
  skip: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    padding: 4,
  },
  skipText: {
    color: T.textDim,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  slide: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    paddingTop: 80,
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  logo: {
    color: T.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: 'monospace',
    marginBottom: 32,
  },
  title: {
    color: T.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 38,
    marginBottom: 20,
  },
  body: {
    color: T.textSecondary,
    fontSize: 15,
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.border,
  },
  cta: {
    width: '88%',
    backgroundColor: T.accent,
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaDisabled: {
    opacity: 0.4,
  },
  ctaText: {
    color: T.bg,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Picker styles
  pickerTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: 'monospace',
    color: T.accent,
    marginBottom: 16,
  },
  pickerTitle: {
    color: T.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerBody: {
    color: T.textSecondary,
    fontSize: 13,
    marginBottom: 24,
    textAlign: 'center',
  },
  professionList: {
    width: '88%',
    flexGrow: 0,
    marginBottom: 24,
  },
  professionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a3520',
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  professionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  professionTexts: {
    flex: 1,
  },
  professionLabel: {
    color: T.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  professionSublabel: {
    color: T.textDim,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },
});
