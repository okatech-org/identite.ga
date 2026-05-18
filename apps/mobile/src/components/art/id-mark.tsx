import React from 'react';
import { Text, View } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { IdnMark, IdnFlagBars } from '@/design/mark';

export function ArtIdMark({ t }: { t: IdnTheme }) {
  return (
    <View style={{ width: 180, height: 200 }}>
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft,
        borderRadius: 24,
      }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <IdnMark size={84} />
      </View>
      <Text style={{ position: 'absolute', top: 14, left: 14, fontSize: 9, fontFamily: idnTokens.mono, color: idnTokens.green, letterSpacing: 1 }}>
        GA-7K3J-9Q2L
      </Text>
      <View style={{ position: 'absolute', bottom: 14, right: 14 }}>
        <IdnFlagBars width={32} height={3} />
      </View>
    </View>
  );
}
