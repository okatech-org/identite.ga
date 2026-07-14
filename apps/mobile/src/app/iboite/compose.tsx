import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { iboiteFr } from '@/data/iboite-fr';
import { resolveActiveAccountId, useIBoiteActiveAccount } from '@/lib/iboite-active-account';

// Pièces jointes : même flux que `courrier/compose.tsx`
// (`expo-document-picker → generateUploadUrl → POST → send`). On accumule
// les fichiers en mémoire puis on les uploade au moment de l'envoi.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_LABEL = '10 Mo';

type PickedAttachment = {
  name: string;
  size: number;
  mime: string;
  bytes: Uint8Array;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pickAttachment(): Promise<PickedAttachment | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async () => {
        const f = input.files?.[0];
        if (!f) {
          resolve(null);
          return;
        }
        const buf = new Uint8Array(await f.arrayBuffer());
        resolve({
          name: f.name,
          size: f.size,
          mime: f.type || 'application/octet-stream',
          bytes: buf,
        });
      };
      input.click();
    });
  }
  const res = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled || !res.assets[0]) return null;
  const asset = res.assets[0];
  const b64 = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: 'base64' as never,
  });
  const bytes = base64ToBytes(b64);
  return {
    name: asset.name,
    size: asset.size ?? bytes.length,
    mime: asset.mimeType ?? 'application/octet-stream',
    bytes,
  };
}

