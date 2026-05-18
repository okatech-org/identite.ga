import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { CARD_GRADIENTS, type Card } from '@/data/cards';
import { CardArtIcon } from './card-art-icon';
import { Icon } from '@/design/icons';

export function CardRow({ card, t, atMax }: { card: Card; t: IdnTheme; atMax?: boolean }) {
  const featuredAction = card.featured;
  const grad = card.grad === 'white' ? null : CARD_GRADIENTS[card.grad];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 }}>
      {grad ? (
        <LinearGradient colors={grad as unknown as readonly [string, string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 52, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }}>
          <CardArtIcon name={card.icon} color="#fff" size={15} />
        </LinearGradient>
      ) : (
        <View style={{ width: 52, height: 32, borderRadius: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
          <CardArtIcon name={card.icon} color="#009640" size={15} />
        </View>
      )}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{card.name}</Text>
        <Text numberOfLines={1} style={{ fontSize: 11, color: t.muted }}>{card.sub}</Text>
      </View>
      {card.official ? (
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: idnTokens.green }}>Voir</Text>
          <Icon name="arrow" size={12} color={idnTokens.green} />
        </Pressable>
      ) : (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: t.borderSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="edit" size={16} color={t.muted} />
          </Pressable>
          <Pressable disabled={!featuredAction && atMax} style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: t.borderSoft, alignItems: 'center', justifyContent: 'center', opacity: !featuredAction && atMax ? 0.3 : 1 }}>
            <Icon name={featuredAction ? 'eyeOff' : 'eye'} size={16} color={t.muted} />
          </Pressable>
          <Pressable style={{ width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: t.borderSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="trash" size={16} color="#B83A3A" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
