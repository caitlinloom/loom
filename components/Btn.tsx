import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { C, F, Sp } from '@/constants/design';

interface BtnProps {
  children:  React.ReactNode;
  onPress:   () => void;
  primary?:  boolean;
  disabled?: boolean;
  loading?:  boolean;
  style?:    ViewStyle;
}

export function Btn({ children, onPress, primary, disabled, loading, style }: BtnProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        s.base,
        primary && s.primary,
        !primary && s.secondary,
        isDisabled && s.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? C.inv : C.text} size="small" />
      ) : (
        <Text style={[s.label, primary && s.labelPrimary, isDisabled && s.labelDisabled]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: {
    paddingVertical:   14,
    paddingHorizontal: 24,
    alignItems:        'center',
    justifyContent:    'center',
    minHeight:         52,
  },
  primary: {
    backgroundColor: C.text,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth:     1,
    borderColor:     C.border,
  },
  disabled: {
    backgroundColor: C.subtle,
    borderColor:     C.border,
  },
  label: {
    fontFamily:    F.sans,
    fontSize:      13,
    fontWeight:    '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color:         C.text,
  },
  labelPrimary: {
    color: C.inv,
  },
  labelDisabled: {
    color: C.text3,
  },
});
