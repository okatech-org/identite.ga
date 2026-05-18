import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { Icon } from '@/design/icons';
import { DOC_FOLDERS } from '@/data/documents';
import { api } from '@/lib/api';
import { useVault } from '@/hooks/use-vault';
import { encryptFile } from '@/lib/vault-crypto';

type VaultFolderId =
  | 'identity' | 'civil_status' | 'residence' | 'education'
  | 'work' | 'health' | 'vehicle' | 'other';

const FOLDERS: VaultFolderId[] = [
  'identity', 'civil_status', 'residence', 'education',
  'work', 'health', 'vehicle', 'other',
];

async function pickFile(): Promise<{ name: string; mime: string; bytes: Uint8Array; fileType: 'image' | 'pdf' | 'other' } | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.onchange = async () => {
        const f = input.files?.[0];
        if (!f) {
          resolve(null);
          return;
        }
        const buf = new Uint8Array(await f.arrayBuffer());
        const mime = f.type || 'application/octet-stream';
        const fileType: 'image' | 'pdf' | 'other' = mime.startsWith('image/')
          ? 'image'
          : mime === 'application/pdf' ? 'pdf' : 'other';
        resolve({ name: f.name, mime, bytes: buf, fileType });
      };
      input.click();
    });
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.85,
    base64: true,
  });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  if (!asset.base64) return null;
  const bin = atob(asset.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return {
    name: asset.fileName ?? 'photo.jpg',
    mime: asset.mimeType ?? 'image/jpeg',
    bytes,
    fileType: 'image',
  };
}

export default function DocAddSelect() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ folder?: string }>();
  const { status } = useVault();
  const generateUrl = useMutation(api.vault.items.generateUploadUrl);
  const createItem = useMutation(api.vault.items.create);

  const initialFolder = (params.folder as VaultFolderId) || 'identity';
  const [selected, setSelected] = useState<VaultFolderId>(initialFolder);
  const [name, setName] = useState('');
  const [expiration, setExpiration] = useState('');
  const [picked, setPicked] = useState<Awaited<ReturnType<typeof pickFile>>>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onPick() {
    try {
      const f = await pickFile();
      if (!f) return;
      setPicked(f);
      if (!name) setName(f.name);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Sélection impossible.');
    }
  }

  async function submit() {
    if (submitting) return;
    if (status.phase !== 'unlocked') {
      Alert.alert('Vault verrouillé', 'Déverrouillez le coffre-fort d\'abord.');
      return;
    }
    if (!picked) {
      Alert.alert('Aucun fichier', 'Sélectionnez un fichier à ajouter.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Donnez un nom à ce document.');
      return;
    }
    if (expiration && !/^\d{4}-\d{2}-\d{2}$/.test(expiration)) {
      Alert.alert('Date invalide', 'Format attendu : AAAA-MM-JJ');
      return;
    }
    setSubmitting(true);
    try {
      const enc = await encryptFile(status.mvk, picked.bytes, {
        name: name.trim(),
        originalName: picked.name,
        mimeType: picked.mime,
      });

      const uploadUrl = await generateUrl({});
      const blob = new Blob([enc.ciphertext as unknown as BlobPart], { type: 'application/octet-stream' });
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error(`Upload échoué (${uploadRes.status})`);
      const { storageId } = (await uploadRes.json()) as { storageId: string };

      await createItem({
        folderId: selected,
        contentRef: storageId as never,
        encryptedMetadata: enc.encryptedMetadata,
        wrappedDek: enc.wrappedDek,
        iv: enc.iv,
        metaIv: enc.metaIv,
        fileType: picked.fileType,
        fileSize: picked.bytes.length,
        expirationDate: expiration || undefined,
      });

      router.replace('/idoc/add-success' as never);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Ajout impossible.');
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader t={t} title="Ajouter un document" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22 }} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', marginBottom: 8 }}>DOSSIER DE DESTINATION</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
            {FOLDERS.map((fid) => {
              const f = DOC_FOLDERS.find((x) => x.id === fid)!;
              const sel = fid === selected;
              return (
                <Pressable
                  key={fid}
                  onPress={() => setSelected(fid)}
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
        </View>

        <Pressable
          onPress={onPick}
          style={{
            marginTop: 22,
            paddingVertical: 28,
            paddingHorizontal: 24,
            borderWidth: 1.5,
            borderColor: idnTokens.green,
            borderStyle: 'dashed',
            backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft,
            borderRadius: 16,
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 9999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={picked ? 'check' : 'upload'} size={20} color={idnTokens.green} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: t.ink, fontWeight: '600' }}>{picked ? 'Fichier sélectionné' : 'Choisir un fichier'}</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }} numberOfLines={1}>
              {picked ? picked.name : 'PDF, JPG, PNG · max 10 MB'}
            </Text>
          </View>
        </Pressable>

        <View style={{ marginTop: 18, gap: 12 }}>
          <IdnInput t={t} label="Nom du document" value={name} onChangeText={setName} />
          <IdnInput
            t={t}
            label="Date d'expiration (optionnel)"
            placeholder="AAAA-MM-JJ"
            value={expiration}
            onChangeText={setExpiration}
          />
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 22), borderTopWidth: 1, borderTopColor: t.borderSoft }}>
        <IdnButton
          t={t}
          variant="primary"
          size="lg"
          full
          onPress={submit}
          disabled={submitting || !picked}
          leadIcon={<Icon name="plus" size={16} color="#fff" />}
        >
          {submitting ? 'Chiffrement & envoi…' : 'Ajouter'}
        </IdnButton>
      </View>
    </View>
  );
}
