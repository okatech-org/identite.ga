import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { NLargeHeader } from '@/components/chrome/large-header';
import { CATEGORIES, POPULAR_SERVICES, type Category } from '@/data/services';

function CategoryIcon({ name, color }: { name: Category['iconName']; color: string }) {
  switch (name) {
    case 'globe':
      return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.6} /><Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke={color} strokeWidth={1.6} /></Svg>;
    case 'user':
      return <Icon name="user" size={18} color={color} />;
    case 'tax':
      return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M6 3h12v18H6z" stroke={color} strokeWidth={1.6} /><Path d="M9 7h6M9 11h6M9 15h6" stroke={color} strokeWidth={1.6} /></Svg>;
    case 'edu':
      return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M3 9l9-4 9 4-9 4-9-4zM7 11v5l5 2 5-2v-5" stroke={color} strokeWidth={1.6} /></Svg>;
    case 'health':
      return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 4v16M4 12h16" stroke={color} strokeWidth={1.6} /></Svg>;
    case 'shield':
      return <Icon name="shield" size={18} color={color} />;
  }
}

export default function Services() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="Services" sub="23 démarches accessibles avec votre IDN" />
      <View style={{ paddingHorizontal: 22, paddingBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
          borderRadius: 12, paddingHorizontal: 14, height: 44,
        }}>
          <Icon name="search" size={18} color={t.muted} />
          <TextInput
            placeholder="Rechercher un service…"
            placeholderTextColor={t.muted}
            style={{ flex: 1, color: t.ink, fontSize: 14, paddingVertical: 0 }}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 18 }}>
          {CATEGORIES.map((cc, i) => (
            <View key={i} style={{ width: '33.3333%', padding: 4 }}>
              <Pressable style={{
                backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
                borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
                alignItems: 'center', gap: 6,
              }}>
                <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <CategoryIcon name={cc.iconName} color={idnTokens.green} />
                </View>
                <Text style={{ fontSize: 11.5, color: t.ink, fontWeight: '500', textAlign: 'center' }}>{cc.k}</Text>
                <Text style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{cc.c}</Text>
              </Pressable>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink, marginBottom: 8 }}>Populaires</Text>
        {POPULAR_SERVICES.map((s, i) => (
          <Pressable key={i} onPress={() => router.push(`/service/${s.id}`)} style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingVertical: 14,
            borderBottomWidth: i === POPULAR_SERVICES.length - 1 ? 0 : 1,
            borderBottomColor: t.borderSoft,
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="doc" size={18} color={t.ink2} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{s.l}</Text>
                {s.b ? (
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999, backgroundColor: idnTokens.green }}>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: '#fff', letterSpacing: 0.5 }}>{s.b}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{s.sub}</Text>
            </View>
            <Icon name="arrow" size={16} color={t.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
