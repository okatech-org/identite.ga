import React, { useState } from 'react';
import { TextInput, View, Text, type KeyboardTypeOptions } from 'react-native';
import type { IdnTheme } from '../tokens';

type Props = {
  label?: string;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  t: IdnTheme;
  hint?: string;
  error?: string;
  leadIcon?: React.ReactNode;
  suffix?: React.ReactNode;
  autoFocus?: boolean;
  editable?: boolean;
};

export function IdnInput({ label, value, onChangeText, placeholder, type = 'text', t, hint, error, leadIcon, suffix, autoFocus, editable = true }: Props) {
  const [focused, setFocused] = useState(false);
  const keyboardType: KeyboardTypeOptions = type === 'email' ? 'email-address' : type === 'number' ? 'numeric' : 'default';
  return (
    <View>
      {label ? <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>{label}</Text> : null}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: error ? '#B83A3A' : focused ? t.green : t.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
      }}>
        {leadIcon ? <View style={{ opacity: 0.7 }}>{leadIcon}</View> : null}
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
          style={{ flex: 1, color: t.ink, fontSize: 14, paddingVertical: 0, height: '100%' }}
        />
        {suffix}
      </View>
      {(hint || error) ? (
        <Text style={{ fontSize: 12, color: error ? '#B83A3A' : t.muted, marginTop: 6 }}>{error || hint}</Text>
      ) : null}
    </View>
  );
}
