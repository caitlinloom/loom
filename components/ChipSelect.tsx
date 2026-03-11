import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C, F } from '@/constants/design';

interface ChipSelectProps<T extends string> {
  options:  T[];
  selected: T[];
  onToggle: (value: T) => void;
}

export function ChipSelect<T extends string>({
  options,
  selected,
  onToggle,
}: ChipSelectProps<T>) {
  return (
    <View style={s.row}>
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onToggle(o)}
            activeOpacity={0.7}
            style={[s.chip, active && s.chipActive]}
          >
            <Text style={[s.label, active && s.labelActive]}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            6,
  },
  chip: {
    paddingVertical:   8,
    paddingHorizontal: 14,
    borderWidth:       1,
    borderColor:       C.border,
    backgroundColor:   'transparent',
  },
  chipActive: {
    borderColor:     C.text,
    backgroundColor: C.text,
  },
  label: {
    fontFamily: F.sans,
    fontSize:   12,
    color:      C.text,
  },
  labelActive: {
    color: C.inv,
  },
});
