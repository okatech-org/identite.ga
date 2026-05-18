import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuth from 'expo-local-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { IdnFlagBars } from '@/design/mark';
import { authClient } from '@/lib/auth-client';
import { BIOMETRIC_KEY } from '@/app/(auth)/signup/bio';

export default function Launcher() {
  useIdnTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [bioEnabled, setBioEnabled] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const flag = await AsyncStorage.getItem(BIOMETRIC_KEY);
      setBioEnabled(flag === '1');
    })();
  }, []);

  async function tryFaceId() {
    setError(null);
    if (!bioEnabled) {
      router.replace('/(tabs)/home');
      return;
    }
    setAuthenticating(true);
    try {
      const hasHw = await LocalAuth.hasHardwareAsync();
      const enrolled = await LocalAuth.isEnrolledAsync();
      if (!hasHw || !enrolled) {
        // Pas de biométrie côté appareil : on déverrouille directement.
        router.replace('/(tabs)/home');
        return;
      }
      const r = await LocalAuth.authenticateAsync({
        promptMessage: 'Déverrouiller IDN',
        cancelLabel: 'Utiliser le PIN',
        disableDeviceFallback: false,
      });
      if (r.success) {
        router.replace('/(tabs)/home');
      } else {
        setError('Authentification refusée. Utilisez votre PIN.');
        setAuthenticating(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'authentification.');
      setAuthenticating(false);
    }
  }

  async function switchAccount() {
    try {
      await authClient.signOut();
    } catch {
      // ignore
    }
    router.replace('/(auth)/hub');
  }

  return (
    <LinearGradient
      colors={['#0E7C3A', '#0A5C2C', '#08401F']}
      locations={[0, 0.6, 1]}
      start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, paddingTop: insets.top + 30, paddingHorizontal: 26, paddingBottom: insets.bottom + 30, alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <View style={{ width: 96, height: 96, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' }}>
            <Svg width={56} height={56} viewBox="0 0 32 32" fill="none">
              <Rect x={2} y={2} width={28} height={28} rx={7} fill="#fff" />
              <Path d="M11 9v14M16 13v10M21 17v6" stroke="#0E7C3A" strokeWidth={2.6} strokeLinecap="round" />
            </Svg>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: '600', color: 'rgba(255,255,255,0.78)' }}>RÉPUBLIQUE GABONAISE</Text>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', marginTop: 6, letterSpacing: -0.4 }}>Identité Numérique</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center', width: '100%', gap: 18 }}>
          <Pressable onPress={tryFaceId} disabled={authenticating} style={{
            width: 76, height: 76, borderRadius: 9999,
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
            alignItems: 'center', justifyContent: 'center',
            opacity: authenticating ? 0.6 : 1,
          }}>
            <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
              <Path d="M5 11c0-3 3-7 7-7s7 4 7 7" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
              <Path d="M8 13c0-2.2 1.8-4 4-4s4 1.8 4 4v2" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
              <Path d="M12 15v6" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
              <Path d="M5 17c0 3.3 3.1 4 7 4M19 14v3" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
            </Svg>
          </Pressable>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.86)', textAlign: 'center' }}>
            {bioEnabled ? 'Touchez pour vous identifier avec Face ID' : 'Touchez pour entrer'}
          </Text>
          {error ? (
            <Text style={{ fontSize: 12, color: '#FFD7D7', textAlign: 'center' }}>{error}</Text>
          ) : null}
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Pressable onPress={() => router.replace('/(tabs)/home')}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Utiliser le PIN</Text>
            </Pressable>
            <IdnFlagBars width={28} height={2.5} />
            <Pressable onPress={switchAccount}>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Changer de compte</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
