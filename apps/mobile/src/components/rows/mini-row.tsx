import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { IdnTheme } from '@/design/tokens';
import { Icon } from '@/design/icons';

type Props = {
  t: IdnTheme;
  icon?: React.ReactNode;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

export function NMiniRow({ t, icon, title, sub, right, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 12,
    }}>
      {icon ? <View style={{ width: 28, alignItems: 'center' }}>{icon}</View> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: t.ink }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {right ?? <Icon name="arrow" size={16} color={t.muted} />}
    </Pressable>
  );
}
