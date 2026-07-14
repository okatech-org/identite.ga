import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { NotifItem, type NotifType, type NotifLike } from '@/components/notif/notif-item';

type Notif = {
  _id: string;
  channel: string;
  category: 'security' | 'kyc' | 'consent' | 'comms';
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  readAt?: number | null;
  sentAt?: number | null;
  createdAt: number;
};

type Filter = 'all' | 'unread' | 'security' | 'document';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',      label: 'Tout' },
  { id: 'unread',   label: 'Non lu' },
  { id: 'security', label: 'Sécurité' },
  { id: 'document', label: 'Documents' },
];

const CATEGORY_TO_TYPE: Record<Notif['category'], NotifType> = {
  security: 'security',
  kyc:      'cv',
  consent:  'document',
  comms:    'system',
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;
  if (ts >= today) {
    const diffMin = Math.floor((now.getTime() - ts) / 60_000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    return `Il y a ${diffH} h`;
  }
  if (ts >= yesterday) return 'Hier';
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
}

function dayBucket(ts: number): 'today' | 'yesterday' | 'older' {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86_400_000;
  if (ts >= today) return 'today';
  if (ts >= yesterday) return 'yesterday';
  return 'older';
}

export default function Notifications() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const { isAuthenticated } = useConvexAuth();
  const rows = useQuery(api.notifications.listMine, isAuthenticated ? { limit: 100 } : 'skip') as Notif[] | undefined;
  const markAllRead = useMutation(api.notifications.markAllRead);
  const markRead = useMutation(api.notifications.markRead);
  const clearAll = useMutation(api.notifications.clearAll);

  async function handleMarkAll() {
    try { await markAllRead({}); } catch { /* ignore */ }
  }
  async function handleMarkOne(id: string) {
    try { await markRead({ notificationId: id as any }); } catch { /* ignore */ }
  }
  function handleClearAll() {
    if (total === 0) return;
    Alert.alert(
      'Effacer les notifications ?',
      'Toutes vos notifications seront supprimées. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try { await clearAll({}); } catch {
              Alert.alert('Erreur', 'Suppression impossible. Réessayez.');
            }
          },
        },
      ],
    );
  }

  const filtered = React.useMemo(() => {
    if (!rows) return undefined;
    return rows.filter(n => {
      const type = CATEGORY_TO_TYPE[n.category] ?? 'system';
      if (filter === 'all') return true;
      if (filter === 'unread') return !n.readAt;
      if (filter === 'security') return type === 'security';
      if (filter === 'document') return type === 'document';
      return true;
    });
  }, [rows, filter]);

  const todayItems = (filtered ?? []).filter(n => dayBucket(n.createdAt) === 'today');
  const yesterdayItems = (filtered ?? []).filter(n => dayBucket(n.createdAt) === 'yesterday');
  const olderItems = (filtered ?? []).filter(n => dayBucket(n.createdAt) === 'older');

  const unreadCount = (rows ?? []).filter(n => !n.readAt).length;
  const total = (rows ?? []).length;

  function toItem(n: Notif): NotifLike {
    return {
      id: n._id,
      type: CATEGORY_TO_TYPE[n.category] ?? 'system',
      title: n.title,
      message: n.body,
      time: formatTime(n.createdAt),
      read: !!n.readAt,
      onMarkRead: () => handleMarkOne(n._id),
    };
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="arrowL" size={20} color={t.ink2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: t.ink, letterSpacing: -0.4, lineHeight: 24 }}>Notifications</Text>
          <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Text>
        </View>
        <Pressable
          onPress={handleMarkAll}
          style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="check" size={18} color={t.ink2} />
        </Pressable>
        <Pressable
          onPress={handleClearAll}
          disabled={total === 0}
          style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center', opacity: total === 0 ? 0.4 : 1 }}
        >
          <Icon name="trash" size={18} color={t.ink2} />
        </Pressable>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 6, paddingVertical: 8 }}>
        {FILTERS.map(f => {
          const sel = f.id === filter;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={{
                paddingHorizontal: 14,
                minHeight: 32,
                backgroundColor: sel ? idnTokens.green : t.surface,
                borderWidth: 1,
                borderColor: sel ? idnTokens.green : t.border,
                borderRadius: 9999,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '600', color: sel ? '#fff' : t.ink2, letterSpacing: 0.2 }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Liste */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: insets.bottom + 22 }} showsVerticalScrollIndicator={false}>
        {filtered === undefined ? (
          [0, 1, 2].map(i => (
            <View key={i} style={{ marginTop: 14, height: 78, borderRadius: 14, backgroundColor: t.surface2 }} />
          ))
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 60, paddingHorizontal: 20, alignItems: 'center', opacity: 0.6 }}>
            <Icon name="bell" size={48} color={t.mutedSoft} />
            <Text style={{ fontSize: 14, color: t.ink2, fontWeight: '600', marginTop: 12 }}>Aucune notification</Text>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Vous êtes à jour !</Text>
          </View>
        ) : (
          <>
            {todayItems.length > 0 ? (
              <View>
                <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '700', paddingHorizontal: 4, paddingTop: 10, paddingBottom: 6 }}>AUJOURD'HUI</Text>
                <View style={{ gap: 8 }}>
                  {todayItems.map(n => <NotifItem key={n._id} n={toItem(n)} t={t} />)}
                </View>
              </View>
            ) : null}
            {yesterdayItems.length > 0 ? (
              <View>
                <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '700', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 6 }}>HIER</Text>
                <View style={{ gap: 8 }}>
                  {yesterdayItems.map(n => <NotifItem key={n._id} n={toItem(n)} t={t} />)}
                </View>
              </View>
            ) : null}
            {olderItems.length > 0 ? (
              <View>
                <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '700', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 6 }}>PLUS ANCIEN</Text>
                <View style={{ gap: 8 }}>
                  {olderItems.map(n => <NotifItem key={n._id} n={toItem(n)} t={t} />)}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
