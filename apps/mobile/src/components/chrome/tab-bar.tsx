import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { Icon, type IconName } from '@/design/icons';

const TABS: { id: string; label: string; icon: IconName }[] = [
  { id: 'home',     label: 'Accueil',    icon: 'home' },
  { id: 'services', label: 'Services',   icon: 'grid' },
  { id: 'idoc',     label: 'iDocument',  icon: 'file' },
  { id: 'profile',  label: 'Profil',     icon: 'user' },
];

export function NTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{
      paddingBottom: Math.max(insets.bottom, 8),
      borderTopWidth: 1,
      borderTopColor: t.borderSoft,
      backgroundColor: t.surface,
      flexDirection: 'row',
    }}>
      {state.routes.map((route, idx) => {
        const meta = TABS.find(tb => tb.id === route.name);
        if (!meta) return null;
        const sel = state.index === idx;
        const color = sel ? idnTokens.green : t.muted;
        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!sel && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, paddingTop: 10, paddingBottom: 4, alignItems: 'center', gap: 4 }}
          >
            <Icon name={meta.icon} size={22} color={color} />
            <Text style={{ fontSize: 10.5, fontWeight: sel ? '600' : '500', color }}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
