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

export default function ICVHome() {
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

  const [openResult, setOpenResult] = useState<AiToolId | null>(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={idnTokens.green} />
      </View>
    );
  }

  if (!cvs || cvs.length === 0) {
    return <EmptyState />;
  }

  if (!activeCvId || !activeCv) {
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
        title={icvStrings.title}
        sub={icvStrings.subtitle}
        onBack={() => router.back()}
        right={
          <PdfButton cvId={activeCvId} size="sm" />
        }
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
              <Pressable
                onPress={() => router.push('/icv/dashboard' as never)}
                style={{
                  marginLeft: 'auto',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 9999,
                  backgroundColor: idnTokens.green,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                  Dashboard
                </Text>
              </Pressable>
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

function EmptyState() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title={icvStrings.title} onBack={() => router.back()} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: t.dark ? '#2A1426' : '#FCE7F3',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="file" size={28} color={ICV_ACCENT} />
        </View>
        <Text
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: '700',
            color: t.muted,
            marginTop: 14,
          }}
        >
          ICV · NOUVEAU
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: t.ink,
            textAlign: 'center',
            marginTop: 8,
            letterSpacing: -0.6,
          }}
        >
          Votre CV professionnel,
        </Text>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: ICV_ACCENT,
            textAlign: 'center',
            letterSpacing: -0.6,
          }}
        >
          en quelques minutes.
        </Text>
        <Text style={{ fontSize: 14, color: t.muted, textAlign: 'center', marginTop: 14, lineHeight: 20 }}>
          12 thèmes professionnels, 5 outils IA, score ATS et export PDF.
          Synchronisé avec votre identité IDN.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
          <Pressable
            onPress={() => router.push('/icv/dashboard' as never)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 9999,
              backgroundColor: idnTokens.green,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="plus" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700' }}>Démarrer mon CV</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/icv/import' as never)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 9999,
              borderWidth: 1,
              borderColor: t.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon name="upload" size={14} color={t.ink2} />
            <Text style={{ color: t.ink2, fontWeight: '600' }}>Importer</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
