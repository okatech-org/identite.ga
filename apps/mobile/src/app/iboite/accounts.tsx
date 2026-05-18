import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { Icon } from '@/design/icons';
import { MAIL_ACCOUNTS } from '@/data/mailbox';

export default function IBoiteAccounts() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Pressable onPress={() => router.back()} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', paddingTop: insets.top + 80, paddingHorizontal: 22 }}>
      <Pressable style={{ backgroundColor: t.surface, borderRadius: 16, padding: 8 }}>
        <Text style={{ paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, fontSize: 10, color: t.muted, fontWeight: '600', letterSpacing: 1.2 }}>VOS BOÎTES</Text>
        {MAIL_ACCOUNTS.map((a, i) => {
          const sel = i === 0;
          return (
            <Pressable
              key={a.id}
              onPress={() => router.back()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 10 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden' }}>
                <LinearGradient colors={a.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={a.icon} size={18} color="#fff" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.ink }}>{a.label}</Text>
                <Text style={{ fontSize: 11, color: t.muted }}>{a.email}</Text>
              </View>
              {sel ? <Icon name="check" size={18} color={idnTokens.green} /> : null}
            </Pressable>
          );
        })}
        <View style={{ height: 1, backgroundColor: t.borderSoft, marginVertical: 8, marginHorizontal: 4 }} />
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="plus" size={18} color={idnTokens.green} />
          </View>
          <Text style={{ color: idnTokens.green, fontSize: 13, fontWeight: '500' }}>Ajouter une boîte</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}
