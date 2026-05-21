import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { IdnInput } from '@/design/components/idn-input';
import {
  getOnboardingProfile,
  getOnboardingPivot,
  setOnboardingPivot,
} from '@/hooks/use-onboarding-state';

const GENDERS: { v: 'M' | 'F'; label: string }[] = [
  { v: 'M', label: 'Masculin' },
  { v: 'F', label: 'Féminin' },
];

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Accepte DD/MM/YYYY → ISO YYYY-MM-DD
function normalizeDate(s: string): string {
  if (isIsoDate(s)) return s;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return s;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export default function SignupPivot() {
  const t = useIdnTheme();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState(''); // utilisateur saisit DD/MM/YYYY
  const [gender, setGender] = useState<'M' | 'F'>('F');
  const [nat, setNat] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const profile = await getOnboardingProfile();
      if (!profile) {
        router.replace('/(auth)/signup/profil');
        return;
      }
      const saved = await getOnboardingPivot();
      if (saved) {
        setFirstName(saved.firstName);
        setLastName(saved.lastName);
        setDob(saved.dateOfBirth);
        if (saved.gender === 'M' || saved.gender === 'F') setGender(saved.gender);
        setBirthPlace(saved.birthPlace);
        setNat(saved.nationality);
        if (saved.phone) setPhone(saved.phone);
      } else if (profile === 'citizen') {
        // Pré-remplit nationalité gabonaise pour les citoyens — modifiable.
        setNat('Gabonaise');
      }
    })();
  }, [router]);

  const normalized = normalizeDate(dob);
  const dobValid = isIsoDate(normalized);
  const canSubmit =
    firstName.trim() && lastName.trim() && dobValid && birthPlace.trim() && nat.trim() && !submitting;

  async function next() {
    if (!canSubmit) {
      setError('Tous les champs sont obligatoires. Date au format JJ/MM/AAAA.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setOnboardingPivot({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: normalized,
        gender,
        birthPlace: birthPlace.trim(),
        nationality: nat.trim(),
        phone: phone.trim() || undefined,
      });
      // cast Href : la route est nouvelle, les types Expo Router seront
      // régénérés au prochain démarrage du dev server.
      router.push('/(auth)/signup/idn' as Href);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <NStepShell
      t={t}
      step={2}
      total={5}
      title="Vos informations"
      sub="Identité pivot — telle qu'elle figure sur vos documents officiels."
      onBack={() => router.back()}
      onPrimary={next}
      primary={submitting ? 'Enregistrement…' : 'Continuer'}
    >
      <IdnInput t={t} label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Aïssatou" autoFocus />
      <IdnInput t={t} label="Nom" value={lastName} onChangeText={setLastName} placeholder="Mboumba" />
      <IdnInput t={t} label="Date de naissance" value={dob} onChangeText={setDob} placeholder="JJ/MM/AAAA" />
      <View>
        <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>Genre</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GENDERS.map((g) => {
            const sel = g.v === gender;
            return (
              <Pressable key={g.v} onPress={() => setGender(g.v)} style={{
                paddingHorizontal: 14, paddingVertical: 10,
                borderRadius: 10, borderWidth: 1.5,
                borderColor: sel ? idnTokens.green : t.border,
                backgroundColor: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
              }}>
                <Text style={{ fontSize: 13, color: t.ink, fontWeight: sel ? '600' : '500' }}>{g.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}><IdnInput t={t} label="Nationalité" value={nat} onChangeText={setNat} /></View>
        <View style={{ flex: 1 }}><IdnInput t={t} label="Lieu de naissance" value={birthPlace} onChangeText={setBirthPlace} placeholder="Libreville" /></View>
      </View>
      <IdnInput
        t={t}
        label="Numéro de téléphone"
        value={phone}
        onChangeText={setPhone}
        placeholder="+241 06 22 14 89"
        type="tel"
      />
      {error ? (
        <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
        </View>
      ) : null}
    </NStepShell>
  );
}
