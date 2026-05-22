import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useAction, useMutation } from 'convex/react';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { ICV_ACCENT, icvStrings } from '@/data/cv';
import { useActiveCv } from '@/hooks/use-active-cv';

const MAX_SIZE = 5 * 1024 * 1024;

export default function ICVImport() {
  const t = useIdnTheme();
  const router = useRouter();
  const { activeCvId } = useActiveCv();
  const generateUploadUrl = useMutation(api.cv.importInternal.generateUploadUrl);
  const parseAndApply = useAction(api.cv.import.parseAndApply);
  const [file, setFile] = useState<{ uri: string; name: string; size: number; mime: string } | null>(null);
  const [mode, setMode] = useState<'new' | 'merge'>('new');
  const [busy, setBusy] = useState(false);

  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/heic',
        'image/heif',
      ],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    if ((a.size ?? 0) > MAX_SIZE) {
      Alert.alert('Erreur', icvStrings.import.tooLarge);
      return;
    }
    setFile({
      uri: a.uri,
      name: a.name,
      size: a.size ?? 0,
      mime: a.mimeType ?? 'application/pdf',
    });
  }

  async function submit() {
    if (!file || busy) return;
    if (mode === 'merge' && !activeCvId) {
      Alert.alert('Erreur', 'Aucun CV actif. Choisissez « Créer un nouveau CV ».');
      return;
    }
    setBusy(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const blob = await readFileAsBlob(file.uri, file.mime);
      const upload = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.mime },
        body: blob,
      });
      if (!upload.ok) throw new Error(`Upload échoué (${upload.status}).`);
      const json = (await upload.json()) as { storageId: string };

      const result = await parseAndApply({
        storageRef: json.storageId as Id<'_storage'>,
        mode,
        targetCvId: mode === 'merge' ? activeCvId! : undefined,
        newCvName:
          mode === 'new'
            ? `CV importé — ${file.name.replace(/\.[^.]+$/, '')}`
            : undefined,
      });

      Alert.alert(icvStrings.import.success, icvStrings.import.successDesc);
      router.dismissAll();
      router.push(`/icv?cv=${result.cvId}` as never);
    } catch (e) {
      Alert.alert('Erreur', `${icvStrings.import.failed}\n${(e as Error).message ?? ''}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <NSheetHeader t={t} title={icvStrings.import.title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 18, gap: 16 }}>
        <Text style={{ fontSize: 13, color: t.muted }}>{icvStrings.import.desc}</Text>

        <Pressable
          onPress={pick}
          style={{
            borderWidth: 1.5,
            borderColor: t.border,
            borderStyle: 'dashed',
            borderRadius: 14,
            padding: 24,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: t.dark ? '#2A1426' : '#FCE7F3',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="upload" size={22} color={ICV_ACCENT} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.ink }}>
            {file ? file.name : icvStrings.import.pick}
          </Text>
          <Text style={{ fontSize: 11, color: t.muted }}>
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} Mo`
              : icvStrings.import.desc}
          </Text>
        </Pressable>

        <View>
          <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 8 }}>
            {icvStrings.import.modeLabel}
          </Text>
          <View style={{ gap: 8 }}>
            <ModeChoice
              label={icvStrings.import.modeNew}
              selected={mode === 'new'}
              onPress={() => setMode('new')}
            />
            <ModeChoice
              label={icvStrings.import.modeMerge}
              selected={mode === 'merge'}
              onPress={() => setMode('merge')}
              disabled={!activeCvId}
              hint={!activeCvId ? '(aucun CV actif)' : undefined}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <IdnButton variant="ghost" size="md" t={t} onPress={() => router.back()} disabled={busy}>
            {icvStrings.import.cancel}
          </IdnButton>
          <View style={{ flex: 1 }} />
          <IdnButton variant="primary" size="md" t={t} onPress={submit} disabled={!file || busy}>
            {busy ? icvStrings.import.importing : icvStrings.import.submit}
          </IdnButton>
        </View>
      </ScrollView>
    </View>
  );
}

function ModeChoice({
  label,
  selected,
  onPress,
  disabled,
  hint,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  const t = useIdnTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: selected ? idnTokens.green : t.border,
        backgroundColor: selected ? (t.dark ? '#0F2818' : '#DCFCE7') : t.surface,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 99,
          borderWidth: 2,
          borderColor: selected ? idnTokens.green : t.mutedSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? (
          <View
            style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: idnTokens.green }}
          />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: selected ? idnTokens.green : t.ink, fontWeight: '600' }}>
          {label}
        </Text>
        {hint ? <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

async function readFileAsBlob(uri: string, mime: string): Promise<Blob> {
  // Nouvelle API expo-file-system v55 : `File` est un wrapper de Blob.
  // On lit le binaire directement, sans round-trip base64.
  const file = new File(uri);
  const arrayBuffer = await file.arrayBuffer();
  return new Blob([arrayBuffer], { type: mime });
}
