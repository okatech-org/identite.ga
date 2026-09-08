import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { api } from '@/lib/api';

type Step = { l: string; ok: boolean | null; w?: string };

function buildSteps(status: string | undefined, score: number | undefined, faceMatchScore: number | undefined): { steps: Step[]; pct: number } {
  const docOk = score != null;
  const ocrOk = score != null && score >= 0.5;
  const matchOk = faceMatchScore != null && faceMatchScore >= 0.5;
  const reviewOk = status === 'approved';
  const reviewInProgress = status === 'under_review' || status === 'submitted';
  const rejected = status === 'rejected';
  const steps: Step[] = [
    { l: 'Document scanné',                    ok: docOk || reviewInProgress || reviewOk },
    { l: 'Lecture OCR',                        ok: ocrOk ? true : reviewInProgress ? false : null, w: ocrOk ? undefined : reviewInProgress ? 'en cours' : undefined },
    { l: 'Face match (selfie ↔ doc)',          ok: matchOk ? true : reviewInProgress ? false : null, w: matchOk ? undefined : reviewInProgress ? 'en cours' : undefined },
    { l: 'Croisement registre civil',          ok: reviewInProgress ? false : reviewOk ? true : null, w: reviewInProgress ? 'en cours' : undefined },
    { l: 'Revue manuelle si nécessaire',       ok: rejected ? false : reviewOk ? true : null },
  ];
  const completed = steps.filter((s) => s.ok === true).length;
  const pct = Math.round((completed / steps.length) * 100);
  return { steps, pct };
}

