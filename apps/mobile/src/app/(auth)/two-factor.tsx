import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { Icon } from '@/design/icons';
import { authClient } from '@/lib/auth-client';
import { setOnboardingDone } from '@/hooks/use-app-state';

/**
 * Challenge 2FA au login. Atteint quand un sign-in renvoie
 * `twoFactorRedirect: true` (cf. login.tsx). L'utilisateur saisit son code
 * TOTP à 6 chiffres (`authClient.twoFactor.verifyTotp`) ou, en secours, un
 * code de récupération (`authClient.twoFactor.verifyBackupCode`).
 */
export default function TwoFactorChallenge() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBackup = mode === 'backup';
  const canSubmit = isBackup ? code.trim().length > 0 : code.trim().length === 6;

  async function submit() {
    if (submitting || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = isBackup
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
        : await authClient.twoFactor.verifyTotp({ code: code.trim() });
      if (res?.error) {
        setError(
          isBackup
            ? 'Code de secours invalide ou déjà utilisé.'
            : 'Code incorrect. Vérifiez votre application d\'authentification.',
        );
        setCode('');
        setSubmitting(false);
        return;
      }
      await setOnboardingDone(true);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vérification impossible. Réessayez.');
      setCode('');
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === 'totp' ? 'backup' : 'totp'));
    setCode('');
    setError(null);
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 20 }}>
      <Pressable
        onPress={() => router.back()}
        style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 26 }}
      >
        <Icon name="arrowL" size={20} color={idnTokens.green} />
        <Text style={{ color: idnTokens.green, fontSize: idnTokens.text.callout, fontWeight: '600' }}>
          Retour
        </Text>
      </Pressable>

      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingHorizontal: 26, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: idnTokens.text.title, fontWeight: '700', color: t.ink, letterSpacing: -0.5 }}>
            Vérification en deux étapes
          </Text>
          <Text style={{ fontSize: idnTokens.text.callout, color: t.muted, marginTop: 10, lineHeight: 22 }}>
            {isBackup
              ? 'Saisissez l\'un de vos codes de secours.'
              : 'Saisissez le code à 6 chiffres de votre application d\'authentification.'}
          </Text>
        </View>

        <View style={{ marginTop: 30 }}>
          <IdnInput
            t={t}
            label={isBackup ? 'Code de secours' : 'Code à 6 chiffres'}
            value={code}
            onChangeText={(v) => setCode(isBackup ? v.trim() : v.replace(/\D/g, '').slice(0, 6))}
            placeholder={isBackup ? 'xxxxxxxxxx' : '000000'}
            type={isBackup ? 'text' : 'number'}
            autoFocus
          />
        </View>

        {error ? (
          <View
            style={{
              marginTop: 14,
              backgroundColor: t.dark ? '#3A1212' : '#FBE5E5',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <Text style={{ color: idnTokens.danger, fontSize: idnTokens.text.footnote, lineHeight: 19 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 24, gap: 12 }}>
          <IdnButton t={t} variant="primary" size="lg" full onPress={submit} disabled={!canSubmit || submitting}>
            {submitting ? 'Vérification…' : 'Vérifier'}
          </IdnButton>
          <Pressable onPress={switchMode} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 8 }}>
            <Text style={{ color: idnTokens.green, fontSize: idnTokens.text.footnote, fontWeight: '600' }}>
              {isBackup ? 'Utiliser un code d\'application' : 'Utiliser un code de secours'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
