import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { LANGUAGES } from '@/data/languages';

export default function SettingsLanguage() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const prefs = useQuery(api.preferences.getMyPreferences, isAuthenticated ? {} : 'skip');
  const update = useMutation(api.preferences.updateMyPreferences);
  const [error, setError] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState<string | null>(null);

  const selectedId = prefs?.language ?? 'fr';

  async function choose(id: string) {
    if (id !== 'fr' && id !== 'en') return; // langues activées uniquement
    if (id === selectedId) return;
    setUpdating(id);
    setError(null);
    try {
      await update({ language: id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mise à jour impossible.');
    } finally {
      setUpdating(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="Langue" sub="L'interface, les emails et les SMS s'adapteront." onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 22 }}>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          {LANGUAGES.map((o, i) => {
            const sel = o.id === selectedId;
            const isUpdating = updating === o.id;
            return (
              <Pressable
                key={o.id}
                disabled={o.dis || isUpdating}
                onPress={() => choose(o.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  padding: 14,
                  borderBottomWidth: i === LANGUAGES.length - 1 ? 0 : 1,
                  borderBottomColor: t.borderSoft,
                  opacity: o.dis ? 0.45 : 1,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: t.ink, fontWeight: '500' }}>{o.l}</Text>
                  <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{o.sub}</Text>
                </View>
                {isUpdating ? (
                  <Text style={{ fontSize: 11, color: t.muted }}>…</Text>
                ) : sel ? (
                  <Icon name="check" size={20} color={idnTokens.green} />
                ) : (
                  <View style={{ width: 20, height: 20, borderRadius: 9999, borderWidth: 1.5, borderColor: t.border }} />
                )}
              </Pressable>
            );
          })}
        </View>
        {error ? (
          <View style={{ marginTop: 12, backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
            <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
