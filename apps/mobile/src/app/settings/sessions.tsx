import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';

type Session = {
  id: string;
  device: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: number;
  expiresAt: number;
  isCurrent: boolean;
};

function relative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return 'Active maintenant';
  if (diff < 60_000) return 'Il y a un instant';
  if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)} h`;
  return `Il y a ${Math.floor(diff / 86_400_000)} j`;
}

export default function SettingsSessions() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const sessions = useQuery(api.sessions.listMine, isAuthenticated ? {} : 'skip') as Session[] | undefined;
  const revoke = useMutation(api.sessions.revoke);
  const revokeAllOthers = useMutation(api.sessions.revokeAllOthers);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke(s: Session) {
    if (s.isCurrent || revoking) return;
    Alert.alert(
      'Révoquer cette session ?',
      `Déconnecter ${s.device}. Cette action ne peut être annulée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            setRevoking(s.id);
            setError(null);
            try {
              await revoke({ sessionId: s.id });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Révocation impossible.');
            } finally {
              setRevoking(null);
            }
          },
        },
      ],
    );
  }

  async function handleRevokeAllOthers() {
    Alert.alert(
      'Déconnecter tous les autres appareils ?',
      'Toutes les autres sessions seront immédiatement déconnectées. Vous resterez connecté sur cet appareil.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter tout',
          style: 'destructive',
          onPress: async () => {
            setRevoking('all');
            setError(null);
            try {
              await revokeAllOthers({});
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Révocation impossible.');
            } finally {
              setRevoking(null);
            }
          },
        },
      ],
    );
  }

  const count = sessions?.length ?? 0;
  const others = sessions?.filter((s) => !s.isCurrent) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Appareils & sessions"
        sub={count > 0 ? `${count} session${count > 1 ? 's' : ''} active${count > 1 ? 's' : ''} sur votre compte.` : 'Chargement…'}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 22 }}>
        {sessions === undefined ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={{ marginBottom: 10, height: 80, borderRadius: 14, backgroundColor: t.surface2 }} />
          ))
        ) : sessions.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 40, gap: 10 }}>
            <Icon name="shield" size={32} color={t.muted} />
            <Text style={{ color: t.muted, fontSize: 13, textAlign: 'center' }}>Aucune session active.</Text>
          </View>
        ) : (
          sessions.map((s) => (
            <View key={s.id} style={{
              flexDirection: 'row', gap: 14, padding: 14,
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 14, marginBottom: 10,
            }}>
              <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="shield" size={18} color={t.ink2} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 13, color: t.ink, fontWeight: '600' }}>{s.device}</Text>
                  {s.isCurrent ? (
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999, backgroundColor: t.dark ? '#0A1F11' : idnTokens.greenSoft }}>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: idnTokens.green }}>CET APPAREIL</Text>
                    </View>
                  ) : null}
                </View>
                {s.ipAddress ? (
                  <Text style={{ fontSize: 11, color: t.muted, marginTop: 3, fontFamily: idnTokens.mono }}>{s.ipAddress}</Text>
                ) : null}
                <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{relative(s.createdAt)}</Text>
                {!s.isCurrent ? (
                  <Pressable onPress={() => handleRevoke(s)} style={{ marginTop: 8 }} disabled={revoking !== null}>
                    <Text style={{ color: '#B83A3A', fontSize: 12, fontWeight: '500' }}>
                      {revoking === s.id ? 'Révocation…' : 'Révoquer cette session'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))
        )}
        {error ? (
          <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
          </View>
        ) : null}
        {others.length > 0 ? (
          <Pressable onPress={handleRevokeAllOthers} style={{
            padding: 14, backgroundColor: 'transparent',
            borderWidth: 1, borderColor: t.border, borderRadius: 12,
            alignItems: 'center',
          }} disabled={revoking !== null}>
            <Text style={{ color: '#B83A3A', fontWeight: '500', fontSize: 13 }}>
              {revoking === 'all' ? 'Déconnexion…' : 'Déconnecter tous les autres appareils'}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}
