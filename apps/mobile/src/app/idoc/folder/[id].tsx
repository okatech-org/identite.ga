import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS, IDENTITY_DOCS } from '@/data/documents';

export default function FolderDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [confidential] = useState(false);

  const folder = DOC_FOLDERS.find(f => f.id === id) ?? DOC_FOLDERS[0];
  const isIdentity = folder.id === 'identity';
  const docs = isIdentity ? IDENTITY_DOCS : [];

  if (docs.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <NLargeHeader t={t} title={folder.label} sub="0 document" onBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: 22, paddingVertical: 20, justifyContent: 'center' }}>
          <View style={{ paddingVertical: 32, paddingHorizontal: 24, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center' }}>
            <Icon name="folderO" size={48} color={t.mutedSoft} />
            <Text style={{ fontSize: 14, color: t.ink2, fontWeight: '600', marginTop: 12 }}>Aucun document</Text>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 18, textAlign: 'center' }}>
              Glissez vos fichiers ici ou utilisez le bouton d'ajout. L'IA détectera automatiquement le type et rangera le document.
            </Text>
            <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
              <IdnButton t={t} variant="primary" full leadIcon={<Icon name="plus" size={16} color="#fff" />} onPress={() => router.push('/idoc/add' as any)}>
                Ajouter un document
              </IdnButton>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title={folder.label}
        sub={`${docs.length} documents`}
        onBack={() => router.back()}
        right={
          <Pressable style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="more" size={18} color={t.ink2} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 86 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {docs.map(d => (
            <Pressable
              key={d.id}
              onPress={() => router.push(`/idoc/preview/${d.id}` as any)}
              style={{ width: '48.5%', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}
            >
              <View style={{ position: 'relative', aspectRatio: 4 / 3, overflow: 'hidden' }}>
                <LinearGradient colors={folder.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: confidential ? 0.3 : 1 }}>
                  {d.fileType === 'image' ? (
                    <Icon name="camera" size={40} color="rgba(255,255,255,0.85)" />
                  ) : (
                    <View style={{ width: 40, height: 50, backgroundColor: '#fff', borderRadius: 4, padding: 6 }}>
                      <Text style={{ color: idnTokens.green, fontSize: 9, fontWeight: '700' }}>PDF</Text>
                    </View>
                  )}
                </LinearGradient>
                {d.side ? (
                  <View style={{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>{d.side === 'front' ? 'RECTO' : 'VERSO'}</Text>
                  </View>
                ) : null}
                <View style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="shield" size={12} color="#fff" />
                </View>
              </View>
              <View style={{ padding: 10 }}>
                <Text numberOfLines={1} style={{ fontSize: 12, color: t.ink, fontWeight: '600' }}>{d.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft }}>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: idnTokens.green }}>VÉRIFIÉ</Text>
                  </View>
                  {d.expiresIn ? <Text style={{ fontSize: 10, color: t.muted }}>Expire {d.expiresIn}</Text> : null}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <Pressable
        onPress={() => router.push('/idoc/add' as any)}
        style={{ position: 'absolute', right: 16, bottom: insets.bottom + 24, height: 52, paddingHorizontal: 18, borderRadius: 9999, backgroundColor: idnTokens.green, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: idnTokens.green, shadowOpacity: 0.36, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
      >
        <Icon name="plus" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Ajouter</Text>
      </Pressable>
    </View>
  );
}
