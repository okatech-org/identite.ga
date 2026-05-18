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

// Better Auth `signUp.email` exige un password. L'app ne l'expose pas à
// l'utilisateur : on génère un secret aléatoire fort (32 caractères),
// non stocké côté client. Le compte ne sera ensuite accessible que par
// PIN (créé à l'étape suivante) ou passkey (étape bio).
function generateInternalPassword(): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  const buf = new Uint32Array(32);
  crypto.getRandomValues(buf);
  let s = '';
  for (let i = 0; i < buf.length; i++) s += alphabet[buf[i] % alphabet.length];
  return s;
}

export default function SignupEmail() {
  const t = useIdnTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const profile = await getOnboardingProfile();
      if (!profile) router.replace('/(auth)/signup/profil');
    })();
  }, [router]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = emailValid && agreed && !submitting;

  async function next() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await authClient.signUp.email({
        email: email.trim().toLowerCase(),
        password: generateInternalPassword(),
        name: email.trim().toLowerCase(),
      });
      if (result?.error) {
        const code = result.error.code as string | undefined;
        setError(
          code === 'USER_ALREADY_EXISTS'
            ? 'Un compte existe déjà avec cette adresse.'
            : code === 'PASSWORD_COMPROMISED'
              ? 'Erreur interne lors de la création du compte. Réessayez.'
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
      title="Votre adresse email"
      sub="Vous accéderez à votre compte par PIN ou empreinte."
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
