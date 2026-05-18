import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { IdnButton } from '@/design/components/idn-button';
import { NStat } from '@/components/rows/stat';
import { E_VISA_DETAIL } from '@/data/services';

export default function ServiceDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const d = E_VISA_DETAIL;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#0E7C3A', '#0A5C2C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top, paddingHorizontal: 22, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14 }}>
          <Pressable onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrowL" size={18} color="#fff" />
          </Pressable>
          <Pressable style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="more" size={18} color="#fff" />
          </Pressable>
        </View>
        <View style={{ marginTop: 30 }}>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#fff', letterSpacing: 0.4 }}>{d.org}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 8, letterSpacing: -0.3 }}>{d.title}</Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 22 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {d.stats.map((st, i) => <NStat key={i} t={t} label={st.label.toUpperCase()} value={st.value} />)}
        </View>
        <Text style={{ fontSize: 13, color: t.ink2, lineHeight: 21, marginTop: 18 }}>{d.description}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink, marginTop: 22, marginBottom: 6 }}>Pièces nécessaires</Text>
        {d.pieces.map((r, i) => (
          <View key={i} style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: t.borderSoft,
          }}>
            <View style={{ width: 24, height: 24, borderRadius: 9999, backgroundColor: r.ok ? idnTokens.green : t.surface2, alignItems: 'center', justifyContent: 'center' }}>
              {r.ok ? <Icon name="check" size={14} color="#fff" /> : <Icon name="plus" size={14} color={t.muted} />}
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: t.ink }}>{r.l}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={{
        paddingHorizontal: 22, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 22),
        borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface,
      }}>
        <IdnButton t={t} variant="primary" size="lg" full>Démarrer la démarche</IdnButton>
      </View>
    </View>
  );
}
