import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { icvStrings } from '@/data/cv';

export default function ICVCreate() {
  const t = useIdnTheme();
  const router = useRouter();
  const cvs = useQuery(api.cv.cvs.listMine);
  const create = useMutation(api.cv.cvs.create);
  const [name, setName] = useState('');
  const [copyFrom, setCopyFrom] = useState<Id<'citizenCv'> | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    const trimmed = name.trim();
    if (trimmed.length < 1) {
      Alert.alert('Erreur', 'Donnez un nom à votre CV.');
      return;
    }
    setBusy(true);
    try {
      const id = await create({ name: trimmed, copyFromCvId: copyFrom ?? undefined });
      router.dismissAll();
      router.push(`/icv?cv=${id}` as never);
    } catch (e) {
      const msg = (e as Error).message ?? '';
      Alert.alert(
        'Erreur',
        msg.includes('CV_LIMIT_REACHED') ? icvStrings.list.limit : msg,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <NSheetHeader t={t} title={icvStrings.create.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>
            {icvStrings.create.nameLabel}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={icvStrings.create.namePh}
            placeholderTextColor={t.mutedSoft}
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

        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>
            {icvStrings.create.copyFromLabel}
          </Text>
          <View style={{ gap: 6 }}>
            <Pressable
              onPress={() => setCopyFrom(null)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: copyFrom === null ? idnTokens.green : t.border,
                backgroundColor: copyFrom === null ? (t.dark ? '#0F2818' : '#DCFCE7') : t.surface,
              }}
            >
              <Text style={{ color: copyFrom === null ? idnTokens.green : t.ink, fontWeight: '600' }}>
                {icvStrings.create.copyFromEmpty}
              </Text>
            </Pressable>
            {(cvs ?? []).map((cv) => {
              const sel = copyFrom === cv._id;
              return (
                <Pressable
                  key={cv._id}
                  onPress={() => setCopyFrom(cv._id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: sel ? idnTokens.green : t.border,
                    backgroundColor: sel ? (t.dark ? '#0F2818' : '#DCFCE7') : t.surface,
                  }}
                >
                  <Text style={{ color: sel ? idnTokens.green : t.ink, fontWeight: '600' }}>
                    {cv.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <IdnButton variant="ghost" size="md" t={t} onPress={() => router.back()} disabled={busy}>
            {icvStrings.create.cancel}
          </IdnButton>
          <View style={{ flex: 1 }} />
          <IdnButton variant="primary" size="md" t={t} onPress={submit} disabled={busy}>
            {busy ? '…' : icvStrings.create.create}
          </IdnButton>
        </View>
      </ScrollView>
    </View>
  );
}
