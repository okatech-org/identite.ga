import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { AccountPill } from '@/components/mailbox/account-pill';
import { AddressStrip } from '@/components/mailbox/address-strip';
import { IBoiteTabs, type IBoiteTab } from '@/components/mailbox/iboite-tabs';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { formatRelativeTime, iboiteAccountToUi } from '@/lib/iboite-adapter';

type LetterFolder = 'inbox' | 'pending' | 'sent' | 'trash';
type MessageFolder = 'inbox' | 'starred' | 'sent' | 'trash';

const COURRIER_FOLDERS: { id: LetterFolder; label: string }[] = [
  { id: 'inbox', label: 'Réception' },
  { id: 'pending', label: 'À traiter' },
  { id: 'sent', label: 'Expédiés' },
  { id: 'trash', label: 'Poubelle' },
];

const EMAIL_FOLDERS: { id: MessageFolder; label: string }[] = [
  { id: 'inbox', label: 'Réception' },
  { id: 'starred', label: 'Favoris' },
  { id: 'sent', label: 'Envoyés' },
  { id: 'trash', label: 'Corbeille' },
];

export default function IBoiteHome() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const accounts = useQuery(api.iboite.accounts.listMine, isAuthenticated ? {} : 'skip');
  const [tab, setTab] = useState<IBoiteTab>('courriers');
  const [letterFolder, setLetterFolder] = useState<LetterFolder>('inbox');
  const [emailFolder, setEmailFolder] = useState<MessageFolder>('inbox');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAccountId && accounts && accounts.length > 0) {
      setSelectedAccountId(accounts[0]._id);
    }
  }, [accounts, selectedAccountId]);

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Connectez-vous pour accéder à iBoîte.</Text>
      </View>
    );
  }

  if (accounts === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }
  if (accounts.length === 0 || !selectedAccountId) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
        <Icon name="mail2" size={36} color={t.mutedSoft} />
        <Text style={{ color: t.muted, fontSize: 13, marginTop: 12, textAlign: 'center' }}>
          Aucun compte iBoîte. Terminez votre inscription pour activer votre adresse souveraine.
        </Text>
      </View>
    );
  }

  const account = accounts.find((a) => a._id === selectedAccountId) ?? accounts[0];
  const accUi = iboiteAccountToUi(account);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="iBoîte" sub="Vos courriers, colis et emails" onBack={() => router.back()} />
      <View style={{ paddingHorizontal: 22 }}>
        <AccountPill acc={accUi} onPress={() => router.push('/iboite/accounts' as never)} />
      </View>
      <AddressStrip
        acc={accUi}
        t={t}
        onConfigure={() =>
          router.push({ pathname: '/iboite/address-setup', params: { accountId: account._id } } as never)
        }
      />
      <IBoiteTabs t={t} active={tab} onChange={setTab} />

      {tab === 'courriers' ? (
        <CourriersTab
          accountId={account._id as never}
          folder={letterFolder}
          onFolder={setLetterFolder}
          onOpen={(id) => router.push(`/iboite/courrier/${id}` as never)}
        />
      ) : null}
      {tab === 'colis' ? <ColisTab accountId={account._id as never} qr={accUi.addr.qr} /> : null}
      {tab === 'emails' ? (
        <EmailsTab
          accountId={account._id as never}
          folder={emailFolder}
          onFolder={setEmailFolder}
          onOpen={(id) => router.push(`/iboite/email/${id}` as never)}
          onCompose={() => router.push('/iboite/compose' as never)}
        />
      ) : null}
    </View>
  );
}

