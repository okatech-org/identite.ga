import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { icvStrings } from '@/data/cv';

interface AtsResult {
  score?: number;
  breakdown?: Record<string, number>;
  recommendations?: string[];
}

export default function ICVAts() {
  const params = useLocalSearchParams<{ cv?: string }>();
  const cvId = params.cv as Id<'citizenCv'> | undefined;
  const t = useIdnTheme();
  const router = useRouter();
  const job = useQuery(
    api.cv.ai.getLastResult,
    cvId ? { cvId, feature: 'ats_check' } : 'skip',
  );

  const isLoading = job === undefined;
  const isPending = job?.status === 'queued' || job?.status === 'running';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <NSheetHeader t={t} title={icvStrings.ats.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <Text style={{ fontSize: 13, color: t.muted }}>{icvStrings.ats.desc}</Text>

        {isLoading || isPending ? (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={idnTokens.green} />
            <Text style={{ fontSize: 13, color: t.muted }}>Analyse en cours…</Text>
          </View>
        ) : !job || job.status === 'failed' || !job.result ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
            <Icon name="alert" size={22} color="#f59e0b" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: t.ink }}>
              Aucune analyse disponible.
            </Text>
            <Text style={{ fontSize: 12, color: t.muted, textAlign: 'center' }}>
              Lancez l’outil « Score ATS » depuis le panneau iCV.
            </Text>
          </View>
        ) : (
          <AtsResultBody result={job.result as AtsResult} />
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <View style={{ flex: 1 }} />
          <IdnButton variant="ghost" size="md" t={t} onPress={() => router.back()}>
            {icvStrings.ats.close}
          </IdnButton>
        </View>
      </ScrollView>
    </View>
  );
}

function AtsResultBody({ result }: { result: AtsResult }) {
  const t = useIdnTheme();
  const score = clampScore(result.score);
  const tone =
    score >= 80
      ? { label: icvStrings.ats.resultGood, fg: '#15803D', bg: '#DCFCE7' }
      : score >= 50
        ? { label: icvStrings.ats.resultMid, fg: '#92400E', bg: '#FEF3C7' }
        : { label: icvStrings.ats.resultBad, fg: '#9F1239', bg: '#FFE4E6' };
  const r = 60;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);

  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          backgroundColor: tone.bg,
          borderRadius: 14,
          padding: 16,
          alignItems: 'center',
        }}
      >
        <Svg width={160} height={160} viewBox="0 0 160 160">
          <Circle cx={80} cy={80} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={11} />
          <Circle
            cx={80}
            cy={80}
            r={r}
            fill="none"
            stroke={tone.fg}
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={`${c}`}
            strokeDashoffset={off}
            transform="rotate(-90 80 80)"
          />
          <SvgText x={80} y={78} textAnchor="middle" fontSize={32} fontWeight="700" fill={tone.fg}>
            {score}
          </SvgText>
          <SvgText
            x={80}
            y={102}
            textAnchor="middle"
            fontSize={9}
            fontWeight="600"
            fill={tone.fg}
            letterSpacing={1.2}
          >
            SCORE ATS
          </SvgText>
        </Svg>
        <Text style={{ fontSize: 22, fontWeight: '700', color: tone.fg, marginTop: 4 }}>
          {tone.label}
        </Text>
        {result.breakdown ? (
          <View style={{ marginTop: 12, gap: 4, alignSelf: 'stretch' }}>
            {Object.entries(result.breakdown).map(([k, v]) => (
              <View
                key={k}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgba(255,255,255,0.4)',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 12, color: tone.fg, textTransform: 'capitalize' }}>
                  {k}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: tone.fg }}>{v}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {result.recommendations && result.recommendations.length > 0 ? (
        <View
          style={{
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.4,
              color: t.muted,
              marginBottom: 8,
            }}
          >
            RECOMMANDATIONS
          </Text>
          {result.recommendations.map((rec, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
              <Icon name="check" size={14} color={idnTokens.green} />
              <Text style={{ flex: 1, fontSize: 13, color: t.ink, lineHeight: 18 }}>{rec}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function clampScore(s: unknown): number {
  if (typeof s === 'number' && Number.isFinite(s)) {
    return Math.max(0, Math.min(100, Math.round(s)));
  }
  return 0;
}
