import React from 'react';
import { View, Text } from 'react-native';
import type { IdnTheme } from '@/design/tokens';

export function NSectionLabel({ t, children, right }: { t: IdnTheme; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 8 }}>
      <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600' }}>{children}</Text>
      {right}
    </View>
  );
}
