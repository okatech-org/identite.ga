import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { SetMobileRow } from '@/components/rows/setting-row';
import { IdnMark, IdnFlagBars } from '@/design/mark';

const LEGAL_BASE = 'https://identite.ga/legal';
const openLegal = (slug: string) => WebBrowser.openBrowserAsync(`${LEGAL_BASE}/${slug}`);

export default function SettingsAbout() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="À propos" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 22 }}>
        <View style={{
          backgroundColor: t.surface, borderWidth: 1, borderColor: t.border,
          borderRadius: 14, padding: 22, alignItems: 'center',
        }}>
          <IdnMark size={56} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: t.ink, marginTop: 12 }}>Identité Numérique</Text>
          <Text style={{ fontSize: 12, color: t.muted, marginTop: 4 }}>Ntsagui digital</Text>
          <Text style={{ fontFamily: idnTokens.mono, fontSize: 11, color: t.muted, marginTop: 14 }}>v{version}</Text>
        </View>
        <Text style={{ fontSize: 13, color: t.ink2, lineHeight: 21, paddingHorizontal: 4, paddingVertical: 20 }}>
          IDN est l'infrastructure de confiance qui relie chaque citoyen, résident et visiteur à l'ensemble des services administratifs en ligne. Opéré par Ntsagui digital.
        </Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} label="Conditions d'utilisation" onPress={() => openLegal('terms')} />
          <SetMobileRow t={t} label="Politique de confidentialité" onPress={() => openLegal('privacy')} />
          <SetMobileRow t={t} label="Mentions légales" onPress={() => openLegal('mentions')} />
          <SetMobileRow t={t} label="Accessibilité (RGAA)" onPress={() => openLegal('accessibilite')} />
          <SetMobileRow t={t} label="Licences open source" onPress={() => openLegal('licenses')} />
        </View>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden', marginTop: 12 }}>
          <SetMobileRow t={t} label="Centre d'appel" value="1407 · gratuit · 24/7" />
          <SetMobileRow t={t} label="Antennes physiques" value="9 provinces" />
          <SetMobileRow t={t} label="État du service" value="Tous les systèmes opérationnels" right={<View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: idnTokens.green }} />} />
        </View>
        <View style={{ alignItems: 'center', paddingTop: 22 }}>
          <IdnFlagBars width={42} height={3} />
        </View>
      </ScrollView>
    </View>
  );
}
