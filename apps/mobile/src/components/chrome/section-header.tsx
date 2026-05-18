import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';

export function SectionH({ t, title, right, onRightPress }: { t: IdnTheme; title: string; right?: React.ReactNode; onRightPress?: () => void }) {
  const isCountRight = typeof right === 'string' && /^\d/.test(right);
  const rightNode = typeof right === 'string'
    ? <Text style={{ fontSize: 11, color: isCountRight ? t.muted : idnTokens.green, fontWeight: '500' }}>{right}</Text>
    : right;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: '600', color: t.ink, letterSpacing: -0.1 }}>{title}</Text>
      {right ? (onRightPress ? <Pressable onPress={onRightPress}>{rightNode}</Pressable> : rightNode) : null}
    </View>
  );
}
