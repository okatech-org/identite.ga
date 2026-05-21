import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Svg, { G, Path, Rect } from 'react-native-svg';
import { useMutation } from 'convex/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnFlagBars } from '@/design/mark';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { BIOMETRIC_KEY } from '@/app/(auth)/signup/bio';

/**
 * Verrou applicatif au cold start : l'utilisateur a déjà une session
 * Better Auth valide (sinon il serait routé vers /hub), on demande juste
 * une confirmation locale d'identité avant d'entrer dans l'app.
 *
 * Deux modes :
 *   - `bio` : si un passkey a été enrôlé (BIOMETRIC_KEY = "1"), on
 *     propose un bouton central qui déclenche Face ID via Better Auth.
 *   - `pin` : pad numérique 6 chiffres vérifié contre le pinHash via
 *     api.onboarding.verifyPin (la session courante reste intacte).
 *
 * « Utiliser le PIN » / « Utiliser Face ID » bascule entre les deux
 * modes sans déconnecter. « Changer de compte » fait un vrai signOut
 * puis ramène sur /hub.
 */

const PIN_KEYS: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

type Mode = 'bio' | 'pin';

export default function Launcher() {
  useIdnTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const verifyPin = useMutation(api.onboarding.verifyPin);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>('bio');
  const [authenticating, setAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pin, setPin] = useState('');

  useEffect(() => {
    (async () => {
      const flag = await AsyncStorage.getItem(BIOMETRIC_KEY);
      const has = flag === '1';
      setBioEnabled(has);
      // Pas de passkey → PIN par défaut, plutôt qu'un bouton Face ID
      // qui ne déclencherait rien.
      if (!has) setMode('pin');
    })();
  }, []);

  async function tryPasskey() {
    if (authenticating) return;
    setError(null);
    setAuthenticating(true);
    try {
      const res = await authClient.signIn.passkey();
      if (res?.error) {
        setError('Authentification refusée. Utilisez votre PIN.');
        setAuthenticating(false);
        return;
      }
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'authentification.');
      setAuthenticating(false);
    }
  }

  async function submitPin(entered: string) {
    if (authenticating) return;
    setAuthenticating(true);
    setError(null);
    try {
      const res = await verifyPin({ pin: entered });
      if (!res.valid) {
        setError('Code PIN incorrect.');
        setPin('');
        setAuthenticating(false);
        return;
      }
      router.replace('/(tabs)/home');
    } catch {
      // Session expirée / autre erreur : on bascule sur hub.
      try { await authClient.signOut(); } catch { /* ignore */ }
      router.replace('/(auth)/hub');
    }
  }

  function pressPinKey(k: string) {
    if (k === '' || authenticating) return;
    setError(null);
    if (k === '⌫') {
      setPin((v) => v.slice(0, -1));
      return;
    }
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 6) void submitPin(next);
  }

  async function switchAccount() {
    try { await authClient.signOut(); } catch { /* ignore */ }
    router.replace('/(auth)/hub');
  }

  const isPin = mode === 'pin';

  return (
    <LinearGradient
      colors={['#0E7C3A', '#0A5C2C', '#08401F']}
      locations={[0, 0.6, 1]}
      start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
      style={{ flex: 1 }}
    >
      <StatusBar style="light" />
      <View style={{ flex: 1, paddingTop: insets.top + 30, paddingHorizontal: 26, paddingBottom: insets.bottom + 26, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo + title — compact en mode PIN pour laisser la place au pad */}
        <View style={{ flex: isPin ? 0 : 1, alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: isPin ? 8 : 0 }}>
          <View style={{
            width: isPin ? 56 : 96, height: isPin ? 56 : 96,
            borderRadius: isPin ? 16 : 26,
            backgroundColor: 'rgba(255,255,255,0.14)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)',
          }}>
            <Svg width={isPin ? 36 : 56} height={isPin ? 36 : 56} viewBox="0 0 32 32" fill="none">
              <Rect x={2} y={2} width={28} height={28} rx={7} fill="#fff" />
              <G transform="translate(4 4)" stroke="#0E7C3A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
                <Path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                <Path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                <Path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                <Path d="M2 12a10 10 0 0 1 18-6" />
                <Path d="M2 16h.01" />
                <Path d="M21.8 16c.2-2 .131-5.354 0-6" />
                <Path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                <Path d="M8.65 22c.21-.66.45-1.32.57-2" />
                <Path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
              </G>
            </Svg>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 11, letterSpacing: 1.6, fontWeight: '600', color: 'rgba(255,255,255,0.78)' }}>RÉPUBLIQUE GABONAISE</Text>
            <Text style={{ fontSize: isPin ? 22 : 28, fontWeight: '700', color: '#fff', marginTop: 6, letterSpacing: -0.4 }}>Identité Numérique</Text>
          </View>
        </View>

        {isPin ? (
          /* MODE PIN — pad numérique */
          <View style={{ alignItems: 'center', width: '100%', gap: 12, marginBottom: 4 }}>
            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.86)', textAlign: 'center' }}>
              Saisissez votre code PIN
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 4 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{
                  width: 16, height: 16, borderRadius: 9999,
                  backgroundColor: i < pin.length ? '#fff' : 'transparent',
                  borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
                }} />
              ))}
            </View>
            {error ? (
              <Text style={{ fontSize: 12, color: '#FFD7D7', textAlign: 'center' }}>{error}</Text>
            ) : null}
            <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 4 }}>
              {PIN_KEYS.map((k, i) => (
                <View key={i} style={{ width: '33.33%', padding: 4 }}>
                  <Pressable disabled={k === '' || authenticating} onPress={() => pressPinKey(k)} style={{
                    height: 52, borderRadius: 14,
                    backgroundColor: k === '' ? 'transparent' : 'rgba(255,255,255,0.10)',
                    borderWidth: k === '' ? 0 : 1,
                    borderColor: 'rgba(255,255,255,0.22)',
                    alignItems: 'center', justifyContent: 'center',
                    opacity: authenticating ? 0.6 : 1,
                  }}>
                    <Text style={{ fontSize: 22, fontWeight: '500', color: '#fff', fontFamily: idnTokens.mono }}>{k}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              {bioEnabled ? (
                <Pressable onPress={() => { setMode('bio'); setError(null); setPin(''); }}>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Utiliser Face ID</Text>
                </Pressable>
              ) : (
                <View style={{ width: 80 }} />
              )}
              <IdnFlagBars width={28} height={2.5} />
              <Pressable onPress={switchAccount}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Changer de compte</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* MODE BIO — bouton central Face ID */
          <View style={{ alignItems: 'center', width: '100%', gap: 18 }}>
            <Pressable onPress={tryPasskey} disabled={authenticating} style={{
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
              Touchez pour vous identifier avec Face ID
            </Text>
            {error ? (
              <Text style={{ fontSize: 12, color: '#FFD7D7', textAlign: 'center' }}>{error}</Text>
            ) : null}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <Pressable onPress={() => { setMode('pin'); setError(null); }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Utiliser le PIN</Text>
              </Pressable>
              <IdnFlagBars width={28} height={2.5} />
              <Pressable onPress={switchAccount}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Changer de compte</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}
