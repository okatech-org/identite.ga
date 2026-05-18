import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { Icon, type IconName } from '@/design/icons';

const ACTIONS: { icon: IconName; l: string; primary?: boolean; danger?: boolean }[] = [
  { icon: 'reply',   l: 'Répondre', primary: true },
  { icon: 'clock',   l: 'À traiter' },
  { icon: 'printer', l: 'Imprimer' },
  { icon: 'trash',   l: 'Suppr.', danger: true },
];

export default function CourrierDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader t={t} title="Courrier" onBack={() => router.back()} right={<Pressable style={{ padding: 4 }}><Icon name="more" size={18} color={t.muted} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 14 }} showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: t.bg }}>
        {/* A4 paper */}
        <View style={{ backgroundColor: '#fffdf7', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 24, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ maxWidth: '50%' }}>
              <Text style={{ fontWeight: '700', fontSize: 10, color: '#1a1a1a' }}>Mairie de Libreville</Text>
              <Text style={{ fontSize: 10, color: '#3a3a3a' }}>Service État Civil</Text>
              <Text style={{ fontSize: 10, color: '#3a3a3a' }}>BP 123 Libreville</Text>
            </View>
            <View style={{ maxWidth: '45%', alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: '700', fontSize: 10, color: '#1a1a1a' }}>Jean Dupont</Text>
              <Text style={{ fontSize: 10, color: '#3a3a3a' }}>BP 1000</Text>
              <Text style={{ fontSize: 10, color: '#3a3a3a' }}>Libreville, GABON</Text>
            </View>
          </View>
          <Text style={{ textAlign: 'right', fontSize: 10, color: '#3a3a3a', marginTop: 14 }}>Libreville, le 15 mai 2026</Text>
          <View style={{ borderBottomWidth: 1, borderBottomColor: '#d6d2c4', paddingBottom: 6, marginTop: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#1a1a1a' }}>Objet : Complément de dossier requis</Text>
          </View>
          <View style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#2a2a2a' }}>Monsieur,</Text>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#2a2a2a', marginTop: 8 }}>
              Suite à l'examen de votre dossier de demande d'acte de naissance, nous avons constaté qu'il manque une pièce justificative.
            </Text>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#2a2a2a', marginTop: 8 }}>
              Nous vous prions de bien vouloir nous transmettre dans les meilleurs délais :
            </Text>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#2a2a2a', marginTop: 4, marginLeft: 14 }}>• Une copie de votre pièce d'identité</Text>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#2a2a2a', marginLeft: 14 }}>• Un justificatif de domicile récent</Text>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#2a2a2a', marginTop: 8 }}>
              Sans réponse de votre part sous 15 jours, votre dossier sera classé sans suite.
            </Text>
            <Text style={{ fontSize: 11, lineHeight: 19, color: '#1d3a6a', marginTop: 14, textAlign: 'right', fontStyle: 'italic' }}>Le Service de l'État Civil</Text>
          </View>
        </View>

        {/* Action requise */}
        <View style={{ backgroundColor: t.dark ? '#1F1216' : '#FBE5E5', borderWidth: 1, borderColor: t.dark ? '#3A1E1E' : '#F5C7C7', borderRadius: 12, padding: 12, marginTop: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Icon name="alert" size={16} color="#B83A3A" />
          <View>
            <Text style={{ fontSize: 12, color: '#B83A3A', fontWeight: '700' }}>Action requise</Text>
            <Text style={{ fontSize: 11, color: t.ink2, marginTop: 2 }}>Réponse attendue avant le 30 mai 2026</Text>
          </View>
        </View>
      </ScrollView>
      {/* Toolbar actions */}
      <View style={{ borderTopWidth: 1, borderTopColor: t.borderSoft, backgroundColor: t.surface, paddingHorizontal: 14, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 4 }}>
          {ACTIONS.map((a, i) => (
            <Pressable key={i} style={{ flex: 1, paddingVertical: 8, alignItems: 'center', gap: 4 }}>
              <Icon name={a.icon} size={18} color={a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2} />
              <Text style={{ fontSize: 10, fontWeight: '500', color: a.primary ? idnTokens.green : a.danger ? '#B83A3A' : t.ink2 }}>{a.l}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
