import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { Icon } from '@/design/icons';
import { authClient } from '@/lib/auth-client';
import { setOnboardingDone } from '@/hooks/use-app-state';

type Phase = 'handle' | 'pin';

const PIN_KEYS: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const HANDLE_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const IDN_DOMAIN = '@idn.ga';

/**
 * Accepte `handle` ou `handle@idn.ga` indifféremment.
 * Renvoie l'email Better Auth normalisé (lower + suffixe @idn.ga).
 */
function normalizeIdnIdentifier(input: string): { handle: string; email: string } | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  const handle = raw.endsWith(IDN_DOMAIN) ? raw.slice(0, -IDN_DOMAIN.length) : raw;
  if (handle.length < 3 || handle.length > 32) return null;
  if (!HANDLE_REGEX.test(handle)) return null;
  return { handle, email: `${handle}${IDN_DOMAIN}` };
}

export default function Login() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<Phase>('handle');
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeIdnIdentifier(identifier);
  const handleValid = normalized !== null;

  function goToPin() {
    if (!handleValid) {
      setError('Saisissez un identifiant IDN valide.');
      return;
    }
    setError(null);
    setPin('');
    setPhase('pin');
  }

  function backToHandle() {
    setPhase('handle');
    setPin('');
    setError(null);
  }

  async function routeAfterAuth() {
    // Si le user n'a aucun passkey enrôlé, on propose d'en créer un avant
    // d'entrer dans l'app. L'écran bio sait revenir à /(tabs)/home grâce
    // au paramètre `next`. En cas d'erreur réseau (ou plugin indispo en
    // mode web), on tombe sur home sans bloquer la connexion.
    try {
      const list = await authClient.passkey.listUserPasskeys?.();
      const data = (list?.data ?? list) as unknown[] | undefined;
      if (Array.isArray(data) && data.length === 0) {
        router.replace('/(auth)/signup/bio?next=/(tabs)/home');
        return;
      }
    } catch {
      // ignore — fallback home
    }
    router.replace('/(tabs)/home');
  }

  async function signInWithPin(entered: string) {
    if (submitting || !normalized) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authClient.$fetch('/sign-in/pin', {
        method: 'POST',
        body: { email: normalized.email, pin: entered },
      });
      const errorBody = (res?.error ?? null) as
        | { code?: string; status?: number; message?: string }
        | null;
      if (errorBody) {
        const code = errorBody.code;
        if (code === 'EMAIL_NOT_VERIFIED') {
          setError('Email non vérifié. Consultez votre boîte de réception.');
        } else if (errorBody.status === 429) {
          setError('Trop de tentatives. Réessayez plus tard.');
        } else {
          setError('Code PIN incorrect.');
        }
        setPin('');
        setSubmitting(false);
        return;
      }
      await setOnboardingDone(true);
      await routeAfterAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible. Réessayez.');
      setPin('');
      setSubmitting(false);
    }
  }

  function pressPinKey(k: string) {
    if (k === '' || submitting) return;
    setError(null);
    if (k === '⌫') {
      setPin((v) => v.slice(0, -1));
      return;
    }
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 6) void signInWithPin(next);
  }

  async function signInWithPasskey() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await authClient.signIn.passkey();
      if (res?.error) {
        setError(res.error.message ?? 'Aucun passkey utilisable sur ce device.');
        setSubmitting(false);
        return;
      }
      await setOnboardingDone(true);
      // User connecté via passkey → forcément déjà enrôlé → home direct.
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion par passkey impossible.');
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 20, paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 28) }}>
      <Pressable onPress={() => (phase === 'pin' ? backToHandle() : router.back())} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
        <Icon name="arrowL" size={20} color={idnTokens.green} />
        <Text style={{ color: idnTokens.green, fontWeight: '500' }}>{phase === 'pin' ? 'Modifier l\'identifiant' : 'Retour'}</Text>
      </Pressable>

      {phase === 'handle' ? (
        <>
          <View style={{ marginTop: 26 }}>
            <Text style={{ fontSize: 26, fontWeight: '700', color: t.ink, letterSpacing: -0.5 }}>Connexion</Text>
            <Text style={{ fontSize: 13, color: t.muted, marginTop: 8 }}>Saisissez votre identifiant IDN pour continuer.</Text>
          </View>

          <View style={{ marginTop: 26, gap: 14 }}>
            <IdnInput
              t={t}
              label="Identifiant IDN"
              value={identifier}
              onChangeText={(v) => setIdentifier(v.toLowerCase())}
              placeholder="prenom.nom"
              hint="Avec ou sans @idn.ga"
              leadIcon={<Icon name="user" size={20} color={t.muted} />}
              autoFocus
            />
          </View>

          {error ? (
            <View style={{ marginTop: 14, backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ flex: 1 }} />

          <IdnButton t={t} variant="primary" size="lg" full onPress={goToPin} disabled={!handleValid}>
            Continuer
          </IdnButton>

          <Pressable
            onPress={signInWithPasskey}
            disabled={submitting}
            style={{ marginTop: 12, paddingVertical: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: submitting ? 0.5 : 1 }}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M5 11c0-3 3-7 7-7s7 4 7 7" stroke={t.ink2} strokeWidth={1.6} strokeLinecap="round" />
              <Path d="M9 13c.5-1.5 2-2 3-2s2.5.5 3 2v2" stroke={t.ink2} strokeWidth={1.6} strokeLinecap="round" />
              <Path d="M12 15v5M5 16c0 3 3 4 7 4" stroke={t.ink2} strokeWidth={1.6} strokeLinecap="round" />
            </Svg>
            <Text style={{ color: t.ink2, fontSize: 13, fontWeight: '500' }}>Se connecter avec un passkey</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={{ marginTop: 22, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: t.ink, letterSpacing: -0.4 }}>Votre code PIN</Text>
            <Text style={{ fontSize: 13, color: t.muted, marginTop: 8, textAlign: 'center' }}>6 chiffres pour accéder à votre compte.</Text>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>{normalized?.email ?? ''}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 22 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  backgroundColor: i < pin.length ? idnTokens.green : 'transparent',
                  borderWidth: 2,
                  borderColor: i < pin.length ? idnTokens.green : t.border,
                }}
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
            {PIN_KEYS.map((k, i) => (
              <View key={i} style={{ width: '33.3333%', padding: 5 }}>
                <Pressable
                  disabled={k === '' || submitting}
                  onPress={() => pressPinKey(k)}
                  style={{
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: k === '' ? 'transparent' : t.surface,
                    borderWidth: k === '' ? 0 : 1,
                    borderColor: t.borderSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: '500', color: t.ink, fontFamily: idnTokens.mono }}>{k}</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {error ? (
            <View style={{ marginTop: 14, backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ flex: 1 }} />

          <Text style={{ textAlign: 'center', fontSize: 12, color: t.muted, paddingVertical: 8 }}>
            {submitting ? 'Connexion…' : 'Saisissez vos 6 chiffres pour vous connecter.'}
          </Text>
        </>
      )}
    </View>
  );
}
