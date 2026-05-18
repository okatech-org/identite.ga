import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { Icon } from '@/design/icons';

export default function ICarteCompose() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader
        t={t}
        title="Nouveau message"
        onBack={() => router.back()}
        right={<Pressable style={{ padding: 4 }}><Icon name="send" size={18} color={idnTokens.green} /></Pressable>}
      />
      <View style={{ flex: 1, paddingHorizontal: 22 }}>
        <View style={{ borderBottomWidth: 1, borderBottomColor: t.borderSoft, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: t.muted, width: 36, fontWeight: '500' }}>De</Text>
          <Text style={{ fontSize: 13, color: t.ink }}>jean.dupont@idn.ga</Text>
        </View>
        <View style={{ borderBottomWidth: 1, borderBottomColor: t.borderSoft, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 12, color: t.muted, width: 36, fontWeight: '500' }}>À</Text>
          <TextInput
            value={to}
            onChangeText={setTo}
            placeholder="destinataire@…"
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
      <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Icon name="paper" size={14} color={t.ink2} />
          <Text style={{ color: t.ink2, fontSize: 12, fontWeight: '500' }}>Joindre</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <IdnButton t={t} variant="ghost" size="sm">Brouillon</IdnButton>
        <IdnButton t={t} variant="primary" size="sm" leadIcon={<Icon name="send" size={14} color="#fff" />}>Envoyer</IdnButton>
      </View>
    </View>
  );
}
