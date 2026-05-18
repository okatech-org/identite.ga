import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { Icon, type IconName } from '@/design/icons';
import { api } from '@/lib/api';

type Action = { icon: IconName; l: string; primary?: boolean; danger?: boolean; onPress: () => void };

export default function EmailDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useConvexAuth();
  const email = useQuery(api.iboite.messages.get, isAuthenticated && id ? { messageId: id as never } : 'skip');
  const markRead = useMutation(api.iboite.messages.markRead);
  const toggleStar = useMutation(api.iboite.messages.toggleStar);
  const move = useMutation(api.iboite.messages.move);

  useEffect(() => {
    if (email && !email.isRead) {
      void markRead({ messageId: email._id as never }).catch(() => {});
    }
  }, [email, markRead]);

  if (email === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }
  if (!email) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <NSheetHeader t={t} title="Message" onBack={() => router.back()} />
        <View style={{ flex: 1, padding: 22, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: t.muted, fontSize: 13 }}>Message introuvable.</Text>
        </View>
      </View>
    );
  }

  const date = new Date(email.createdAt).toLocaleString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  async function onDelete() {
    try {
      await move({ messageId: id as never, target: 'trash' });
      router.back();
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Action impossible.');
    }
  }

  const replyTo = email.senderKind === 'admin' ? email.senderEmail : email.senderEmail;
  const replyBody = `\n\n--- Message d'origine ---\nDe : ${email.senderName} <${email.senderEmail}>\nDate : ${date}\nObjet : ${email.subject}\n\n${email.body}`;
  const replyHref =
    `/iboite/compose?to=${encodeURIComponent(replyTo)}` +
    `&subject=${encodeURIComponent(`Re: ${email.subject.replace(/^Re:\s*/i, '')}`)}` +
    `&body=${encodeURIComponent(replyBody)}`;
  const fwdHref =
    `/iboite/compose?subject=${encodeURIComponent(`Tr: ${email.subject.replace(/^(Re|Tr|Fwd):\s*/i, '')}`)}` +
    `&body=${encodeURIComponent(replyBody)}`;

  async function onArchive() {
    Alert.alert(
      'Bientôt disponible',
      'L\'archivage sera proposé dans la prochaine version. En attendant, marquez ce message comme favori (étoile) pour le retrouver facilement.',
    );
  }

  const actions: Action[] = [
    { icon: 'reply', l: 'Répondre', primary: true, onPress: () => router.push(replyHref as never) },
    { icon: 'forward', l: 'Transférer', onPress: () => router.push(fwdHref as never) },
    { icon: 'archive', l: 'Archiver', onPress: onArchive },
    { icon: 'trash', l: 'Suppr.', danger: true, onPress: onDelete },
  ];

  const isAdmin = email.senderKind === 'admin';

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader
        t={t}
        title="Message"
        onBack={() => router.back()}
        right={
          <Pressable onPress={async () => { try { await toggleStar({ messageId: id as never }); } catch { /* ignore */ } }} style={{ padding: 4 }}>
            <Icon name={email.isStarred ? 'star' : 'starO'} size={18} color={email.isStarred ? idnTokens.yellow : t.muted} />
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, letterSpacing: -0.3, lineHeight: 24 }}>{email.subject}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: isAdmin ? '#3b82f6' : '#10b981', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={isAdmin ? 'building' : 'user'} size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{email.senderName}</Text>
            <Text style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono }}>{email.senderEmail}</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>À : {email.recipientEmail} · {date}</Text>
          </View>
        </View>
        <View style={{ paddingTop: 14 }}>
          <Text style={{ fontSize: 13, lineHeight: 22, color: t.ink2 }}>{email.body}</Text>
        </View>
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), flexDirection: 'row', gap: 4 }}>
        {actions.map((a, i) => (
          <Pressable key={i} onPress={a.onPress} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', gap: 4 }}>
            <Icon name={a.icon} size={18} color={a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2} />
            <Text style={{ fontSize: 10, fontWeight: '500', color: a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2 }}>{a.l}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
