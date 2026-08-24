import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { idnTokens } from '../tokens';
import type { IdnTheme } from '../tokens';

export function Toggle({ on, onChange, t }: { on: boolean; onChange?: (v: boolean) => void; t: IdnTheme }) {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: on ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [on, anim]);
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 14] });
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [t.border, idnTokens.green] }) as any;
  return (
    <Pressable onPress={() => onChange?.(!on)} hitSlop={8}>
      <Animated.View style={{ width: 32, height: 18, borderRadius: 9999, backgroundColor: bg, justifyContent: 'center' }}>
        <Animated.View style={{ width: 14, height: 14, borderRadius: 9999, backgroundColor: '#fff', position: 'absolute', left }} />
      </Animated.View>
    </Pressable>
  );
}
