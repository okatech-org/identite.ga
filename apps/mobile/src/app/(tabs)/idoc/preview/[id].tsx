import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS } from '@/data/documents';

const DETAILS: { l: string; v: string; mono?: boolean; accent?: boolean }[] = [
  { l: 'Type',       v: 'Identité' },
  { l: 'Numéro',     v: 'GA-1234-5678-9012', mono: true },
  { l: 'Délivré le', v: '12/03/2022' },
  { l: 'Expire le',  v: '12/03/2030', accent: true },
  { l: 'Autorité',   v: 'DGDI' },
  { l: 'Taille',     v: '2.4 MB' },
  { l: 'Source',     v: 'Upload' },
];

export default function DocPreview() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const folder = DOC_FOLDERS[0];

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <View style={{ width: 38, height: 4, borderRadius: 9999, backgroundColor: t.borderSoft }} />
      </View>
      <View style={{ paddingHorizontal: 22, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
        <Text style={{ fontSize: 15, color: t.ink, fontWeight: '700' }}>CNI · Recto</Text>
        <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Identité · 12 mai 2026</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingVertical: 14 }} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={{ aspectRatio: 85 / 55, borderRadius: 14, overflow: 'hidden' }}>
          <LinearGradient colors={folder.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <Icon name="camera" size={56} color="rgba(255,255,255,0.85)" />
            <View style={{ position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>RECTO</Text>
            </View>
            <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8 }}>
              <Icon name="shield" size={12} color="#22c55e" />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#fff', letterSpacing: 0.8 }}>DOCUMENT VÉRIFIÉ</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Métadonnées */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', marginBottom: 8 }}>DÉTAILS</Text>
          <View style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 14 }}>
            {DETAILS.map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i === DETAILS.length - 1 ? 0 : 1, borderBottomColor: t.borderSoft }}>
                <Text style={{ fontSize: 12, color: t.muted }}>{r.l}</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: r.accent ? idnTokens.green : t.ink, fontFamily: r.mono ? idnTokens.mono : undefined }}>{r.v}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 22), borderTopWidth: 1, borderTopColor: t.borderSoft, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <IdnButton t={t} variant="ghost" full leadIcon={<Icon name="download" size={16} color={t.ink} />}>Télécharger</IdnButton>
        </View>
        <View style={{ flex: 1 }}>
          <IdnButton t={t} variant="danger" full leadIcon={<Icon name="trash" size={16} color="#B83A3A" />} onPress={() => router.back()}>Supprimer</IdnButton>
        </View>
      </View>
    </View>
  );
}
