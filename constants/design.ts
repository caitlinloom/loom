import { Platform } from 'react-native';

// ─── Loom Design System ───────────────────────────────────────────────────────
// Exact port of the S object from the prototype.
// Editorial black/white aesthetic with Libre Baskerville serif.

export const C = {
  bg:       '#FFFFFF',
  subtle:   '#F7F7F5',
  border:   '#E8E8E4',
  borderDk: '#D4D4CF',
  text:     '#0A0A0A',
  text2:    '#4A4A46',
  text3:    '#8A8A84',
  accent:   '#0A0A0A',
  inv:      '#FFFFFF',
  err:      '#B44433',
  ok:       '#3A7D44',
} as const;

// Font family strings for StyleSheet usage.
// LibreBaskerville_* must be loaded via useFonts before use.
export const F = {
  serif:    'LibreBaskerville_400Regular',
  serifI:   'LibreBaskerville_400Regular_Italic',
  serifBd:  'LibreBaskerville_700Bold',
  sans:     Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  mono:     'JetBrainsMono_400Regular',
} as const;

// Spacing scale
export const Sp = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

// Typography scale
export const Ty = {
  heading1: { fontFamily: F.serif,  fontSize: 48, lineHeight: 52 },
  heading2: { fontFamily: F.serif,  fontSize: 28, lineHeight: 34 },
  heading3: { fontFamily: F.serif,  fontSize: 22, lineHeight: 30 },
  body:     { fontFamily: F.sans,   fontSize: 15, lineHeight: 22 },
  bodyItal: { fontFamily: F.serifI, fontSize: 15, lineHeight: 22 },
  small:    { fontFamily: F.sans,   fontSize: 13, lineHeight: 18 },
  label:    { fontFamily: F.sans,   fontSize: 11, lineHeight: 14, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  mono:     { fontFamily: F.mono,   fontSize: 13, lineHeight: 18 },
} as const;
