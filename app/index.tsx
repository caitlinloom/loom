import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { C, F, Sp } from '@/constants/design';
import { Btn } from '@/components/Btn';

// ─── Splash / Landing screen ──────────────────────────────────────────────────
// This screen is briefly shown before the root layout's auth gate redirects.
// It also serves as the "logged out" landing.

export default function SplashScreen() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <StatusBar style="dark" />

      <View style={s.content}>
        <Text style={s.wordmark}>Loom</Text>
        <View style={s.rule} />
        <Text style={s.tagline}>
          One hundred questions about what matters most. An algorithm that listens. Connections woven from substance.
        </Text>
      </View>

      <View style={s.footer}>
        <Btn primary onPress={() => router.push('/(auth)/signup')}>
          Get started
        </Btn>
        <Text style={s.note}>
          Paid membership required · No free tier, no ads.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
    paddingHorizontal: Sp.lg,
    paddingTop:      Sp.xxl * 2,
    paddingBottom:   Sp.xxl,
    justifyContent:  'space-between',
  },
  content: {},
  wordmark: {
    fontFamily:    F.serif,
    fontSize:      60,
    color:         C.text,
    letterSpacing: -1,
    lineHeight:    64,
    marginBottom:  Sp.md,
  },
  rule: {
    width:           36,
    height:          1,
    backgroundColor: C.text,
    marginBottom:    Sp.lg,
  },
  tagline: {
    fontFamily: F.serifI,
    fontSize:   17,
    color:      C.text2,
    lineHeight: 28,
    maxWidth:   340,
  },
  footer: {
    gap: Sp.md,
  },
  note: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text3,
    textAlign:  'center',
  },
});
