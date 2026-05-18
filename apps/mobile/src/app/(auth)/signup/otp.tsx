import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { Icon } from '@/design/icons';
import { authClient } from '@/lib/auth-client';
import { api } from '@/lib/api';
import {
  getOnboardingEmail,
  getOnboardingProfile,
} from '@/hooks/use-onboarding-state';

const RESEND_COOLDOWN = 60;

export default function SignupOtp() {
  const t = useIdnTheme();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<'citizen' | 'resident' | 'visitor' | 'developer' | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const lastAttempted = useRef<string | null>(null);
  const selectProfile = useMutation(api.onboarding.selectProfile);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      const e = await getOnboardingEmail();
      const p = await getOnboardingProfile();
      if (!e || !p) {
        router.replace('/(auth)/signup/profil');
        return;
      }
      setEmail(e);
      setProfile(p);
    })();
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function verify(otp: string) {
    if (!email || !profile || verifying) return;
    if (lastAttempted.current === otp) return;
    lastAttempted.current = otp;
    setVerifying(true);
    setError(null);
    try {
      const result = await authClient.emailOtp.verifyEmail({ email, otp });
      if (result?.error) {
        setError('Code invalide ou expiré.');
        setVerifying(false);
        return;
      }
      await selectProfile({ profileType: profile });
      router.push('/(auth)/signup/pivot');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.toLowerCase().includes('rate') ? 'Trop de tentatives. Réessayez plus tard.' : 'Code invalide ou expiré.');
      setVerifying(false);
    }
  }

  useEffect(() => {
    if (code.length === 6 && !verifying) {
      void verify(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function resend() {
    if (!email || cooldown > 0) return;
    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      setCooldown(RESEND_COOLDOWN);
      setCode('');
      setError(null);
      lastAttempted.current = null;
    } catch {
      setError('Impossible d\'envoyer un nouveau code. Réessayez plus tard.');
    }
  }

  const digits = code.padEnd(6, ' ').slice(0, 6).split('');

  return (
    <NStepShell
      t={t}
      step={3}
      total={5}
      title="Vérifiez votre email"
      sub={
        <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20 }}>
          Code à 6 chiffres envoyé à <Text style={{ color: t.ink, fontWeight: '600' }}>{email ?? 'votre adresse'}</Text>
        </Text>
      }
      primary={verifying ? 'Vérification…' : 'Vérifier'}
      secondary="Modifier l'email"
      onBack={() => router.back()}
      onPrimary={() => verify(code)}
      onSecondary={() => router.back()}
    >
      <Pressable onPress={() => inputRef.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
        {digits.map((c, i) => {
          const filled = c.trim().length > 0;
          return (
            <View key={i} style={{
              flex: 1, height: 56,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: t.surface,
              borderWidth: 1.5,
              borderColor: filled ? idnTokens.green : t.border,
              borderRadius: 12,
            }}>
              <Text style={{ fontSize: 22, fontWeight: '600', fontFamily: idnTokens.mono, color: t.ink }}>{c.trim()}</Text>
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        // Invisible — focus via le bandeau de cases
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: t.muted }}>
          {cooldown > 0 ? `Nouveau code dans ${cooldown}s` : 'Vous pouvez recevoir un nouveau code'}
        </Text>
        <Pressable onPress={resend} disabled={cooldown > 0}>
          <Text style={{ fontSize: 12, color: cooldown > 0 ? t.muted : idnTokens.green, fontWeight: '500' }}>Renvoyer le code</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{
        backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft,
        padding: 14, borderRadius: 12,
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
      }}>
        <Icon name="mail" size={20} color={idnTokens.blue} />
        <Text style={{ flex: 1, fontSize: 12, color: t.ink2, lineHeight: 18 }}>
          Pas reçu ? Vérifiez les courriers indésirables. Le code arrive habituellement en moins de 30 secondes.
        </Text>
      </View>
      {error ? (
        <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
        </View>
      ) : null}
    </NStepShell>
  );
}
