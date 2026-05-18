import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { IdnTheme } from '@/design/tokens';
import { CARD_GRADIENTS, type Card } from '@/data/cards';
import { CardArtIcon } from './card-art-icon';
import { Icon } from '@/design/icons';

export function MiniCard({ card, t, onRemove, dragMode }: { card: Card; t: IdnTheme; onRemove?: () => void; dragMode?: boolean }) {
  // CNAMGS / santé : fond blanc, libellés verts #009640
  if (card.official) {
    return (
      <View style={{ position: 'relative', aspectRatio: 85 / 55, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1, borderColor: t.border, padding: 10, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CardArtIcon name={card.icon} color="#009640" size={20} />
          {dragMode ? <Icon name="grip" color="#009640" size={14} /> : null}
        </View>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#009640', letterSpacing: 0.2, lineHeight: 12 }}>{card.name}</Text>
          <Text style={{ fontSize: 8, color: 'rgba(0,150,64,0.6)', marginTop: 2 }}>{card.sub}</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 8, right: 10, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text style={{ fontSize: 9, fontWeight: '600', color: '#009640' }}>Ouvrir →</Text>
        </View>
      </View>
    );
  }

  const grad = card.grad === 'white' ? CARD_GRADIENTS.green : CARD_GRADIENTS[card.grad];
  return (
    <View style={{ aspectRatio: 85 / 55, borderRadius: 11, overflow: 'hidden' }}>
      <LinearGradient colors={grad as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <CardArtIcon name={card.icon} color="#fff" size={18} />
          {dragMode ? (
            <Icon name="grip" color="rgba(255,255,255,0.7)" size={14} />
          ) : (
            <Pressable onPress={onRemove} style={{ width: 20, height: 20, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="eyeOff" color="#fff" size={11} />
            </Pressable>
          )}
        </View>
        <View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff', lineHeight: 12 }}>{card.name}</Text>
          <Text style={{ fontSize: 8, color: 'rgba(255,255,255,0.78)', marginTop: 2 }}>{card.sub}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}
