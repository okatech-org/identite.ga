import React from 'react';
import { Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { IdnButton } from '@/design/components/idn-button';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';

const CATEGORY_LABEL: Record<string, string> = {
  administrative: 'Administratif',
  civilStatus: 'État civil',
  fiscal: 'Fiscalité',
  education: 'Éducation',
  health: 'Santé',
  transport: 'Transport',
  social: 'Social',
  other: 'Autre',
};

async function openLink(url: string) {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
  } catch {
    // ignore
  }
}

export default function ServiceDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useConvexAuth();
  const decodedId = decodeURIComponent(id ?? '');
  const service = useQuery(api.services.get, isAuthenticated && decodedId ? { id: decodedId } : 'skip');

  if (service === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }
  if (!service) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <NSheetHeader t={t} title="Service" onBack={() => router.back()} />
        <View style={{ flex: 1, padding: 22, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <Icon name="sparkles" size={36} color={t.mutedSoft} />
          <Text style={{ color: t.muted, fontSize: 13, textAlign: 'center' }}>
            Ce service n’est plus disponible ou vous n’y avez pas accès.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader t={t} title="Service" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'flex-start', gap: 6 }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: idnTokens.green }}>
              {CATEGORY_LABEL[service.category] ?? service.category}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: t.ink, marginTop: 8, letterSpacing: -0.3 }}>{service.label}</Text>
          <Text style={{ fontSize: 13, color: t.muted, lineHeight: 20, marginTop: 4 }}>{service.description}</Text>
        </View>

        <View style={{ marginTop: 22, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="building" size={20} color={t.ink2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600' }}>FOURNI PAR</Text>
            <Text style={{ fontSize: 13, color: t.ink, fontWeight: '600', marginTop: 2 }}>{service.appName}</Text>
          </View>
        </View>

        <View style={{ marginTop: 18, padding: 14, backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft, borderRadius: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Icon name="shield" size={16} color={idnTokens.blue} />
          <Text style={{ flex: 1, fontSize: 11, color: t.ink2, lineHeight: 17 }}>
            En cliquant ci-dessous, vous accédez au site du fournisseur du service. Votre identité IDN n’est pas transmise automatiquement — l’application demande votre consentement à chaque connexion.
          </Text>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 22), borderTopWidth: 1, borderTopColor: t.borderSoft }}>
        <IdnButton
          t={t}
          variant="primary"
          size="lg"
          full
          leadIcon={<Icon name="link" size={16} color="#fff" />}
          onPress={() => openLink(service.link)}
        >
          Accéder au service
        </IdnButton>
      </View>
    </View>
  );
}
