import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { api } from '@/lib/api';

const KEYS: string[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function SignupPin() {
  const t = useIdnTheme();
  const router = useRouter();
  const createPin = useMutation(api.onboarding.createPin);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phase, setPhase] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const current = phase === 'enter' ? pin : confirm;
  const filled = current.length;

  function press(k: string) {
    if (k === '') return;
    setError(null);
    if (phase === 'enter') {
      if (k === '⌫') return setPin((v) => v.slice(0, -1));
      if (pin.length >= 6) return;
      const next = pin + k;
      setPin(next);
      if (next.length === 6) setPhase('confirm');
    } else {
      if (k === '⌫') return setConfirm((v) => v.slice(0, -1));
      if (confirm.length >= 6) return;
      const next = confirm + k;
      setConfirm(next);
      if (next.length === 6) void submit(pin, next);
    }
  }

  async function submit(originalPin: string, confirmPin: string) {
    if (originalPin !== confirmPin) {
      setError('Les deux codes ne correspondent pas. Recommencez.');
      setPin('');
      setConfirm('');
      setPhase('enter');
      return;
    }
    if (!/^\d{6}$/.test(originalPin)) {
      setError('Le PIN doit faire exactement 6 chiffres.');
      return;
    }
    setSubmitting(true);
    try {
      await createPin({ pin: originalPin });
      router.push('/(auth)/signup/bio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement du PIN.');
      setPin('');
      setConfirm('');
      setPhase('enter');
      setSubmitting(false);
    }
  }

  return (
    <NStepShell
      t={t}
      step={5}
      total={5}
      title={phase === 'enter' ? 'Créez votre code PIN' : 'Confirmez votre PIN'}
      sub={phase === 'enter'
        ? '6 chiffres pour les actions sensibles : signature, validation, accès rapide.'
        : 'Saisissez le même code pour confirmer.'}
      primary={submitting ? 'Enregistrement…' : 'Confirmer'}
      onBack={() => {
        if (phase === 'confirm') {
          setPhase('enter');
          setConfirm('');
          setError(null);
        } else {
          router.back();
        }
      }}
      onPrimary={() => phase === 'confirm' && void submit(pin, confirm)}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 14 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={{
            width: 18, height: 18, borderRadius: 9999,
            backgroundColor: i < filled ? idnTokens.green : 'transparent',
            borderWidth: 2,
            borderColor: i < filled ? idnTokens.green : t.border,
          }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 8 }}>
        {KEYS.map((k, i) => (
          <View key={i} style={{ width: '33.3333%', padding: 5 }}>
            <Pressable disabled={k === '' || submitting} onPress={() => press(k)} style={{
              height: 56, borderRadius: 14,
              backgroundColor: k === '' ? 'transparent' : t.surface,
              borderWidth: k === '' ? 0 : 1,
              borderColor: t.borderSoft,
              alignItems: 'center', justifyContent: 'center',
              opacity: submitting ? 0.6 : 1,
            }}>
              <Text style={{ fontSize: 22, fontWeight: '500', color: t.ink, fontFamily: idnTokens.mono }}>{k}</Text>
            </Pressable>
          </View>
        ))}
      </View>
      {error ? (
        <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12, marginTop: 12 }}>
          <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
        </View>
      ) : null}
    </NStepShell>
  );
}
