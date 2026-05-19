import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useMutation } from 'convex/react';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { ICV_ACCENT, ICV_ACCENT_SOFT_DARK, ICV_ACCENT_SOFT_LIGHT, ICV_THEMES, icvStrings, THEME_CATEGORIES, type CvThemeId } from '@/data/cv';
import { useIdnTheme } from '@/design/theme';

/**
 * Section « Choisir un thème » — affichée dans la home iCV (compact) ou
 * en plein écran (mode `expanded`). Appelle `cv.profile.setTheme`.
 */
export function ThemePicker({
  cvId,
  activeTheme,
  onOpenGallery,
}: {
  cvId: Id<'citizenCv'>;
  activeTheme: CvThemeId;
  onOpenGallery?: () => void;
}) {
  const t = useIdnTheme();
  const setTheme = useMutation(api.cv.profile.setTheme);
  const [pending, setPending] = useState<CvThemeId | null>(null);

  async function pick(id: CvThemeId) {
    if (pending || id === activeTheme) return;
    setPending(id);
    try {
      await setTheme({ cvId, theme: id });
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? 'Action impossible.');
    } finally {
      setPending(null);
    }
  }

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 14,
        padding: 14,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 99,
            backgroundColor: ICV_ACCENT,
          }}
        />
        <Text style={{ fontSize: 13, fontWeight: '700', color: t.ink, flex: 1 }}>
          {icvStrings.themes.title}
        </Text>
        {onOpenGallery ? (
          <Pressable onPress={onOpenGallery} hitSlop={8}>
            <Text style={{ fontSize: 11, color: t.muted, fontWeight: '500' }}>
              Galerie →
            </Text>
          </Pressable>
        ) : null}
      </View>

      {THEME_CATEGORIES.map((cat) => (
        <View key={cat} style={{ marginTop: 6 }}>
          <Text
            style={{
              fontSize: 9,
              color: t.muted,
              fontWeight: '700',
              letterSpacing: 1.2,
              paddingVertical: 4,
            }}
          >
            {cat.toUpperCase()}
          </Text>
          {ICV_THEMES.filter((th) => th.category === cat).map((th) => {
            const sel = th.id === activeTheme;
            return (
              <Pressable
                key={th.id}
                onPress={() => pick(th.id)}
                disabled={pending !== null}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: sel
                    ? t.dark
                      ? ICV_ACCENT_SOFT_DARK
                      : ICV_ACCENT_SOFT_LIGHT
                    : 'transparent',
                  opacity: pending && pending !== th.id ? 0.5 : 1,
                }}
              >
                <View
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 99,
                    backgroundColor: th.color,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12.5,
                      fontWeight: '600',
                      color: sel ? ICV_ACCENT : t.ink,
                    }}
                  >
                    {th.label}
                  </Text>
                  <Text
                    style={{ fontSize: 10.5, color: t.muted }}
                    numberOfLines={1}
                  >
                    {th.desc}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
