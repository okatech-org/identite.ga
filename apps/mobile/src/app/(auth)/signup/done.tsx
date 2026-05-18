import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { LoABadge } from '@/design/loa-badge';
import { api } from '@/lib/api';
import { clearOnboarding } from '@/hooks/use-onboarding-state';
import { setOnboardingDone } from '@/hooks/use-app-state';

export default function SignupDone() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useQuery(api.profile.getCurrentUser);

  async function finish(toKyc: boolean) {
    await Promise.all([setOnboardingDone(true), clearOnboarding()]);
    router.replace(toKyc ? '/kyc/intro' : '/(tabs)/home');
  }

  const idnId = user?.profile?.idnId ?? '—';
  const loa = (user?.profile?.loa ?? 1) as 1 | 2 | 3;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 40, paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 26) }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <View style={{ width: 96, height: 96, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l5 5 9-11" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 26, fontWeight: '700', color: t.ink, letterSpacing: -0.4 }}>Compte créé !</Text>
          <Text style={{ fontSize: 14, color: t.muted, lineHeight: 22, marginTop: 12, textAlign: 'center', maxWidth: 280 }}>
            Votre identité numérique est active. Vérifiez votre identité pour débloquer plus de services.
          </Text>
        </View>
        <View style={{
          padding: 16, backgroundColor: t.surface,
          borderWidth: 1, borderColor: t.border, borderRadius: 14,
          width: '100%', maxWidth: 280, alignItems: 'flex-start',
        }}>
          <Text style={{ color: t.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: '600', fontFamily: idnTokens.mono }}>VOTRE ID IDN</Text>
          <Text style={{ fontSize: 16, color: t.ink, fontWeight: '600', marginTop: 6, fontFamily: idnTokens.mono }}>{idnId}</Text>
          <View style={{ marginTop: 10 }}><LoABadge level={loa} t={t} compact /></View>
        </View>
      </View>
      <IdnButton t={t} variant="primary" size="lg" full onPress={() => finish(true)}>Vérifier mon identité</IdnButton>
      <Pressable style={{ alignItems: 'center', padding: 16 }} onPress={() => finish(false)}>
        <Text style={{ color: t.muted, fontSize: 13, fontWeight: '500' }}>Continuer vers l'accueil</Text>
      </Pressable>
    </View>
  );
}
