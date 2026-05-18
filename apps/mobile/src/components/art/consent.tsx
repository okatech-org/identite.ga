import React from 'react';
import { Text, View } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';

const ROWS = [
  { l: 'Prénom · Nom', on: true },
  { l: 'Date de naissance', on: true },
  { l: 'Numéro fiscal', on: false },
  { l: 'Adresse', on: false },
] as const;

export function ArtConsent({ t }: { t: IdnTheme }) {
  return (
    <View style={{ width: 200, height: 180, gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      {ROWS.map((r, i) => (
        <View key={i} style={{
          width: 200,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 10,
        }}>
          <Text style={{ fontSize: 12, color: t.ink, flex: 1, fontWeight: '500' }}>{r.l}</Text>
          <View style={{ width: 30, height: 18, borderRadius: 9999, backgroundColor: r.on ? idnTokens.green : t.border, padding: 2 }}>
            <View style={{ width: 14, height: 14, borderRadius: 9999, backgroundColor: '#fff', transform: [{ translateX: r.on ? 12 : 0 }] }} />
          </View>
        </View>
      ))}
    </View>
  );
}
