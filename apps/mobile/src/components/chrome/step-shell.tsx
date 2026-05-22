import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller';
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
        <Text style={{ fontSize: idnTokens.text.caption, color: t.muted, fontFamily: idnTokens.mono, fontWeight: '600' }}>{step}/{total}</Text>
      </View>
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 24, gap: 18, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View>
          <Text style={{ fontSize: idnTokens.text.title, fontWeight: '700', color: t.ink, letterSpacing: -0.4, lineHeight: 32 }}>{title}</Text>
          {sub ? (
            typeof sub === 'string'
              ? <Text style={{ fontSize: idnTokens.text.callout, color: t.muted, marginTop: 10, lineHeight: 23 }}>{sub}</Text>
              : <View style={{ marginTop: 10 }}>{sub}</View>
          ) : null}
        </View>
        {children}
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 22), gap: 10, backgroundColor: t.bg, borderTopWidth: 1, borderTopColor: t.borderSoft }}>
          <IdnButton t={t} variant="primary" size="lg" full onPress={onPrimary}>{primary}</IdnButton>
          {secondary ? <IdnButton t={t} variant="quiet" size="md" full onPress={onSecondary}>{secondary}</IdnButton> : null}
        </View>
      </KeyboardStickyView>
    </View>
  );
}
