import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import type { IdnTheme } from '../tokens';

export function IdnCard({ children, t, style, padded = true }: { children: React.ReactNode; t: IdnTheme; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return (
    <View style={[
      {
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 12,
        padding: padded ? 20 : 0,
      },
      style,
    ]}>
      {children}
    </View>
  );
}
