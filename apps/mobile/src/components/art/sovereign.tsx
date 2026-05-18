import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';

export function ArtSovereign({ t }: { t: IdnTheme }) {
  return (
    <View style={{ width: 180, height: 180 }}>
      <Svg viewBox="0 0 200 200" width="100%" height="100%">
        <Path
          d="M100 20 L160 50 L160 110 Q160 160 100 180 Q40 160 40 110 L40 50 Z"
          fill={t.dark ? '#0F2A18' : idnTokens.greenSoft}
          stroke={idnTokens.green}
          strokeWidth={2}
        />
        <Path d="M80 100l15 15 30-35" stroke={idnTokens.green} strokeWidth={4} fill="none" strokeLinecap="round" />
        <SvgText x={100} y={155} fontSize={9} fill={idnTokens.green} textAnchor="middle" letterSpacing={1.5}>GABON · 100%</SvgText>
      </Svg>
    </View>
  );
}
