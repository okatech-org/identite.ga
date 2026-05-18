import React from 'react';
import { View, Text } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';

export function SectionH({ t, title, right }: { t: IdnTheme; title: string; right?: React.ReactNode }) {
  const isCountRight = typeof right === 'string' && /^\d/.test(right);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: t.ink, letterSpacing: -0.1 }}>{title}</Text>
      {typeof right === 'string'
        ? <Text style={{ fontSize: 11, color: isCountRight ? t.muted : idnTokens.green, fontWeight: '500' }}>{right}</Text>
        : right}
    </View>
  );
}
