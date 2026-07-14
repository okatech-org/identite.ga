import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';

export default function KycSelfie() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const active = useQuery(api.kyc.getActiveRequest, isAuthenticated ? {} : 'skip');
  const generateUploadUrl = useMutation(api.kyc.generateUploadUrl);
  const setSelfie = useMutation(api.kyc.setSelfie);
  const submit = useMutation(api.kyc.submit);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const kycRequestId = active?._id as Id<'kycRequest'> | undefined;
  const selfieUploaded = !!active?.selfieUrl || !!preview;

  async function pick() {
    if (!kycRequestId) {
      setError('Veuillez d\'abord prendre le recto de votre pièce d\'identité.');
      return;
    }
    setError(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      let res: ImagePicker.ImagePickerResult;
      if (perm.granted) {
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          cameraType: ImagePicker.CameraType.front,
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
      const uploadUrl = await generateUploadUrl({});
      const blob = await (await fetch(asset.uri)).blob();
      const upload = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': asset.mimeType ?? 'image/jpeg' },
        body: blob,
      });
      if (!upload.ok) throw new Error('Échec de l\'upload du selfie.');
      const { storageId } = (await upload.json()) as { storageId: string };
      await setSelfie({ kycRequestId, storageRef: storageId as Id<'_storage'> });
      setPreview(asset.uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la capture.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!kycRequestId) return;
    setSubmitting(true);
    setError(null);
    try {
      await submit({ kycRequestId });
      router.replace('/kyc/review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Soumission impossible.');
      setSubmitting(false);
    }
  }

  const previewUri = preview ?? active?.selfieUrl ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0E110D', paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 }}>
        <Pressable onPress={() => router.back()} style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="arrowL" size={18} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#fff' }}>Selfie vivant</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
        <View style={{ position: 'absolute', top: 18, left: 22, right: 22, padding: 12, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>
            {previewUri ? 'Selfie capturé — vérifiez la netteté' : 'Placez votre visage dans le cadre'}
          </Text>
        </View>
        <Pressable onPress={pick} style={{
          width: 220, height: 280,
          borderRadius: 140,
          borderWidth: 3,
          borderStyle: 'dashed',
          borderColor: idnTokens.green,
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#0E110D',
        }}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View style={{ width: 180, height: 220, opacity: 0.34 }}>
              <Svg viewBox="0 0 100 120" width="100%" height="100%">
                <Ellipse cx={50} cy={55} rx={28} ry={38} stroke="#fff" strokeWidth={1.4} fill="none" />
                <Circle cx={40} cy={48} r={2.5} fill="#fff" />
                <Circle cx={60} cy={48} r={2.5} fill="#fff" />
                <Path d="M44 65c2 2 10 2 12 0" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" fill="none" />
              </Svg>
            </View>
          )}
        </Pressable>
        <View style={{ position: 'absolute', bottom: 18, left: 22, right: 22, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 12, textAlign: 'center' }}>
            {selfieUploaded
              ? 'Selfie prêt — appuyez pour soumettre'
              : 'Bonne lumière · visage bien visible · sans lunettes ni chapeau'}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 30), gap: 10 }}>
        {error ? (
          <Text style={{ fontSize: 12, color: '#FFD7D7', textAlign: 'center' }}>{error}</Text>
        ) : null}
        {selfieUploaded ? (
          <Pressable onPress={handleSubmit} disabled={submitting || uploading} style={{
            paddingVertical: 14, borderRadius: 12,
            backgroundColor: submitting ? 'rgba(255,255,255,0.5)' : idnTokens.green,
            alignItems: 'center',
          }}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Soumettre ma vérification</Text>
            )}
          </Pressable>
        ) : (
          <Pressable onPress={pick} disabled={uploading} style={{
            paddingVertical: 14, borderRadius: 12,
            backgroundColor: uploading ? 'rgba(255,255,255,0.5)' : '#fff',
            alignItems: 'center',
          }}>
            {uploading ? <ActivityIndicator color="#0E110D" /> : (
              <Text style={{ color: '#0E110D', fontSize: 14, fontWeight: '600' }}>Capturer mon selfie</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
