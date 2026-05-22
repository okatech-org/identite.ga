import React, { useState } from 'react';
import { Pressable, TextInput, View, Text, type KeyboardTypeOptions } from 'react-native';
import { idnTokens } from '../tokens';
import type { IdnTheme } from '../tokens';

type Props = {
  label?: string;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  t: IdnTheme;
  hint?: string;
  error?: string;
  leadIcon?: React.ReactNode;
  suffix?: React.ReactNode;
  autoFocus?: boolean;
  editable?: boolean;
  onPress?: () => void;
  rightAction?: { label: string; onPress: () => void };
};

export function IdnInput({ label, value, onChangeText, placeholder, type = 'text', t, hint, error, leadIcon, suffix, autoFocus, editable = true, onPress, rightAction }: Props) {
  const [focused, setFocused] = useState(false);
  const keyboardType: KeyboardTypeOptions =
    type === 'email' ? 'email-address'
    : type === 'number' ? 'numeric'
    : type === 'tel' ? 'phone-pad'
    : 'default';

  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: error ? idnTokens.danger : focused ? t.green : t.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  };

  const inputContent = (
    <>
      {leadIcon ? <View style={{ opacity: 0.7 }}>{leadIcon}</View> : null}
      {onPress ? (
        <Text style={{ flex: 1, color: value ? t.ink : t.muted, fontSize: idnTokens.text.body }}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.muted}
          autoFocus={autoFocus}
          editable={editable}
          secureTextEntry={type === 'password'}
          keyboardType={keyboardType}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, color: t.ink, fontSize: idnTokens.text.body, paddingVertical: 0, height: '100%' }}
        />
      )}
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} hitSlop={8}>
          <Text style={{ color: t.green, fontSize: idnTokens.text.footnote, fontWeight: '600' }}>{rightAction.label}</Text>
        </Pressable>
      ) : null}
      {suffix}
    </>
  );

  return (
    <View>
      {label ? (
        <Text style={{ fontSize: idnTokens.text.label, fontWeight: '600', color: t.ink, marginBottom: 8 }}>
          {label}
        </Text>
      ) : null}
      {onPress ? (
        <Pressable onPress={onPress} style={containerStyle}>{inputContent}</Pressable>
      ) : (
        <View style={containerStyle}>{inputContent}</View>
      )}
      {(hint || error) ? (
        <Text style={{ fontSize: idnTokens.text.footnote, color: error ? idnTokens.danger : t.muted, marginTop: 8, lineHeight: 18 }}>
          {error || hint}
        </Text>
      ) : null}
    </View>
  );
}
