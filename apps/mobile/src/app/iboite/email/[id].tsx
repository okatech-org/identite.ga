import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { Icon, type IconName } from '@/design/icons';
import { MOCK_EMAILS } from '@/data/mailbox';

const ACTIONS: { icon: IconName; l: string; primary?: boolean; danger?: boolean }[] = [
  { icon: 'reply',   l: 'Répondre', primary: true },
  { icon: 'forward', l: 'Transférer' },
  { icon: 'archive', l: 'Archiver' },
  { icon: 'trash',   l: 'Suppr.', danger: true },
];

export default function EmailDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = MOCK_EMAILS.find(m => m.id === id) ?? MOCK_EMAILS[0];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader t={t} title="Message" onBack={() => router.back()} right={<Pressable style={{ padding: 4 }}><Icon name="star" size={18} color={idnTokens.yellow} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, letterSpacing: -0.3, lineHeight: 24 }}>{e.subject}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="building" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{e.sender.name}</Text>
            <Text style={{ fontSize: 11, color: t.muted, fontFamily: idnTokens.mono }}>{e.sender.email}</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>À : jean.dupont@idn.ga · 15 mai 2026, 09:32</Text>
          </View>
        </View>
        <View style={{ paddingTop: 14 }}>
          <Text style={{ fontSize: 13, lineHeight: 22, color: t.ink2 }}>Bonjour Monsieur Dupont,</Text>
          <Text style={{ fontSize: 13, lineHeight: 22, color: t.ink2, marginTop: 10 }}>
            Votre demande a été enregistrée sous le numéro <Text style={{ fontFamily: idnTokens.mono, color: t.ink, fontWeight: '700' }}>#2024-12345</Text>. Vous recevrez une réponse définitive sous 3 à 5 jours ouvrés.
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 22, color: t.ink2, marginTop: 10 }}>
            Vous pouvez suivre l'avancement de votre dossier depuis votre espace personnel sur idn.ga.
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 22, color: t.muted, marginTop: 16 }}>Cordialement,{'\n'}L'équipe État Civil</Text>
        </View>

        {/* Pièce jointe */}
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', marginBottom: 8 }}>PIÈCE JOINTE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12 }}>
            <View style={{ width: 36, height: 44, borderRadius: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: idnTokens.blue, fontSize: 9, fontWeight: '700' }}>PDF</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: t.ink, fontWeight: '500' }}>Confirmation_2024-12345.pdf</Text>
              <Text style={{ fontSize: 10, color: t.muted }}>248 KB</Text>
            </View>
            <Pressable><Text style={{ color: idnTokens.green, fontSize: 12, fontWeight: '600' }}>Télécharger</Text></Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), flexDirection: 'row', gap: 4 }}>
        {ACTIONS.map((a, i) => (
          <Pressable key={i} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', gap: 4 }}>
            <Icon name={a.icon} size={18} color={a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2} />
            <Text style={{ fontSize: 10, fontWeight: '500', color: a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2 }}>{a.l}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
