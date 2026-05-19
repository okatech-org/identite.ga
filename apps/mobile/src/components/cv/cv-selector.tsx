import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { ICV_ACCENT, ICV_ACCENT_SOFT_DARK, ICV_ACCENT_SOFT_LIGHT, icvStrings } from '@/data/cv';

interface CvSummary {
  _id: string;
  name: string;
  isDefault: boolean;
}

/**
 * Sélecteur de CV mobile : un chip qui affiche le CV actif + bouton « + ».
 * Au tap, navigue vers `/icv/list` qui sert aussi de sélecteur.
 */
export function CvSelector({
  active,
  onCreate,
}: {
  active: CvSummary | null;
  onCreate: () => void;
}) {
  const t = useIdnTheme();
  const router = useRouter();
  if (!active) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable
        onPress={() => router.push('/icv/list' as never)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 9999,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ fontSize: 13, fontWeight: '600', color: t.ink, maxWidth: 160 }}
        >
          {active.name}
        </Text>
        {active.isDefault ? (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1,
              backgroundColor: t.dark ? ICV_ACCENT_SOFT_DARK : ICV_ACCENT_SOFT_LIGHT,
              borderRadius: 9999,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '700', color: ICV_ACCENT }}>
              {icvStrings.selector.principal}
            </Text>
          </View>
        ) : null}
        <Icon name="arrow" size={12} color={t.mutedSoft} />
      </Pressable>
      <Pressable
        onPress={onCreate}
        hitSlop={8}
        style={{
          width: 32,
          height: 32,
          borderRadius: 9999,
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="plus" size={16} color={idnTokens.green} />
      </Pressable>
    </View>
  );
}
