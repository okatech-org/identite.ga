import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { Icon } from '@/design/icons';

type Props = {
  t: IdnTheme;
  title: string;
  sub?: string;
  right?: React.ReactNode;
  scrolled?: boolean;
  onBack?: () => void;
};

export function NLargeHeader({ t, title, sub, right, scrolled, onBack }: Props) {
  return (
    <View style={{
      paddingHorizontal: 22,
      paddingTop: 6,
      paddingBottom: 14,
      borderBottomWidth: scrolled ? 1 : 0,
      borderBottomColor: t.borderSoft,
      backgroundColor: t.bg,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 }}>
        {onBack ? (
          <Pressable onPress={onBack} style={{ marginLeft: -4, flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 }}>
            <Icon name="arrowL" size={20} color={idnTokens.green} />
            <Text style={{ color: idnTokens.green, fontSize: 15, fontWeight: '500' }}>Retour</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }} />
        {right}
      </View>
      <Text style={{ fontSize: 30, fontWeight: '700', color: t.ink, letterSpacing: -0.6, lineHeight: 33, marginTop: 4 }}>{title}</Text>
      {sub ? <Text style={{ fontSize: 13, color: t.muted, marginTop: 6, lineHeight: 19 }}>{sub}</Text> : null}
    </View>
  );
}