export default function KycReview() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const active = useQuery(api.kyc.getActiveRequest, isAuthenticated ? {} : 'skip');

  const { steps, pct } = buildSteps(active?.status, active?.score, active?.faceMatchScore);
  const offsetCircumference = 2 * Math.PI * 44;
  const dashOffset = offsetCircumference * (1 - pct / 100);

  const title = active?.status === 'approved'
    ? 'Identité vérifiée'
    : active?.status === 'rejected'
      ? 'Vérification refusée'
      : 'Vérification en cours';
  const sub = active?.status === 'approved'
    ? 'Votre niveau de garantie a été mis à jour.'
    : active?.status === 'rejected'
      ? active.rejectionReason ?? 'La revue a refusé cette vérification.'
      : 'Notre système croise vos données. Vous serez notifié·e dès qu\'une décision sera prise.';

  const timelineLabels: Record<string, string> = {
    kyc_submitted: 'Demande envoyée',
    kyc_under_review: 'Revue démarrée',
    kyc_complement_requested: 'Complément demandé',
    kyc_complement_provided: 'Complément transmis',
    kyc_approved: 'Identité vérifiée',
    kyc_rejected: 'Demande refusée',
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingTop: insets.top + 40, paddingHorizontal: 26, paddingBottom: Math.max(insets.bottom, 26), gap: 22 }}>
      <View style={{ alignItems: 'center', gap: 22 }}>
        <View style={{ width: 96, height: 96 }}>
          <Svg viewBox="0 0 100 100" width={96} height={96}>
            <Circle cx={50} cy={50} r={44} stroke={t.border} strokeWidth={5} fill="none" />
            <Circle
              cx={50} cy={50} r={44}
              stroke={active?.status === 'approved' ? idnTokens.green : active?.status === 'rejected' ? '#B83A3A' : idnTokens.blue}
              strokeWidth={5} fill="none"
              strokeDasharray={offsetCircumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </Svg>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: t.ink, fontFamily: idnTokens.mono }}>{pct}%</Text>
          </View>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: t.ink, letterSpacing: -0.3 }}>{title}</Text>
          <Text style={{ fontSize: 13, color: t.muted, marginTop: 10, lineHeight: 20, maxWidth: 280, textAlign: 'center' }}>
            {sub}
          </Text>
        </View>
        {active?.status === 'complement_required' && active.complementRequest ? (
          <View style={{ width: '100%', padding: 16, borderRadius: 14, backgroundColor: t.dark ? '#1F2316' : idnTokens.yellowSoft, borderWidth: 1, borderColor: t.dark ? '#3A3F1F' : '#E8D67E' }}>
            <Text style={{ color: t.ink, fontSize: 14, fontWeight: '700' }}>Un complément est nécessaire</Text>
            <Text style={{ color: t.muted, fontSize: 11, marginTop: 4 }}>Demandé le {new Date(active.complementRequest.requestedAt).toLocaleString('fr-FR')}</Text>
            <Text style={{ color: t.ink2, fontSize: 13, lineHeight: 19, marginTop: 10 }}>{active.complementRequest.message}</Text>
          </View>
        ) : null}
        {active ? (
          <View style={{ width: '100%' }}>
            <Text style={{ color: t.ink, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>Pièces transmises</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { label: 'Recto', uri: active.docFrontUrl },
                { label: 'Verso', uri: active.docBackUrl },
                { label: 'Selfie', uri: active.selfieUrl },
              ].map((document) => (
                <View key={document.label} style={{ flex: 1, gap: 5 }}>
                  <View style={{ height: 86, borderRadius: 10, overflow: 'hidden', backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    {document.uri ? <Image source={{ uri: document.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <Text style={{ color: t.muted, fontSize: 10 }}>Absent</Text>}
                  </View>
                  <Text style={{ color: t.muted, fontSize: 10, textAlign: 'center' }}>{document.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View style={{ width: '100%', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, padding: 16 }}>
          {steps.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
              <View style={{
                width: 18, height: 18, borderRadius: 9999,
                backgroundColor: r.ok === true ? idnTokens.green : r.ok === false ? idnTokens.blue : t.border,
                alignItems: 'center', justifyContent: 'center',
              }}>
                {r.ok === true ? (
                  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none"><Path d="M5 12l5 5 9-11" stroke="#fff" strokeWidth={3} strokeLinecap="round" /></Svg>
                ) : r.ok === false ? (
                  <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: '#fff' }} />
                ) : null}
              </View>
              <Text style={{ flex: 1, fontSize: 12, color: r.ok === null ? t.muted : t.ink }}>{r.l}</Text>
              {r.w ? <Text style={{ fontSize: 10, color: idnTokens.blue, fontWeight: '600' }}>{r.w}</Text> : null}
            </View>
          ))}
        </View>
        {active && active.timeline.length > 0 ? (
          <View style={{ width: '100%' }}>
            <Text style={{ color: t.ink, fontSize: 14, fontWeight: '700', marginBottom: 10 }}>Historique</Text>
            <View style={{ borderLeftWidth: 1, borderLeftColor: t.border, marginLeft: 5, paddingLeft: 16, gap: 14 }}>
              {active.timeline.map((event, index) => (
                <View key={`${event.action}-${index}`}>
                  <View style={{ position: 'absolute', left: -21, top: 4, width: 9, height: 9, borderRadius: 5, backgroundColor: idnTokens.green }} />
                  <Text style={{ color: t.ink, fontSize: 12, fontWeight: '600' }}>{timelineLabels[event.action] ?? event.action}</Text>
                  <Text style={{ color: t.muted, fontSize: 10, marginTop: 2 }}>{new Date(event.createdAt).toLocaleString('fr-FR')}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
      {active?.status === 'complement_required' ? <IdnButton t={t} size="lg" full onPress={() => router.push('/kyc/doc?target=2' as never)}>Fournir le complément</IdnButton> : null}
      {active?.status === 'rejected' ? <IdnButton t={t} size="lg" full onPress={() => router.replace('/kyc/intro?target=2' as never)}>Démarrer une nouvelle demande</IdnButton> : null}
      <IdnButton t={t} variant="ghost" size="lg" full onPress={() => router.replace('/(tabs)/home')}>Retour à l’accueil</IdnButton>
      {active ? <Text style={{ textAlign: 'center', color: t.mutedSoft, fontSize: 9, fontFamily: idnTokens.mono }}>RÉF. {active._id}</Text> : null}
    </ScrollView>
  );
}
