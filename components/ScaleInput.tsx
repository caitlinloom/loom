import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { C, F } from '@/constants/design';

interface ScaleInputProps {
  value:    number | undefined;
  onChange: (v: number) => void;
  min:      string;
  max:      string;
}

export function ScaleInput({ value, onChange, min, max }: ScaleInputProps) {
  const v = value ?? 5;

  return (
    <View>
      {/* Pole labels */}
      <View style={s.labels}>
        <Text style={s.pole}>{min}</Text>
        <Text style={s.pole}>{max}</Text>
      </View>

      {/* 10 dots */}
      <View style={s.track}>
        {Array.from({ length: 10 }, (_, i) => {
          const active  = i <= v;
          const current = i === v;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onChange(i)}
              activeOpacity={0.7}
              style={s.dotWrap}
            >
              <View
                style={[
                  s.dot,
                  active  && s.dotActive,
                  current && s.dotCurrent,
                ]}
              >
                {current && (
                  <Text style={s.dotLabel}>{v + 1}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  labels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   14,
  },
  pole: {
    fontFamily: F.serifI,
    fontSize:   12,
    color:      C.text3,
  },
  track: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  dotWrap: {
    flex:           1,
    alignItems:     'center',
    paddingVertical: 10,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: C.border,
  },
  dotActive: {
    backgroundColor: C.text,
  },
  dotCurrent: {
    width:           30,
    height:          30,
    borderRadius:    15,
    backgroundColor: C.text,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dotLabel: {
    fontFamily: F.mono,
    fontSize:   11,
    fontWeight: '600',
    color:      C.inv,
  },
});
