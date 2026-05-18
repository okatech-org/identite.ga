import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { IdnInput } from '@/design/components/idn-input';
import { api } from '@/lib/api';

const GENDERS: { v: 'M' | 'F' | 'O' | 'N'; label: string }[] = [
  { v: 'M', label: 'Masculin' },
  { v: 'F', label: 'Féminin' },
  { v: 'O', label: 'Autre' },
  { v: 'N', label: 'Non précisé' },
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
  const setPivot = useMutation(api.onboarding.setIdentityPivot);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState(''); // utilisateur saisit DD/MM/YYYY
  const [gender, setGender] = useState<'M' | 'F' | 'O' | 'N'>('F');
  const [nat, setNat] = useState('Gabonaise');
  const [birthPlace, setBirthPlace] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = normalizeDate(dob);
  const dobValid = isIsoDate(normalized);
  const canSubmit = firstName.trim() && lastName.trim() && dobValid && birthPlace.trim() && nat.trim() && !submitting;

  async function next() {
    if (!canSubmit) {
      setError('Tous les champs sont obligatoires. Date au format JJ/MM/AAAA.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setPivot({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: normalized,
        gender,
        birthPlace: birthPlace.trim(),
        nationality: nat.trim(),
      });
      router.push('/(auth)/signup/pin');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <NStepShell
      t={t}
      step={4}
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
      {error ? (
        <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 10, padding: 12 }}>
          <Text style={{ color: '#B83A3A', fontSize: 12, lineHeight: 17 }}>{error}</Text>
        </View>
      ) : null}
    </NStepShell>
  );
}
