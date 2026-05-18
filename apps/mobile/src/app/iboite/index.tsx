import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { AccountPill } from '@/components/mailbox/account-pill';
import { AddressStrip } from '@/components/mailbox/address-strip';
import { IBoiteTabs, type IBoiteTab } from '@/components/mailbox/iboite-tabs';
import { Icon } from '@/design/icons';
import { MAIL_ACCOUNTS, MOCK_LETTERS, MOCK_PACKAGES, MOCK_EMAILS } from '@/data/mailbox';

const COURRIER_FOLDERS = [
  { l: 'Réception', n: 2, sel: true },
  { l: 'À traiter', n: 1 },
  { l: 'Expédiés' },
  { l: 'Poubelle' },
];

const EMAIL_FOLDERS = [
  { l: 'Réception', n: 2, sel: true },
  { l: 'Favoris', n: 1 },
  { l: 'Envoyés' },
  { l: 'Corbeille' },
];

export default function IBoiteHome() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<IBoiteTab>('courriers');
  const acc = MAIL_ACCOUNTS[0];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="iBoîte" sub="Vos courriers, colis et emails" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: 22 }}>
        <AccountPill acc={acc} onPress={() => router.push('/iboite/accounts' as any)} />
      </View>
      <AddressStrip acc={acc} t={t} />
      <IBoiteTabs t={t} active={tab} onChange={setTab} />

      {tab === 'courriers' ? <CourriersTab onOpen={id => router.push(`/iboite/courrier/${id}` as any)} /> : null}
      {tab === 'colis' ? <ColisTab /> : null}
      {tab === 'emails' ? <EmailsTab onOpen={id => router.push(`/iboite/email/${id}` as any)} onCompose={() => router.push('/iboite/compose' as any)} /> : null}
    </View>
  );

  function CourriersTab({ onOpen }: { onOpen: (id: string) => void }) {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: insets.bottom + 86 }} showsVerticalScrollIndicator={false}>
          {/* Folder chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }} style={{ marginBottom: 6, flexGrow: 0 }}>
            {COURRIER_FOLDERS.map((f, i) => (
              <Pressable
                key={i}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: f.sel ? idnTokens.green : t.surface,
                  borderWidth: 1,
                  borderColor: f.sel ? idnTokens.green : t.border,
                  borderRadius: 9999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: f.sel ? '#fff' : t.ink2 }}>{f.l}</Text>
                {f.n ? (
                  <View style={{ paddingHorizontal: 6, borderRadius: 9999, backgroundColor: f.sel ? 'rgba(255,255,255,0.22)' : t.surface2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: f.sel ? '#fff' : t.ink2 }}>{f.n}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>

          {MOCK_LETTERS.map(l => (
            <Pressable
              key={l.id}
              onPress={() => onOpen(l.id)}
              style={{
                position: 'relative',
                marginBottom: 10,
                padding: 14,
                backgroundColor: t.surface,
                borderWidth: l.read ? 1 : 1.5,
                borderColor: l.read ? t.border : idnTokens.green,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {l.type === 'action_required' && !l.read ? (
                <View style={{ position: 'absolute', top: 10, right: 12, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, backgroundColor: '#B83A3A' }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>URGENT</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="mail2" size={18} color={t.ink2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 12, color: t.muted, fontWeight: '500' }}>{l.sender}</Text>
                  <Text style={{ fontSize: 13, color: t.ink, fontWeight: l.read ? '500' : '700', marginTop: 2 }}>{l.subject}</Text>
                  <Text numberOfLines={2} style={{ fontSize: 11, color: t.muted, marginTop: 4, lineHeight: 17 }}>{l.preview}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 10, color: t.muted }}>{l.time}{l.due ? ` · Réponse avant ${l.due}` : ''}</Text>
                    {!l.read ? <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: idnTokens.green }} /> : null}
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          style={{ position: 'absolute', right: 16, bottom: insets.bottom + 24, width: 52, height: 52, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center', shadowColor: idnTokens.green, shadowOpacity: 0.36, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
        >
          <Icon name="plus" size={22} color="#fff" />
        </Pressable>
      </View>
    );
  }

  function ColisTab() {
    return (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, marginTop: 8 }}>
          <View style={{ flex: 1, backgroundColor: t.dark ? '#3A2D14' : '#FEF3C7', borderWidth: 1, borderColor: t.dark ? '#5A4626' : '#FDE68A', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="package" size={18} color={t.dark ? '#fcd34d' : '#92400e'} />
              <Text style={{ fontSize: 22, fontWeight: '700', color: t.dark ? '#fcd34d' : '#92400e' }}>1</Text>
            </View>
            <Text style={{ fontSize: 11, color: t.dark ? '#fcd34d' : '#92400e', fontWeight: '500', marginTop: 2 }}>À retirer</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft, borderWidth: 1, borderColor: t.dark ? '#1B3F5A' : '#BFD9F7', borderRadius: 12, padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="truck" size={18} color={idnTokens.blue} />
              <Text style={{ fontSize: 22, fontWeight: '700', color: idnTokens.blue }}>1</Text>
            </View>
            <Text style={{ fontSize: 11, color: idnTokens.blue, fontWeight: '500', marginTop: 2 }}>En transit</Text>
          </View>
        </View>

        {MOCK_PACKAGES.map(p => {
          const avail = p.status === 'available';
          return (
            <View key={p.id} style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, marginBottom: 8 }}>
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: avail ? (t.dark ? '#3A2D14' : '#FEF3C7') : (t.dark ? '#10243A' : idnTokens.blueSoft), alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={avail ? 'package' : 'truck'} size={18} color={avail ? '#92400e' : idnTokens.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: t.ink, fontWeight: '600' }}>{p.description}</Text>
                <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>De : {p.sender}</Text>
                <Text style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono, marginTop: 2 }}>{p.tracking}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: avail ? '#FEF3C7' : idnTokens.blueSoft }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: avail ? '#92400e' : idnTokens.blue }}>{avail ? 'À retirer' : 'En transit'}</Text>
                </View>
                {p.eta ? <Text style={{ fontSize: 10, color: t.muted }}>Arrivée {p.eta}</Text> : null}
              </View>
            </View>
          );
        })}

        {/* Point Relais info */}
        <View style={{ marginTop: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="qr" size={28} color={t.ink2} />
          </View>
          <View>
            <Text style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: '600' }}>POINT RELAIS IDN.GA</Text>
            <Text style={{ fontFamily: idnTokens.mono, fontSize: 14, color: t.ink, fontWeight: '600', marginTop: 2 }}>{acc.addr.qr}</Text>
            <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>À présenter au retrait</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  function EmailsTab({ onOpen, onCompose }: { onOpen: (id: string) => void; onCompose: () => void }) {
    return (
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }} style={{ marginBottom: 6, flexGrow: 0 }}>
            {EMAIL_FOLDERS.map((f, i) => (
              <Pressable
                key={i}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: f.sel ? idnTokens.green : t.surface,
                  borderWidth: 1,
                  borderColor: f.sel ? idnTokens.green : t.border,
                  borderRadius: 9999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '500', color: f.sel ? '#fff' : t.ink2 }}>{f.l}</Text>
                {f.n ? (
                  <View style={{ paddingHorizontal: 6, borderRadius: 9999, backgroundColor: f.sel ? 'rgba(255,255,255,0.22)' : t.surface2 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: f.sel ? '#fff' : t.ink2 }}>{f.n}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </ScrollView>

          {MOCK_EMAILS.map((e, i) => (
            <Pressable
              key={e.id}
              onPress={() => onOpen(e.id)}
              style={{
                flexDirection: 'row',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 4,
                borderBottomWidth: i === MOCK_EMAILS.length - 1 ? 0 : 1,
                borderBottomColor: t.borderSoft,
                backgroundColor: e.read ? 'transparent' : (t.dark ? 'rgba(14,124,58,0.06)' : 'rgba(14,124,58,0.04)'),
              }}
            >
              <View style={{ paddingTop: 6 }}>
                <Icon name={e.starred ? 'star' : 'starO'} size={16} color={e.starred ? idnTokens.yellow : t.mutedSoft} />
              </View>
              <View style={{ width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: e.sender.type === 'admin' ? '#3b82f6' : '#10b981' }}>
                <Icon name={e.sender.type === 'admin' ? 'building' : 'user'} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: e.read ? '500' : '700', color: e.read ? t.ink2 : t.ink }}>{e.sender.name}</Text>
                  <Text style={{ fontSize: 10, color: t.muted }}>{e.time}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 12, color: e.read ? t.muted : t.ink, fontWeight: e.read ? '500' : '600', marginTop: 2 }}>{e.subject}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, color: t.muted }}>{e.preview}</Text>
                  {e.attach ? <Icon name="paper" size={12} color={t.muted} /> : null}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          onPress={onCompose}
          style={{ position: 'absolute', right: 16, bottom: insets.bottom + 24, width: 52, height: 52, borderRadius: 9999, backgroundColor: idnTokens.green, alignItems: 'center', justifyContent: 'center', shadowColor: idnTokens.green, shadowOpacity: 0.36, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
        >
          <Icon name="send" size={20} color="#fff" />
        </Pressable>
      </View>
    );
  }
}
