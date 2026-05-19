import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text } from 'react-native';
import { useAction } from 'convex/react';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { icvStrings } from '@/data/cv';

/**
 * Bouton « PDF » mobile : appelle `cv.export.renderPdf` puis ouvre l'URL
 * signée dans le navigateur natif (Linking.openURL). L'utilisateur peut
 * sauver / partager le PDF depuis là.
 */
export function PdfButton({
  cvId,
  size = 'md',
  variant = 'primary',
}: {
  cvId: Id<'citizenCv'>;
  size?: 'sm' | 'md';
  variant?: 'primary' | 'outline';
}) {
  const renderPdf = useAction(api.cv.export.renderPdf);
  const [pending, setPending] = useState(false);

  async function handlePress() {
    if (pending) return;
    setPending(true);
    try {
      const result = await renderPdf({ cvId });
      const ok = await Linking.canOpenURL(result.url);
      if (!ok) {
        Alert.alert('Erreur', "Impossible d'ouvrir le PDF.");
        return;
      }
      await Linking.openURL(result.url);
    } catch (e) {
      const msg = (e as Error).message ?? '';
      Alert.alert(
        'Erreur',
        msg.includes('cvExport') || msg.includes('RATE_LIMIT')
          ? icvStrings.actions.pdfRateLimit
          : icvStrings.actions.pdfFailed,
      );
    } finally {
      setPending(false);
    }
  }

  const bg = variant === 'primary' ? idnTokens.green : 'transparent';
  const fg = variant === 'primary' ? '#fff' : idnTokens.green;
  const pad = size === 'sm' ? { x: 12, y: 6 } : { x: 14, y: 8 };

  return (
    <Pressable
      onPress={handlePress}
      disabled={pending}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: pad.x,
        paddingVertical: pad.y,
        backgroundColor: bg,
        borderRadius: 9999,
        opacity: pending ? 0.6 : 1,
        borderWidth: variant === 'outline' ? 1 : 0,
        borderColor: idnTokens.green,
      }}
    >
      {pending ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Icon name="download" size={size === 'sm' ? 12 : 14} color={fg} />
      )}
      <Text
        style={{
          fontSize: size === 'sm' ? 12 : 13,
          fontWeight: '600',
          color: fg,
        }}
      >
        {pending ? icvStrings.actions.preparing : icvStrings.actions.pdf}
      </Text>
    </Pressable>
  );
}
