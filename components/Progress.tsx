import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C, F } from '@/constants/design';

interface ProgressProps {
  current: number;
  total:   number;
  label:   string;
}

export function Progress({ current, total, label }: ProgressProps) {
  const pct = Math.min(Math.max(current / total, 0), 1);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.count}>{current}/{total}</Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'baseline',
    marginBottom:   8,
  },
  label: {
    fontFamily:    F.sans,
    fontSize:      11,
    color:         C.text3,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  count: {
    fontFamily: F.mono,
    fontSize:   13,
    color:      C.text3,
  },
  track: {
    height:          2,
    backgroundColor: C.border,
    overflow:        'hidden',
  },
  fill: {
    height:          2,
    backgroundColor: C.text,
  },
});
