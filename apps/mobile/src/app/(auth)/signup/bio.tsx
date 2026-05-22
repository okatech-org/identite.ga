import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuth from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { authClient } from '@/lib/auth-client';

// Conservé pour compat des composants existants qui lisent ce flag
// (ex: launcher.tsx, profile.tsx). À terme, on bascule entièrement sur
// l'existence d'un passkey côté serveur (passkey.listUserPasskeys).
export const BIOMETRIC_KEY = 'idn.biometricEnabled';

export default function SignupBio() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ next?: string }>();
  const nextHref: Href = (params.next as Href) ?? '/(auth)/signup/done';
  const [available, setAvailable] = useState<boolean>(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Sur web (Expo web), on suppose WebAuthn dispo dans le navigateur.
      // Sur natif, on vérifie le hardware biométrique pour ajuster le copy.
      if (Platform.OS === 'web') {
        setAvailable(typeof window !== 'undefined' && 'PublicKeyCredential' in window);
        return;
      }
      try {
        const hasHw = await LocalAuth.hasHardwareAsync();
        const enrolled = await LocalAuth.isEnrolledAsync();
        setAvailable(hasHw && enrolled);
      } catch {
        setAvailable(false);
      }
    })();
  }, []);

  async function activate() {
    setActivating(true);
    setError(null);
    try {
      const res = await authClient.passkey.addPasskey({ name: 'Face ID' });
      if (res?.error) {
        await AsyncStorage.setItem(BIOMETRIC_KEY, '0');
        setError(res.error.message ?? 'Impossible d\'enrôler le passkey.');
        setActivating(false);
        return;
      }
      await AsyncStorage.setItem(BIOMETRIC_KEY, '1');
    } catch (err) {
      await AsyncStorage.setItem(BIOMETRIC_KEY, '0');
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'activation.');
      setActivating(false);
      return;
    }
    router.replace(nextHref);
  }

  async function skip() {
    await AsyncStorage.setItem(BIOMETRIC_KEY, '0');
    router.replace(nextHref);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 40, paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 26) }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <View style={{
          width: 110, height: 110, borderRadius: 9999,
          backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Svg width={52} height={52} viewBox="0 0 24 24" fill="none">
            <Path d="M5 11c0-3 3-7 7-7s7 4 7 7" stroke={idnTokens.green} strokeWidth={1.4} strokeLinecap="round" />
            <Path d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4v2" stroke={idnTokens.green} strokeWidth={1.4} strokeLinecap="round" />
            <Path d="M12 15v6" stroke={idnTokens.green} strokeWidth={1.4} strokeLinecap="round" />
            <Path d="M5 17c0 3.3 3.1 4 7 4M19 14v3" stroke={idnTokens.green} strokeWidth={1.4} strokeLinecap="round" />
          </Svg>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: idnTokens.text.title, fontWeight: '700', color: t.ink, letterSpacing: -0.4, textAlign: 'center' }}>Face ID pour vous connecter ?</Text>
          <Text style={{ fontSize: idnTokens.text.body, color: t.muted, lineHeight: 25, marginTop: 14, textAlign: 'center', maxWidth: 320 }}>
            {available
              ? 'Déverrouillez l\'app et signez vos démarches plus rapidement. Vous pouvez toujours utiliser votre PIN.'
              : 'Aucun capteur biométrique configuré sur cet appareil. Vous pourrez l\'activer plus tard.'}
          </Text>
        </View>
        {error ? (
          <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 12, padding: 14, alignSelf: 'stretch' }}>
            <Text style={{ color: idnTokens.danger, fontSize: idnTokens.text.footnote, lineHeight: 19 }}>{error}</Text>
          </View>
        ) : null}
      </View>
      <IdnButton t={t} variant="primary" size="lg" full onPress={activate} disabled={activating}>
        {activating ? 'Activation…' : (available ? 'Activer Face ID' : 'Continuer')}
      </IdnButton>
      <Pressable style={{ alignItems: 'center', padding: 18 }} onPress={skip}>
        <Text style={{ color: t.muted, fontSize: idnTokens.text.callout, fontWeight: '600' }}>Plus tard</Text>
      </Pressable>
    </View>
  );
}
