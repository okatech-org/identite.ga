import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { idnTokens } from '@/design/tokens';
import type { IdnTheme } from '@/design/tokens';
import { Icon } from '@/design/icons';
import type { MailAccount } from '@/data/mailbox';

export function AddressStrip({ acc, t }: { acc: MailAccount; t: IdnTheme }) {
  return (
    <View style={{ marginHorizontal: 22, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 10 }}>
      <Icon name="pinLoc" size={14} color={idnTokens.green} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 11, color: t.ink, fontWeight: '500' }}>{acc.addr.rue}, {acc.addr.ville}</Text>
        <Text style={{ fontSize: 10, color: t.muted, fontFamily: idnTokens.mono }}>{acc.addr.qr}</Text>
      </View>
      <Pressable style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 1, borderColor: t.borderSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="copy" size={14} color={t.muted} />
      </Pressable>
    </View>
  );
}
