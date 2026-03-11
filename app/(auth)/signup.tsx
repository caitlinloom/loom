import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '@/lib/supabase';
import { C, F, Sp } from '@/constants/design';
import { Btn } from '@/components/Btn';
import { Inp } from '@/components/Inp';

export default function SignupScreen() {
  const router = useRouter();

  const [phone,    setPhone]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Normalize: strip non-digits, require 10 digits (US)
  const digits   = phone.replace(/\D/g, '');
  const e164     = `+1${digits}`;
  const canSubmit = digits.length === 10 && !loading;

  const sendOtp = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      phone: e164,
    });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      router.push({ pathname: '/(auth)/verify', params: { phone: e164 } });
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.heading}>Create your{'\n'}account</Text>
        <Text style={s.sub}>
          We'll send a verification code to confirm your number.
        </Text>

        <View style={s.phoneRow}>
          <View style={s.countryCode}>
            <Text style={s.countryCodeText}>+1</Text>
          </View>
          <View style={s.phoneInput}>
            <Inp
              value={phone}
              onChangeText={setPhone}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              maxLength={14}
              returnKeyType="done"
              onSubmitEditing={sendOtp}
              style={s.inputInner}
            />
          </View>
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Btn primary onPress={sendOtp} disabled={!canSubmit} loading={loading}>
          Send verification code
        </Btn>

        <Text style={s.legal}>
          By continuing you agree to Loom's{' '}
          <Text style={s.link}>Terms of Service</Text> and{' '}
          <Text style={s.link}>Privacy Policy</Text>. Standard message and data rates may apply.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: {
    flex:            1,
    backgroundColor: C.bg,
  },
  container: {
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.xxl * 1.5,
    paddingBottom:     Sp.xxl,
    gap:               Sp.lg,
  },
  heading: {
    fontFamily: F.serif,
    fontSize:   30,
    color:      C.text,
    lineHeight: 38,
  },
  sub: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.text3,
    lineHeight: 20,
    marginTop:  -Sp.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    gap:           8,
  },
  countryCode: {
    width:           64,
    paddingVertical: 13,
    borderWidth:     1,
    borderColor:     C.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  countryCodeText: {
    fontFamily: F.sans,
    fontSize:   15,
    color:      C.text2,
  },
  phoneInput: {
    flex: 1,
  },
  inputInner: {
    borderWidth: 0,
    borderWidth: 1,
    borderColor: C.border,
  },
  error: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.err,
    marginTop:  -Sp.sm,
  },
  legal: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text3,
    lineHeight: 16,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