function CourriersTab({
  accountId,
  folder,
  onFolder,
  onOpen,
}: {
  accountId: string;
  folder: LetterFolder;
  onFolder: (f: LetterFolder) => void;
  onOpen: (id: string) => void;
}) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const result = usePaginatedQuery(
    api.iboite.letters.listByFolder,
    { accountId: accountId as never, folder },
    { initialNumItems: 30 },
  );
  const letters = result.results;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: insets.bottom + 86 }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }} style={{ marginBottom: 6, flexGrow: 0 }}>
          {COURRIER_FOLDERS.map((f) => {
            const sel = f.id === folder;
            return (
              <Pressable
                key={f.id}
                onPress={() => onFolder(f.id)}
                style={{
                  paddingHorizontal: 12,
                  minHeight: 30,
                  backgroundColor: sel ? idnTokens.green : t.surface,
                  borderWidth: 1,
                  borderColor: sel ? idnTokens.green : t.border,
                  borderRadius: 9999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '500', color: sel ? '#fff' : t.ink2 }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {letters.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Icon name="mail2" size={32} color={t.mutedSoft} />
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 10 }}>Aucun courrier dans ce dossier.</Text>
          </View>
        ) : (
          letters.map((l) => (
            <Pressable
              key={l._id}
              onPress={() => onOpen(l._id)}
              style={{
                position: 'relative',
                marginBottom: 10,
                padding: 14,
                backgroundColor: t.surface,
                borderWidth: l.isRead ? 1 : 1.5,
                borderColor: l.isRead ? t.border : idnTokens.green,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {l.type === 'action_required' && !l.isRead ? (
                <View style={{ position: 'absolute', top: 10, right: 12, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, backgroundColor: '#B83A3A' }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>URGENT</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="mail2" size={18} color={t.ink2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 12, color: t.muted, fontWeight: '500' }}>{l.senderName}</Text>
                  <Text style={{ fontSize: 13, color: t.ink, fontWeight: l.isRead ? '500' : '700', marginTop: 2 }}>{l.subject}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text style={{ fontSize: 10, color: t.muted }}>
                      {formatRelativeTime(l.createdAt)}
                      {l.dueAt ? ` · Réponse avant ${new Date(l.dueAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}` : ''}
                    </Text>
                    {!l.isRead ? <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: idnTokens.green }} /> : null}
                  </View>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function ColisTab({ accountId, qr }: { accountId: string; qr: string }) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const data = useQuery(api.iboite.packages.listMine, { accountId: accountId as never });
  const markPickedUp = useMutation(api.iboite.packages.markPickedUp);

  if (data === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.muted, fontSize: 13 }}>Chargement…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, marginTop: 8 }}>
        <View style={{ flex: 1, backgroundColor: t.dark ? '#3A2D14' : '#FEF3C7', borderWidth: 1, borderColor: t.dark ? '#5A4626' : '#FDE68A', borderRadius: 12, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="package" size={18} color={t.dark ? '#fcd34d' : '#92400e'} />
            <Text style={{ fontSize: 22, fontWeight: '700', color: t.dark ? '#fcd34d' : '#92400e' }}>{data.available}</Text>
          </View>
          <Text style={{ fontSize: 11, color: t.dark ? '#fcd34d' : '#92400e', fontWeight: '500', marginTop: 2 }}>À retirer</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft, borderWidth: 1, borderColor: t.dark ? '#1B3F5A' : '#BFD9F7', borderRadius: 12, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="truck" size={18} color={idnTokens.blue} />
            <Text style={{ fontSize: 22, fontWeight: '700', color: idnTokens.blue }}>{data.transit}</Text>
          </View>
          <Text style={{ fontSize: 11, color: idnTokens.blue, fontWeight: '500', marginTop: 2 }}>En transit</Text>
        </View>
      </View>

      {data.items.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <Icon name="package" size={32} color={t.mutedSoft} />
          <Text style={{ fontSize: 12, color: t.muted, marginTop: 10 }}>Aucun colis pour le moment.</Text>
        </View>
      ) : (
        data.items.map((p) => {
          const avail = p.status === 'available';
          return (
            <Pressable
              key={p._id}
              onPress={async () => {
                if (avail) {
                  try {
                    await markPickedUp({ packageId: p._id as never });
                  } catch {
                    // ignore
                  }
                }
              }}
              style={{ flexDirection: 'row', gap: 12, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, marginBottom: 8 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: avail ? (t.dark ? '#3A2D14' : '#FEF3C7') : (t.dark ? '#10243A' : idnTokens.blueSoft), alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={avail ? 'package' : 'truck'} size={18} color={avail ? '#92400e' : idnTokens.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: t.ink, fontWeight: '600' }}>{p.description}</Text>
                <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>De : {p.senderName}</Text>
                <Text style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono, marginTop: 2 }}>{p.trackingNumber}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999, backgroundColor: avail ? '#FEF3C7' : idnTokens.blueSoft }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: avail ? '#92400e' : idnTokens.blue }}>{avail ? 'À retirer' : p.status === 'transit' ? 'En transit' : p.status}</Text>
                </View>
                {p.estimatedDeliveryAt ? (
                  <Text style={{ fontSize: 10, color: t.muted }}>
                    Arrivée {new Date(p.estimatedDeliveryAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}

      <View style={{ marginTop: 18, padding: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="qr" size={28} color={t.ink2} />
        </View>
        <View>
          <Text style={{ fontSize: 11, color: t.muted, letterSpacing: 1, fontWeight: '600' }}>POINT RELAIS IDN.GA</Text>
          <Text style={{ fontFamily: idnTokens.mono, fontSize: 14, color: t.ink, fontWeight: '600', marginTop: 2 }}>{qr}</Text>
          <Text style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>À présenter au retrait</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function EmailsTab({
  accountId,
  folder,
  onFolder,
  onOpen,
  onCompose,
}: {
  accountId: string;
  folder: MessageFolder;
  onFolder: (f: MessageFolder) => void;
  onOpen: (id: string) => void;
  onCompose: () => void;
}) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const result = usePaginatedQuery(
    api.iboite.messages.listByFolder,
    { accountId: accountId as never, folder },
    { initialNumItems: 30 },
  );
  const toggleStar = useMutation(api.iboite.messages.toggleStar);
  const emails = result.results;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: insets.bottom + 24 }} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 6 }} style={{ marginBottom: 6, flexGrow: 0 }}>
          {EMAIL_FOLDERS.map((f) => {
            const sel = f.id === folder;
            return (
              <Pressable
                key={f.id}
                onPress={() => onFolder(f.id)}
                style={{
                  paddingHorizontal: 12,
                  minHeight: 30,
                  backgroundColor: sel ? idnTokens.green : t.surface,
                  borderWidth: 1,
                  borderColor: sel ? idnTokens.green : t.border,
                  borderRadius: 9999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '500', color: sel ? '#fff' : t.ink2 }}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {emails.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Icon name="mail" size={32} color={t.mutedSoft} />
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 10 }}>Aucun email dans ce dossier.</Text>
          </View>
        ) : (
          emails.map((e, i) => (
            <Pressable
              key={e._id}
              onPress={() => onOpen(e._id)}
              style={{
                flexDirection: 'row',
                gap: 10,
                paddingVertical: 12,
                paddingHorizontal: 4,
                borderBottomWidth: i === emails.length - 1 ? 0 : 1,
                borderBottomColor: t.borderSoft,
                backgroundColor: e.isRead ? 'transparent' : (t.dark ? 'rgba(14,124,58,0.06)' : 'rgba(14,124,58,0.04)'),
              }}
            >
              <Pressable
                onPress={async () => {
                  try { await toggleStar({ messageId: e._id as never }); } catch { /* ignore */ }
                }}
                style={{ paddingTop: 6 }}
              >
                <Icon name={e.isStarred ? 'star' : 'starO'} size={16} color={e.isStarred ? idnTokens.yellow : t.mutedSoft} />
              </Pressable>
              <View style={{ width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: e.senderKind === 'admin' ? '#3b82f6' : '#10b981' }}>
                <Icon name={e.senderKind === 'admin' ? 'building' : 'user'} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: e.isRead ? '500' : '700', color: e.isRead ? t.ink2 : t.ink }}>{e.senderName}</Text>
                  <Text style={{ fontSize: 10, color: t.muted }}>{formatRelativeTime(e.createdAt)}</Text>
                </View>
                <Text numberOfLines={1} style={{ fontSize: 12, color: e.isRead ? t.muted : t.ink, fontWeight: e.isRead ? '500' : '600', marginTop: 2 }}>{e.subject}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, color: t.muted }}>{e.preview}</Text>
                  {e.hasAttachment ? <Icon name="paper" size={12} color={t.muted} /> : null}
                </View>
              </View>
            </Pressable>
          ))
        )}
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
