import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { Icon } from '@/design/icons';

export function NSheetHeader({ t, title, onBack, right }: { t: IdnTheme; title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.borderSoft,
      minHeight: 44,
      backgroundColor: t.bg,
    }}>
      {onBack ? (
        <Pressable onPress={onBack} style={{ padding: 4 }}>
          <Icon name="arrowL" size={20} color={idnTokens.green} />
        </Pressable>
      ) : <View style={{ width: 8 }} />}
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: t.ink, textAlign: 'center' }}>{title}</Text>
      <View style={{ minWidth: 28, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}
