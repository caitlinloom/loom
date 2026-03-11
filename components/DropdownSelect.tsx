import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { C, F } from '@/constants/design';

interface DropdownSelectProps<T extends string> {
  value:       T | '';
  onChange:    (value: T) => void;
  options:     T[];
  placeholder: string;
  label?:      string;
}

export function DropdownSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  label,
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      {label ? <Text style={s.label}>{label}</Text> : null}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={s.trigger}
      >
        <Text style={[s.triggerText, !value && s.placeholder]}>
          {value || placeholder}
        </Text>
        {/* Chevron */}
        <Text style={s.chevron}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>{placeholder}</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={item => item}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <TouchableOpacity
                  onPress={() => { onChange(item); setOpen(false); }}
                  activeOpacity={0.7}
                  style={[s.option, selected && s.optionSelected]}
                >
                  <Text style={[s.optionText, selected && s.optionTextSelected]}>
                    {item}
                  </Text>
                  {selected && <Text style={s.check}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
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
  trigger: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   13,
    paddingHorizontal: 16,
    borderWidth:       1,
    borderColor:       C.border,
    backgroundColor:   C.bg,
  },
  triggerText: {
    flex:       1,
    fontFamily: F.sans,
    fontSize:   15,
    color:      C.text,
  },
  placeholder: {
    color: C.text3,
  },
  chevron: {
    fontSize: 20,
    color:    C.text3,
    marginTop: -2,
  },
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    backgroundColor: C.bg,
    maxHeight:       '60%',
    paddingBottom:   Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth:  1,
    borderTopColor:  C.border,
  },
  sheetHeader: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetTitle: {
    fontFamily: F.serif,
    fontSize:   16,
    color:      C.text,
  },
  close: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.text3,
    padding:    4,
  },
  option: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.subtle,
  },
  optionSelected: {
    backgroundColor: C.subtle,
  },
  optionText: {
    flex:       1,
    fontFamily: F.sans,
    fontSize:   15,
    color:      C.text,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
  check: {
    fontFamily: F.sans,
    fontSize:   14,
    color:      C.ok,
  },
});
