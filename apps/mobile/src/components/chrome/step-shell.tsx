import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { IdnButton } from '@/design/components/idn-button';

type Props = {
  t: IdnTheme;
  step: number;
  total: number;
  title: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
  primary?: string;
  secondary?: string;
  onBack?: () => void;
  onPrimary?: () => void;
  onSecondary?: () => void;
};

export function NStepShell({ t, step, total, title, sub, children, primary = 'Continuer', secondary, onBack, onPrimary, onSecondary }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={onBack} style={{ padding: 4, marginLeft: -4 }} hitSlop={8}>
          <Icon name="arrowL" size={20} color={idnTokens.green} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', gap: 3 }}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < step ? idnTokens.green : t.border }} />
          ))}
        </View>
        <Text style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono, fontWeight: '600' }}>{step}/{total}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: t.ink, letterSpacing: -0.4, lineHeight: 29 }}>{title}</Text>
          {sub ? (
            typeof sub === 'string'
              ? <Text style={{ fontSize: 13, color: t.muted, marginTop: 8, lineHeight: 20 }}>{sub}</Text>
              : <View style={{ marginTop: 8 }}>{sub}</View>
          ) : null}
        </View>
        {children}
      </ScrollView>
      <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 22), gap: 8 }}>
        <IdnButton t={t} variant="primary" size="lg" full onPress={onPrimary}>{primary}</IdnButton>
        {secondary ? <IdnButton t={t} variant="quiet" size="md" full onPress={onSecondary}>{secondary}</IdnButton> : null}
      </View>
    </View>
  );
}
