import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { CardArtIcon } from '@/components/cards/card-art-icon';
import { CARD_GRADIENTS, CARD_TEMPLATES } from '@/data/cards';

export default function ICarteAddTemplate() {
  const t = useIdnTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: t.surface }}>
      <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 14 }}>
        <View style={{ width: 38, height: 4, borderRadius: 9999, backgroundColor: t.borderSoft }} />
      </View>
      <View style={{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: t.ink, letterSpacing: -0.2 }}>Ajouter une carte</Text>
        <Pressable onPress={() => router.back()} style={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={14} color={t.ink2} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 24 }}>
        <Text style={{ fontSize: 12, color: t.muted, marginBottom: 14, lineHeight: 18 }}>Choisissez le type de carte à ajouter à votre portefeuille.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {CARD_TEMPLATES.map(tp => (
            <Pressable
              key={tp.id}
              onPress={() => { router.back(); router.push('/icarte/add' as any); }}
              style={{ width: '48%', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <View style={{ width: 44, height: 28, borderRadius: 5, overflow: 'hidden' }}>
                <LinearGradient colors={CARD_GRADIENTS[tp.grad] as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <CardArtIcon name={tp.icon} color="#fff" size={15} />
                </LinearGradient>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: t.ink }}>{tp.label}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          onPress={() => { router.back(); router.push('/icarte/custom' as any); }}
          style={{ marginTop: 14, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft, borderWidth: 1, borderColor: t.dark ? '#1B3F2A' : '#C5E0CC', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ width: 44, height: 28, borderRadius: 5, overflow: 'hidden' }}>
            <LinearGradient colors={['#0E7C3A', '#2563AC', '#F2C811']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="palette" size={14} color="#fff" />
            </LinearGradient>
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: idnTokens.green }}>Carte personnalisée</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Choisissez couleur, icône et nom.</Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
