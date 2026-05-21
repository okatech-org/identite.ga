import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { api } from '@/lib/api';
import { clearOnboarding } from '@/hooks/use-onboarding-state';
import { setOnboardingDone } from '@/hooks/use-app-state';

const IDN_DOMAIN = '@idn.ga';

export default function SignupDone() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useQuery(api.profile.getCurrentUser);

  async function finish(toKyc: boolean) {
    await Promise.all([setOnboardingDone(true), clearOnboarding()]);
    router.replace(toKyc ? '/kyc/intro' : '/(tabs)/home');
  }

  const email = user?.email ?? '';
  const handle = email.toLowerCase().endsWith(IDN_DOMAIN)
    ? email.slice(0, -IDN_DOMAIN.length)
    : email;
  const pivot = user?.profile?.pivot;
  const fullName = pivot ? `${pivot.firstName} ${pivot.lastName}` : '';
  const firstName = pivot?.firstName ?? '';
  const idnId = user?.profile?.idnId ?? '';
  const phone = pivot?.phone ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 30, paddingHorizontal: 22, paddingBottom: Math.max(insets.bottom, 22) }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 60, height: 60, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l5 5 9-11" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: t.ink, letterSpacing: -0.4 }}>
          {firstName ? `Bienvenue, ${firstName}.` : 'Bienvenue.'}
        </Text>
        <Text style={{ fontSize: 13, color: t.muted, marginTop: 6, lineHeight: 20, textAlign: 'center', maxWidth: 280 }}>
          Votre identité numérique est active.
        </Text>
      </View>

      {/* Carte IDN — adresse souveraine */}
      <View
        style={{
          marginTop: 22,
          backgroundColor: idnTokens.green,
          padding: 20,
          borderRadius: 16,
          shadowColor: idnTokens.green,
          shadowOpacity: 0.18,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 2, height: 3 }}>
            <View style={{ width: 9, backgroundColor: '#3B9C58' }} />
            <View style={{ width: 9, backgroundColor: '#FCD34D' }} />
            <View style={{ width: 9, backgroundColor: '#2563EB' }} />
          </View>
          <Text style={{ color: '#fff', fontFamily: idnTokens.mono, fontSize: 9, letterSpacing: 1, opacity: 0.75 }}>
            IDN ID · {idnId || '—'}
          </Text>
        </View>
        <Text style={{ color: '#fff', marginTop: 22, fontSize: 9.5, letterSpacing: 1.3, fontWeight: '700', opacity: 0.75 }}>
          VOTRE ADRESSE IDN
        </Text>
        <Text style={{ color: '#fff', fontFamily: idnTokens.mono, fontSize: 17, fontWeight: '600', marginTop: 6, letterSpacing: -0.3 }}>
          {handle}
          <Text style={{ color: '#fff', opacity: 0.85 }}>{IDN_DOMAIN}</Text>
        </Text>
        <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 9, letterSpacing: 1, opacity: 0.6 }}>TITULAIRE</Text>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', marginTop: 2 }}>{fullName || '—'}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.18)' }}>
            <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#fff' }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>Niveau 1</Text>
          </View>
        </View>
      </View>

      {/* Récap utile */}
      <View style={{ marginTop: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, gap: 10 }}>
        {[
          { l: 'Téléphone', v: phone || '—' },
          { l: 'Code PIN', v: '••••••' },
        ].map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: t.muted }}>{r.l}</Text>
            <Text style={{ fontSize: 12, color: t.ink, fontFamily: idnTokens.mono, fontWeight: '500' }}>{r.v}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <IdnButton t={t} variant="primary" size="lg" full onPress={() => finish(true)}>Vérifier mon identité · Niveau 2</IdnButton>
      <Pressable style={{ alignItems: 'center', padding: 14 }} onPress={() => finish(false)}>
        <Text style={{ color: t.muted, fontSize: 13, fontWeight: '500' }}>Continuer vers l'accueil</Text>
      </Pressable>
    </View>
  );
}
