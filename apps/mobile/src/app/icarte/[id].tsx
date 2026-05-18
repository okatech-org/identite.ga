import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { IdnFlagBars } from '@/design/mark';
import { CardArtIcon } from '@/components/cards/card-art-icon';
import { Icon } from '@/design/icons';
import { CARD_GRADIENTS, DEFAULT_CARDS } from '@/data/cards';

export default function ICarteCardDetail() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [verso, setVerso] = useState(false);

  const card = DEFAULT_CARDS.find(c => c.id === id) ?? DEFAULT_CARDS[0];
  const grad = card.grad === 'white' ? CARD_GRADIENTS.green : CARD_GRADIENTS[card.grad];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader
        t={t}
        title={card.name}
        onBack={() => router.back()}
        right={<Pressable style={{ padding: 4 }}><Icon name="more" size={18} color={t.muted} /></Pressable>}
      />
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 }}>
        {/* Grande carte */}
        <View style={{ aspectRatio: 85 / 55, borderRadius: 18, overflow: 'hidden', shadowColor: '#0E7C3A', shadowOpacity: 0.32, shadowRadius: 32, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}>
          <LinearGradient colors={grad as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 20 }}>
            <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ position: 'absolute', right: 14, bottom: 14 }}><IdnFlagBars width={32} height={3} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <CardArtIcon name={card.icon} color="#fff" size={28} />
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.16)' }}>
                <Text style={{ fontSize: 9, fontWeight: '600', color: '#fff', letterSpacing: 0.4 }}>{verso ? 'VERSO' : 'RECTO'}</Text>
              </View>
            </View>
            {!verso ? (
              <>
                <View style={{ marginTop: 22 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.4 }}>NOM COMPLET</Text>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 2 }}>DUPONT Jean</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 24, marginTop: 14 }}>
                  <View>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 }}>NUMÉRO</Text>
                    <Text style={{ fontFamily: idnTokens.mono, fontSize: 12, color: '#fff', marginTop: 2 }}>GA-1234-5678-9012</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 }}>VALIDITÉ</Text>
                    <Text style={{ fontFamily: idnTokens.mono, fontSize: 12, color: '#fff', marginTop: 2 }}>12/2030</Text>
                  </View>
                </View>
              </>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 18 }}>
                {[
                  { k: 'NAISSANCE', v: '15/03/1990' },
                  { k: 'LIEU', v: 'Libreville' },
                  { k: 'SEXE', v: 'M' },
                  { k: 'TAILLE', v: '1.75 m' },
                ].map((r, i) => (
                  <View key={i} style={{ width: '50%', marginBottom: 12 }}>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1.2 }}>{r.k}</Text>
                    <Text style={{ fontFamily: idnTokens.mono, fontSize: 13, color: '#fff', marginTop: 2 }}>{r.v}</Text>
                  </View>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Hint flip */}
        <Pressable onPress={() => setVerso(v => !v)} style={{ marginTop: 14, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="rotate" size={16} color={t.muted} />
          <Text style={{ color: t.muted, fontSize: 12 }}>Toucher pour retourner</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <IdnButton t={t} variant="ghost" full leadIcon={<Icon name="qr" size={16} color={t.ink} />}>QR Code</IdnButton>
          </View>
          <View style={{ flex: 1 }}>
            <IdnButton t={t} variant="ghost" full leadIcon={<Icon name="download" size={16} color={t.ink} />}>Télécharger</IdnButton>
          </View>
        </View>
        <View style={{ marginTop: 10 }}>
          <IdnButton t={t} variant="primary" size="lg" full leadIcon={<Icon name="share" size={16} color="#fff" />}>Partager</IdnButton>
        </View>
      </View>
    </View>
  );
}
