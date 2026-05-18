import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { Icon, type IconName } from '@/design/icons';

export type NotifType = 'security' | 'document' | 'ai' | 'cv' | 'system';

export const NOTIF_META: Record<NotifType, { c: string; bg: string; dBg: string; icon: IconName }> = {
  security: { c: '#dc2626', bg: '#fee2e2', dBg: 'rgba(220,38,38,0.16)',  icon: 'shield' },
  document: { c: '#2563eb', bg: '#dbeafe', dBg: 'rgba(37,99,235,0.16)',  icon: 'file' },
  ai:       { c: '#16a34a', bg: '#dcfce7', dBg: 'rgba(22,163,74,0.16)',  icon: 'sparkles' },
  cv:       { c: '#9333ea', bg: '#f3e8ff', dBg: 'rgba(147,51,234,0.16)', icon: 'user' },
  system:   { c: '#6b7280', bg: '#f3f4f6', dBg: 'rgba(107,114,128,0.18)',icon: 'bell' },
};

export type NotifLike = {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionLabel?: string;
  onMarkRead?: () => void;
  onAction?: () => void;
};

export function NotifItem({ n, t }: { n: NotifLike; t: IdnTheme }) {
  const meta = NOTIF_META[n.type];
  return (
    <View
      style={{
        position: 'relative',
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: n.read ? 'transparent' : t.surface,
        borderWidth: 1,
        borderColor: n.read ? 'transparent' : t.border,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.dark ? meta.dBg : meta.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={meta.icon} size={22} color={meta.c} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ flex: 1, fontSize: 13, fontWeight: n.read ? '500' : '700', color: n.read ? t.ink2 : t.ink, lineHeight: 17 }}>{n.title}</Text>
          <Text style={{ fontSize: 10, color: t.muted }}>{n.time}</Text>
        </View>
        <Text style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 18 }}>{n.message}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
          {!n.read ? (
            <Pressable onPress={n.onMarkRead} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="check" size={12} color={t.muted} />
              <Text style={{ color: t.muted, fontSize: 11, fontWeight: '500' }}>Marquer comme lu</Text>
            </Pressable>
          ) : null}
          {n.actionLabel ? (
            <Pressable onPress={n.onAction} style={{ marginLeft: n.read ? 'auto' : 0 }}>
              <Text style={{ color: idnTokens.green, fontSize: 11, fontWeight: '700' }}>{n.actionLabel} →</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {!n.read ? (
        <View style={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 9999, backgroundColor: idnTokens.green }} />
      ) : null}
    </View>
  );
}
