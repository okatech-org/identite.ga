import React, { useState } from 'react';
import { Pressable, Text, View, type ViewStyle, type StyleProp } from 'react-native';
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

const sizes = {
  sm: { h: 32, px: 12, fs: 13 },
  md: { h: 40, px: 16, fs: 14 },
  lg: { h: 48, px: 20, fs: 15 },
} as const;

export function IdnButton({ children, variant = 'primary', size = 'md', t, onPress, disabled, full, leadIcon, style }: Props) {
  const [pressed, setPressed] = useState(false);
  const sz = sizes[size];
  const variants = {
    primary: { bg: t.green, fg: '#fff', bd: t.green, hover: t.greenDk },
    ghost:   { bg: 'transparent' as string, fg: t.ink, bd: t.border, hover: t.surface2 },
    quiet:   { bg: 'transparent' as string, fg: t.ink2, bd: 'transparent', hover: t.surface2 },
    danger:  { bg: 'transparent' as string, fg: '#B83A3A', bd: t.border, hover: 'rgba(184,58,58,0.06)' },
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
          borderRadius: 8,
          opacity: disabled ? 0.5 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: full ? 'stretch' : 'flex-start',
          width: full ? '100%' : undefined,
        },
        style,
      ]}
    >
      {leadIcon ? <View>{leadIcon}</View> : null}
      <Text style={{ color: variants.fg, fontSize: sz.fs, fontWeight: '500' }}>{children}</Text>
    </Pressable>
  );
}
