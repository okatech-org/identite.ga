import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { iboiteFr } from '@/data/iboite-fr';

/**
 * Composition d'un courrier physique iBoîte (équivalent mobile du
 * `LetterComposeModal` web). Sans éditeur riche dans cette première
 * mouture mobile — un textarea suffit. Les PJ sont à ajouter dans un
 * second passage (expo-document-picker → generateUploadUrl → send).
 */
export default function IBoiteCourrierCompose() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ to?: string; subject?: string; body?: string }>();
  const { isAuthenticated } = useConvexAuth();
  const accounts = useQuery(api.iboite.accounts.listMine, isAuthenticated ? {} : 'skip');
  const send = useMutation(api.iboite.letters.send);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState((params.to as string | undefined) ?? '');
  const [subject, setSubject] = useState((params.subject as string | undefined) ?? '');
  const [body, setBody] = useState((params.body as string | undefined) ?? '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accountId && accounts && accounts.length > 0) setAccountId(accounts[0]._id);
  }, [accounts, accountId]);

  const senderEmail = accounts?.find((a) => a._id === accountId)?.emailAlias ?? '—';

  async function submit() {
    if (submitting) return;
    if (!accountId) {
      Alert.alert('Aucun compte', 'Aucun compte iBoîte actif.');
      return;
    }
    if (!toEmail.trim()) {
      Alert.alert('Destinataire requis', 'Saisissez une adresse iBoîte (login ou alias @idn.ga).');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Objet requis', 'Donnez un objet à votre courrier.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Courrier vide', 'Écrivez le contenu de votre courrier.');
      return;
    }
    setSubmitting(true);
    try {
      await send({
        accountId: accountId as never,
        recipientEmail: toEmail.trim().toLowerCase(),
        subject: subject.trim(),
        body: body.trim(),
      });
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Envoi impossible.');
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader
        t={t}
        title={iboiteFr.compose.titleLetter}
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
            placeholder="login ou destinataire@idn.ga"
            placeholderTextColor={t.muted}
            autoCapitalize="none"
            keyboardType="email-address"
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
          placeholder="Rédigez votre courrier…"
          placeholderTextColor={t.muted}
          multiline
          textAlignVertical="top"
          style={{ flex: 1, fontSize: 13, color: t.ink, lineHeight: 21, paddingVertical: 14 }}
        />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable
          onPress={() => Alert.alert('Bientôt disponible', 'Les pièces jointes seront ajoutées dans une prochaine version.')}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}
        >
          <Icon name="paper" size={14} color={t.ink2} />
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500' }}>Joindre</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <IdnButton t={t} variant="primary" size="sm" leadIcon={<Icon name="send" size={14} color="#fff" />} onPress={submit} disabled={submitting}>
          {submitting ? '…' : 'Envoyer'}
        </IdnButton>
      </View>
    </View>
  );
}
