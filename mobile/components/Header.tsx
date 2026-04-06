import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  accentColor: string;
}

export function Header({ accentColor }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <Text style={styles.logo}>WAVE<Text style={{ color: accentColor }}>:ONE</Text></Text>
        <Text style={styles.tagline}>PROFESSIONAL BRIEFING</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: accentColor + '22' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#060f09',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
  },
  logo: {
    color: '#e4f5e0',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  logoAccent: {
    color: '#4caf8c',
  },
  tagline: {
    color: '#3a5a42',
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: '#0f2014',
  },
});
