import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';

export default function DocAddPreview() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader
        t={t}
        title="Confirmer"
        onBack={() => router.back()}
        right={<Pressable onPress={() => router.back()} style={{ padding: 4 }}><Icon name="close" size={18} color="#B83A3A" /></Pressable>}
      />
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22, gap: 18 }}>
        {/* Aperçu */}
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ width: 60, height: 76, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: idnTokens.green, fontSize: 11, fontWeight: '700' }}>PDF</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: t.ink, fontWeight: '600' }}>cni_recto_aissatou.pdf</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>1.24 MB</Text>
          </View>
        </View>

        {/* Détection IA */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, backgroundColor: 'rgba(168,85,247,0.04)', borderWidth: 1, borderColor: t.dark ? '#3a1f5a' : '#e9d5ff', borderRadius: 12 }}>
          <View style={{ marginTop: 2 }}>
            <Icon name="sparkles" size={14} color="#a855f7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: '#a855f7', fontWeight: '600' }}>Détection IA</Text>
            <Text style={{ fontSize: 11, color: t.ink2, marginTop: 2, lineHeight: 17 }}>
              Type : <Text style={{ fontWeight: '700' }}>Identité (recto)</Text> · Dossier suggéré : <Text style={{ fontWeight: '700' }}>Identité</Text>
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <IdnButton t={t} variant="primary" size="lg" full onPress={() => router.replace('/idoc/add-success' as any)}>
          Confirmer l'envoi
        </IdnButton>
      </View>
    </View>
  );
}
