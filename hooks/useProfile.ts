import { useCallback } from 'react';
import { supabase, db, uploadPhoto } from '@/lib/supabase';
import { Profile, Preferences, Gender, Orientation, Religion, MonogamyStance } from '@/types';

// Helpers used by onboarding screens to write data to Supabase.

export function useProfile() {
  // ── Upsert core profile fields ─────────────────────────────────────────────
  const saveProfile = useCallback(async (
    userId: string,
    fields: Partial<Pick<
      Profile,
      | 'name'
      | 'birth_date'
      | 'gender'
      | 'orientation'
      | 'religion'
      | 'monogamy'
      | 'bio'
      | 'location_name'
      | 'location_lat'
      | 'location_lng'
      | 'onboarding_step'
    >>,
  ) => {
    const { error } = await db.profiles()
      .upsert({ id: userId, ...fields, updated_at: new Date().toISOString() });
    if (error) throw error;
  }, []);

  // ── Save photos (upload + upsert rows) ────────────────────────────────────
  const savePhotos = useCallback(async (
    userId: string,
    localUris: (string | null)[],   // 4 slots, null = not set
  ) => {
    const uploads = localUris.map(async (uri, position) => {
      if (!uri) return null;
      // If already a remote URL (from a previous upload), keep it
      if (uri.startsWith('http')) return { position, url: uri };
      const url = await uploadPhoto(userId, uri, position);
      return { position, url };
    });

    const results = await Promise.all(uploads);
    const rows = results
      .filter(Boolean)
      .map(r => ({ user_id: userId, position: r!.position, url: r!.url }));

    if (rows.length === 0) return;

    // Delete existing then insert to ensure clean ordering
    await db.photos().delete().eq('user_id', userId);
    const { error } = await db.photos().insert(rows);
    if (error) throw error;
  }, []);

  // ── Fetch photo URLs for a user ───────────────────────────────────────────
  const fetchPhotos = useCallback(async (userId: string): Promise<string[]> => {
    const { data, error } = await db.photos()
      .select('url, position')
      .eq('user_id', userId)
      .order('position');
    if (error) throw error;
    return (data ?? []).map(r => r.url);
  }, []);

  // ── Save preferences ──────────────────────────────────────────────────────
  const savePreferences = useCallback(async (
    userId: string,
    prefs: Omit<Preferences, 'id' | 'user_id' | 'updated_at'>,
  ) => {
    const { error } = await db.preferences().upsert({
      user_id: userId,
      ...prefs,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }, []);

  // ── Fetch preferences ─────────────────────────────────────────────────────
  const fetchPreferences = useCallback(async (
    userId: string,
  ): Promise<Preferences | null> => {
    const { data, error } = await db.preferences()
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as Preferences | null;
  }, []);

  // ── Save a single question answer (upsert) ────────────────────────────────
  const saveAnswer = useCallback(async (
    userId:     string,
    questionId: number,
    answer:     number,
  ) => {
    const { error } = await db.question_answers().upsert({
      user_id:     userId,
      question_id: questionId,
      answer,
      created_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,question_id' });
    if (error) throw error;
  }, []);

  // ── Fetch all answers for a user ──────────────────────────────────────────
  const fetchAnswers = useCallback(async (
    userId: string,
  ): Promise<Record<number, number>> => {
    const { data, error } = await db.question_answers()
      .select('question_id, answer')
      .eq('user_id', userId);
    if (error) throw error;
    const map: Record<number, number> = {};
    (data ?? []).forEach(r => { map[r.question_id] = r.answer; });
    return map;
  }, []);

  // ── Trigger server-side compatibility calculation ─────────────────────────
  // Called after all questions are answered.
  const triggerCompatCalc = useCallback(async (userId: string) => {
    const { error } = await supabase.functions.invoke('calculate-compatibility', {
      body: { userId },
    });
    if (error) throw error;
  }, []);

  return {
    saveProfile,
    savePhotos,
    fetchPhotos,
    savePreferences,
    fetchPreferences,
    saveAnswer,
    fetchAnswers,
    triggerCompatCalc,
  };
}
