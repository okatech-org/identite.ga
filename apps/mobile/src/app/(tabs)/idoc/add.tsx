import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS } from '@/data/documents';

export default function DocAddSelect() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState('identity');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader t={t} title="Ajouter un document" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22 }} showsVerticalScrollIndicator={false}>
        {/* Sélection dossier */}
        <View>
          <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', marginBottom: 8 }}>DOSSIER DE DESTINATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
            {DOC_FOLDERS.slice(0, 6).map(f => {
              const sel = f.id === selected;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setSelected(f.id)}
                  style={{
                    paddingHorizontal: 12,
                    minHeight: 32,
                    backgroundColor: sel ? idnTokens.green : t.surface,
                    borderWidth: 1,
                    borderColor: sel ? idnTokens.green : t.border,
                    borderRadius: 9999,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '500', color: sel ? '#fff' : t.ink2 }}>{f.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={{ fontSize: 11, color: t.muted, marginTop: 8 }}>L'IA peut détecter automatiquement le bon dossier après l'upload.</Text>
        </View>

        {/* Dropzone */}
        <Pressable
          onPress={() => router.push('/idoc/add-preview' as any)}
          style={{
            marginTop: 24,
            paddingVertical: 32,
            paddingHorizontal: 24,
            borderWidth: 1.5,
            borderColor: idnTokens.green,
            borderStyle: 'dashed',
            backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft,
            borderRadius: 16,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View style={{ width: 64, height: 64, borderRadius: 9999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: idnTokens.green, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
            <Icon name="upload" size={22} color={idnTokens.green} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: t.ink, fontWeight: '600' }}>Cliquez pour sélectionner</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>PDF, JPG, PNG · max 10 MB</Text>
          </View>
        </Pressable>

        <View style={{ marginTop: 18 }}>
          <IdnButton t={t} variant="ghost" size="lg" full leadIcon={<Icon name="camera" size={18} color={t.ink} />} onPress={() => router.push('/idoc/add-preview' as any)}>
            Prendre une photo
          </IdnButton>
        </View>
      </ScrollView>
    </View>
  );
}
