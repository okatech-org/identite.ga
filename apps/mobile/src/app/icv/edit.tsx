import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@/lib/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import type { FunctionReturnType } from 'convex/server';
import { Icon } from '@/design/icons';
import { idnTokens } from '@/design/tokens';
import { useIdnTheme } from '@/design/theme';
import { NLargeHeader } from '@/components/chrome/large-header';
import { IdnButton } from '@/design/components/idn-button';
import { icvStrings, LANG_LEVELS, SKILL_LEVELS } from '@/data/cv';
import { AiResultCard } from '@/components/cv/ai-result-card';

type SectionKind = 'info' | 'experience' | 'education' | 'skill' | 'language' | 'hobby';
const VALID_SECTIONS: SectionKind[] = [
  'info',
  'experience',
  'education',
  'skill',
  'language',
  'hobby',
];

type CvFull = NonNullable<FunctionReturnType<typeof api.cv.profile.get>>;

export default function ICVEdit() {
  const t = useIdnTheme();
  const params = useLocalSearchParams<{ section?: string; cv?: string; id?: string }>();
  const section = params.section as SectionKind | undefined;
  const cvParam = params.cv as Id<'citizenCv'> | undefined;
  const idParam = params.id ?? null;
  const router = useRouter();

  if (!section || !VALID_SECTIONS.includes(section) || !cvParam) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: t.muted }}>Paramètres invalides.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: idnTokens.green, fontWeight: '600' }}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return <Editor section={section} cvId={cvParam} entryId={idParam} />;
}

