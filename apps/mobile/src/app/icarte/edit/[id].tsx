import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { Icon } from '@/design/icons';
import { CardArtIcon } from '@/components/cards/card-art-icon';
import { CARD_GRADIENTS, DEFAULT_CARDS } from '@/data/cards';

export default function ICarteEdit() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = DEFAULT_CARDS.find(c => c.id === id) ?? DEFAULT_CARDS[5];

  const [name, setName] = useState(card.name);
  const [sub, setSub] = useState(card.sub);

  const grad = card.grad === 'white' ? CARD_GRADIENTS.green : CARD_GRADIENTS[card.grad];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader t={t} title="Modifier la carte" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ aspectRatio: 85 / 55, maxWidth: 220, alignSelf: 'center', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
          <LinearGradient colors={grad as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 16 }}>
            <CardArtIcon name={card.icon} color="#fff" size={18} />
            <View style={{ marginTop: 22 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{name}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{sub}</Text>
            </View>
          </LinearGradient>
        </View>
        <View style={{ gap: 14 }}>
          <IdnInput t={t} label="Nom" value={name} onChangeText={setName} />
          <IdnInput t={t} label="Sous-titre" value={sub} onChangeText={setSub} />
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 22), borderTopWidth: 1, borderTopColor: t.borderSoft, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><IdnButton t={t} variant="ghost" size="lg" full onPress={() => router.back()}>Annuler</IdnButton></View>
        <View style={{ flex: 1 }}><IdnButton t={t} variant="primary" size="lg" full leadIcon={<Icon name="check" size={16} color="#fff" />}>Enregistrer</IdnButton></View>
      </View>
    </View>
  );
}
