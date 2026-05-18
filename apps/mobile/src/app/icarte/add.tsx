import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { NSheetHeader } from '@/components/chrome/sheet-header';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { Icon } from '@/design/icons';
import { CardArtIcon } from '@/components/cards/card-art-icon';
import { CARD_GRADIENTS } from '@/data/cards';

export default function ICarteAddForm() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('Permis de Conduire');
  const [issuer, setIssuer] = useState('Direction Générale des Transports');
  const [fullName, setFullName] = useState('');
  const [categories, setCategories] = useState('B, C');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NSheetHeader t={t} title="Ajouter une carte" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
        {/* Vignette du template sélectionné */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, marginBottom: 18 }}>
          <View style={{ width: 56, height: 36, borderRadius: 6, overflow: 'hidden' }}>
            <LinearGradient colors={CARD_GRADIENTS.orange as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <CardArtIcon name="car" color="#fff" size={18} />
            </LinearGradient>
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>Permis de Conduire</Text>
            <Text style={{ fontSize: 11, color: t.muted }}>Type sélectionné</Text>
          </View>
        </View>
        <View style={{ gap: 14 }}>
          <IdnInput t={t} label="Nom de la carte" value={name} onChangeText={setName} />
          <IdnInput t={t} label="Émetteur / Organisation" value={issuer} onChangeText={setIssuer} />
          <IdnInput t={t} label="Nom complet" placeholder="DUPONT Jean" value={fullName} onChangeText={setFullName} />
          <IdnInput t={t} label="Catégories" placeholder="A, B, C" value={categories} onChangeText={setCategories} />
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 22), borderTopWidth: 1, borderTopColor: t.borderSoft, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><IdnButton t={t} variant="ghost" size="lg" full onPress={() => router.back()}>Annuler</IdnButton></View>
        <View style={{ flex: 1 }}><IdnButton t={t} variant="primary" size="lg" full leadIcon={<Icon name="plus" size={16} color="#fff" />}>Créer</IdnButton></View>
      </View>
    </View>
  );
}
