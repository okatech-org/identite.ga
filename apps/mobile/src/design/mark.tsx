import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { idnTokens } from './tokens';

export function IdnMark({ size = 28, color }: { size?: number; color?: string }) {
  const c = color || idnTokens.green;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Rect x={2} y={2} width={28} height={28} rx={7} fill={c} />
      <Path d="M11 9v14M16 13v10M21 17v6" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
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
