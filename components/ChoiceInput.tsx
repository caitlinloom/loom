import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { C, F } from '@/constants/design';

interface ChoiceInputProps {
  options:  string[];
  value:    number | undefined;
  onChange: (index: number) => void;
}

export function ChoiceInput({ options, value, onChange }: ChoiceInputProps) {
  return (
    <View style={s.container}>
      {options.map((opt, i) => {
        const selected = value === i;
        return (
          <TouchableOpacity
            key={i}
            onPress={() => onChange(i)}
            activeOpacity={0.7}
            style={[s.option, selected && s.optionSelected]}
          >
            <Text style={[s.text, selected && s.textSelected]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 6,
  },
  option: {
    paddingVertical:   13,
    paddingHorizontal: 16,
    borderWidth:       1,
    borderColor:       C.border,
    backgroundColor:   'transparent',
  },
  optionSelected: {
    borderColor:     C.text,
    backgroundColor: C.text,
  },
  text: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.text,
    lineHeight: 20,
  },
  textSelected: {
    color: C.inv,
  },
});
