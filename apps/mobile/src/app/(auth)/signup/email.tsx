import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { IdnInput } from '@/design/components/idn-input';
import { Icon } from '@/design/icons';
import { authClient } from '@/lib/auth-client';
import {
  getOnboardingProfile,
  setOnboardingEmail,
} from '@/hooks/use-onboarding-state';

function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (pwd.length < 8) return { score: 0, label: 'trop court' };
  let score = 0;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ['très faible', 'faible', 'moyenne', 'forte', 'excellente'] as const;
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export default function SignupEmail() {
  const t = useIdnTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const profile = await getOnboardingProfile();
      if (!profile) router.replace('/(auth)/signup/profil');
    })();
  }, [router]);

  const strength = passwordStrength(pwd);
  const colors = [t.border, '#B83A3A', idnTokens.yellow, idnTokens.green, idnTokens.green];
  const bars = [0, 1, 2, 3].map((i) => (i < strength.score ? colors[strength.score] : t.border));
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && pwd.length >= 12 && agreed && !submitting;

  async function next() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password: pwd,
        name: email.trim().toLowerCase(),
      });
      if (result?.error) {
        const code = result.error.code as string | undefined;
        setError(
          code === 'USER_ALREADY_EXISTS'
            ? 'Un compte existe déjà avec cette adresse.'
            : code === 'PASSWORD_COMPROMISED'
              ? 'Ce mot de passe a fuité dans une base de données. Choisissez-en un autre.'
              : code === 'PASSWORD_TOO_SHORT'
                ? 'Le mot de passe doit faire au moins 12 caractères.'
                : (result.error.message ?? 'Une erreur est survenue. Réessayez.'),
        );
        setSubmitting(false);
        return;
      }
      await setOnboardingEmail(email.trim().toLowerCase());
      router.push('/(auth)/signup/otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.');
      setSubmitting(false);
    }
  }

  return (
    <NStepShell
      t={t}
      step={2}
      total={5}
      title="Vos identifiants"
      sub="Vous pourrez ajouter la 2FA plus tard."
      primary={submitting ? 'Envoi en cours…' : 'Recevoir le code'}
      onBack={() => router.back()}
      onPrimary={next}
    >
      <IdnInput
        t={t}
        label="Adresse email"
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
        value={pwd}
        onChangeText={setPwd}
        placeholder="Minimum 12 caractères"
        type="password"
        leadIcon={<Icon name="lock" size={20} color={t.muted} />}
      />
      {pwd.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {bars.map((c, i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c }} />
            ))}
          </View>
          <Text style={{ fontSize: 12, color: t.muted, marginTop: -8 }}>
            Force du mot de passe : <Text style={{ color: colors[strength.score], fontWeight: '600' }}>{strength.label}</Text>
          </Text>
        </>
      ) : null}
      <Pressable onPress={() => setAgreed((v) => !v)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View style={{
          width: 18, height: 18, borderRadius: 4, marginTop: 2,
          borderWidth: 1.5, borderColor: agreed ? idnTokens.green : t.border,
          backgroundColor: agreed ? idnTokens.green : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {agreed ? <Icon name="check" size={12} color="#fff" /> : null}
        </View>
        <Text style={{ flex: 1, fontSize: 12, color: t.ink2, lineHeight: 18 }}>
          J'accepte les <Text style={{ color: idnTokens.green, textDecorationLine: 'underline' }}>CGU</Text> et la <Text style={{ color: idnTokens.green, textDecorationLine: 'underline' }}>politique de confidentialité</Text>.
        </Text>
      </Pressable>
      {error ? (
        <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
        </View>
      ) : null}
    </NStepShell>
  );
}
