import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import {
  ICV_ACCENT,
  ICV_ACCENT_SOFT_DARK,
  ICV_ACCENT_SOFT_LIGHT,
  ICV_THEMES,
  icvStrings,
  THEME_CATEGORIES,
  getCvThemeById,
  type CvThemeId,
} from '@/data/cv';
import { CvPreview, type PreviewCv } from '@/components/cv/cv-preview';

export default function ICVThemes() {
  const params = useLocalSearchParams<{ cv?: string }>();
  const cvId = params.cv as Id<'citizenCv'> | undefined;
  const t = useIdnTheme();
  const router = useRouter();
  const cv = useQuery(api.cv.profile.get, cvId ? { cvId } : 'skip');
  const setTheme = useMutation(api.cv.profile.setTheme);
  const [selected, setSelected] = useState<CvThemeId | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cv?.activeTheme) setSelected(cv.activeTheme as CvThemeId);
  }, [cv?.activeTheme]);

  async function apply() {
    if (!cvId || !selected || busy) return;
    if (selected === cv?.activeTheme) {
      router.back();
      return;
    }
    setBusy(true);
    try {
      await setTheme({ cvId, theme: selected });
      router.back();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? 'Échec.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <NSheetHeader
        t={t}
        title={icvStrings.themes.galleryTitle}
        onBack={() => router.back()}
      />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
        <Text style={{ fontSize: 12, color: t.muted }}>{icvStrings.themes.galleryDesc}</Text>
        {THEME_CATEGORIES.map((cat) => (
          <View key={cat}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 1.4,
                color: t.muted,
                marginBottom: 8,
              }}
            >
              {cat.toUpperCase()}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {ICV_THEMES.filter((th) => th.category === cat).map((th) => {
                const sel = th.id === selected;
                return (
                  <Pressable
                    key={th.id}
                    onPress={() => setSelected(th.id)}
                    style={{
                      width: '47%',
                      padding: 8,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: sel ? ICV_ACCENT : t.border,
                      backgroundColor: sel
                        ? t.dark
                          ? ICV_ACCENT_SOFT_DARK
                          : ICV_ACCENT_SOFT_LIGHT
                        : t.surface,
                    }}
                  >
                    <View
                      style={{
                        aspectRatio: 0.71,
                        backgroundColor: '#fff',
                        borderRadius: 4,
                        overflow: 'hidden',
                      }}
                    >
                      {cv ? (
                        <View
                          style={{
                            transform: [{ scale: 0.4 }],
                            transformOrigin: 'top left',
                          }}
                        >
                          <CvPreview cv={cv as PreviewCv} themeId={th.id} />
                        </View>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 99,
                          backgroundColor: th.color,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: sel ? ICV_ACCENT : t.ink,
                          flex: 1,
                        }}
                      >
                        {th.label}
                      </Text>
                      {sel ? <Icon name="check" size={14} color={ICV_ACCENT} /> : null}
                    </View>
                    <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                      {th.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
      <View
        style={{
          padding: 14,
          borderTopWidth: 1,
          borderTopColor: t.border,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <IdnButton variant="ghost" size="md" t={t} onPress={() => router.back()} disabled={busy}>
          {icvStrings.create.cancel}
        </IdnButton>
        <View style={{ flex: 1 }} />
        <IdnButton variant="primary" size="md" t={t} onPress={apply} disabled={!selected || busy}>
          {busy ? '…' : selected ? icvStrings.themes.apply(getCvThemeById(selected).label) : 'Appliquer'}
        </IdnButton>
      </View>
    </View>
  );
}