export default function IBoiteCompose() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    to?: string;
    subject?: string;
    body?: string;
    replyToId?: string;
    mode?: 'reply' | 'replyAll' | 'forward';
  }>();
  const { isAuthenticated } = useConvexAuth();
  const accounts = useQuery(api.iboite.accounts.listMine, isAuthenticated ? {} : 'skip');
  const send = useMutation(api.iboite.messages.send);
  const generateUploadUrl = useMutation(api.iboite.messages.generateUploadUrl);
  // Réponse / transfert : on lit le message d'origine via Convex pour
  // pré-remplir proprement destinataire / objet / citation (au lieu de
  // tout passer en query params).
  const replyToId = (params.replyToId as string | undefined) ?? null;
  // Note V1 : 'replyAll' = 'reply' au pré-remplissage tant que le modèle
  // `iboiteMessage` n'a pas de champ `cc[]`. Comportement identique côté UX
  // — sera précisé quand la conv supportera plusieurs destinataires.
  const mode = (params.mode as 'reply' | 'replyAll' | 'forward' | undefined) ?? 'reply';
  const original = useQuery(
    api.iboite.messages.get,
    isAuthenticated && replyToId ? { messageId: replyToId as never } : 'skip',
  );

  const { activeAccountId } = useIBoiteActiveAccount();
  const accountId = resolveActiveAccountId(accounts, activeAccountId);
  const [toEmail, setToEmail] = useState((params.to as string | undefined) ?? '');
  const [toName, setToName] = useState('');
  const [subject, setSubject] = useState((params.subject as string | undefined) ?? '');
  const [body, setBody] = useState((params.body as string | undefined) ?? '');
  const [attachments, setAttachments] = useState<PickedAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Sentinel pour ne pré-remplir qu'une seule fois (sinon l'effet ré-écrase
  // les modifs que l'utilisateur fait pendant la frappe).
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (prefilled || !original) return;
    const stripPrefix = (s: string) => s.replace(/^(Re|Tr|Fwd):\s*/i, '');
    const date = new Date(original.createdAt).toLocaleString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    const quote = `\n\n--- Message d'origine ---\nDe : ${original.senderName} <${original.senderEmail}>\nDate : ${date}\nObjet : ${original.subject}\n\n${original.body}`;
    if (mode === 'forward') {
      setSubject((prev) => prev || `Tr: ${stripPrefix(original.subject)}`);
    } else {
      setToEmail((prev) => prev || original.senderEmail);
      setToName((prev) => prev || original.senderName);
      setSubject((prev) => prev || `Re: ${stripPrefix(original.subject)}`);
    }
    setBody((prev) => prev || quote);
    setPrefilled(true);
  }, [original, mode, prefilled]);

  const senderEmail = accounts?.find((a) => a._id === accountId)?.emailAlias ?? '—';

  async function onAttach() {
    try {
      const f = await pickAttachment();
      if (!f) return;
      if (f.size > MAX_ATTACHMENT_BYTES) {
        Alert.alert('Fichier trop volumineux', `Chaque pièce jointe est limitée à ${MAX_ATTACHMENT_LABEL}.`);
        return;
      }
      setAttachments((prev) => [...prev, f]);
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Sélection impossible.');
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit() {
    if (submitting) return;
    if (!accountId) {
      Alert.alert('Aucun compte', iboiteFr.compose.errors.noAccount);
      return;
    }
    if (!toEmail.trim() || !toEmail.includes('@')) {
      Alert.alert('Destinataire invalide', 'Saisissez une adresse email valide.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Objet requis', 'Donnez un objet à votre message.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Message vide', 'Écrivez votre message.');
      return;
    }
    setSubmitting(true);
    try {
      // Upload des pièces jointes vers `_storage`, puis collecte des
      // références à passer à `send`.
      const uploaded: { name: string; size: number; storageRef: string; mimeType: string }[] = [];
      for (const att of attachments) {
        const uploadUrl = await generateUploadUrl({});
        const blob = new Blob([att.bytes as unknown as BlobPart], { type: att.mime });
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': att.mime },
          body: blob,
        });
        if (!uploadRes.ok) throw new Error(`Upload échoué (${uploadRes.status})`);
        const { storageId } = (await uploadRes.json()) as { storageId: string };
        uploaded.push({
          name: att.name,
          size: att.size,
          storageRef: storageId,
          mimeType: att.mime,
        });
      }

      await send({
        accountId: accountId as never,
        recipientEmail: toEmail.trim().toLowerCase(),
        recipientName: toName.trim() || toEmail.trim().split('@')[0],
        subject: subject.trim(),
        body: body.trim(),
        attachments: uploaded.length > 0 ? (uploaded as never) : undefined,
      });
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Envoi impossible.');
      setSubmitting(false);
    }
  }

  return (
    // Présenté en `formSheet` (cf. iboite/_layout) → pas de `insets.top`,
    // iOS gère la safe area du sheet.
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <NSheetHeader
        t={t}
        title=""
        onBack={() => router.back()}
        right={
          <Pressable onPress={submit} disabled={submitting} style={{ padding: 4 }}>
            <Icon name="send" size={18} color={submitting ? t.muted : idnTokens.green} />
          </Pressable>
        }
      />
      <View style={{ flex: 1, paddingHorizontal: 22 }}>
        <View style={{ borderBottomWidth: 1, borderBottomColor: t.borderSoft, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: t.muted, width: 36, fontWeight: '500' }}>De</Text>
          <Text style={{ fontSize: 13, color: t.ink }}>{senderEmail}</Text>
        </View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: t.borderSoft, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: t.muted, width: 36, fontWeight: '500' }}>À</Text>
          <TextInput
            value={toEmail}
            onChangeText={setToEmail}
            placeholder="destinataire@…"
            placeholderTextColor={t.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ flex: 1, fontSize: 13, color: t.ink }}
          />
        </View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: t.borderSoft, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: t.muted, width: 36, fontWeight: '500' }}>Nom</Text>
          <TextInput
            value={toName}
            onChangeText={setToName}
            placeholder="Nom du destinataire (optionnel)"
            placeholderTextColor={t.muted}
            style={{ flex: 1, fontSize: 13, color: t.ink }}
          />
        </View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: t.borderSoft, paddingVertical: 12 }}>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Objet"
            placeholderTextColor={t.muted}
            style={{ fontSize: 14, color: t.ink, fontWeight: '600' }}
          />
        </View>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Votre message…"
          placeholderTextColor={t.muted}
          multiline
          textAlignVertical="top"
          style={{ flex: 1, fontSize: 13, color: t.ink, lineHeight: 21, paddingVertical: 14 }}
        />
      </View>
      {attachments.length > 0 ? (
        <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, paddingHorizontal: 22, paddingVertical: 8, gap: 6 }}>
          {attachments.map((a, i) => (
            <View
              key={`${a.name}-${i}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
            >
              <Icon name="paper" size={14} color={t.ink2} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{ fontSize: 12, color: t.ink, fontWeight: '500' }}>{a.name}</Text>
                <Text style={{ fontSize: 10, color: t.muted }}>{formatBytes(a.size)}</Text>
              </View>
              <Pressable
                onPress={() => removeAttachment(i)}
                disabled={submitting}
                accessibilityLabel={`Retirer ${a.name}`}
                hitSlop={8}
                style={{ padding: 2 }}
              >
                <Icon name="close" size={16} color={t.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable
          onPress={onAttach}
          disabled={submitting}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Icon name="paper" size={14} color={t.ink2} />
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500' }}>Joindre</Text>
          <Text style={{ color: t.muted, fontSize: 11 }}>Max {MAX_ATTACHMENT_LABEL}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <IdnButton t={t} variant="primary" size="sm" leadIcon={<Icon name="send" size={14} color="#fff" />} onPress={submit} disabled={submitting}>
          {submitting ? '…' : 'Envoyer'}
        </IdnButton>
      </View>
    </View>
  );
}
