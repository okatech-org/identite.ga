import React, { useEffect } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { Icon, type IconName } from '@/design/icons';
import { api } from '@/lib/api';

type Action = { icon: IconName; l: string; primary?: boolean; danger?: boolean; onPress: () => void };

export default function CourrierDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useConvexAuth();
  const letter = useQuery(api.iboite.letters.get, isAuthenticated && id ? { letterId: id as never } : 'skip');
  const markRead = useMutation(api.iboite.letters.markRead);
  const moveLetter = useMutation(api.iboite.letters.move);

  useEffect(() => {
    if (letter && !letter.isRead) {
      void markRead({ letterId: letter._id as never }).catch(() => {});
    }
  }, [letter, markRead]);

  if (letter === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }
  if (!letter) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <NSheetHeader t={t} title="Courrier" onBack={() => router.back()} />
        <View style={{ flex: 1, padding: 22, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: t.muted, fontSize: 13 }}>Courrier introuvable.</Text>
        </View>
      </View>
    );
  }

  const created = new Date(letter.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const dueLabel = letter.dueAt
    ? new Date(letter.dueAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  async function move(target: 'pending' | 'trash') {
    try {
      await moveLetter({ letterId: id as never, target });
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Action impossible.');
    }
  }

  const replyBody = `\n\n--- Courrier d'origine ---\nDe : ${letter.senderName}\nDate : ${created}\nObjet : ${letter.subject}\n\n${letter.body}`;
  const replyHref =
    `/iboite/compose?subject=${encodeURIComponent(`Re: ${letter.subject.replace(/^Re:\s*/i, '')}`)}` +
    `&body=${encodeURIComponent(replyBody)}`;

  function onPrint() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
      return;
    }
    Alert.alert('Impression', 'L\'impression directe sera disponible dans une prochaine version.');
  }

  const actions: Action[] = [
    { icon: 'reply', l: 'Répondre', primary: true, onPress: () => router.push(replyHref as never) },
    { icon: 'clock', l: 'À traiter', onPress: () => move('pending') },
    { icon: 'printer', l: 'Imprimer', onPress: onPrint },
    { icon: 'trash', l: 'Suppr.', danger: true, onPress: () => move('trash') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader
        t={t}
        title="Courrier"
        onBack={() => router.back()}
        right={<Pressable style={{ padding: 4 }}><Icon name="more" size={18} color={t.muted} /></Pressable>}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 14 }} showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: t.bg }}>
        <View style={{ backgroundColor: '#fffdf7', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ maxWidth: '50%' }}>
              <Text style={{ fontWeight: '700', fontSize: 10, color: '#1a1a1a' }}>{letter.senderName}</Text>
              <Text style={{ fontSize: 10, color: '#3a3a3a' }}>{letter.senderAddress}</Text>
            </View>
            <View style={{ maxWidth: '45%', alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: '700', fontSize: 10, color: '#1a1a1a' }}>{letter.recipientName}</Text>
              <Text style={{ fontSize: 10, color: '#3a3a3a' }}>{letter.recipientAddress}</Text>
            </View>
          </View>
          <Text style={{ textAlign: 'right', fontSize: 10, color: '#3a3a3a', marginTop: 14 }}>{created}</Text>
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#d6d2c4', paddingBottom: 6, marginTop: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a1a1a' }}>Objet : {letter.subject}</Text>
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#2a2a2a' }}>{letter.body}</Text>
          </View>
        </View>

        {letter.type === 'action_required' && dueLabel ? (
          <View style={{ backgroundColor: t.dark ? '#1F1216' : '#FBE5E5', borderWidth: 1, borderColor: t.dark ? '#3A1E1E' : '#F5C7C7', borderRadius: 12, padding: 12, marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Icon name="alert" size={16} color="#B83A3A" />
            <View>
              <Text style={{ fontSize: 12, color: '#B83A3A', fontWeight: '700' }}>Action requise</Text>
              <Text style={{ fontSize: 11, color: t.ink2, marginTop: 2 }}>Réponse attendue avant le {dueLabel}</Text>
            </View>
          </View>
        ) : null}

        {letter.attachments.length > 0 ? (
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', marginBottom: 8 }}>PIÈCES JOINTES</Text>
            <View style={{ gap: 6 }}>
              {letter.attachments.map((a) => (
                <View key={a._id} style={{ padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name="paper" size={18} color={t.ink2} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: t.ink, fontWeight: '500' }}>{a.name}</Text>
                    <Text style={{ fontSize: 10, color: t.muted, marginTop: 1 }}>{Math.max(1, Math.round(a.size / 1024))} KB</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 4 }}>
          {actions.map((a, i) => (
            <Pressable key={i} onPress={a.onPress} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', gap: 4 }}>
              <Icon name={a.icon} size={18} color={a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2} />
              <Text style={{ fontSize: 10, fontWeight: '500', color: a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2 }}>{a.l}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
