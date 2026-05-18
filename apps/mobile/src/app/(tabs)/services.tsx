import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon, type IconName } from '@/design/icons';
import { NLargeHeader } from '@/components/chrome/large-header';
import { api } from '@/lib/api';

type CategoryId =
  | 'administrative' | 'civilStatus' | 'fiscal' | 'education'
  | 'health' | 'transport' | 'social' | 'other';

const CATEGORY_VISUAL: Record<CategoryId, { icon: IconName; svgKey?: 'globe' | 'tax' | 'edu' | 'health' }> = {
  administrative: { icon: 'building', svgKey: 'globe' },
  civilStatus: { icon: 'baby' },
  fiscal: { icon: 'doc', svgKey: 'tax' },
  education: { icon: 'cap', svgKey: 'edu' },
  health: { icon: 'heart', svgKey: 'health' },
  transport: { icon: 'car' },
  social: { icon: 'users' },
  other: { icon: 'sparkles' },
};

function CategoryIcon({ name, color }: { name: 'globe' | 'tax' | 'edu' | 'health' | IconName; color: string }) {
  switch (name) {
    case 'globe':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} />
          <Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case 'tax':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M6 3h12v18H6z" stroke={color} strokeWidth={1.6} />
          <Path d="M9 7h6M9 11h6M9 15h6" stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case 'edu':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M3 9l9-4 9 4-9 4-9-4zM7 11v5l5 2 5-2v-5" stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    case 'health':
      return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4v16M4 12h16" stroke={color} strokeWidth={1.6} />
        </Svg>
      );
    default:
      return <Icon name={name as IconName} size={18} color={color} />;
  }
}

async function openLink(url: string) {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  } catch {
    // ignore
  }
}

export default function Services() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const services = useQuery(api.services.listForCurrentUser, isAuthenticated ? {} : 'skip');
  const categories = useQuery(api.services.listCategories, {});
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<CategoryId | null>(null);

  const counts = useMemo(() => {
    const m = new Map<CategoryId, number>();
    for (const s of services ?? []) m.set(s.category as CategoryId, (m.get(s.category as CategoryId) ?? 0) + 1);
    return m;
  }, [services]);

  const filtered = useMemo(() => {
    if (!services) return [];
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (selectedCat && s.category !== selectedCat) return false;
      if (!q) return true;
      return (
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.appName.toLowerCase().includes(q)
      );
    });
  }, [services, search, selectedCat]);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="Services"
        sub={`${services?.length ?? 0} service${(services?.length ?? 0) > 1 ? 's' : ''} accessible${(services?.length ?? 0) > 1 ? 's' : ''} avec votre IDN`}
      />
      <View style={{ paddingHorizontal: 22, paddingBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
          borderRadius: 12, paddingHorizontal: 14, height: 44,
        }}>
          <Icon name="search" size={18} color={t.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un service…"
            placeholderTextColor={t.muted}
            style={{ flex: 1, color: t.ink, fontSize: 14, paddingVertical: 0 }}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 18 }}>
          {(categories ?? []).map((cc) => {
            const count = counts.get(cc.id as CategoryId) ?? 0;
            const sel = selectedCat === cc.id;
            const visual = CATEGORY_VISUAL[cc.id as CategoryId];
            return (
              <View key={cc.id} style={{ width: '33.3333%', padding: 4 }}>
                <Pressable
                  onPress={() => setSelectedCat(sel ? null : (cc.id as CategoryId))}
                  style={{
                    backgroundColor: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
                    borderWidth: 1,
                    borderColor: sel ? idnTokens.green : t.border,
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 8,
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <CategoryIcon name={(visual.svgKey ?? visual.icon) as never} color={idnTokens.green} />
                  </View>
                  <Text style={{ fontSize: 11.5, color: t.ink, fontWeight: '500', textAlign: 'center' }}>{cc.label}</Text>
                  <Text style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{String(count).padStart(2, '0')}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {services === undefined ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: t.muted }}>Chargement…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Icon name="sparkles" size={32} color={t.mutedSoft} />
            <Text style={{ fontSize: 13, color: t.ink2, fontWeight: '600', marginTop: 12 }}>
              {services.length === 0 ? 'Aucun service disponible' : 'Aucun résultat'}
            </Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 4, textAlign: 'center', maxWidth: 280 }}>
              {services.length === 0
                ? 'Connectez-vous à une application pour faire apparaître ici les services qu\'elle propose.'
                : 'Essayez un autre mot-clé ou une autre catégorie.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink, marginBottom: 8 }}>
              {selectedCat ? categories?.find((c) => c.id === selectedCat)?.label : 'Disponibles pour vous'}
            </Text>
            {filtered.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/service/${encodeURIComponent(s.id)}` as never)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: i === filtered.length - 1 ? 0 : 1,
                  borderBottomColor: t.borderSoft,
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIcon name={(CATEGORY_VISUAL[s.category as CategoryId].svgKey ?? CATEGORY_VISUAL[s.category as CategoryId].icon) as never} color={t.ink2} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }} numberOfLines={1}>{s.label}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }} numberOfLines={1}>{s.appName}</Text>
                </View>
                <Pressable onPress={() => openLink(s.link)} style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Icon name="arrow" size={16} color={t.muted} />
                </Pressable>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
