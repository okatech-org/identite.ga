import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { IdnFlagBars } from '@/design/mark';
import { CardArtIcon } from '@/components/cards/card-art-icon';
import { Icon } from '@/design/icons';
import { CARD_GRADIENTS } from '@/data/cards';
import { api } from '@/lib/api';
import { gradientToGradKey, walletCardToUi } from '@/lib/wallet-adapter';

function formatLabel(key: string): string {
  if (!key) return '';
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
}

export default function ICarteCardDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useConvexAuth();
  const wallet = useQuery(api.wallet.listMine, isAuthenticated ? {} : 'skip');
  const [verso, setVerso] = useState(false);

  const raw = wallet?.cards.find((c) => c._id === id);

  if (wallet === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }

  if (!raw) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <NSheetHeader t={t} title="Carte introuvable" onBack={() => router.back()} />
        <View style={{ flex: 1, padding: 22, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <Icon name="wallet" size={40} color={t.mutedSoft} />
          <Text style={{ color: t.muted, fontSize: 13 }}>Cette carte n'existe plus.</Text>
        </View>
      </View>
    );
  }

  const card = walletCardToUi(raw);
  const gradKey = gradientToGradKey(raw.gradient);
  const grad = gradKey === 'white' ? CARD_GRADIENTS.green : CARD_GRADIENTS[gradKey];

  const frontEntries = Object.entries(raw.data ?? {});
  const backEntries = Object.entries(raw.backData ?? {});
  const visible = verso ? backEntries : frontEntries;
  const hasBack = backEntries.length > 0;
  const hasContent = visible.length > 0 && visible.some(([, v]) => v && v.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader
        t={t}
        title={raw.name}
        onBack={() => router.back()}
        right={
          <Pressable onPress={() => router.push(`/icarte/edit/${raw._id}` as never)} style={{ padding: 4 }}>
            <Icon name="edit" size={18} color={t.muted} />
          </Pressable>
        }
      />
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 }}>
        <View style={{ aspectRatio: 85 / 55, borderRadius: 18, overflow: 'hidden', shadowColor: '#0E7C3A', shadowOpacity: 0.32, shadowRadius: 32, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
          <LinearGradient colors={grad as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 20 }}>
            <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ position: 'absolute', right: 14, bottom: 14 }}><IdnFlagBars width={32} height={3} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <CardArtIcon name={card.icon} color="#fff" size={28} />
              {hasBack ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.16)' }}>
                  <Text style={{ fontSize: 9, fontWeight: '600', color: '#fff', letterSpacing: 0.4 }}>{verso ? 'VERSO' : 'RECTO'}</Text>
                </View>
              ) : null}
            </View>
            <View style={{ marginTop: 18, flex: 1 }}>
              {!hasContent ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                  <Icon name="edit" size={18} color="rgba(255,255,255,0.85)" />
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>Renseignez vos informations</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {visible.map(([k, v], i) => (
                    <View key={`${verso ? 'b' : 'f'}-${i}`} style={{ width: '50%', marginBottom: 12 }}>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 }}>{formatLabel(k).toUpperCase()}</Text>
                      <Text numberOfLines={1} style={{ fontFamily: idnTokens.mono, fontSize: 13, color: '#fff', marginTop: 2 }}>{v || '—'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </LinearGradient>
        </View>

        {hasBack ? (
          <Pressable onPress={() => setVerso((v) => !v)} style={{ marginTop: 14, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="rotate" size={16} color={t.muted} />
            <Text style={{ color: t.muted, fontSize: 12 }}>Toucher pour retourner</Text>
          </Pressable>
        ) : null}

        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <IdnButton
              t={t}
              variant="ghost"
              full
              leadIcon={<Icon name="edit" size={16} color={t.ink} />}
              onPress={() => router.push(`/icarte/edit/${raw._id}` as never)}
            >
              Modifier
            </IdnButton>
          </View>
          <View style={{ flex: 1 }}>
            <IdnButton t={t} variant="ghost" full leadIcon={<Icon name="qr" size={16} color={t.ink} />}>QR Code</IdnButton>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          <IdnButton t={t} variant="primary" size="lg" full leadIcon={<Icon name="share" size={16} color="#fff" />}>Partager</IdnButton>
        </View>
      </View>
    </View>
  );
}
