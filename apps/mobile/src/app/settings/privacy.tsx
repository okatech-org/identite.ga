import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { SetMobileRow } from '@/components/rows/setting-row';
import { Toggle } from '@/design/components/toggle';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { api } from '@/lib/api';

function DeleteAccountModal({ visible, onClose, currentEmail }: { visible: boolean; onClose: () => void; currentEmail: string }) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const requestDeletion = useMutation(api.privacy.requestAccountDeletion);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (confirmEmail.trim().toLowerCase() !== currentEmail.toLowerCase()) {
      setError('L\'adresse email ne correspond pas à votre compte.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestDeletion({ confirmEmail: confirmEmail.trim().toLowerCase() });
      Alert.alert(
        'Demande enregistrée',
        'Votre compte sera supprimé sous 30 jours. Vous pouvez annuler en vous reconnectant pendant ce délai.',
      );
      setConfirmEmail('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demande impossible.');
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <Pressable onPress={onClose}><Text style={{ color: idnTokens.green, fontSize: 14, fontWeight: '500' }}>Annuler</Text></Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: t.ink }}>Supprimer mon compte</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={{
            padding: 16, borderRadius: 14,
            backgroundColor: t.dark ? '#1F1216' : '#FBE5E5',
            borderWidth: 1,
            borderColor: t.dark ? '#3A1E1E' : '#F5C7C7',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#B83A3A' }}>Action irréversible</Text>
            <Text style={{ fontSize: 12, color: t.muted, marginTop: 6, lineHeight: 18 }}>
              Toutes vos données seront supprimées sous 30 jours. Les logs d'audit sont conservés 5 ans (obligation légale).
            </Text>
          </View>
          <IdnInput
            t={t}
            label={`Saisissez votre adresse email pour confirmer (${currentEmail})`}
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            type="email"
            autoFocus
          />
          {error ? (
            <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
            </View>
          ) : null}
          <IdnButton t={t} variant="danger" size="lg" full onPress={submit} disabled={submitting}>
            {submitting ? 'Envoi…' : 'Confirmer la suppression'}
          </IdnButton>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SettingsPrivacy() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.profile.getCurrentUser, isAuthenticated ? {} : 'skip');
  const requestExport = useMutation(api.privacy.requestDataExport);
  const [stats, setStats] = useState(true);
  const [ux, setUx] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      await requestExport({});
      Alert.alert('Export demandé', 'Votre archive ZIP sera disponible par email sous 24h.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demande impossible.');
    } finally {
      setExporting(false);
    }
  }

  function deactivate() {
    Alert.alert(
      'Désactiver temporairement ?',
      'Votre compte sera mis en pause. Vous pourrez le réactiver en vous reconnectant.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Désactiver', onPress: () => Alert.alert('Bientôt', 'La désactivation temporaire sera disponible dans une prochaine version.') },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="Confidentialité" sub="Visualisez, exportez ou supprimez vos données." onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 22 }}>
        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingVertical: 6 }}>VOS DONNÉES</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow
            t={t}
            label={exporting ? 'Demande en cours…' : 'Télécharger une copie'}
            value="Archive ZIP · disponible sous 24h"
            onPress={exporting ? undefined : handleExport}
          />
          <SetMobileRow t={t} label="Liste des partages actifs" value="Voir les applications autorisées" onPress={() => router.push('/(tabs)/profile')} />
        </View>

        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 6 }}>RÉUTILISATION</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} label="Statistiques anonymisées" value="Aide les administrations à planifier" right={<Toggle on={stats} onChange={setStats} t={t} />} />
          <SetMobileRow t={t} label="Programme d'amélioration UX" value="Anonyme · révocable" right={<Toggle on={ux} onChange={setUx} t={t} />} />
        </View>

        {error ? (
          <View style={{ marginTop: 12, backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
            <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
          </View>
        ) : null}

        <View style={{
          marginTop: 18, padding: 16, borderRadius: 14,
          backgroundColor: t.dark ? '#1F1216' : '#FBE5E5',
          borderWidth: 1,
          borderColor: t.dark ? '#3A1E1E' : '#F5C7C7',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#B83A3A' }}>Zone sensible</Text>
          <Text style={{ fontSize: 11, color: t.muted, marginTop: 4, lineHeight: 17 }}>
            Suspendre ou supprimer définitivement votre compte IDN. Les logs d'audit sont conservés 5 ans (obligation légale).
          </Text>
          <View style={{ gap: 8, marginTop: 14 }}>
            <IdnButton t={t} variant="ghost" size="md" full onPress={deactivate}>Désactiver temporairement</IdnButton>
            <IdnButton t={t} variant="danger" size="md" full onPress={() => setDeleteOpen(true)}>Supprimer mon compte</IdnButton>
          </View>
        </View>
      </ScrollView>
      <DeleteAccountModal visible={deleteOpen} onClose={() => setDeleteOpen(false)} currentEmail={user?.email ?? ''} />
    </View>
  );
}
