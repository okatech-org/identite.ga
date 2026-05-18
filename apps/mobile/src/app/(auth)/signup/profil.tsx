import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { LoABadge } from '@/design/loa-badge';
import { Icon } from '@/design/icons';
import { PROFILS } from '@/data/profils';
import {
  getOnboardingProfile,
  setOnboardingProfile,
  type OnboardingProfile,
} from '@/hooks/use-onboarding-state';

export default function SignupProfil() {
  const t = useIdnTheme();
  const router = useRouter();
  const [sel, setSel] = useState<OnboardingProfile>('citizen');

  useEffect(() => {
    (async () => {
      const saved = await getOnboardingProfile();
      if (saved) setSel(saved);
    })();
  }, []);

  async function next() {
    await setOnboardingProfile(sel);
    router.push('/(auth)/signup/email');
  }

  return (
    <NStepShell
      t={t}
      step={1}
      total={5}
      title="Quel est votre profil ?"
      sub="Détermine les pièces demandées et les services accessibles."
      onBack={() => router.back()}
      onPrimary={next}
    >
      <View style={{ gap: 10 }}>
        {PROFILS.map((p) => {
          const isSel = p.id === sel;
          return (
            <Pressable key={p.id} onPress={() => setSel(p.id)} style={{
              flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
              borderWidth: 1.5,
              borderColor: isSel ? idnTokens.green : t.border,
              backgroundColor: isSel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
              borderRadius: 14,
            }}>
              <View style={{
                width: 42, height: 42, borderRadius: 11,
                backgroundColor: isSel ? idnTokens.green : t.surface2,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="user" size={20} color={isSel ? '#fff' : t.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.ink }}>{p.label}</Text>
                <Text style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{p.sub}</Text>
              </View>
              <LoABadge level={p.loa} t={t} compact />
            </Pressable>
          );
        })}
      </View>
    </NStepShell>
  );
}