function Editor({
  section,
  cvId,
  entryId,
}: {
  section: SectionKind;
  cvId: Id<'citizenCv'>;
  entryId: string | null;
}) {
  const t = useIdnTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cv = useQuery(api.cv.profile.get, { cvId });

  if (cv === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={idnTokens.green} />
      </View>
    );
  }
  if (cv === null) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: t.muted }}>{icvStrings.errors.loadFailed}</Text>
      </View>
    );
  }

  const isEditing = entryId !== null;
  // Pour les sections multi-entrées sans `?id=` : afficher la liste en haut.
  const showList = !isEditing && section !== 'info' && section !== 'hobby'
    && sectionItems(cv, section).length > 0;
  const title = showList ? listTitleFor(section) : computeTitle(section, isEditing);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <NLargeHeader
        t={t}
        title={title}
        sub={icvStrings.editor.eyebrow}
        onBack={() => router.back()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingBottom: insets.bottom + 32,
          gap: 14,
        }}
      >
        {showList ? <SectionList section={section} cv={cv} cvId={cvId} /> : null}
        {showList ? (
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1.4,
              color: t.muted,
              marginTop: 4,
            }}
          >
            {addTitleFor(section).toUpperCase()}
          </Text>
        ) : null}

        {section === 'info' && <InfoForm cv={cv} onDone={() => router.back()} />}
        {section === 'experience' && (
          <ExperienceForm
            cvId={cvId}
            entry={findEntry(cv.experiences, entryId)}
            onDone={() => router.back()}
          />
        )}
        {section === 'education' && (
          <EducationForm
            cvId={cvId}
            entry={findEntry(cv.education, entryId)}
            onDone={() => router.back()}
          />
        )}
        {section === 'skill' && (
          <SkillForm
            cvId={cvId}
            entry={findEntry(cv.skills, entryId)}
            onDone={() => router.back()}
          />
        )}
        {section === 'language' && (
          <LanguageForm
            cvId={cvId}
            entry={findEntry(cv.languages, entryId)}
            onDone={() => router.back()}
          />
        )}
        {section === 'hobby' && <HobbyForm cv={cv} cvId={cvId} onDone={() => router.back()} />}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Liste des entrées existantes (au-dessus du formulaire d'ajout)
// ─────────────────────────────────────────────────────────────────────────

type SectionEntry = { id: string };

function sectionItems(cv: CvFull, section: SectionKind): SectionEntry[] {
  if (section === 'experience') return cv.experiences;
  if (section === 'education') return cv.education;
  if (section === 'skill') return cv.skills;
  if (section === 'language') return cv.languages;
  return [];
}

function listTitleFor(section: SectionKind): string {
  if (section === 'experience') return 'Mes expériences';
  if (section === 'education') return 'Mes formations';
  if (section === 'skill') return 'Mes compétences';
  if (section === 'language') return 'Mes langues';
  return '';
}

function addTitleFor(section: SectionKind): string {
  if (section === 'experience') return 'Ajouter une expérience';
  if (section === 'education') return 'Ajouter une formation';
  if (section === 'skill') return 'Ajouter une compétence';
  if (section === 'language') return 'Ajouter une langue';
  return '';
}

function SectionList({
  section,
  cv,
  cvId,
}: {
  section: SectionKind;
  cv: CvFull;
  cvId: Id<'citizenCv'>;
}) {
  const router = useRouter();
  const removeExperience = useMutation(api.cv.experiences.remove);
  const removeEducation = useMutation(api.cv.education.remove);
  const removeSkill = useMutation(api.cv.skills.remove);
  const removeLanguage = useMutation(api.cv.languages.remove);

  function confirmDelete(label: string, exec: () => Promise<void>) {
    Alert.alert(`Supprimer ${label} ?`, undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await exec();
          } catch (e) {
            Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
          }
        },
      },
    ]);
  }

  function rowPress(entryId: string) {
    router.push(`/icv/edit?section=${section}&cv=${cvId}&id=${entryId}` as never);
  }

  return (
    <View style={{ gap: 8 }}>
      {section === 'experience' &&
        cv.experiences.map((e) => (
          <Row
            key={e.id}
            primary={e.title || '(sans titre)'}
            secondary={[e.company, formatRange(e.startDate, e.endDate, e.current)]
              .filter(Boolean)
              .join(' · ')}
            onPress={() => rowPress(e.id)}
            onDelete={() =>
              confirmDelete('cette expérience', async () => {
                await removeExperience({ cvId, id: e.id });
              })
            }
          />
        ))}
      {section === 'education' &&
        cv.education.map((e) => (
          <Row
            key={e.id}
            primary={e.degree || '(sans diplôme)'}
            secondary={[e.school, e.year].filter(Boolean).join(' · ')}
            onPress={() => rowPress(e.id)}
            onDelete={() =>
              confirmDelete('cette formation', async () => {
                await removeEducation({ cvId, id: e.id });
              })
            }
          />
        ))}
      {section === 'skill' &&
        cv.skills.map((e) => (
          <Row
            key={e.id}
            primary={e.name}
            secondary={e.level}
            onPress={() => rowPress(e.id)}
            onDelete={() =>
              confirmDelete('cette compétence', async () => {
                await removeSkill({ cvId, id: e.id });
              })
            }
          />
        ))}
      {section === 'language' &&
        cv.languages.map((e) => (
          <Row
            key={e.id}
            primary={e.name}
            secondary={e.level}
            onPress={() => rowPress(e.id)}
            onDelete={() =>
              confirmDelete('cette langue', async () => {
                await removeLanguage({ cvId, id: e.id });
              })
            }
          />
        ))}
    </View>
  );
}

