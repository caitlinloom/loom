import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { C, F } from '@/constants/design';

interface PhotoUploadProps {
  photos:   (string | null)[];   // 4 slots
  onChange: (photos: (string | null)[]) => void;
}

export function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const pick = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library in Settings.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const next = [...photos];
      next[index] = result.assets[0].uri;
      onChange(next);
    }
  };

  return (
    <View style={s.grid}>
      {[0, 1, 2, 3].map(i => {
        const uri = photos[i];
        return (
          <TouchableOpacity
            key={i}
            onPress={() => pick(i)}
            activeOpacity={0.8}
            style={[s.cell, uri ? s.cellFilled : s.cellEmpty]}
          >
            {uri ? (
              <>
                <Image source={{ uri }} style={s.image} />
                {/* Replace indicator */}
                <View style={s.replaceBtn}>
                  <Text style={s.replaceIcon}>+</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={s.plus}>+</Text>
                <Text style={s.hint}>{i === 0 ? 'Main photo' : `Photo ${i + 1}`}</Text>
              </>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const CELL_RATIO = 4 / 3; // height = width * ratio

const s = StyleSheet.create({
  grid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            8,
  },
  cell: {
    // Two columns with 8px gap
    width:        '48.5%',
    aspectRatio:  3 / 4,
    overflow:     'hidden',
    alignItems:   'center',
    justifyContent: 'center',
  },
  cellEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.borderDk,
    backgroundColor: C.subtle,
  },
  cellFilled: {},
  image: {
    width:     '100%',
    height:    '100%',
    resizeMode: 'cover',
  },
  plus: {
    fontSize: 22,
    color:    C.text3,
  },
  hint: {
    fontFamily: F.sans,
    fontSize:   11,
    color:      C.text3,
    marginTop:  4,
  },
  replaceBtn: {
    position:        'absolute',
    bottom:          6,
    right:           6,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  replaceIcon: {
    fontSize:   16,
    color:      C.text,
    lineHeight: 20,
  },
});
