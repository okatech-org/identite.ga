import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { IdnTheme } from '@/design/tokens';
import { Icon } from '@/design/icons';

type Props = {
  t: IdnTheme;
  label: string;
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
};

export function SetMobileRow({ t, label, value, right, onPress, danger }: Props) {
  return (
    <Pressable onPress={onPress} style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 13, paddingHorizontal: 14,
      backgroundColor: t.surface,
      borderBottomWidth: 1, borderBottomColor: t.borderSoft,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: danger ? '#B83A3A' : t.ink, fontWeight: '500' }}>{label}</Text>
        {value ? <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{value}</Text> : null}
      </View>
      {right ?? <Icon name="arrow" size={16} color={t.muted} />}
    </Pressable>
  );
}
