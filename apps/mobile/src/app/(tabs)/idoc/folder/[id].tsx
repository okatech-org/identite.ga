import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS } from '@/data/documents';
import { api } from '@/lib/api';
import { useDecryptedItems } from '@/hooks/use-vault';

type VaultFolderId =
  | 'identity' | 'civil_status' | 'residence' | 'education'
  | 'work' | 'health' | 'vehicle' | 'other';

export default function FolderDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const folderId = (id ?? 'identity') as VaultFolderId;
  const items = useQuery(api.vault.items.listByFolder, { folderId });
  const removeItem = useMutation(api.vault.items.remove);
  const decoded = useDecryptedItems(items);

  const folder = DOC_FOLDERS.find((f) => f.id === folderId) ?? DOC_FOLDERS[0];

  async function onDelete(itemId: string, label: string) {
    Alert.alert('Supprimer', `Confirmer la suppression de « ${label} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItem({ itemId: itemId as never });
          } catch (err) {
            Alert.alert('Erreur', err instanceof Error ? err.message : 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  if (decoded === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }

  if (decoded.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <NLargeHeader t={t} title={folder.label} sub="0 document" onBack={() => router.back()} />
        <View style={{ flex: 1, paddingHorizontal: 22, paddingVertical: 20, justifyContent: 'center' }}>
          <View style={{ paddingVertical: 32, paddingHorizontal: 24, borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center' }}>
            <Icon name="folderO" size={48} color={t.mutedSoft} />
            <Text style={{ fontSize: 14, color: t.ink2, fontWeight: '600', marginTop: 12 }}>Aucun document</Text>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 4, lineHeight: 18, textAlign: 'center' }}>
              Ajoutez votre premier document à ce dossier. Il sera chiffré sur votre appareil avant l'envoi.
            </Text>
            <View style={{ alignSelf: 'stretch', marginTop: 18 }}>
              <IdnButton
                t={t}
                variant="primary"
                full
                leadIcon={<Icon name="plus" size={16} color="#fff" />}
                onPress={() => router.push(`/idoc/add?folder=${folderId}` as never)}
              >
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
        sub={`${decoded.length} document${decoded.length > 1 ? 's' : ''}`}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 86 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {decoded.map((d) => {
            const meta = d.metadata as { name?: string; expiresIn?: string } | null;
            const name = meta?.name ?? '—';
            return (
              <Pressable
                key={d._id}
                onPress={() => router.push(`/idoc/preview/${d._id}` as never)}
                onLongPress={() => onDelete(d._id, name)}
                style={{ width: '48.5%', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, overflow: 'hidden' }}
              >
                <View style={{ position: 'relative', aspectRatio: 4 / 3, overflow: 'hidden' }}>
                  <LinearGradient colors={folder.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    {d.fileType === 'image' ? (
                      <Icon name="camera" size={40} color="rgba(255,255,255,0.85)" />
                    ) : (
                      <View style={{ width: 40, height: 50, backgroundColor: '#fff', borderRadius: 4, padding: 6 }}>
                        <Text style={{ color: idnTokens.green, fontSize: 9, fontWeight: '700' }}>
                          {d.fileType === 'pdf' ? 'PDF' : 'DOC'}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                  {d.side ? (
                    <View style={{ position: 'absolute', top: 8, left: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>{d.side === 'front' ? 'RECTO' : 'VERSO'}</Text>
                    </View>
                  ) : null}
                  <View style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 9999, backgroundColor: d.status === 'verified' ? idnTokens.green : t.muted, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="shield" size={12} color="#fff" />
                  </View>
                </View>
                <View style={{ padding: 10 }}>
                  <Text numberOfLines={1} style={{ fontSize: 12, color: t.ink, fontWeight: '600' }}>{name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft }}>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: idnTokens.green }}>
                        {d.status === 'verified' ? 'VÉRIFIÉ' : d.status === 'pending' ? 'EN ATTENTE' : d.status.toUpperCase()}
                      </Text>
                    </View>
                    {d.expirationDate ? (
                      <Text style={{ fontSize: 10, color: t.muted }}>Expire {d.expirationDate}</Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Pressable
        onPress={() => router.push(`/idoc/add?folder=${folderId}` as never)}
        style={{ position: 'absolute', right: 16, bottom: insets.bottom + 24, height: 52, paddingHorizontal: 18, borderRadius: 9999, backgroundColor: idnTokens.green, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: idnTokens.green, shadowOpacity: 0.36, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
      >
        <Icon name="plus" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Ajouter</Text>
      </Pressable>
    </View>
  );
}
