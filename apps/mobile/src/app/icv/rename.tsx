import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { icvStrings } from '@/data/cv';

export default function ICVRename() {
  const params = useLocalSearchParams<{ cv?: string; name?: string }>();
  const cvId = params.cv as Id<'citizenCv'> | undefined;
  const t = useIdnTheme();
  const router = useRouter();
  const rename = useMutation(api.cv.cvs.rename);
  const [name, setName] = useState(params.name ?? '');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !cvId) return;
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      Alert.alert('Erreur', 'Le nom ne peut pas être vide.');
      return;
    }
    setBusy(true);
    try {
      await rename({ cvId, name: trimmed });
      router.back();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? 'Échec.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <NSheetHeader t={t} title={icvStrings.rename.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>
            {icvStrings.rename.nameLabel}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={80}
            style={{
              backgroundColor: t.surface,
              borderWidth: 1,
              borderColor: t.border,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              color: t.ink,
              fontSize: 14,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <IdnButton variant="ghost" size="md" t={t} onPress={() => router.back()} disabled={busy}>
            {icvStrings.rename.cancel}
          </IdnButton>
          <View style={{ flex: 1 }} />
          <IdnButton variant="primary" size="md" t={t} onPress={submit} disabled={busy}>
            {busy ? '…' : icvStrings.rename.save}
          </IdnButton>
        </View>
      </ScrollView>
    </View>
  );
}
