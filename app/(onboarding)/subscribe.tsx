import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { db } from '@/lib/supabase';
import { createSubscriptionPaymentSheet, SUBSCRIPTION_PRICE } from '@/lib/stripe';
import { useAuth } from '@/hooks/useAuth';
import { C, F, Sp } from '@/constants/design';
import { Btn } from '@/components/Btn';

// Paywall — users must subscribe before accessing any features.
export default function SubscribeScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user, refreshProfile }                  = useAuth();
  const router                                    = useRouter();

  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Create subscription + get payment sheet params from edge function
      const { paymentIntent, ephemeralKey, customer } =
        await createSubscriptionPaymentSheet();

      // 2. Init Stripe payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName:      'Loom',
        customerId:               customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        defaultBillingDetails: { name: '' },
        appearance: {
          colors: {
            primary:    '#0A0A0A',
            background: '#FFFFFF',
            componentBackground: '#F7F7F5',
            componentBorder: '#E8E8E4',
            primaryText: '#0A0A0A',
            secondaryText: '#4A4A46',
          },
        },
      });

      if (initError) throw new Error(initError.message);

      // 3. Present sheet
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment failed', presentError.message);
        }
        setLoading(false);
        return;
      }

      // 4. Payment succeeded — advance onboarding step
      await db.profiles()
        .update({ onboarding_step: 1, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      await refreshProfile();
      router.replace('/(onboarding)/profile');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // DEV ONLY — skip Stripe and advance directly to profile step
  const handleDevSkip = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await db.profiles()
        .update({ onboarding_step: 1, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      await refreshProfile();
      router.replace('/(onboarding)/profile');
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={s.content} bounces={false}>
        {/* Header */}
        <Text style={s.wordmark}>Loom</Text>
        <View style={s.rule} />
        <Text style={s.headline}>Where compatibility{'\n'}is the currency.</Text>

        {/* Plan details */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Loom Membership</Text>
            <Text style={s.price}>{SUBSCRIPTION_PRICE}</Text>
          </View>
          <View style={s.divider} />
          {FEATURES.map((f, i) => (
            <View key={i} style={s.feature}>
              <Text style={s.featureDot}>—</Text>
              <Text style={s.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Anti-features (what this is not) */}
        <View style={s.anti}>
          {ANTI.map((a, i) => (
            <Text key={i} style={s.antiText}>{a}</Text>
          ))}
        </View>
      </ScrollView>

      {/* CTA pinned to bottom */}
      <View style={s.footer}>
        <Btn primary onPress={handleSubscribe} loading={loading}>
          Subscribe for {SUBSCRIPTION_PRICE}
        </Btn>
        <Text style={s.footerNote}>
          Billed monthly. Cancel anytime in your account settings.
        </Text>
        <Btn onPress={handleDevSkip} disabled={loading}>
          Skip (dev mode)
        </Btn>
      </View>
    </View>
  );
}

const FEATURES = [
  'Full access to all 100 compatibility questions',
  'Deep match scoring across 8 relationship dimensions',
  'Browse every profile above your 70% threshold',
  'Unlimited messaging with your matches',
  'No algorithmic nudges, no endless swiping',
];

const ANTI = [
  'No free tier.',
  'No advertising.',
  'No selling your data.',
];

const s = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: C.bg,
  },
  content: {
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.xxl * 1.5,
    paddingBottom:     120,
    gap:               Sp.lg,
  },
  wordmark: {
    fontFamily:    F.serif,
    fontSize:      36,
    color:         C.text,
    letterSpacing: -0.5,
  },
  rule: {
    width:           36,
    height:          1,
    backgroundColor: C.text,
  },
  headline: {
    fontFamily:  F.serifI,
    fontSize:    24,
    color:       C.text,
    lineHeight:  34,
  },
  card: {
    borderWidth:  1,
    borderColor:  C.border,
    padding:      Sp.lg,
    gap:          Sp.sm,
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    marginBottom:   Sp.xs,
  },
  cardTitle: {
    fontFamily: F.serif,
    fontSize:   16,
    color:      C.text,
  },
  price: {
    fontFamily: F.mono,
    fontSize:   14,
    color:      C.text,
  },
  divider: {
    height:          1,
    backgroundColor: C.border,
    marginVertical:  Sp.sm,
  },
  feature: {
    flexDirection: 'row',
    gap:           10,
    alignItems:    'flex-start',
  },
  featureDot: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.text3,
    marginTop:  2,
  },
  featureText: {
    flex:       1,
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.text2,
    lineHeight: 20,
  },
  anti: {
    gap: 4,
  },
  antiText: {
    fontFamily: F.serifI,
    fontSize:   13,
    color:      C.text3,
  },
  footer: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.lg,
    paddingBottom:     Sp.xxl,
    backgroundColor:   C.bg,
    borderTopWidth:    1,
    borderTopColor:    C.border,
    gap:               Sp.sm,
  },
  footerNote: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text3,
    textAlign:  'center',
  },
});
