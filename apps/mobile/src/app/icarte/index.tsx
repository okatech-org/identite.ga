import React from 'react';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { NSectionLabel } from '@/components/chrome/section-label';
import { MiniCard } from '@/components/cards/mini-card';
import { CardRow } from '@/components/cards/card-row';
import { CardArtIcon } from '@/components/cards/card-art-icon';
import { Icon } from '@/design/icons';
import { CARD_GRADIENTS, CARD_TEMPLATES, DEFAULT_CARDS } from '@/data/cards';

export default function ICarteHome() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const featured = DEFAULT_CARDS.filter(c => c.featured);
  const others = DEFAULT_CARDS.filter(c => !c.featured);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title="iCarte"
        sub="Gérez toutes vos cartes numériques"
        onBack={() => router.back()}
        right={
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: idnTokens.green }}>{featured.length}/6 dans le profil</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Cartes dans le profil */}
        <NSectionLabel
          t={t}
          right={<Text style={{ fontSize: 10, color: t.muted }}>Maintenez pour réordonner</Text>}
        >
          <Text style={{ color: idnTokens.green }}>● </Text>CARTES DANS LE PROFIL
        </NSectionLabel>
        {featured.length === 0 ? (
          <View style={{ paddingVertical: 30, alignItems: 'center', borderWidth: 1.5, borderColor: t.border, borderStyle: 'dashed', borderRadius: 14 }}>
            <Icon name="wallet" size={36} color={t.mutedSoft} />
            <Text style={{ fontSize: 13, color: t.ink2, fontWeight: '500', marginTop: 10 }}>Aucune carte dans le profil</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>Ajoutez des cartes depuis la liste ci-dessous</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {featured.map(c => (
              <Pressable key={c.id} onPress={() => router.push(`/icarte/${c.id}` as any)} style={{ width: '48.5%' }}>
                <MiniCard card={c} t={t} dragMode />
              </Pressable>
            ))}
          </View>
        )}

        {/* Autres cartes */}
        <NSectionLabel
          t={t}
          right={<Text style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{others.length} cartes</Text>}
        >
          AUTRES CARTES
        </NSectionLabel>
        {others.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Icon name="cc" size={32} color={t.mutedSoft} />
            <Text style={{ fontSize: 12, color: t.ink2, fontWeight: '500', marginTop: 8 }}>Toutes vos cartes sont dans le profil</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>Ajoutez de nouvelles cartes ci-dessous</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
            {others.map((c, i) => (
              <View key={c.id} style={{ borderBottomWidth: i === others.length - 1 ? 0 : 1, borderBottomColor: t.borderSoft }}>
                <CardRow card={c} t={t} atMax={featured.length >= 6} />
              </View>
            ))}
          </View>
        )}

        {/* Ajouter une carte */}
        <NSectionLabel t={t}>AJOUTER UNE CARTE</NSectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CARD_TEMPLATES.map(tp => (
            <Pressable
              key={tp.id}
              onPress={() => router.push('/icarte/add' as any)}
              style={{ width: '23%', backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center', gap: 6 }}
            >
              <View style={{ width: 40, height: 26, borderRadius: 5, overflow: 'hidden' }}>
                <LinearGradient colors={CARD_GRADIENTS[tp.grad] as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <CardArtIcon name={tp.icon} color="#fff" size={13} />
                </LinearGradient>
              </View>
              <Text style={{ fontSize: 10, color: t.muted, fontWeight: '500' }}>{tp.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => router.push('/icarte/custom' as any)}
            style={{ flex: 1, minWidth: '48%', backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft, borderWidth: 1, borderColor: t.dark ? '#1B3F2A' : '#C5E0CC', borderRadius: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Icon name="palette" size={18} color={idnTokens.green} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: idnTokens.green }}>Personnalisée</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
