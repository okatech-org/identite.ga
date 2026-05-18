import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/design/icons';
import type { MailAccount } from '@/data/mailbox';

export function AccountPill({ acc, expanded, onPress }: { acc: MailAccount; expanded?: boolean; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ width: '100%', borderRadius: 14, overflow: 'hidden' }}>
      <LinearGradient colors={acc.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={acc.icon} size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{acc.label}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>{acc.email}</Text>
        </View>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon name="chevDn" size={14} color="#fff" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
