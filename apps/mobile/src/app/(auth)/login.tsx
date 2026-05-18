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

export default function Login() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (result?.error) {
        const code = result.error.code as string | undefined;
        setError(
          code === 'INVALID_EMAIL_OR_PASSWORD'
            ? 'Email ou mot de passe incorrect.'
            : code === 'EMAIL_NOT_VERIFIED'
              ? 'Email non vérifié. Consultez votre boîte de réception.'
              : (result.error.message ?? 'Connexion impossible. Réessayez.'),
        );
        setSubmitting(false);
        return;
      }
      await setOnboardingDone(true);
      router.replace('/launcher');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible. Réessayez.');
      setSubmitting(false);
    }
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && password.length >= 1 && !submitting;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 20, paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 28) }}>
      <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 }}>
        <Icon name="arrowL" size={20} color={idnTokens.green} />
        <Text style={{ color: idnTokens.green, fontWeight: '500' }}>Retour</Text>
      </Pressable>
      <View style={{ marginTop: 26 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: t.ink, letterSpacing: -0.5 }}>Connexion</Text>
        <Text style={{ fontSize: 13, color: t.muted, marginTop: 8 }}>Saisissez vos identifiants IDN pour continuer.</Text>
      </View>
      <View style={{ marginTop: 26, gap: 14 }}>
        <IdnInput
          t={t}
          label="Email"
          value={email}
          onChangeText={setEmail}
          type="email"
          placeholder="vous@example.ga"
          leadIcon={<Icon name="mail" size={20} color={t.muted} />}
          autoFocus
        />
        <IdnInput
          t={t}
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          type="password"
          leadIcon={<Icon name="lock" size={20} color={t.muted} />}
        />
        <Pressable style={{ alignSelf: 'flex-end' }} hitSlop={8}>
          <Text style={{ color: t.muted, fontSize: 12 }}>Mot de passe oublié ?</Text>
        </Pressable>
      </View>
      {error ? (
        <View style={{ marginTop: 14, backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }} />
      <IdnButton t={t} variant="primary" size="lg" full onPress={signIn} disabled={!canSubmit}>
        {submitting ? 'Connexion…' : 'Se connecter'}
      </IdnButton>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <Pressable disabled style={{ flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: 0.5 }}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M5 11c0-3 3-7 7-7s7 4 7 7" stroke={t.ink2} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M9 13c.5-1.5 2-2 3-2s2.5.5 3 2v2" stroke={t.ink2} strokeWidth={1.6} strokeLinecap="round" />
            <Path d="M12 15v5M5 16c0 3 3 4 7 4" stroke={t.ink2} strokeWidth={1.6} strokeLinecap="round" />
          </Svg>
          <Text style={{ color: t.ink2, fontSize: 13, fontWeight: '500' }}>Face ID</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/scanner')} style={{ flex: 1, paddingVertical: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          <Icon name="qr" size={20} color={t.ink2} />
          <Text style={{ color: t.ink2, fontSize: 13, fontWeight: '500' }}>QR</Text>
        </Pressable>
      </View>
    </View>
  );
}
