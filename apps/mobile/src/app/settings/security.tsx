import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NLargeHeader } from '@/components/chrome/large-header';
import { SetMobileRow } from '@/components/rows/setting-row';
import { IdnButton } from '@/design/components/idn-button';
import { IdnInput } from '@/design/components/idn-input';
import { Toggle } from '@/design/components/toggle';
import { Icon } from '@/design/icons';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { BIOMETRIC_KEY } from '@/app/(auth)/signup/bio';

/** Extrait le secret Base32 d'une URI otpauth:// (pour saisie manuelle). */
function secretFromTotpUri(uri: string): string | null {
  const m = uri.match(/[?&]secret=([^&]+)/i);
  return m ? decodeURIComponent(m[1]) : null;
}

type Passkey = { id: string; name?: string; createdAt: string | number | Date };

function fmtDate(v: string | number | Date): string {
  return new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

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

function PinChangeModal({ visible, configured, onClose }: { visible: boolean; configured: boolean; onClose: () => void }) {
  const t = useIdnTheme();
  const createPin = useMutation(api.onboarding.createPin);
  const changePin = useMutation(api.onboarding.changePin);
  const [phase, setPhase] = useState<'check' | 'new' | 'confirm'>('check');
  const [pin, setPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  function reset() {
    setPhase(configured ? 'check' : 'new');
    setPin(''); setCurrentPin(''); setNewPin(''); setError(null); setSubmitting(false);
  }

  async function next(pinValue: string) {
    setError(null);
    if (phase === 'check') {
      setCurrentPin(pinValue);
      setPhase('new');
      setPin('');
    } else if (phase === 'new') {
      setNewPin(pinValue);
      setPhase('confirm');
      setPin('');
    } else {
      if (pinValue !== newPin) {
        setError('Les deux PIN ne correspondent pas.');
        setPhase('new');
        setPin('');
        setNewPin('');
        return;
      }
      setSubmitting(true);
      try {
        if (configured) {
          await changePin({ currentPin, newPin: pinValue });
        } else {
          await createPin({ pin: pinValue });
        }
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onShow={reset} onRequestClose={() => { reset(); onClose(); }}>
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

function TotpEnrollModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'password' | 'setup'>('password');
  const [password, setPassword] = useState('');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<'secret' | 'codes' | null>(null);

  const secret = totpUri ? secretFromTotpUri(totpUri) : null;

  function reset() {
    setPhase('password'); setPassword(''); setTotpUri(null); setBackupCodes([]);
    setCode(''); setError(null); setSubmitting(false); setCopied(null);
  }
  function close() { reset(); onClose(); }

  async function enable() {
    if (submitting) return;
    if (!password) { setError('Saisissez votre mot de passe.'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await authClient.twoFactor.enable({ password });
      if (res?.error) {
        const msg = (res.error.message ?? '').toLowerCase();
        setError(msg.includes('password') || msg.includes('invalid') ? 'Mot de passe incorrect.' : (res.error.message ?? 'Activation impossible.'));
        setSubmitting(false);
        return;
      }
      setTotpUri(res.data.totpURI);
      setBackupCodes((res.data.backupCodes ?? []) as string[]);
      setPhase('setup');
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation impossible.');
      setSubmitting(false);
    }
  }

  async function verify() {
    if (submitting) return;
    if (code.trim().length !== 6) { setError('Saisissez le code à 6 chiffres.'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await authClient.twoFactor.verifyTotp({ code: code.trim() });
      if (res?.error) {
        setError('Code incorrect. Vérifiez votre application d\'authentification.');
        setCode(''); setSubmitting(false);
        return;
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vérification impossible.');
      setSubmitting(false);
    }
  }

  async function copy(kind: 'secret' | 'codes', text: string) {
    await Clipboard.setStringAsync(text);
    setCopied(kind);
    setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1500);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <Pressable onPress={close}><Text style={{ color: idnTokens.green, fontSize: 14, fontWeight: '500' }}>Annuler</Text></Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: t.ink }}>Application d’authentification</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }} keyboardShouldPersistTaps="handled">
          {phase === 'password' ? (
            <>
              <Text style={{ fontSize: 13, color: t.ink2, lineHeight: 19 }}>
                Confirmez votre mot de passe pour générer une clé secrète et l’associer à votre application d’authentification (Google Authenticator, 1Password, etc.).
              </Text>
              <IdnInput t={t} label="Mot de passe" value={password} onChangeText={setPassword} type="password" autoFocus />
              {error ? (
                <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
                </View>
              ) : null}
              <IdnButton t={t} variant="primary" size="lg" full onPress={enable} disabled={submitting}>
                {submitting ? 'Génération…' : 'Continuer'}
              </IdnButton>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13, color: t.ink2, lineHeight: 19 }}>
                Scannez ce QR code dans votre application d’authentification, puis saisissez le code à 6 chiffres généré pour finaliser.
              </Text>
              {totpUri ? (
                <View style={{ alignSelf: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 14 }}>
                  <QRCode value={totpUri} size={180} color="#0E110D" backgroundColor="#fff" />
                </View>
              ) : null}
              {secret ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: idnTokens.text.label, fontWeight: '600', color: t.ink }}>Clé secrète (saisie manuelle)</Text>
                  <Pressable onPress={() => copy('secret', secret)} style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ flex: 1, color: t.ink, fontSize: 13, fontFamily: idnTokens.mono, letterSpacing: 1 }}>{secret}</Text>
                    <Text style={{ color: idnTokens.green, fontSize: 12, fontWeight: '600' }}>{copied === 'secret' ? 'Copié' : 'Copier'}</Text>
                  </Pressable>
                </View>
              ) : null}
              {backupCodes.length > 0 ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: idnTokens.text.label, fontWeight: '600', color: t.ink }}>Codes de secours</Text>
                  <Text style={{ fontSize: 12, color: t.muted, lineHeight: 17 }}>Conservez-les hors ligne : chacun permet une connexion si vous perdez votre application.</Text>
                  <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 14, gap: 4 }}>
                    {backupCodes.map((c) => (
                      <Text key={c} style={{ color: t.ink, fontSize: 13, fontFamily: idnTokens.mono, letterSpacing: 1 }}>{c}</Text>
                    ))}
                    <Pressable onPress={() => copy('codes', backupCodes.join('\n'))} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                      <Text style={{ color: idnTokens.green, fontSize: 12, fontWeight: '600' }}>{copied === 'codes' ? 'Copiés' : 'Copier les codes'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <IdnInput t={t} label="Code à 6 chiffres" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} placeholder="000000" type="number" />
              {error ? (
                <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
                  <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
                </View>
              ) : null}
              <IdnButton t={t} variant="primary" size="lg" full onPress={verify} disabled={submitting || code.length !== 6}>
                {submitting ? 'Vérification…' : 'Activer la 2FA'}
              </IdnButton>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function TotpDisableModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function close() { setPassword(''); setError(null); setSubmitting(false); onClose(); }

  async function disable() {
    if (submitting) return;
    if (!password) { setError('Saisissez votre mot de passe.'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await authClient.twoFactor.disable({ password });
      if (res?.error) {
        const msg = (res.error.message ?? '').toLowerCase();
        setError(msg.includes('password') || msg.includes('invalid') ? 'Mot de passe incorrect.' : (res.error.message ?? 'Désactivation impossible.'));
        setSubmitting(false);
        return;
      }
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Désactivation impossible.');
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: t.borderSoft }}>
          <Pressable onPress={close}><Text style={{ color: idnTokens.green, fontSize: 14, fontWeight: '500' }}>Annuler</Text></Pressable>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600', color: t.ink }}>Désactiver la 2FA</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 13, color: t.ink2, lineHeight: 19 }}>
            Confirmez votre mot de passe pour désactiver la double authentification par application. Vos codes de secours seront invalidés.
          </Text>
          <IdnInput t={t} label="Mot de passe" value={password} onChangeText={setPassword} type="password" autoFocus />
          {error ? (
            <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
            </View>
          ) : null}
          <IdnButton t={t} variant="danger" size="lg" full onPress={disable} disabled={submitting}>
            {submitting ? 'Désactivation…' : 'Désactiver'}
          </IdnButton>
        </ScrollView>
      </View>
    </Modal>
  );
}

