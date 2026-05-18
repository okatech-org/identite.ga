import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { IdnTheme } from './tokens';

export function LoABadge({ level = 1, t, compact = false }: { level?: 1 | 2 | 3; t: IdnTheme; compact?: boolean }) {
  const meta = ({
    1: { label: 'Niveau 1', sub: 'Faible',      color: t.muted, fill: t.surface2 },
    2: { label: 'Niveau 2', sub: 'Substantiel', color: t.blue,  fill: t.dark ? '#10243A' : t.blueSoft },
    3: { label: 'Niveau 3', sub: 'Élevé',       color: t.green, fill: t.dark ? '#0F2A18' : t.greenSoft },
  } as const)[level];
  const s = compact ? 10 : 11;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: compact ? 2 : 4,
      paddingHorizontal: compact ? 8 : 10,
      borderRadius: 9999,
      backgroundColor: meta.fill,
      alignSelf: 'flex-start',
    }}>
      <Svg width={s} height={s} viewBox="0 0 12 12" fill="none">
        <Path d="M6 1l4 1.5v3.5c0 2.4-1.7 4.4-4 5-2.3-.6-4-2.6-4-5V2.5L6 1z" fill={meta.color} />
      </Svg>
      <Text style={{ color: meta.color, fontSize: compact ? 11 : 12, fontWeight: '600', letterSpacing: 0.1 }}>
        {meta.label}
        {!compact && <Text style={{ opacity: 0.7, fontWeight: '500' }}> · {meta.sub}</Text>}
      </Text>
    </View>
  );
}
