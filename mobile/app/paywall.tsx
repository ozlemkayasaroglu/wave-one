import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const FEATURES = [
  'Sektörünüzdeki haberleri anında takip edin',
  'AI destekli Türkçe özet ve çeviri',
  'Günlük, haftalık ve aylık haber akışı',
  'Reklamsız, saf içerik deneyimi',
  'Sürekli güncellenen haber kaynakları',
  'Instagram, Twitter ve LinkedIn için kişiselleştirilmiş post üretimi',
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('yearly');

  function startTrial() {
    router.push({ pathname: '/login', params: { plan: 'trial' } });
  }

  function subscribe() {
    router.push({ pathname: '/login', params: { plan: selected } });
  }

  function restorePurchase() {
    // Kullanıcı giriş yaparak aboneliği geri yükleyebilir
    router.push({ pathname: '/login', params: { plan: '' } });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <Text style={styles.logo}>WAVE<Text style={styles.logoAccent}>:ONE</Text></Text>
      <Text style={styles.subtitle}>PROFESSIONAL BRIEFING</Text>

      <View style={styles.divider} />

      {/* Headline */}
      <Text style={styles.headline}>
        Sektörünün gündemini{'\n'}her sabah hazır bul.
      </Text>
      <Text style={styles.body}>
        Hukuk, sağlık, eğitim ve yazılım alanlarındaki en önemli gelişmeleri
        yapay zeka destekli Türkçe özetlerle takip et.
      </Text>

      {/* Features */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Pricing toggle */}
      <View style={styles.plans}>
        <TouchableOpacity
          style={[styles.plan, selected === 'monthly' && styles.planActive]}
          onPress={() => setSelected('monthly')}
          activeOpacity={0.8}
        >
          <Text style={[styles.planPeriod, selected === 'monthly' && styles.planPeriodActive]}>
            AYLIK
          </Text>
          <Text style={[styles.planPrice, selected === 'monthly' && styles.planPriceActive]}>
            ₺99
          </Text>
          <Text style={[styles.planSub, selected === 'monthly' && styles.planSubActive]}>
            / ay
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.plan, selected === 'yearly' && styles.planActive]}
          onPress={() => setSelected('yearly')}
          activeOpacity={0.8}
        >
          <View style={styles.badgeWrap}>
            <Text style={styles.badge}>%33 TASARRUF</Text>
          </View>
          <Text style={[styles.planPeriod, selected === 'yearly' && styles.planPeriodActive]}>
            YILLIK
          </Text>
          <Text style={[styles.planPrice, selected === 'yearly' && styles.planPriceActive]}>
            ₺790
          </Text>
          <Text style={[styles.planSub, selected === 'yearly' && styles.planSubActive]}>
            / yıl · ₺65.8/ay
          </Text>
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.cta} onPress={subscribe} activeOpacity={0.85}>
        <Text style={styles.ctaText}>
          {selected === 'monthly' ? '₺99/ay ile Başla' : '₺790/yıl ile Başla'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={startTrial} activeOpacity={0.7}>
        <Text style={styles.trial}>7 gün ücretsiz dene · İstediğin zaman iptal et</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Legal */}
      <View style={styles.legal}>
        <TouchableOpacity onPress={() => Linking.openURL('https://waveone.app/terms')}>
          <Text style={styles.legalLink}>Kullanım Koşulları</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://waveone.app/privacy')}>
          <Text style={styles.legalLink}>Gizlilik Politikası</Text>
        </TouchableOpacity>
        <Text style={styles.legalDot}>·</Text>
        <TouchableOpacity onPress={restorePurchase}>
          <Text style={styles.legalLink}>Satın Alımı Geri Yükle</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060f09',
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    color: '#e4f5e0',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  logoAccent: {
    color: '#4caf8c',
  },
  subtitle: {
    color: '#3a5a42',
    fontSize: 9,
    letterSpacing: 3,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#0f2014',
    marginVertical: 24,
  },
  headline: {
    color: '#e4f5e0',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  body: {
    color: '#6b8f72',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  features: {
    width: '100%',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureCheck: {
    color: '#4caf8c',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  featureText: {
    color: '#b8d4bc',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  plan: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1a3520',
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#080f0a',
    minHeight: 100,
    justifyContent: 'center',
  },
  planActive: {
    borderColor: '#4caf8c',
    backgroundColor: '#0d2516',
  },
  badgeWrap: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#4caf8c',
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badge: {
    color: '#020d04',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  planPeriod: {
    color: '#3a5a42',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  planPeriodActive: {
    color: '#4caf8c',
  },
  planPrice: {
    color: '#6b8f72',
    fontSize: 28,
    fontWeight: '800',
  },
  planPriceActive: {
    color: '#e4f5e0',
  },
  planSub: {
    color: '#3a5a42',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  planSubActive: {
    color: '#4a6650',
  },
  cta: {
    width: '100%',
    backgroundColor: '#4caf8c',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaText: {
    color: '#020d04',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trial: {
    color: '#4a6650',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  legal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalLink: {
    color: '#3a5a42',
    fontSize: 11,
    textDecorationLine: 'underline',
    fontFamily: 'monospace',
  },
  legalDot: {
    color: '#1a3520',
    fontSize: 11,
  },
  skip: {
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    color: '#3a5a42',
    fontSize: 12,
    fontFamily: 'monospace',
    textDecorationLine: 'underline',
  },
});
