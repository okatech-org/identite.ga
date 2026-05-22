import React, { useState } from 'react';
import { Pressable, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { idnTokens } from '../tokens';
import type { IdnTheme } from '../tokens';

type Variant = 'primary' | 'ghost' | 'quiet' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  t: IdnTheme;
  onPress?: () => void;
  disabled?: boolean;
  full?: boolean;
  leadIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

// Tailles dimensionnées pour des cibles tactiles confortables (Apple HIG 44pt, Material 48dp).
// `md` reste au-dessus du minimum recommandé ; `lg` est calibré pour les CTA principaux.
const sizes = {
  sm: { h: 40, px: 14, fs: idnTokens.text.footnote },
  md: { h: 48, px: 18, fs: idnTokens.text.callout },
  lg: { h: 56, px: 22, fs: idnTokens.text.body },
} as const;

export function IdnButton({ children, variant = 'primary', size = 'md', t, onPress, disabled, full, leadIcon, style }: Props) {
  const [pressed, setPressed] = useState(false);
  const sz = sizes[size];
  const variants = {
    primary: { bg: t.green, fg: '#fff', bd: t.green, hover: t.greenDk },
    ghost:   { bg: 'transparent' as string, fg: t.ink, bd: t.border, hover: t.surface2 },
    quiet:   { bg: 'transparent' as string, fg: t.ink2, bd: 'transparent', hover: t.surface2 },
    danger:  { bg: 'transparent' as string, fg: idnTokens.danger, bd: t.border, hover: 'rgba(184,58,58,0.06)' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        {
          height: sz.h,
          paddingHorizontal: sz.px,
          backgroundColor: pressed && !disabled ? variants.hover : variants.bg,
          borderColor: variants.bd,
          borderWidth: 1,
          borderRadius: 12,
          opacity: disabled ? 0.5 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          alignSelf: full ? 'stretch' : 'flex-start',
          width: full ? '100%' : undefined,
        },
        style,
      ]}
    >
      {leadIcon ? <View>{leadIcon}</View> : null}
      <Text style={{ color: variants.fg, fontSize: sz.fs, fontWeight: '600' }}>{children}</Text>
    </Pressable>
  );
}
