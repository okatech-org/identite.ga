import React from 'react';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS } from '@/data/documents';
import { api } from '@/lib/api';

export default function DocPreview() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useConvexAuth();
  const item = useQuery(api.idoc.get, isAuthenticated && id ? { itemId: id as never } : 'skip');
  const downloadUrl = useQuery(
    api.idoc.getDownloadUrl,
    isAuthenticated && id ? { itemId: id as never } : 'skip',
  );
  const removeItem = useMutation(api.idoc.remove);

  const folder = item ? DOC_FOLDERS.find((f) => f.id === item.folderId) ?? DOC_FOLDERS[0] : DOC_FOLDERS[0];
  const name = item?.name ?? item?.originalName ?? '—';

  async function onDelete() {
    Alert.alert('Supprimer', `Confirmer la suppression de « ${name} » ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItem({ itemId: id as never });
            router.back();
          } catch (err) {
            Alert.alert('Erreur', err instanceof Error ? err.message : 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  if (item === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, backgroundColor: t.surface, padding: 22, justifyContent: 'center', alignItems: 'center' }}>
        <Icon name="folderO" size={40} color={t.mutedSoft} />
        <Text style={{ color: t.muted, fontSize: 13, marginTop: 10 }}>Document introuvable.</Text>
      </View>
    );
  }

  const createdLabel = new Date(item.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const sizeKb = Math.max(1, Math.round(item.fileSize / 1024));

  const details: { l: string; v: string; mono?: boolean; accent?: boolean }[] = [
    { l: 'Dossier', v: folder.label },
    { l: 'Type', v: item.fileType.toUpperCase() },
    { l: 'Ajouté le', v: createdLabel },
    { l: 'Taille', v: `${sizeKb} KB` },
    { l: 'Statut', v: item.status === 'verified' ? 'Vérifié' : item.status === 'pending' ? 'En attente' : item.status, accent: item.status === 'verified' },
  ];
  if (item.expirationDate) {
    details.push({ l: 'Expire le', v: item.expirationDate, accent: true });
  }
  if (item.side) {
    details.push({ l: 'Face', v: item.side === 'front' ? 'Recto' : 'Verso' });
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <View style={{ width: 38, height: 4, borderRadius: 9999, backgroundColor: t.borderSoft }} />
      </View>
      <View style={{ paddingHorizontal: 22, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
        <Text style={{ fontSize: 15, color: t.ink, fontWeight: '700' }}>{name}</Text>
        <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{folder.label} · {createdLabel}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingVertical: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ aspectRatio: 85 / 55, borderRadius: 14, overflow: 'hidden' }}>
          <LinearGradient colors={folder.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            {item.fileType === 'image' ? (
              <Icon name="camera" size={56} color="rgba(255,255,255,0.85)" />
            ) : (
              <View style={{ width: 64, height: 80, backgroundColor: '#fff', borderRadius: 6, padding: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: idnTokens.green, fontSize: 14, fontWeight: '700' }}>{item.fileType === 'pdf' ? 'PDF' : 'DOC'}</Text>
              </View>
            )}
            {item.side ? (
              <View style={{ position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 }}>{item.side === 'front' ? 'RECTO' : 'VERSO'}</Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>

        <View style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', marginBottom: 8 }}>DÉTAILS</Text>
          <View style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 14 }}>
            {details.map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i === details.length - 1 ? 0 : 1, borderBottomColor: t.borderSoft }}>
                <Text style={{ fontSize: 12, color: t.muted }}>{r.l}</Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: r.accent ? idnTokens.green : t.ink, fontFamily: r.mono ? idnTokens.mono : undefined }}>{r.v}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 22), borderTopWidth: 1, borderTopColor: t.borderSoft, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <IdnButton
            t={t}
            variant="ghost"
            full
            leadIcon={<Icon name="download" size={16} color={t.ink} />}
            disabled={!downloadUrl}
            onPress={() => {
              if (downloadUrl) void Linking.openURL(downloadUrl);
            }}
          >
            Télécharger
          </IdnButton>
        </View>
        <View style={{ flex: 1 }}>
          <IdnButton t={t} variant="danger" full leadIcon={<Icon name="trash" size={16} color="#B83A3A" />} onPress={onDelete}>
            Supprimer
          </IdnButton>
        </View>
      </View>
    </View>
  );
}
