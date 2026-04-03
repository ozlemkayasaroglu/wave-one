import * as SecureStore from 'expo-secure-store';

const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export async function localGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(`waveone_${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (entry.expiresAt < Date.now()) {
      await SecureStore.deleteItemAsync(`waveone_${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export async function localSet<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + TTL };
    await SecureStore.setItemAsync(`waveone_${key}`, JSON.stringify(entry));
  } catch { /* silent */ }
}
