import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { Icon, type IconName } from '@/design/icons';
import { api } from '@/lib/api';
import { kycEntryRoute } from '@/lib/kyc-flow';

const STEPS: { n: string; t: string; d: string; i: IconName }[] = [
  { n: '01', t: 'Document d\'identité', d: 'Photographiez votre CNI recto-verso',     i: 'doc' },
  { n: '02', t: 'Selfie vivant',         d: 'Détection de présence + face match',     i: 'camera' },
  { n: '03', t: 'Validation',            d: 'Revue auto, puis manuelle si besoin (24-48h)', i: 'check' },
];

export default function KycIntro() {
  const t = useIdnTheme();
  const router = useRouter();
  const { target } = useLocalSearchParams<{ target?: string }>();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.profile.getCurrentUser, isAuthenticated ? {} : 'skip');
  const active = useQuery(api.kyc.getActiveRequest, isAuthenticated ? {} : 'skip');
  const currentLoa = me?.profile?.loa ?? 1;
  const targetLoa = target === '3' || (target === undefined && currentLoa === 2) ? 3 : 2;

  function continueFlow() {
    const destination = kycEntryRoute({ targetLoa, currentLoa, activeStatus: active?.status });
    if (destination === 'review') router.replace('/kyc/review');
    else if (destination === 'level3') router.replace('/kyc/level3' as never);
    else router.push(`/kyc/doc?target=${targetLoa}` as never);
  }

  const level3 = targetLoa === 3;
  const introSteps = level3 && currentLoa >= 2 ? [
    { n: '01', t: 'Créneau au choix', d: 'Choisissez une date et un contrôleur disponibles', i: 'calendar' as IconName },
    { n: '02', t: 'Entretien vidéo', d: 'Présentez votre pièce et répondez aux questions', i: 'camera' as IconName },
    { n: '03', t: 'Décision', d: 'Validation humaine de votre identité', i: 'check' as IconName },
  ] : STEPS;
  return (
    <NStepShell
      t={t}
      step={0}
      total={3}
      title={`Passons au Niveau ${targetLoa}`}
      sub={level3 ? 'Une démarche unique et sécurisée : vos justificatifs si nécessaire, puis un entretien avec un contrôleur habilité.' : '3 étapes, environ 5 minutes. Vos images sont transmises de façon chiffrée et servent uniquement à confirmer votre identité.'}
      primary={active?.status === 'complement_required' ? 'Répondre au complément' : level3 && currentLoa >= 2 ? 'Choisir un créneau' : 'Commencer'}
      onBack={() => router.back()}
      onPrimary={continueFlow}
    >
      {introSteps.map((s, i) => (
        <View key={i} style={{
          flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14,
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 11,
            backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={s.i} size={20} color={idnTokens.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{s.t}</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{s.d}</Text>
          </View>
          <Text style={{ fontSize: 10, fontFamily: idnTokens.mono, color: t.muted, fontWeight: '600' }}>{s.n}</Text>
        </View>
      ))}
    </NStepShell>
  );
}
