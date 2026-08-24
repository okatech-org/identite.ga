import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';

function CornerBracket({ position }: { position: { top?: number; bottom?: number; left?: number; right?: number } }) {
  const top = position.top != null, bottom = position.bottom != null, left = position.left != null, right = position.right != null;
  return (
    <View style={{
      position: 'absolute', ...position,
      width: 20, height: 20,
      borderTopWidth: top ? 3 : 0,
      borderBottomWidth: bottom ? 3 : 0,
      borderLeftWidth: left ? 3 : 0,
      borderRightWidth: right ? 3 : 0,
      borderColor: idnTokens.green,
    }} />
  );
}

export default function KycDoc() {
  const router = useRouter();
  const { target } = useLocalSearchParams<{ target?: string }>();
  const targetLoa = target === '3' ? 3 : 2;
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const active = useQuery(api.kyc.getActiveRequest, isAuthenticated ? {} : 'skip');
  const requestVerification = useMutation(api.verification.request);
  const generateUploadUrl = useMutation(api.kyc.generateUploadUrl);
  const setDocumentImage = useMutation(api.kyc.setDocumentImage);

  const [side, setSide] = useState<'front' | 'back'>('front');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<{ front?: string; back?: string }>({});

  const editableActive = active?.status === 'pending' || active?.status === 'complement_required' ? active : null;
  const kycRequestId = (editableActive?._id ?? null) as Id<'kycRequest'> | null;
  const hasFront = !!editableActive?.docFrontUrl || !!previews.front;
  const hasBack = !!editableActive?.docBackUrl || !!previews.back;

  async function ensureRequest(): Promise<Id<'kycRequest'>> {
    if (kycRequestId) return kycRequestId;
    const result = await requestVerification({ targetLoa, documentType: 'cni_gabon' });
    if (!result.kycRequestId) throw new Error('Aucune demande documentaire n’a été ouverte.');
    return result.kycRequestId;
  }

  async function pick() {
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      let res: ImagePicker.ImagePickerResult;
      if (perm.granted) {
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false,
        });
      } else {
        res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }
      if (res.canceled || !res.assets?.[0]) return;
      const asset = res.assets[0];
      setUploading(true);
      const requestId = await ensureRequest();
      const uploadUrl = await generateUploadUrl({});
      const blob = await (await fetch(asset.uri)).blob();
      const upload = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': asset.mimeType ?? 'image/jpeg' },
        body: blob,
      });
      if (!upload.ok) throw new Error('Échec de l\'upload de la photo.');
      const { storageId } = (await upload.json()) as { storageId: string };
      await setDocumentImage({ kycRequestId: requestId, side, storageRef: storageId as Id<'_storage'> });
      setPreviews((p) => ({ ...p, [side]: asset.uri }));
      // Auto avance vers verso si on vient de capturer recto
      if (side === 'front' && !hasBack) setSide('back');
      else if (side === 'back') {
        router.push(`/kyc/selfie?target=${targetLoa}` as never);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la capture.');
    } finally {
      setUploading(false);
    }
  }

  function flipSide() {
    setSide((s) => (s === 'front' ? 'back' : 'front'));
  }

  const previewUri = previews[side] ?? (side === 'front' ? editableActive?.docFrontUrl ?? undefined : editableActive?.docBackUrl ?? undefined);
  const sideLabel = side === 'front' ? 'Recto de la CNI' : 'Verso de la CNI';

  return (
    <View style={{ flex: 1, backgroundColor: '#0E110D', paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 }}>
        <Pressable onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrowL" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#fff' }}>{sideLabel}</Text>
        <Pressable onPress={flipSide} style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="flip" size={18} color="#fff" />
        </Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
        <View style={{ position: 'absolute', top: 18, left: 22, right: 22, padding: 10, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#fff' }}>{previewUri ? 'Aperçu — appuyez pour reprendre' : 'Cadrez la carte dans le rectangle'}</Text>
        </View>
        <View style={{ width: '100%', height: 180, borderRadius: 14, borderWidth: 2.5, borderColor: '#fff', position: 'relative', overflow: 'hidden', backgroundColor: '#0E110D' }}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View style={{ position: 'absolute', inset: 14, opacity: 0.34 } as any}>
              <Text style={{ fontSize: 8, letterSpacing: 1.4, color: '#fff', fontFamily: idnTokens.mono }}>RÉPUBLIQUE GABONAISE</Text>
              <Text style={{ fontSize: 9, color: '#fff', marginTop: 2, fontFamily: idnTokens.mono }}>CARTE NATIONALE D’IDENTITÉ</Text>
            </View>
          )}
          <CornerBracket position={{ top: -3, left: -3 }} />
          <CornerBracket position={{ top: -3, right: -3 }} />
          <CornerBracket position={{ bottom: -3, left: -3 }} />
          <CornerBracket position={{ bottom: -3, right: -3 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {(['front', 'back'] as const).map((s) => {
            const done = s === 'front' ? hasFront : hasBack;
            const sel = side === s;
            return (
              <Pressable key={s} onPress={() => setSide(s)} style={{
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 9999, borderWidth: 1,
                backgroundColor: sel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                borderColor: sel ? '#fff' : 'rgba(255,255,255,0.2)',
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}>
                {done ? <Icon name="check" size={12} color={idnTokens.green} /> : null}
                <Text style={{ fontSize: 12, color: '#fff', fontWeight: '500' }}>{s === 'front' ? 'Recto' : 'Verso'}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ paddingHorizontal: 26, paddingTop: 20, paddingBottom: Math.max(insets.bottom, 26) }}>
        <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 16 }}>Bonne lumière · pas de reflets · cadre net</Text>
        {error ? (
          <Text style={{ fontSize: 12, color: '#FFD7D7', textAlign: 'center', marginBottom: 12 }}>{error}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ width: 48 }} />
          <Pressable onPress={pick} disabled={uploading} style={{ width: 72, height: 72, borderRadius: 9999, backgroundColor: uploading ? 'rgba(255,255,255,0.5)' : '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }}>
            {uploading ? <ActivityIndicator color="#0E110D" /> : null}
          </Pressable>
          {hasFront && hasBack ? (
            <Pressable onPress={() => router.push(`/kyc/selfie?target=${targetLoa}` as never)} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 9999, backgroundColor: idnTokens.green }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Suivant</Text>
            </Pressable>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>
      </View>
    </View>
  );
}
