import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import { C, F } from '@/constants/design';

interface InpProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Inp({ label, error, style, ...props }: InpProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      {label ? (
        <Text style={s.label}>{label}</Text>
      ) : null}
      <TextInput
        {...props}
        style={[
          s.input,
          focused && s.inputFocused,
          error  && s.inputError,
          style,
        ]}
        placeholderTextColor={C.text3}
        onFocus={e => { setFocused(true);  props.onFocus?.(e);  }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e);   }}
        selectionColor={C.text}
      />
      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : null}
    </View>
  );
}

// Multi-line variant
export function TextArea({ label, error, style, ...props }: InpProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        {...props}
        multiline
        textAlignVertical="top"
        style={[
          s.input,
          s.textarea,
          focused && s.inputFocused,
          error   && s.inputError,
          style,
        ]}
        placeholderTextColor={C.text3}
        onFocus={e => { setFocused(true);  props.onFocus?.(e);  }}
        onBlur={e  => { setFocused(false); props.onBlur?.(e);   }}
        selectionColor={C.text}
      />
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  label: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  6,
    fontWeight:    '500',
  },
  input: {
    paddingVertical:   13,
    paddingHorizontal: 16,
    borderWidth:       1,
    borderColor:       C.border,
    backgroundColor:   C.bg,
    color:             C.text,
    fontSize:          15,
    fontFamily:        F.sans,
  },
  inputFocused: {
    borderColor: C.text,
  },
  inputError: {
    borderColor: C.err,
  },
  textarea: {
    minHeight:  96,
    fontFamily: F.serifI,
  },
  error: {
    fontFamily:  F.sans,
    fontSize:    12,
    color:       C.err,
    marginTop:   6,
  },
});

// Re-export a convenience alias used in some screens
export { Inp as default };
