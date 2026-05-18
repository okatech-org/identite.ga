import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { IdnTheme } from '@/design/tokens';
import { Icon } from '@/design/icons';
import type { DocFolder } from '@/data/documents';

export function FolderCard({ f, t, opened, onPress }: { f: DocFolder; t: IdnTheme; opened?: boolean; onPress?: () => void }) {
  const empty = f.count === 0;
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 10,
      }}
    >
      <View style={{ position: 'relative', width: 60, height: 50 }}>
        {/* Onglet arrière */}
        <View style={{ position: 'absolute', top: 4, left: 4, width: 24, height: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4, overflow: 'hidden', opacity: empty ? 0.3 : 1 }}>
          <LinearGradient colors={f.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
        </View>
        {/* Corps du dossier */}
        <View style={{ position: 'absolute', top: 8, left: 0, right: 0, bottom: 0, borderRadius: 6, overflow: 'hidden', opacity: empty ? 0.3 : 1 }}>
          <LinearGradient colors={f.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={f.icon} size={22} color="#fff" />
          </LinearGradient>
        </View>
        {opened ? (
          <View style={{ position: 'absolute', top: 12, right: -3, width: 14, height: 18, backgroundColor: '#fff', borderTopLeftRadius: 2, borderBottomLeftRadius: 2 }} />
        ) : null}
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: t.ink }}>{f.label}</Text>
        <Text style={{ fontSize: 10, color: t.muted, marginTop: 2 }}>{f.count} document{f.count > 1 ? 's' : ''}</Text>
      </View>
    </Pressable>
  );
}
