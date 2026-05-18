import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { SetMobileRow } from '@/components/rows/setting-row';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { Toggle } from '@/design/components/toggle';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { BIOMETRIC_KEY } from '@/app/(auth)/signup/bio';

function PasswordChangeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useIdnTheme();
  const changePassword = useMutation(api.account.changePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  async function submit() {
    setError(null);
    if (next.length < 12) {
      setError('Le nouveau mot de passe doit faire au moins 12 caractères.');
      return;
    }
    if (next !== confirm) {
      setError('La confirmation ne correspond pas.');
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setConfirm('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Échec du changement de mot de passe.';
      setError(
        msg.toLowerCase().includes('compromised') ? 'Ce mot de passe a fuité dans une base de données.'
        : msg.toLowerCase().includes('invalid') ? 'Mot de passe actuel incorrect.'
        : msg,
      );
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <Pressable onPress={onClose}><Text style={{ color: idnTokens.green, fontSize: 14, fontWeight: '500' }}>Annuler</Text></Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: t.ink }}>Changer le mot de passe</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }} keyboardShouldPersistTaps="handled">
          <IdnInput t={t} label="Mot de passe actuel" value={current} onChangeText={setCurrent} type="password" autoFocus />
          <IdnInput t={t} label="Nouveau mot de passe" value={next} onChangeText={setNext} type="password" hint="Minimum 12 caractères" />
          <IdnInput t={t} label="Confirmation" value={confirm} onChangeText={setConfirm} type="password" />
          {error ? (
            <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
            </View>
          ) : null}
          <IdnButton t={t} variant="primary" size="lg" full onPress={submit} disabled={submitting}>
            {submitting ? 'Enregistrement…' : 'Enregistrer'}
          </IdnButton>
        </ScrollView>
      </View>
    </Modal>
  );
}

function PinChangeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useIdnTheme();
  const verifyPin = useMutation(api.onboarding.verifyPin);
  const createPin = useMutation(api.onboarding.createPin);
  const [phase, setPhase] = useState<'check' | 'new' | 'confirm'>('check');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  function reset() {
    setPhase('check'); setPin(''); setError(null); setSubmitting(false);
  }

  async function next(pinValue: string) {
    setError(null);
    if (phase === 'check') {
      setSubmitting(true);
      try {
        const r = await verifyPin({ pin: pinValue });
        if (!r.valid) {
          setError('PIN incorrect.');
          setSubmitting(false);
          setPin('');
          return;
        }
        setPhase('new');
        setPin('');
        setSubmitting(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur.');
        setSubmitting(false);
        setPin('');
      }
    } else if (phase === 'new') {
      setPhase('confirm');
      setPin('');
    } else {
      // confirm
      setSubmitting(true);
      try {
        await createPin({ pin: pinValue });
        reset();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur.');
        setSubmitting(false);
        setPin('');
      }
    }
  }

  function press(k: string) {
    if (k === '⌫') return setPin((v) => v.slice(0, -1));
    if (pin.length >= 6) return;
    const v = pin + k;
    setPin(v);
    if (v.length === 6) void next(v);
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  const title = phase === 'check' ? 'Saisissez votre PIN actuel' : phase === 'new' ? 'Nouveau PIN' : 'Confirmez le nouveau PIN';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { reset(); onClose(); }}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <Pressable onPress={() => { reset(); onClose(); }}><Text style={{ color: idnTokens.green, fontSize: 14, fontWeight: '500' }}>Annuler</Text></Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: t.ink }}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ flex: 1, padding: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 14 }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{
                width: 18, height: 18, borderRadius: 9999,
                backgroundColor: i < pin.length ? idnTokens.green : 'transparent',
                borderWidth: 2,
                borderColor: i < pin.length ? idnTokens.green : t.border,
              }} />
            ))}
          </View>
          {error ? (
            <Text style={{ textAlign: 'center', color: '#B83A3A', fontSize: 12, marginBottom: 10 }}>{error}</Text>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginTop: 8 }}>
            {KEYS.map((k, i) => (
              <View key={i} style={{ width: '33.3333%', padding: 5 }}>
                <Pressable disabled={k === '' || submitting} onPress={() => press(k)} style={{
                  height: 56, borderRadius: 14,
                  backgroundColor: k === '' ? 'transparent' : t.surface,
                  borderWidth: k === '' ? 0 : 1,
                  borderColor: t.borderSoft,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: submitting ? 0.6 : 1,
                }}>
                  <Text style={{ fontSize: 22, fontWeight: '500', color: t.ink, fontFamily: idnTokens.mono }}>{k}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsSecurity() {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.profile.getCurrentUser, isAuthenticated ? {} : 'skip');
  const [pwOpen, setPwOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [faceUnlock, setFaceUnlock] = useState(false);

  React.useEffect(() => {
    (async () => {
      const flag = await AsyncStorage.getItem(BIOMETRIC_KEY);
      setFaceUnlock(flag === '1');
    })();
  }, []);

  async function toggleFace(v: boolean) {
    setFaceUnlock(v);
    await AsyncStorage.setItem(BIOMETRIC_KEY, v ? '1' : '0');
  }

  const pinConfigured = user?.profile?.pinConfigured ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="Sécurité" sub="Mot de passe, PIN, authentification à deux facteurs." onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 22 }}>
        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingVertical: 6 }}>IDENTIFIANTS</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} label="Mot de passe" value="Changer le mot de passe" onPress={() => setPwOpen(true)} />
          <SetMobileRow t={t} label="Code PIN" value={pinConfigured ? '6 chiffres · configuré' : 'Non configuré'} onPress={() => setPinOpen(true)} />
        </View>

        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 6 }}>AUTHENTIFICATION À 2 FACTEURS</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} label="Application d'authentification" value="Non configurée" right={<IdnButton t={t} variant="primary" size="sm">Activer</IdnButton>} />
          <SetMobileRow t={t} label="SMS" value="Non configuré" right={<IdnButton t={t} variant="ghost" size="sm">Configurer</IdnButton>} />
          <SetMobileRow t={t} label="Clé matérielle (FIDO2)" value="YubiKey, Titan…" right={<IdnButton t={t} variant="ghost" size="sm">Ajouter</IdnButton>} />
        </View>

        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 6 }}>BIOMÉTRIE (CET APPAREIL)</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} label="Face ID" value="Pour déverrouiller l'app" right={<Toggle on={faceUnlock} onChange={toggleFace} t={t} />} />
        </View>

        <View style={{
          marginTop: 18, padding: 16, borderRadius: 14,
          backgroundColor: t.dark ? '#10243A' : idnTokens.blueSoft,
          flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        }}>
          <Icon name="shield" size={18} color={idnTokens.blue} />
          <Text style={{ flex: 1, fontSize: 12, color: t.ink2, lineHeight: 18 }}>
            La 2FA SMS, TOTP et FIDO2 sont disponibles depuis le portail web identite.ga. Elles seront branchées dans l'app mobile bientôt.
          </Text>
        </View>
      </ScrollView>
      <PasswordChangeModal visible={pwOpen} onClose={() => setPwOpen(false)} />
      <PinChangeModal visible={pinOpen} onClose={() => setPinOpen(false)} />
    </View>
  );
}
