import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SecureStore from 'expo-secure-store';
import { T } from '@/lib/theme';

export default function RootLayout() {
  useEffect(() => {
    async function redirect() {
      const onboarded = await SecureStore.getItemAsync('waveone_onboarded');
      if (!onboarded) { router.replace('/onboarding'); return; }

      const auth = await SecureStore.getItemAsync('waveone_auth');
      if (!auth) { router.replace('/paywall'); return; }

      if (auth === 'trial') {
        const startedAt = await SecureStore.getItemAsync('waveone_plan_started_at');
        if (startedAt) {
          const elapsed = Date.now() - parseInt(startedAt);
          const oneMonth = 30 * 24 * 60 * 60 * 1000;
          if (elapsed > oneMonth) {
            await SecureStore.deleteItemAsync('waveone_auth');
            router.replace('/paywall');
            return;
          }
        }
      }
    }
    redirect();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: T.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="article" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="paywall" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
