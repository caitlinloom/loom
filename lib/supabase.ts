import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── SecureStore adapter for Supabase session persistence ────────────────────
// Uses expo-secure-store on native, localStorage on web.

const ExpoSecureStoreAdapter = {
  getItem: (key: string): Promise<string | null> =>
    SecureStore.getItemAsync(key),
  setItem: (key: string, value: string): Promise<void> =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string): Promise<void> =>
    SecureStore.deleteItemAsync(key),
};

const storage =
  Platform.OS === 'web'
    ? undefined   // supabase-js falls back to localStorage on web
    : ExpoSecureStoreAdapter;

const supabaseUrl  = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    storage,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
});

// ─── Typed helpers ────────────────────────────────────────────────────────────

export const db = {
  profiles:             () => supabase.from('profiles'),
  photos:               () => supabase.from('photos'),
  preferences:          () => supabase.from('preferences'),
  question_answers:     () => supabase.from('question_answers'),
  compatibility_scores: () => supabase.from('compatibility_scores'),
  interactions:         () => supabase.from('interactions'),
  matches:              () => supabase.from('matches'),
  messages:             () => supabase.from('messages'),
  subscriptions:        () => supabase.from('subscriptions'),
};

// Upload a photo and return its public URL.
// bucket: 'profile-photos'
export async function uploadPhoto(
  userId: string,
  uri: string,
  position: number,
): Promise<string> {
  const ext  = uri.split('.').pop() ?? 'jpg';
  const path = `${userId}/${position}-${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob     = await response.blob();

  const { error } = await supabase.storage
    .from('profile-photos')
    .upload(path, blob, { contentType: `image/${ext}`, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
  return data.publicUrl;
}
