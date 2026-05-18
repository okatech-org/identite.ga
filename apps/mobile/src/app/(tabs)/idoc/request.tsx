import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { Icon } from '@/design/icons';
import { REQUESTABLE_DOCS } from '@/data/documents';

export default function DocRequest() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState('birth');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="Demander" sub="Document officiel à l'administration" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 90 }} showsVerticalScrollIndicator={false}>
        {/* Demandes en cours */}
        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingVertical: 8 }}>DEMANDES EN COURS</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: t.dark ? '#0F2A18' : idnTokens.greenSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="file" size={18} color={idnTokens.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: t.ink, fontWeight: '600' }}>Acte de Naissance</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>Demandé le 12 mai · Prévu le 17 mai</Text>
          </View>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: idnTokens.blue }}>En cours</Text>
          </View>
        </View>

        {/* Types disponibles */}
        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingTop: 20, paddingBottom: 8 }}>DOCUMENTS DISPONIBLES</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {REQUESTABLE_DOCS.map(d => {
            const isSel = d.id === sel;
            return (
              <Pressable
                key={d.id}
                onPress={() => setSel(d.id)}
                style={{
                  width: '48.5%',
                  backgroundColor: t.surface,
                  borderWidth: 2,
                  borderColor: isSel ? idnTokens.green : t.border,
                  borderRadius: 12,
                  padding: 12,
                  position: 'relative',
                }}
              >
                {isSel ? (
                  <View style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={10} color="#fff" />
                  </View>
                ) : null}
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: d.color + '22', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Icon name={d.icon} size={16} color={d.color} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: t.ink, lineHeight: 16 }}>{d.label}</Text>
                <Text numberOfLines={2} style={{ fontSize: 10, color: t.muted, marginTop: 2, lineHeight: 14, height: 28 }}>{d.desc}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Icon name="clock" size={9} color={t.muted} />
                    <Text style={{ fontSize: 9, color: t.muted }}>{d.delai}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: t.ink, fontWeight: '700' }}>{d.prix}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {/* CTA flottant */}
      <View style={{ position: 'absolute', bottom: insets.bottom + 14, left: 22, right: 22, borderRadius: 14, overflow: 'hidden' }}>
        <Pressable>
          <LinearGradient colors={['#0E7C3A', '#10b981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icon name="send" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Envoyer la demande</Text>
            <Icon name="arrow" size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
