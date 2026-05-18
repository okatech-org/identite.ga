import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { FolderCard } from '@/components/documents/folder-card';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS } from '@/data/documents';
import { api } from '@/lib/api';

export default function IDocHome() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const summary = useQuery(api.vault.folders.summary, {});
  const [confidential, setConfidential] = useState(false);
  const [search, setSearch] = useState('');

  const countsById = new Map(summary?.map((s) => [s.folderId as string, s]) ?? []);
  const folders = DOC_FOLDERS.map((f) => ({
    ...f,
    count: countsById.get(f.id)?.count ?? 0,
    hasExpiring: countsById.get(f.id)?.hasExpiring ?? false,
  }));
  const totalItems = folders.reduce((sum, f) => sum + f.count, 0);
  const filledFolders = folders.filter((f) => f.count > 0).length;
  const filteredFolders = search
    ? folders.filter((f) => f.label.toLowerCase().includes(search.toLowerCase()))
    : folders;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="iDocument"
        sub={`${totalItems} document${totalItems > 1 ? 's' : ''} · ${filledFolders} dossier${filledFolders > 1 ? 's' : ''}`}
        onBack={() => router.back()}
        right={
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              onPress={() => setConfidential((c) => !c)}
              style={{
                width: 36, height: 36, borderRadius: 9999,
                backgroundColor: confidential ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
                borderWidth: 1,
                borderColor: confidential ? (t.dark ? '#1B3F2A' : '#C5E0CC') : t.border,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name={confidential ? 'eyeOff' : 'eye'} size={18} color={confidential ? idnTokens.green : t.ink2} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/notifications')}
              style={{ position: 'relative', width: 36, height: 36, borderRadius: 9999, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="bell" size={18} color={t.ink2} />
            </Pressable>
          </View>
        }
      />
      <View style={{ marginHorizontal: 22, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, backgroundColor: 'rgba(126,34,206,0.04)', borderWidth: 1, borderColor: t.dark ? '#3a1f5a' : '#e9d5ff' }}>
        <Icon name="sparkles" size={14} color="#a855f7" />
        <Text style={{ fontSize: 11, color: '#a855f7', fontWeight: '600' }}>IA Active</Text>
        <Text style={{ flex: 1, fontSize: 11, color: t.muted }}>Détection automatique du type & du dossier</Text>
      </View>

      <View style={{ paddingHorizontal: 22, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14, height: 44 }}>
          <Icon name="search" size={18} color={t.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un dossier…"
            placeholderTextColor={t.muted}
            style={{ flex: 1, fontSize: 13, color: t.ink }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 86 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {filteredFolders.map((f, i) => (
            <View key={f.id} style={{ width: '48.5%' }}>
              <FolderCard f={f} t={t} opened={i === 0} onPress={() => router.push(`/idoc/folder/${f.id}` as never)} />
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={() => router.push('/idoc/add' as never)}
        style={{ position: 'absolute', right: 16, bottom: insets.bottom + 24, height: 52, paddingHorizontal: 18, borderRadius: 9999, backgroundColor: idnTokens.green, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: idnTokens.green, shadowOpacity: 0.36, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
      >
        <Icon name="plus" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Ajouter</Text>
      </Pressable>
    </View>
  );
}
