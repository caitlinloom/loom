import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase, db } from '@/lib/supabase';
import { C, F, Sp } from '@/constants/design';
import { Btn } from '@/components/Btn';

const CODE_LENGTH = 6;

export default function VerifyScreen() {
  const { phone }  = useLocalSearchParams<{ phone: string }>();
  const router     = useRouter();

  const [digits,   setDigits]  = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [resent,   setResent]  = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));

  // Auto-focus first input
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, []);

  const handleInput = (idx: number, val: string) => {
    // Accept paste of full code
    if (val.length > 1) {
      const pasted = val.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
      const next   = [...pasted, ...Array(CODE_LENGTH).fill('')].slice(0, CODE_LENGTH);
      setDigits(next);
      const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      return;
    }
    const char = val.replace(/\D/g, '');
    const next = [...digits];
    next[idx]  = char;
    setDigits(next);
    if (char && idx < CODE_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = '';
      setDigits(next);
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const verify = async () => {
    const token = digits.join('');
    if (token.length < CODE_LENGTH) return;

    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (err) {
      setLoading(false);
      setError('Invalid code. Please try again.');
      return;
    }

    // Ensure a profile row exists
    if (data.user) {
      await db.profiles().upsert({
        id:              data.user.id,
        phone,
        onboarding_step: 0,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
      });
    }

    setLoading(false);
    // Root layout's auth gate will redirect to subscribe
  };

  const resend = async () => {
    await supabase.auth.signInWithOtp({ phone });
    setResent(true);
    setTimeout(() => setResent(false), 30000);
  };

  const canSubmit = digits.every(Boolean) && !loading;

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={s.container}>
        <Text style={s.heading}>Verify your{'\n'}number</Text>
        <Text style={s.sub}>Enter the 6-digit code sent to{'\n'}{phone}</Text>

        {/* OTP inputs */}
        <View style={s.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => { inputRefs.current[i] = r; }}
              value={d}
              onChangeText={v => handleInput(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              maxLength={1}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              style={[s.codeInput, d ? s.codeInputFilled : null]}
              selectionColor={C.text}
            />
          ))}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Btn primary onPress={verify} disabled={!canSubmit} loading={loading}>
          Verify
        </Btn>

        <TouchableOpacity onPress={resend} disabled={resent}>
          <Text style={[s.resend, resent && s.resendSent]}>
            {resent ? 'Code resent' : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: {
    flex:            1,
    backgroundColor: C.bg,
  },
  container: {
    flex:              1,
    paddingHorizontal: Sp.lg,
    paddingTop:        Sp.xxl * 1.5,
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
  codeRow: {
    flexDirection:  'row',
    gap:            8,
    justifyContent: 'center',
  },
  codeInput: {
    width:           46,
    height:          56,
    borderWidth:     1,
    borderColor:     C.border,
    backgroundColor: C.bg,
    textAlign:       'center',
    fontSize:        22,
    fontFamily:      F.mono,
    color:           C.text,
  },
  codeInputFilled: {
    borderColor: C.text,
  },
  error: {
    fontFamily: F.sans,
    fontSize:   13,
    color:      C.err,
    textAlign:  'center',
  },
  resend: {
    fontFamily:         F.sans,
    fontSize:           13,
    color:              C.text3,
    textAlign:          'center',
    textDecorationLine: 'underline',
  },
  resendSent: {
    color: C.ok,
  },
});
