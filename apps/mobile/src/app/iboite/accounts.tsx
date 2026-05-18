import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { iboiteAccountToUi } from '@/lib/iboite-adapter';

export default function IBoiteAccounts() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const accounts = useQuery(api.iboite.accounts.listMine, isAuthenticated ? {} : 'skip');

  return (
    <Pressable onPress={() => router.back()} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: insets.top + 80, paddingHorizontal: 22 }}>
      <Pressable style={{ backgroundColor: t.surface, borderRadius: 16, padding: 8 }}>
        <Text style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, fontSize: 10, color: t.muted, fontWeight: '600', letterSpacing: 1.2 }}>VOS BOÎTES</Text>
        {accounts === undefined ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: t.muted, fontSize: 12 }}>Chargement…</Text>
          </View>
        ) : accounts.length === 0 ? (
          <View style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: t.muted, fontSize: 12 }}>Aucune boîte active.</Text>
          </View>
        ) : (
          accounts.map((a, i) => {
            const ui = iboiteAccountToUi(a);
            const sel = i === 0;
            return (
              <Pressable
                key={a._id}
                onPress={() => router.back()}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 10 }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden' }}>
                  <LinearGradient colors={ui.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={ui.icon} size={18} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{ui.label}</Text>
                  <Text style={{ fontSize: 11, color: t.muted }}>{ui.email}</Text>
                </View>
                {sel ? <Icon name="check" size={18} color={idnTokens.green} /> : null}
              </Pressable>
            );
          })
        )}
      </Pressable>
    </Pressable>
  );
}
