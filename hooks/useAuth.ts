import { useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, db } from '@/lib/supabase';
import { Profile, Subscription } from '@/types';

interface AuthState {
  session:      Session | null;
  user:         User    | null;
  profile:      Profile | null;
  subscription: Subscription | null;
  loading:      boolean;
  // Which onboarding step the user is on (mirrors profile.onboarding_step)
  // 0 = just authenticated (needs subscription)
  // 1 = subscribed (needs profile)
  // 2 = profile done (needs preferences)
  // 3 = preferences done (needs questions)
  // 4 = fully onboarded
  onboardingStep: number;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [session,       setSession]      = useState<Session | null>(null);
  const [user,          setUser]          = useState<User    | null>(null);
  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [subscription,  setSubscription]  = useState<Subscription | null>(null);
  const [loading,       setLoading]       = useState(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: sub }] = await Promise.all([
      db.profiles().select('*').eq('id', uid).maybeSingle(),
      db.subscriptions().select('*').eq('user_id', uid).maybeSingle(),
    ]);
    setProfile(prof as Profile | null);
    setSubscription(sub as Subscription | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) await fetchProfile(s.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: listener } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
          setSubscription(null);
        }
        setLoading(false);
      },
    );

    return () => listener.unsubscribe();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const onboardingStep = profile?.onboarding_step ?? 0;

  return {
    session,
    user,
    profile,
    subscription,
    loading,
    onboardingStep,
    signOut,
    refreshProfile,
  };
}
