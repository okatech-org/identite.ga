import React from 'react';
import { Text, View } from 'react-native';
import type { IdnTheme } from '@/design/tokens';

export function NStat({ t, label, value }: { t: IdnTheme; label: string; value: string }) {
  return (
    <View style={{
      flex: 1, padding: 12, borderRadius: 12,
      backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
    }}>
      <Text style={{ fontSize: 11, color: t.muted, letterSpacing: 0.4 }}>{label}</Text>
      <Text style={{ fontSize: 17, fontWeight: '700', color: t.ink, marginTop: 4 }}>{value}</Text>
    </View>
  );
}
