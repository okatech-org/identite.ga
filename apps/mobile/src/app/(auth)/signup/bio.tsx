import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as LocalAuth from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';

export const BIOMETRIC_KEY = 'idn.biometricEnabled';

export default function SignupBio() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [available, setAvailable] = useState<boolean>(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
    if (!available) {
      // Sur simulateur web/dev sans biométrie : on garde le flag à false et on avance.
      await AsyncStorage.setItem(BIOMETRIC_KEY, '0');
      router.push('/(auth)/signup/done');
      return;
    }
    setActivating(true);
    setError(null);
    try {
      const r = await LocalAuth.authenticateAsync({
        promptMessage: 'Activer Face ID pour IDN',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });
      if (r.success) {
        await AsyncStorage.setItem(BIOMETRIC_KEY, '1');
      } else {
        await AsyncStorage.setItem(BIOMETRIC_KEY, '0');
        setError('Authentification biométrique refusée.');
        setActivating(false);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'activation.');
      setActivating(false);
      return;
    }
    router.push('/(auth)/signup/done');
  }

  async function skip() {
    await AsyncStorage.setItem(BIOMETRIC_KEY, '0');
    router.push('/(auth)/signup/done');
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
          <Text style={{ fontSize: 24, fontWeight: '700', color: t.ink, letterSpacing: -0.4, textAlign: 'center' }}>Face ID pour vous connecter ?</Text>
          <Text style={{ fontSize: 14, color: t.muted, lineHeight: 22, marginTop: 12, textAlign: 'center', maxWidth: 280 }}>
            {available
              ? 'Déverrouillez l\'app et signez vos démarches plus rapidement. Vous pouvez toujours utiliser votre PIN.'
              : 'Aucun capteur biométrique configuré sur cet appareil. Vous pourrez l\'activer plus tard.'}
          </Text>
        </View>
        {error ? (
          <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12, alignSelf: 'stretch' }}>
            <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
          </View>
        ) : null}
      </View>
      <IdnButton t={t} variant="primary" size="lg" full onPress={activate} disabled={activating}>
        {activating ? 'Activation…' : (available ? 'Activer Face ID' : 'Continuer')}
      </IdnButton>
      <Pressable style={{ alignItems: 'center', padding: 16 }} onPress={skip}>
        <Text style={{ color: t.muted, fontSize: 13, fontWeight: '500' }}>Plus tard</Text>
      </Pressable>
    </View>
  );
}
