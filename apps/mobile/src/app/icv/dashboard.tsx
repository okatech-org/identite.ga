import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon, type IconName } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NLargeHeader } from '@/components/chrome/large-header';
import { useActiveCv } from '@/hooks/use-active-cv';
import { ICV_ACCENT, icvStrings } from '@/data/cv';
import { CvSelector } from '@/components/cv/cv-selector';
import { PdfButton } from '@/components/cv/pdf-button';
import { ScoreRing } from '@/components/cv/score-ring';

type SectionKey = 'experience' | 'education' | 'skill' | 'info' | 'language' | 'hobby';

const SECTION_META: Record<
  SectionKey,
  { label: string; icon: IconName; color: string; bgLight: string; bgDark: string }
> = {
  experience: { label: 'Expériences', icon: 'briefcase', color: '#f97316', bgLight: '#FFEDD5', bgDark: '#2A1A0E' },
  education: { label: 'Formation', icon: 'cap', color: '#3b82f6', bgLight: '#DBEAFE', bgDark: '#0F2640' },
  skill: { label: 'Compétences', icon: 'star', color: '#a855f7', bgLight: '#F3E8FF', bgDark: '#2A1542' },
  info: { label: 'Informations', icon: 'user', color: '#22c55e', bgLight: '#DCFCE7', bgDark: '#0F2818' },
  language: { label: 'Langues', icon: 'globe', color: '#06b6d4', bgLight: '#CFFAFE', bgDark: '#0E2A33' },
  hobby: { label: 'Hobbies', icon: 'heart', color: '#94a3b8', bgLight: '#F1F5F9', bgDark: '#1A1F26' },
};

export default function ICVDashboard() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cvs, activeCv, activeCvId, isLoading } = useActiveCv();

  const fullCv = useQuery(
    api.cv.profile.get,
    activeCvId ? { cvId: activeCvId } : 'skip',
  );
  const scoreData = useQuery(
    api.cv.score.get,
    activeCvId ? { cvId: activeCvId } : 'skip',
  );

  if (isLoading || !cvs || !activeCv || !activeCvId) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={idnTokens.green} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title={icvStrings.dashboard.title}
        sub={fullCv ? `${fullCv.firstName} ${fullCv.lastName}`.trim() || activeCv.name : activeCv.name}
        onBack={() => router.back()}
        right={<PdfButton cvId={activeCvId} size="sm" />}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 24,
          gap: 14,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CvSelector active={activeCv} onCreate={() => router.push('/icv/create' as never)} />
        </View>

        <ScoreRing
          score={scoreData?.score ?? activeCv.completionScore}
          level={scoreData?.level ?? 'Débutant'}
        />

        {/* Suggestions */}
        <View
          style={{
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.4,
              color: t.muted,
              marginBottom: 10,
            }}
          >
            {icvStrings.dashboard.suggestions}
          </Text>
          {scoreData?.suggestions && scoreData.suggestions.length > 0 ? (
            <View style={{ gap: 8 }}>
              {scoreData.suggestions.map((s) => (
                <View
                  key={s.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    backgroundColor: t.surface2,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12.5, fontWeight: '600', color: t.ink }}>
                      {s.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                      Impact :{' '}
                      {s.impact === 'high'
                        ? icvStrings.dashboard.impactHigh
                        : s.impact === 'medium'
                          ? icvStrings.dashboard.impactMedium
                          : icvStrings.dashboard.impactLow}
                    </Text>
                  </View>
                  <Icon name="sparkles" size={14} color={ICV_ACCENT} />
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: t.muted, fontStyle: 'italic' }}>
              Excellent ! Aucune suggestion pour l'instant.
            </Text>
          )}
        </View>

        {/* Sections */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1.4,
            color: t.muted,
            marginTop: 4,
          }}
        >
          {icvStrings.dashboard.sections}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <SectionCard
            kind="experience"
            count={fullCv?.experiences.length ?? 0}
            cvId={activeCvId}
          />
          <SectionCard
            kind="education"
            count={fullCv?.education.length ?? 0}
            cvId={activeCvId}
          />
          <SectionCard
            kind="skill"
            count={fullCv?.skills.length ?? 0}
            cvId={activeCvId}
          />
          <SectionCard
            kind="info"
            count={contactPercent(fullCv)}
            hint="%"
            cvId={activeCvId}
          />
          <SectionCard
            kind="language"
            count={fullCv?.languages.length ?? 0}
            cvId={activeCvId}
          />
          <SectionCard
            kind="hobby"
            count={fullCv?.hobbies.length ?? 0}
            cvId={activeCvId}
          />
        </View>

        <Pressable
          onPress={() => router.push('/icv' as never)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 12,
            borderRadius: 9999,
            backgroundColor: idnTokens.green,
            marginTop: 6,
          }}
        >
          <Icon name="edit" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {icvStrings.dashboard.editCv}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SectionCard({
  kind,
  count,
  hint,
  cvId,
}: {
  kind: SectionKey;
  count: number;
  hint?: string;
  cvId: Id<'citizenCv'>;
}) {
  const t = useIdnTheme();
  const router = useRouter();
  const m = SECTION_META[kind];
  return (
    <Pressable
      onPress={() => router.push(`/icv/edit?section=${kind}&cv=${cvId}` as never)}
      style={{
        width: '48%',
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          backgroundColor: t.dark ? m.bgDark : m.bgLight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={m.icon} size={18} color={m.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{m.label}</Text>
        <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>
          {count}
          {hint ?? ''}
        </Text>
      </View>
    </Pressable>
  );
}

function contactPercent(cv: { firstName: string; lastName: string; email: string; phone: string } | null | undefined): number {
  if (!cv) return 0;
  const filled = [cv.firstName, cv.lastName, cv.email, cv.phone].filter((s) => s.trim().length > 0).length;
  return Math.round((filled / 4) * 100);
}