function Row({
  primary,
  secondary,
  onPress,
  onDelete,
}: {
  primary: string;
  secondary?: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  const t = useIdnTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: t.surface,
        borderWidth: 1,
        borderColor: t.border,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '600', color: t.ink }}>
          {primary}
        </Text>
        {secondary ? (
          <Text numberOfLines={1} style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>
            {secondary}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={{
          width: 32,
          height: 32,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="trash" size={16} color="#dc2626" />
      </Pressable>
    </Pressable>
  );
}

function formatRange(start: string, end: string | undefined, current: boolean): string {
  if (current) return `${start} → Aujourd'hui`;
  if (!end) return start;
  return `${start} → ${end}`;
}

function computeTitle(s: SectionKind, editing: boolean): string {
  if (s === 'info') return icvStrings.editor.sections.info;
  if (s === 'experience')
    return editing
      ? icvStrings.editor.sections.experienceEdit
      : icvStrings.editor.sections.experienceAdd;
  if (s === 'education')
    return editing
      ? icvStrings.editor.sections.educationEdit
      : icvStrings.editor.sections.educationAdd;
  if (s === 'skill')
    return editing
      ? icvStrings.editor.sections.skillEdit
      : icvStrings.editor.sections.skillAdd;
  if (s === 'language')
    return editing
      ? icvStrings.editor.sections.languageEdit
      : icvStrings.editor.sections.languageAdd;
  return "Centres d'intérêt";
}

function findEntry<T extends { id: string }>(arr: T[], id: string | null): T | null {
  if (!id) return null;
  return arr.find((e) => e.id === id) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// INFO
// ─────────────────────────────────────────────────────────────────────────

function InfoForm({ cv, onDone }: { cv: CvFull; onDone: () => void }) {
  const upsert = useMutation(api.cv.profile.upsert);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: cv.firstName,
    lastName: cv.lastName,
    email: cv.email,
    phone: cv.phone,
    address: cv.address,
    summary: cv.summary,
    linkedinUrl: cv.linkedinUrl ?? '',
    portfolioUrl: cv.portfolioUrl ?? '',
  });

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      await upsert({
        cvId: cv._id,
        patch: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          summary: form.summary,
          linkedinUrl: form.linkedinUrl || undefined,
          portfolioUrl: form.portfolioUrl || undefined,
        },
      });
      onDone();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormField label={icvStrings.editor.fields.firstName} value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} />
      <FormField label={icvStrings.editor.fields.lastName} value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
      <FormField label={icvStrings.editor.fields.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} keyboardType="email-address" />
      <FormField label={icvStrings.editor.fields.phone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
      <FormField label={icvStrings.editor.fields.address} value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      <FormField
        label={icvStrings.editor.fields.summary}
        hint={icvStrings.editor.fields.summaryHint}
        value={form.summary}
        onChange={(v) => setForm({ ...form, summary: v })}
        multiline
      />
      <FormField label={icvStrings.editor.fields.linkedinUrl} value={form.linkedinUrl} onChange={(v) => setForm({ ...form, linkedinUrl: v })} keyboardType="url" />
      <FormField label={icvStrings.editor.fields.portfolioUrl} value={form.portfolioUrl} onChange={(v) => setForm({ ...form, portfolioUrl: v })} keyboardType="url" />
      <SaveBar onCancel={onDone} onSave={save} busy={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EXPERIENCE (avec bouton IA)
// ─────────────────────────────────────────────────────────────────────────

function ExperienceForm({
  cvId,
  entry,
  onDone,
}: {
  cvId: Id<'citizenCv'>;
  entry: CvFull['experiences'][number] | null;
  onDone: () => void;
}) {
  const t = useIdnTheme();
  const add = useMutation(api.cv.experiences.add);
  const update = useMutation(api.cv.experiences.update);
  const remove = useMutation(api.cv.experiences.remove);
  const [busy, setBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [form, setForm] = useState({
    title: entry?.title ?? '',
    company: entry?.company ?? '',
    startDate: entry?.startDate ?? '',
    endDate: entry?.endDate ?? '',
    current: entry?.current ?? false,
    description: entry?.description ?? '',
  });

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const data = {
        title: form.title,
        company: form.company,
        startDate: form.startDate,
        endDate: form.current ? undefined : form.endDate || undefined,
        current: form.current,
        description: form.description,
      };
      if (entry) {
        await update({ cvId, id: entry.id, patch: data });
      } else {
        await add({ cvId, data });
      }
      onDone();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!entry) return;
    Alert.alert(
      'Supprimer cette expérience ?',
      undefined,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await remove({ cvId, id: entry.id });
              onDone();
            } catch (e) {
              Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <>
      <FormField label={icvStrings.editor.fields.title} value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="ex. Chef de Projet Digital" />
      <FormField label={icvStrings.editor.fields.company} value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <FormField label={icvStrings.editor.fields.startDate} value={form.startDate} onChange={(v) => setForm({ ...form, startDate: v })} placeholder="01/2022" />
        </View>
        <View style={{ flex: 1 }}>
          <FormField label={icvStrings.editor.fields.endDate} value={form.endDate} onChange={(v) => setForm({ ...form, endDate: v })} placeholder={form.current ? '—' : '—'} editable={!form.current} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Switch value={form.current} onValueChange={(v) => setForm({ ...form, current: v })} />
        <Text style={{ color: t.ink, fontSize: 14 }}>{icvStrings.editor.fields.current}</Text>
      </View>

      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: t.ink }}>
            {icvStrings.editor.fields.description}
          </Text>
          <Pressable
            onPress={() => setAiOpen(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 9999,
              backgroundColor: t.dark ? '#0F2818' : '#DCFCE7',
            }}
          >
            <Icon name="sparkles" size={12} color={idnTokens.green} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: idnTokens.green }}>
              {icvStrings.editor.aiImprove}
            </Text>
          </Pressable>
        </View>
        <TextInput
          value={form.description}
          onChangeText={(v) => setForm({ ...form, description: v })}
          multiline
          numberOfLines={5}
          style={{
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: t.ink,
            fontSize: 14,
            minHeight: 100,
            textAlignVertical: 'top',
          }}
        />
      </View>

      {aiOpen ? (
        <AiResultCard cvId={cvId} feature="improve_summary" onClose={() => setAiOpen(false)} />
      ) : null}

      <SaveBar onCancel={onDone} onSave={save} onDelete={entry ? handleDelete : undefined} busy={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// EDUCATION
// ─────────────────────────────────────────────────────────────────────────

function EducationForm({
  cvId,
  entry,
  onDone,
}: {
  cvId: Id<'citizenCv'>;
  entry: CvFull['education'][number] | null;
  onDone: () => void;
}) {
  const add = useMutation(api.cv.education.add);
  const update = useMutation(api.cv.education.update);
  const remove = useMutation(api.cv.education.remove);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    degree: entry?.degree ?? '',
    school: entry?.school ?? '',
    year: entry?.year ?? '',
    description: entry?.description ?? '',
  });

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const data = {
        degree: form.degree,
        school: form.school,
        year: form.year,
        description: form.description || undefined,
      };
      if (entry) await update({ cvId, id: entry.id, patch: data });
      else await add({ cvId, data });
      onDone();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!entry) return;
    Alert.alert('Supprimer cette formation ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await remove({ cvId, id: entry.id });
          onDone();
        },
      },
    ]);
  }

  return (
    <>
      <FormField label={icvStrings.editor.fields.degree} value={form.degree} onChange={(v) => setForm({ ...form, degree: v })} />
      <FormField label={icvStrings.editor.fields.school} value={form.school} onChange={(v) => setForm({ ...form, school: v })} />
      <FormField label={icvStrings.editor.fields.year} value={form.year} onChange={(v) => setForm({ ...form, year: v })} placeholder="2024" />
      <FormField label="Description (optionnel)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
      <SaveBar onCancel={onDone} onSave={save} onDelete={entry ? handleDelete : undefined} busy={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SKILL
// ─────────────────────────────────────────────────────────────────────────

function SkillForm({
  cvId,
  entry,
  onDone,
}: {
  cvId: Id<'citizenCv'>;
  entry: CvFull['skills'][number] | null;
  onDone: () => void;
}) {
  const add = useMutation(api.cv.skills.add);
  const update = useMutation(api.cv.skills.update);
  const remove = useMutation(api.cv.skills.remove);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; level: (typeof SKILL_LEVELS)[number] }>({
    name: entry?.name ?? '',
    level: entry?.level ?? 'Intermédiaire',
  });

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      if (entry) await update({ cvId, id: entry.id, patch: form });
      else await add({ cvId, data: form });
      onDone();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!entry) return;
    Alert.alert('Supprimer cette compétence ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await remove({ cvId, id: entry.id });
          onDone();
        },
      },
    ]);
  }

  return (
    <>
      <FormField label={icvStrings.editor.fields.skillName} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="ex. TypeScript" />
      <ChipPicker
        label={icvStrings.editor.fields.skillLevel}
        value={form.level}
        options={[...SKILL_LEVELS]}
        onChange={(v) => setForm({ ...form, level: v as (typeof SKILL_LEVELS)[number] })}
      />
      <SaveBar onCancel={onDone} onSave={save} onDelete={entry ? handleDelete : undefined} busy={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LANGUAGE
// ─────────────────────────────────────────────────────────────────────────

function LanguageForm({
  cvId,
  entry,
  onDone,
}: {
  cvId: Id<'citizenCv'>;
  entry: CvFull['languages'][number] | null;
  onDone: () => void;
}) {
  const add = useMutation(api.cv.languages.add);
  const update = useMutation(api.cv.languages.update);
  const remove = useMutation(api.cv.languages.remove);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ name: string; level: (typeof LANG_LEVELS)[number] }>({
    name: entry?.name ?? '',
    level: entry?.level ?? 'B2',
  });

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      if (entry) await update({ cvId, id: entry.id, patch: form });
      else await add({ cvId, data: form });
      onDone();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  function handleDelete() {
    if (!entry) return;
    Alert.alert('Supprimer cette langue ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          await remove({ cvId, id: entry.id });
          onDone();
        },
      },
    ]);
  }

  return (
    <>
      <FormField label={icvStrings.editor.fields.languageName} value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="ex. Anglais" />
      <ChipPicker
        label={icvStrings.editor.fields.languageLevel}
        value={form.level}
        options={[...LANG_LEVELS]}
        onChange={(v) => setForm({ ...form, level: v as (typeof LANG_LEVELS)[number] })}
      />
      <SaveBar onCancel={onDone} onSave={save} onDelete={entry ? handleDelete : undefined} busy={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HOBBIES — édités en bloc (un par ligne)
// ─────────────────────────────────────────────────────────────────────────

function HobbyForm({
  cv,
  cvId,
  onDone,
}: {
  cv: CvFull;
  cvId: Id<'citizenCv'>;
  onDone: () => void;
}) {
  const upsert = useMutation(api.cv.profile.upsert);
  const [busy, setBusy] = useState(false);
  const [value, setValue] = useState(cv.hobbies.join('\n'));

  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      const hobbies = value
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      await upsert({ cvId, patch: { hobbies } });
      onDone();
    } catch (e) {
      Alert.alert('Erreur', (e as Error).message ?? icvStrings.errors.saveFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormField
        label="Vos centres d'intérêt"
        hint="Un par ligne (ex. Photographie, Course à pied, Échecs)"
        value={value}
        onChange={setValue}
        multiline
        placeholder={'Photographie\nCourse à pied\nÉchecs'}
      />
      <SaveBar onCancel={onDone} onSave={save} busy={busy} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────

function FormField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  multiline,
  keyboardType,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url' | 'numeric';
  editable?: boolean;
}) {
  const t = useIdnTheme();
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.mutedSoft}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        editable={editable}
        style={{
          backgroundColor: t.surface,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 12,
          color: t.ink,
          fontSize: 14,
          minHeight: multiline ? 96 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
          opacity: editable ? 1 : 0.6,
        }}
      />
      {hint ? (
        <Text style={{ fontSize: 11, color: t.muted, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

function ChipPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const t = useIdnTheme();
  return (
    <View>
      <Text style={{ fontSize: 13, fontWeight: '500', color: t.ink, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => {
          const sel = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 9999,
                backgroundColor: sel ? idnTokens.green : t.surface,
                borderWidth: 1,
                borderColor: sel ? idnTokens.green : t.border,
              }}
            >
              <Text style={{ color: sel ? '#fff' : t.ink, fontSize: 12, fontWeight: '600' }}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SaveBar({
  onCancel,
  onSave,
  onDelete,
  busy,
}: {
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  busy: boolean;
}) {
  const t = useIdnTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
      {onDelete ? (
        <IdnButton variant="danger" size="md" t={t} onPress={onDelete} disabled={busy}>
          {icvStrings.editor.delete}
        </IdnButton>
      ) : null}
      <View style={{ flex: 1 }} />
      <IdnButton variant="ghost" size="md" t={t} onPress={onCancel} disabled={busy}>
        {icvStrings.editor.cancel}
      </IdnButton>
      <IdnButton variant="primary" size="md" t={t} onPress={onSave} disabled={busy}>
        {busy ? '…' : icvStrings.editor.save}
      </IdnButton>
    </View>
  );
}
