import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F, Sp } from '@/constants/design';

interface SectionProps {
  label?:    string;
  children:  React.ReactNode;
  style?:    object;
}

export function Section({ label, children, style }: SectionProps) {
  return (
    <View style={[s.container, style]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      {children}
    </View>
  );
}

export function Rule() {
  return <View style={s.rule} />;
}

const s = StyleSheet.create({
  container: {
    marginBottom: Sp.lg,
  },
  label: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
    marginBottom:  12,
    fontWeight:    '500',
  },
  rule: {
    height:           1,
    backgroundColor:  C.border,
    marginVertical:   Sp.lg,
  },
});
