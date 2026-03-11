import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  LibreBaskerville_400Regular,
  LibreBaskerville_400Regular_Italic,
  LibreBaskerville_700Bold,
} from '@expo-google-fonts/libre-baskerville';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAuth } from '@/hooks/useAuth';
import { STRIPE_PUBLISHABLE_KEY } from '@/lib/stripe';
import { C } from '@/constants/design';

SplashScreen.preventAutoHideAsync();

// ─── Root layout: handles font loading, auth gate, and routing ───────────────
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    LibreBaskerville_400Regular,
    LibreBaskerville_400Regular_Italic,
    LibreBaskerville_700Bold,
    JetBrainsMono_400Regular,
  });

  const { session, loading, onboardingStep } = useAuth();
  const router   = useRouter();
  const segments = useSegments();

  // Route guard: runs whenever auth state or onboarding step changes
  useEffect(() => {
    if (!fontsLoaded || loading) return;

    SplashScreen.hideAsync();

    const inAuth        = segments[0] === '(auth)';
    const inOnboarding  = segments[0] === '(onboarding)';
    const inApp         = segments[0] === '(app)';

    if (!session) {
      // Not signed in — send to auth unless already there
      if (!inAuth) router.replace('/(auth)/signup');
      return;
    }

    // Signed in — route to correct onboarding step
    switch (onboardingStep) {
      case 0:
        if (!inOnboarding || segments[1] !== 'subscribe')
          router.replace('/(onboarding)/subscribe');
        break;
      case 1:
        if (!inOnboarding || segments[1] !== 'profile')
          router.replace('/(onboarding)/profile');
        break;
      case 2:
        if (!inOnboarding || segments[1] !== 'preferences')
          router.replace('/(onboarding)/preferences');
        break;
      case 3:
        if (!inOnboarding || segments[1] !== 'questions')
          router.replace('/(onboarding)/questions');
        break;
      default:
        // Step 4+ = fully onboarded
        if (!inApp) router.replace('/(app)/browse');
        break;
    }
  }, [fontsLoaded, loading, session, onboardingStep]);

  if (!fontsLoaded || loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator color={C.text} />
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index"            />
        <Stack.Screen name="(auth)"           />
        <Stack.Screen name="(onboarding)"     />
        <Stack.Screen name="(app)"            />
      </Stack>
    </StripeProvider>
  );
}

const s = StyleSheet.create({
  loader: {
    flex:            1,
    backgroundColor: C.bg,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
