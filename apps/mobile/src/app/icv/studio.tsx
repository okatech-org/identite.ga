import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NLargeHeader } from '@/components/chrome/large-header';
import { useActiveCv } from '@/hooks/use-active-cv';
import { ICV_ACCENT, icvStrings, type AiToolId, type CvThemeId } from '@/data/cv';
import { AiResultCard } from '@/components/cv/ai-result-card';
import { AiTools } from '@/components/cv/ai-tools';
import { CvPreview, type PreviewCv } from '@/components/cv/cv-preview';
import { CvSelector } from '@/components/cv/cv-selector';
import { PdfButton } from '@/components/cv/pdf-button';
import { ThemePicker } from '@/components/cv/theme-picker';

/**
 * Studio iCV — aperçu plein écran, sélecteur de thème, outils IA.
 * Accessible depuis le tableau de bord (`/icv`). Sans CV → redirige sur /icv.
 */
export default function ICVStudio() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ cv?: string }>();

  const { cvs, activeCvId, activeCv, setActiveCvId, isLoading } = useActiveCv();
  const fullCv = useQuery(
    api.cv.profile.get,
    activeCvId ? { cvId: activeCvId } : 'skip',
  );

  // Si ?cv=... en query param, bascule
  useEffect(() => {
    if (params.cv && cvs?.some((c) => c._id === params.cv)) {
      setActiveCvId(params.cv as Id<'citizenCv'>);
      router.setParams({ cv: undefined });
    }
  }, [params.cv, cvs, setActiveCvId, router]);

  // Sans CV → on renvoie sur l'empty state /icv.
  useEffect(() => {
    if (!isLoading && cvs && cvs.length === 0) {
      router.replace('/icv' as never);
    }
  }, [isLoading, cvs, router]);

  const [openResult, setOpenResult] = useState<AiToolId | null>(null);

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
        title="Studio"
        sub="Aperçu, thème et outils IA"
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
        {/* Sélecteur CV */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CvSelector
            active={activeCv}
            onCreate={() => router.push('/icv/create' as never)}
          />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => router.push('/icv/import' as never)}
            hitSlop={6}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
            }}
          >
            <Icon name="upload" size={12} color={t.ink2} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: t.ink2 }}>
              {icvStrings.actions.import}
            </Text>
          </Pressable>
        </View>

        {/* Aperçu A4 — centré et scalé */}
        <View
          style={{
            backgroundColor: t.dark ? '#181C16' : '#E5E4DE',
            borderRadius: 14,
            padding: 12,
            alignItems: 'center',
            justifyContent: 'flex-start',
            minHeight: 420,
          }}
        >
          {fullCv ? (
            <View style={{ width: 320, height: 452, transform: [{ scale: 0.95 }] }}>
              <CvPreview cv={fullCv as PreviewCv} />
            </View>
          ) : (
            <ActivityIndicator color={idnTokens.green} style={{ marginTop: 100 }} />
          )}
        </View>

        {/* Thèmes */}
        <ThemePicker
          cvId={activeCvId}
          activeTheme={activeCv.activeTheme as CvThemeId}
          onOpenGallery={() => router.push(`/icv/themes?cv=${activeCvId}` as never)}
        />

        {/* Outils IA */}
        <AiTools cvId={activeCvId} onResult={(tool) => {
          if (tool === 'ats_check') {
            router.push(`/icv/ats?cv=${activeCvId}` as never);
          } else {
            setOpenResult(tool);
          }
        }} />

        {/* Résultats IA inline */}
        {openResult === 'improve_summary' && fullCv ? (
          <AiResultCard
            cvId={activeCvId}
            feature="improve_summary"
            currentSummary={fullCv.summary}
            onClose={() => setOpenResult(null)}
          />
        ) : null}
        {openResult === 'suggest_skills' ? (
          <AiResultCard
            cvId={activeCvId}
            feature="suggest_skills"
            onClose={() => setOpenResult(null)}
          />
        ) : null}
        {openResult === 'generate_letter' ? (
          <AiResultCard
            cvId={activeCvId}
            feature="generate_letter"
            onClose={() => setOpenResult(null)}
          />
        ) : null}

        {/* Profil */}
        {fullCv ? (
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
                marginBottom: 8,
              }}
            >
              MON PROFIL
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>
              {`${fullCv.firstName} ${fullCv.lastName}`.trim() || '—'}
            </Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
              {fullCv.email || '—'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
              <Pill color={ICV_ACCENT} bg={t.dark ? '#2A1426' : '#FCE7F3'}>
                {fullCv.experiences.length} exp.
              </Pill>
              <Pill color="#3B82F6" bg={t.dark ? '#0F2640' : '#DBEAFE'}>
                {fullCv.skills.length} comp.
              </Pill>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Pill({
  color,
  bg,
  children,
}: {
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 3,
        backgroundColor: bg,
        borderRadius: 9999,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: '600', color }}>{children}</Text>
    </View>
  );
}
