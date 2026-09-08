import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';

const REFRESH_PADDING_MS = 2_000;

export default function IdCard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const presentation = useQuery(api.presentation.getCurrentPresentation, isAuthenticated ? {} : 'skip');
  const mintToken = useMutation(api.presentation.mintToken);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [remainingMs, setRemainingMs] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const r = await mintToken({});
      setToken(r.token);
      setExpiresAt(r.expiresAt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de générer le QR.';
      setError(msg);
      setToken(null);
    }
  }, [mintToken]);

  // Premier mint + renouvellement automatique
  useEffect(() => {
    if (isAuthenticated) void refresh();
  }, [refresh, isAuthenticated]);

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      const left = expiresAt - Date.now();
      setRemainingMs(left);
      if (left <= REFRESH_PADDING_MS) {
        void refresh();
      }
    }, 250);
    return () => clearInterval(id);
  }, [expiresAt, refresh]);

  const idnId = presentation?.idnId ?? '—';
  const fullName = presentation ? `${presentation.firstName} ${presentation.lastName}` : '—';
  const profileLabel = presentation
    ? (presentation.profileType === 'citizen' ? 'Citoyen Gabonais'
      : presentation.profileType === 'resident' ? 'Résident étranger'
      : presentation.profileType === 'visitor' ? 'Visiteur'
      : presentation.profileType === 'developer' ? 'Développeur' : '—')
    : '—';
  const dob = presentation?.dateOfBirth ?? '';
  const dobLabel = dob ? (() => {
    const [y, m, d] = dob.split('-');
    if (!y || !m || !d) return dob;
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${Number(d)} ${months[Number(m) - 1] ?? m} ${y}`;
  })() : '';
  const loa = presentation?.loa ?? 1;
  const loaLabel = loa === 3 ? 'NIVEAU 3 · ÉLEVÉ' : loa === 2 ? 'NIVEAU 2 · SUBSTANTIEL' : 'NIVEAU 1 · FAIBLE';
  const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));

  async function share() {
    if (!presentation) return;
    try {
      await Share.share({
        message: `Mon identité IDN : ${fullName} · ${idnId} · ${loaLabel}`,
      });
    } catch {
      // ignore
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0E110D', paddingTop: insets.top }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 }}>
        <Pressable onPress={() => router.back()} style={{
          width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#fff' }}>Votre identité</Text>
        <Pressable onPress={refresh} style={{
          width: 32, height: 32, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.12)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="more" size={18} color="#fff" />
        </Pressable>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26 }}>
        <View style={{ backgroundColor: '#fff', padding: 18, borderRadius: 18, width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
          {token ? (
            <QRCode value={token} size={204} color="#0E110D" backgroundColor="#fff" />
          ) : (
            <Text style={{ color: '#0E110D', fontFamily: idnTokens.mono, fontSize: 11 }}>{error ?? 'Génération…'}</Text>
          )}
        </View>
        <Text style={{ fontFamily: idnTokens.mono, fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: 2, marginTop: 22 }}>{idnId}</Text>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 8 }}>{fullName}</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{profileLabel} {dobLabel ? `· ${dobLabel}` : ''}</Text>
        <View style={{ marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.18)' }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: '#fff', letterSpacing: 0.4 }}>{loaLabel}</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 24) }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: 12, borderRadius: 12 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 17, textAlign: 'center' }}>
            {error
              ? error
              : token
                ? `Présentez ce QR à un contrôleur d'identité. Renouvellement dans ${secondsLeft}s.`
                : 'Présentez ce QR à un contrôleur d\'identité. Renouvellement automatique toutes les 30 s.'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <Pressable onPress={share} style={{ flex: 1, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>Partager</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/consents' as never)} style={{ flex: 1, paddingVertical: 14, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ color: '#0E110D', fontSize: 13, fontWeight: '600' }}>Gérer les accès</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
