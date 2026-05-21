import React from 'react';
import { View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { idnTokens } from './tokens';

// Logo IDN : carré arrondi vert + empreinte digitale stylisée en blanc.
// Aligné sur le composant @repo/ui/components/idn-mark.tsx du web.
export function IdnMark({ size = 28, color }: { size?: number; color?: string }) {
  const c = color || idnTokens.green;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={2} y={2} width={28} height={28} rx={7} fill={c} />
      <G
        transform="translate(4 4)"
        stroke="#ffffff"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
        <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
        <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
        <Path d="M2 12a10 10 0 0 1 18-6" />
        <Path d="M2 16h.01" />
        <Path d="M21.8 16c.2-2 .131-5.354 0-6" />
        <Path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
        <Path d="M8.65 22c.21-.66.45-1.32.57-2" />
        <Path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
      </G>
    </Svg>
  );
}

export function IdnFlagBars({ height = 3, width = 36 }: { height?: number; width?: number }) {
  const barW = (width - 6) / 3;
  return (
    <View style={{ flexDirection: 'row', gap: 3, width, height }}>
      <View style={{ width: barW, height, backgroundColor: idnTokens.green, borderRadius: 2 }} />
      <View style={{ width: barW, height, backgroundColor: idnTokens.yellow, borderRadius: 2 }} />
      <View style={{ width: barW, height, backgroundColor: idnTokens.blue, borderRadius: 2 }} />
    </View>
  );
}