function NipChangeModal({ visible, onClose, currentNip }: { visible: boolean; onClose: () => void; currentNip?: string }) {
  const t = useIdnTheme();
  const insets = useSafeAreaInsets();
  const updateNip = useMutation(api.profile.updateNip);
  const [nip, setNip] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function close() {
    setNip('');
    setError(null);
    setSubmitting(false);
    onClose();
  }

  async function submit() {
    const value = nip.trim();
    if (!/^[A-Za-z0-9]{14}$/.test(value)) {
      setError('Le NIP doit contenir exactement 14 lettres ou chiffres.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateNip({ nip: value });
      close();
      Alert.alert('NIP enregistré', 'Votre numéro d’identification personnelle a été mis à jour.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Mise à jour impossible.');
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            borderBottomWidth: 1,
            borderBottomColor: t.borderSoft,
          }}
        >
          <Pressable onPress={close}>
            <Text style={{ color: idnTokens.green, fontSize: 14 }}>Annuler</Text>
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              color: t.ink,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            {currentNip ? 'Modifier le NIP' : 'Définir le NIP'}
          </Text>
          <View style={{ width: 54 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 22, gap: 14 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: t.muted, fontSize: 12, lineHeight: 18 }}>Le NIP RBPP comporte exactement 14 caractères. Vérifiez-le soigneusement avant l’enregistrement.</Text>
          <IdnInput t={t} label="NIP (RBPP)" value={nip} onChangeText={(value) => setNip(value.replace(/[^A-Za-z0-9]/g, '').slice(0, 14))} placeholder="14 caractères" autoFocus />
          {error ? (
            <View
              style={{
                backgroundColor: t.dark ? '#3A1212' : '#FBE5E5',
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: '#B83A3A', fontSize: 12 }}>{error}</Text>
            </View>
          ) : null}
          <IdnButton t={t} size="lg" full onPress={submit} disabled={submitting || nip.length !== 14}>
            {submitting ? 'Enregistrement…' : 'Enregistrer le NIP'}
          </IdnButton>
        </ScrollView>
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
  const { data: session } = authClient.useSession();
  const twoFactorEnabled: boolean = session?.user?.twoFactorEnabled ?? false;
  const [pwOpen, setPwOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [nipOpen, setNipOpen] = useState(false);
  const [totpEnrollOpen, setTotpEnrollOpen] = useState(false);
  const [totpDisableOpen, setTotpDisableOpen] = useState(false);
  const [faceUnlock, setFaceUnlock] = useState(false);
  const [passkeys, setPasskeys] = useState<Passkey[] | undefined>(undefined);
  const [pkError, setPkError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      const flag = await AsyncStorage.getItem(BIOMETRIC_KEY);
      setFaceUnlock(flag === '1');
    })();
  }, []);

  const loadPasskeys = React.useCallback(async () => {
    try {
      const res = await authClient.passkey.listUserPasskeys();
      if (res?.error) {
        setPkError(res.error.message ?? 'Impossible de charger les clés.');
        setPasskeys([]);
        return;
      }
      setPkError(null);
      setPasskeys((res?.data ?? []) as Passkey[]);
    } catch (err) {
      setPkError(err instanceof Error ? err.message : 'Impossible de charger les clés.');
      setPasskeys([]);
    }
  }, []);

  React.useEffect(() => {
    if (isAuthenticated) void loadPasskeys();
  }, [isAuthenticated, loadPasskeys]);

  async function toggleFace(v: boolean) {
    setFaceUnlock(v);
    await AsyncStorage.setItem(BIOMETRIC_KEY, v ? '1' : '0');
  }

  async function addPasskey() {
    if (adding) return;
    setAdding(true);
    setPkError(null);
    try {
      const res = await authClient.passkey.addPasskey({
        name: `Clé matérielle · ${fmtDate(Date.now())}`,
        authenticatorAttachment: 'cross-platform',
      });
      if (res?.error) {
        setPkError(res.error.message ?? 'Impossible d\'ajouter la clé.');
        return;
      }
      await loadPasskeys();
    } catch (err) {
      setPkError(err instanceof Error ? err.message : 'Impossible d\'ajouter la clé.');
    } finally {
      setAdding(false);
    }
  }

  function confirmDelete(pk: Passkey) {
    if (deleting) return;
    Alert.alert(
      'Supprimer cette clé ?',
      `${pk.name || 'Clé sans nom'} ne pourra plus servir à vous connecter. Cette action ne peut être annulée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeleting(pk.id);
            setPkError(null);
            try {
              const res = await authClient.passkey.deletePasskey({ id: pk.id });
              if (res?.error) {
                setPkError(res.error.message ?? 'Suppression impossible.');
                return;
              }
              await loadPasskeys();
            } catch (err) {
              setPkError(err instanceof Error ? err.message : 'Suppression impossible.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    );
  }

  const fido2Value = pkError
    ? pkError
    : passkeys === undefined
      ? 'Chargement…'
      : passkeys.length === 0
        ? 'Aucune clé enregistrée'
        : `${passkeys.length} clé${passkeys.length > 1 ? 's' : ''} enregistrée${passkeys.length > 1 ? 's' : ''}`;

  const pinConfigured = user?.profile?.pinConfigured ?? false;
  const currentNip = user?.profile?.pivot?.nip;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader t={t} title="Sécurité" sub="Mot de passe, PIN, authentification à deux facteurs." onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 4, paddingBottom: 22 }}>
        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingVertical: 6 }}>IDENTIFIANTS</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow t={t} label="Mot de passe" value="Changer le mot de passe" onPress={() => setPwOpen(true)} />
          <SetMobileRow t={t} label="Code PIN" value={pinConfigured ? '6 chiffres · configuré' : 'Non configuré'} onPress={() => setPinOpen(true)} />
          <SetMobileRow t={t} label="NIP (RBPP)" value={currentNip ? `Configuré · ${currentNip.slice(0, 4)}••••••${currentNip.slice(-4)}` : 'Non configuré'} onPress={() => setNipOpen(true)} />
        </View>

        <Text style={{ fontSize: 10, color: t.muted, letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingTop: 14, paddingBottom: 6 }}>AUTHENTIFICATION À 2 FACTEURS</Text>
        <View style={{ backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 14, overflow: 'hidden' }}>
          <SetMobileRow
            t={t}
            label="Application d'authentification"
            value={twoFactorEnabled ? 'Configurée' : 'Non configurée'}
            right={
              twoFactorEnabled
                ? <IdnButton t={t} variant="danger" size="sm" onPress={() => setTotpDisableOpen(true)}>Désactiver</IdnButton>
                : <IdnButton t={t} variant="primary" size="sm" onPress={() => setTotpEnrollOpen(true)}>Activer</IdnButton>
            }
          />
          <SetMobileRow
            t={t}
            label="Clé matérielle (FIDO2)"
            value={fido2Value}
            right={<IdnButton t={t} variant="ghost" size="sm" onPress={addPasskey} disabled={adding}>{adding ? 'Ajout…' : 'Ajouter'}</IdnButton>}
          />
          {(passkeys ?? []).map((pk) => (
            <SetMobileRow
              key={pk.id}
              t={t}
              label={pk.name || 'Clé sans nom'}
              value={`Ajoutée le ${fmtDate(pk.createdAt)}`}
              right={
                <IdnButton t={t} variant="danger" size="sm" onPress={() => confirmDelete(pk)} disabled={deleting !== null}>
                  {deleting === pk.id ? 'Suppression…' : 'Supprimer'}
                </IdnButton>
              }
            />
          ))}
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
            L’application d’authentification (TOTP) et les clés matérielles (FIDO2) protègent votre compte. Conservez vos codes de secours hors ligne pour ne jamais perdre l’accès.
          </Text>
        </View>
      </ScrollView>
      <PasswordChangeModal visible={pwOpen} onClose={() => setPwOpen(false)} />
      <PinChangeModal visible={pinOpen} configured={pinConfigured} onClose={() => setPinOpen(false)} />
      <NipChangeModal visible={nipOpen} onClose={() => setNipOpen(false)} currentNip={currentNip} />
      <TotpEnrollModal visible={totpEnrollOpen} onClose={() => setTotpEnrollOpen(false)} />
      <TotpDisableModal visible={totpDisableOpen} onClose={() => setTotpDisableOpen(false)} />
    </View>
  );
}
