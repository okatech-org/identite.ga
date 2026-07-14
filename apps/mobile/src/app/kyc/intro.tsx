import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { Icon, type IconName } from '@/design/icons';

const STEPS: { n: string; t: string; d: string; i: IconName }[] = [
  { n: '01', t: 'Document d\'identité', d: 'Photographiez votre CNI recto-verso',     i: 'doc' },
  { n: '02', t: 'Selfie vivant',         d: 'Détection de présence + face match',     i: 'camera' },
  { n: '03', t: 'Validation',            d: 'Revue auto, puis manuelle si besoin (24-48h)', i: 'check' },
];

export default function KycIntro() {
  const t = useIdnTheme();
  const router = useRouter();
  return (
    <NStepShell
      t={t}
      step={0}
      total={3}
      title="Passons au Niveau 2"
      sub="3 étapes, environ 5 minutes. Vos images sont transmises de façon chiffrée à notre partenaire de vérification agréé, et servent uniquement à confirmer votre identité."
      primary="Commencer"
      onBack={() => router.back()}
      onPrimary={() => router.push('/kyc/doc')}
    >
      {STEPS.map((s, i) => (
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
