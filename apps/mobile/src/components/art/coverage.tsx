import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';

const DOTS: [number, number][] = [
  [90, 65], [130, 55], [110, 90], [75, 110], [145, 100], [100, 130], [60, 80], [125, 130], [90, 45],
];

export function ArtCoverage({ t }: { t: IdnTheme }) {
  return (
    <View style={{ width: 200, height: 180, alignItems: 'center', justifyContent: 'center' }}>
      <Svg viewBox="0 0 200 180" width="100%" height="100%">
        <Path
          d="M55 35 Q80 25 115 30 Q150 35 165 60 Q170 85 158 105 Q150 130 130 145 Q105 155 85 150 Q60 145 45 125 Q35 100 40 75 Q45 50 55 35 Z"
          fill={t.dark ? '#0F2A18' : idnTokens.greenSoft}
          stroke={idnTokens.green}
          strokeWidth={1.5}
        />
        {DOTS.map(([x, y], i) => (
          <G key={i}>
            <Circle cx={x} cy={y} r={8} fill={idnTokens.green} opacity={0.18} />
            <Circle cx={x} cy={y} r={3} fill={idnTokens.green} />
          </G>
        ))}
      </Svg>
    </View>
  );
}
