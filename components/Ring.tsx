import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C, F } from '@/constants/design';

interface RingProps {
  score: number;
  size?: number;
}

export function Ring({ score, size = 80 }: RingProps) {
  const strokeWidth = 3;
  const radius      = (size - strokeWidth * 2) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset        = circumference - (score / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      {/* SVG ring — rotated so arc starts at 12 o'clock */}
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0, transform: [{ rotate: '-90deg' }] }}
      >
        {/* Track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={C.border}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={C.text}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Label */}
      <View style={[s.center, { width: size, height: size }]}>
        <Text style={[s.score, { fontSize: size * 0.28 }]}>{score}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: {
    position:       'absolute',
    alignItems:     'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: F.serif,
    color:      C.text,
    lineHeight: undefined,
  },
});
