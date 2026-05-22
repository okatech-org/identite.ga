import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useIdnTheme } from '@/design/theme';
import { idnTokens } from '@/design/tokens';
import { NStepShell } from '@/components/chrome/step-shell';
import { IdnInput } from '@/design/components/idn-input';
import { IdnDateInput } from '@/design/components/idn-date-input';
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

export default function SignupPivot() {
  const t = useIdnTheme();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
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
        setNat('Gabonaise');
      }
    })();
  }, [router]);

  const dobValid = isIsoDate(dob);
  const canSubmit =
    firstName.trim() && lastName.trim() && dobValid && birthPlace.trim() && nat.trim() && !submitting;

  async function next() {
    if (!canSubmit) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await setOnboardingPivot({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dob,
        gender,
        birthPlace: birthPlace.trim(),
        nationality: nat.trim(),
        phone: phone.trim() || undefined,
      });
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
      <IdnDateInput t={t} label="Date de naissance" value={dob} onChange={setDob} />
      <View>
        <Text style={{ fontSize: idnTokens.text.label, fontWeight: '600', color: t.ink, marginBottom: 8 }}>Genre</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GENDERS.map((g) => {
            const sel = g.v === gender;
            return (
              <Pressable key={g.v} onPress={() => setGender(g.v)} style={{
                paddingHorizontal: 18, paddingVertical: 14,
                borderRadius: 12, borderWidth: 1.5,
                borderColor: sel ? idnTokens.green : t.border,
                backgroundColor: sel ? (t.dark ? '#0F2A18' : idnTokens.greenSoft) : t.surface,
              }}>
                <Text style={{ fontSize: idnTokens.text.callout, color: t.ink, fontWeight: sel ? '600' : '500' }}>{g.label}</Text>
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
        <View style={{ backgroundColor: t.dark ? '#3A1212' : '#FBE5E5', borderRadius: 12, padding: 14 }}>
          <Text style={{ color: idnTokens.danger, fontSize: idnTokens.text.footnote, lineHeight: 18 }}>{error}</Text>
        </View>
      ) : null}
    </NStepShell>
  );
}
