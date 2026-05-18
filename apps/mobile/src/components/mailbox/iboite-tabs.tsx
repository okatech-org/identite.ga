import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { Icon, type IconName } from '@/design/icons';

export type IBoiteTab = 'courriers' | 'colis' | 'emails';

const TABS: { id: IBoiteTab; label: string; icon: IconName; badge: number; color: string }[] = [
  { id: 'courriers', label: 'Courriers', icon: 'mail2',   badge: 2, color: '#3b82f6' },
  { id: 'colis',     label: 'Colis',     icon: 'package', badge: 1, color: '#f59e0b' },
  { id: 'emails',    label: 'eMails',    icon: 'chat',    badge: 2, color: '#10b981' },
];

export function IBoiteTabs({ t, active, onChange }: { t: IdnTheme; active: IBoiteTab; onChange?: (id: IBoiteTab) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4 }}>
      {TABS.map(tb => {
        const sel = tb.id === active;
        return (
          <Pressable
            key={tb.id}
            onPress={() => onChange?.(tb.id)}
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 6,
              backgroundColor: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : 'transparent',
              borderWidth: 1,
              borderColor: sel ? (t.dark ? '#1B3F2A' : '#C5E0CC') : t.border,
              borderRadius: 10,
              alignItems: 'center',
              gap: 4,
            }}
          >
            <View>
              <Icon name={tb.icon} size={18} color={sel ? idnTokens.green : tb.color} />
              {tb.badge > 0 ? (
                <View style={{ position: 'absolute', top: -4, right: -8, minWidth: 14, height: 14, paddingHorizontal: 4, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{tb.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontSize: 11, fontWeight: sel ? '600' : '500', color: sel ? idnTokens.green : t.ink2 }}>{tb.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
