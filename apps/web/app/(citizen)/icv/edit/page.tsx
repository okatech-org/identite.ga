"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { ArrowLeft, Loader2, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import type { FunctionReturnType } from "convex/server"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select"
import { Textarea } from "@repo/ui/components/textarea"

import { AiResultCard } from "../_components/ai-result-card"
import { icv } from "../_content/fr"
import { ICV_ACCENT } from "../_content/themes"

type SectionKind = "info" | "experience" | "education" | "skill" | "language"

const VALID_SECTIONS: SectionKind[] = [
  "info",
  "experience",
  "education",
  "skill",
  "language",
]

export default function IcvEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get("section") ?? "info"
  const cvParam = searchParams.get("cv") as Id<"citizenCv"> | null
  const idParam = searchParams.get("id")

  if (!VALID_SECTIONS.includes(sectionParam as SectionKind) || !cvParam) {
    return <InvalidParams />
  }

  return (
    <Editor
      section={sectionParam as SectionKind}
      cvId={cvParam}
      entryId={idParam}
      onClose={() => router.push("/icv")}
    />
  )
}

function InvalidParams() {
  return (
    <section className="mx-auto max-w-md p-8 text-center">
      <p className="text-sm font-bold text-muted-foreground">
        Paramètres invalides.
      </p>
      <Button asChild className="mt-4">
        <Link href="/icv">Retour</Link>
      </Button>
    </section>
  )
}

function Editor({
  section,
  cvId,
  entryId,
  onClose,
}: {
  section: SectionKind
  cvId: Id<"citizenCv">
  entryId: string | null
  onClose: () => void
}) {
  const cv = useQuery(api.cv.profile.get, { cvId })
  const isEditing = entryId !== null

  if (cv === undefined) {
    return (
      <section className="mx-auto w-full max-w-3xl px-5 py-10">
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }
  if (cv === null) {
    return <InvalidParams />
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-8 md:px-7 md:py-10">
      <header className="mb-6 flex items-center gap-3">
        <Button
          asChild
          variant="outline"
          size="icon"
          className="rounded-full"
        >
          <Link href="/icv">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {icv.editor.eyebrow}
          </p>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight">
            {titleFor(section, isEditing)}
          </h1>
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
        {section === "info" ? (
          <InfoForm cv={cv} onClose={onClose} />
        ) : section === "experience" ? (
          <ExperienceForm
            cvId={cvId}
            entry={findEntry(cv.experiences, entryId)}
            onClose={onClose}
          />
        ) : section === "education" ? (
          <EducationForm
            cvId={cvId}
            entry={findEntry(cv.education, entryId)}
            onClose={onClose}
          />
        ) : section === "skill" ? (
          <SkillForm
            cvId={cvId}
            entry={findEntry(cv.skills, entryId)}
            onClose={onClose}
          />
        ) : (
          <LanguageForm
            cvId={cvId}
            entry={findEntry(cv.languages, entryId)}
            onClose={onClose}
          />
        )}
      </div>
    </section>
  )
}

function titleFor(section: SectionKind, editing: boolean): string {
  switch (section) {
    case "info":
      return "Mes informations"
    case "experience":
      return editing
        ? icv.editor.sections.experience.editTitle
        : icv.editor.sections.experience.addTitle
    case "education":
      return editing
        ? icv.editor.sections.education.editTitle
        : icv.editor.sections.education.addTitle
    case "skill":
      return editing
        ? icv.editor.sections.skill.editTitle
        : icv.editor.sections.skill.addTitle
    case "language":
      return editing
        ? icv.editor.sections.language.editTitle
        : icv.editor.sections.language.addTitle
  }
}

function findEntry<T extends { id: string }>(
  arr: T[],
  id: string | null,
): T | null {
  if (!id) return null
  return arr.find((e) => e.id === id) ?? null
}

// ─────────────────────────────────────────────────────────────────────────
// Formulaire INFO (champs racine)
// ─────────────────────────────────────────────────────────────────────────

type CvFull = NonNullable<FunctionReturnType<typeof api.cv.profile.get>>

function InfoForm({
  cv,
  onClose,
}: {
  cv: CvFull
  onClose: () => void
}) {
  const upsert = useMutation(api.cv.profile.upsert)
  const [pending, setPending] = React.useState(false)
  const [form, setForm] = React.useState({
    firstName: cv.firstName,
    lastName: cv.lastName,
    email: cv.email,
    phone: cv.phone,
    address: cv.address,
    summary: cv.summary,
    portfolioUrl: cv.portfolioUrl ?? "",
    linkedinUrl: cv.linkedinUrl ?? "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
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
          portfolioUrl: form.portfolioUrl || undefined,
          linkedinUrl: form.linkedinUrl || undefined,
        },
      })
      toast.success("Informations enregistrées.")
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Prénom">
          <Input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            maxLength={80}
          />
        </Field>
        <Field label="Nom">
          <Input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            maxLength={80}
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Téléphone">
          <Input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            maxLength={30}
          />
        </Field>
      </div>
      <Field label="Adresse">
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </Field>
      <Field
        label="Résumé professionnel"
        hint="50-300 caractères pour un score optimal."
      >
        <Textarea
          rows={4}
          value={form.summary}
          onChange={(e) => setForm({ ...form, summary: e.target.value })}
          maxLength={2000}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="LinkedIn (URL)">
          <Input
            type="url"
            placeholder="https://linkedin.com/in/..."
            value={form.linkedinUrl}
            onChange={(e) =>
              setForm({ ...form, linkedinUrl: e.target.value })
            }
          />
        </Field>
        <Field label="Portfolio (URL)">
          <Input
            type="url"
            placeholder="https://..."
            value={form.portfolioUrl}
            onChange={(e) =>
              setForm({ ...form, portfolioUrl: e.target.value })
            }
          />
        </Field>
      </div>
      <FormActions onCancel={onClose} pending={pending} />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Formulaire EXPÉRIENCE (avec bouton IA)
// ─────────────────────────────────────────────────────────────────────────

function ExperienceForm({
  cvId,
  entry,
  onClose,
}: {
  cvId: Id<"citizenCv">
  entry: {
    id: string
    title: string
    company: string
    startDate: string
    endDate?: string
    current: boolean
    description: string
  } | null
  onClose: () => void
}) {
  const add = useMutation(api.cv.experiences.add)
  const update = useMutation(api.cv.experiences.update)
  const remove = useMutation(api.cv.experiences.remove)
  const [pending, setPending] = React.useState(false)
  const [aiVisible, setAiVisible] = React.useState(false)
  const [form, setForm] = React.useState({
    title: entry?.title ?? "",
    company: entry?.company ?? "",
    startDate: entry?.startDate ?? "",
    endDate: entry?.endDate ?? "",
    current: entry?.current ?? false,
    description: entry?.description ?? "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      const data = {
        title: form.title,
        company: form.company,
        startDate: form.startDate,
        endDate: form.current ? undefined : form.endDate || undefined,
        current: form.current,
        description: form.description,
      }
      if (entry) {
        await update({ cvId, id: entry.id, patch: data })
        toast.success("Expérience mise à jour.")
      } else {
        await add({ cvId, data })
        toast.success("Expérience ajoutée.")
      }
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!entry || pending) return
    if (!window.confirm("Supprimer cette expérience ?")) return
    setPending(true)
    try {
      await remove({ cvId, id: entry.id })
      toast.success("Expérience supprimée.")
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label={icv.editor.sections.experience.fields.title}>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder={icv.editor.sections.experience.fields.titlePh}
        />
      </Field>
      <Field label={icv.editor.sections.experience.fields.company}>
        <Input
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          placeholder={icv.editor.sections.experience.fields.companyPh}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={icv.editor.sections.experience.fields.startDate}>
          <Input
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            placeholder="01/2022"
          />
        </Field>
        <Field label={icv.editor.sections.experience.fields.endDate}>
          <Input
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            placeholder={
              form.current
                ? "—"
                : icv.editor.sections.experience.fields.endDatePh
            }
            disabled={form.current}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.current}
          onChange={(e) => setForm({ ...form, current: e.target.checked })}
          className="h-4 w-4 accent-emerald-600"
        />
        {icv.editor.sections.experience.fields.current}
      </label>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label>{icv.editor.sections.experience.fields.description}</Label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-auto rounded-full px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"
            onClick={() => setAiVisible(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {icv.editor.sections.experience.aiImprove}
          </Button>
        </div>
        <Textarea
          rows={5}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={5000}
        />
        {aiVisible ? (
          <div className="mt-3">
            <AiResultCard
              cvId={cvId}
              feature="improve_summary"
              currentSummary={undefined}
              onClose={() => setAiVisible(false)}
            />
          </div>
        ) : null}
      </div>

      <FormActions
        onCancel={onClose}
        onDelete={entry ? handleDelete : undefined}
        pending={pending}
      />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Formulaire FORMATION
// ─────────────────────────────────────────────────────────────────────────

function EducationForm({
  cvId,
  entry,
  onClose,
}: {
  cvId: Id<"citizenCv">
  entry: {
    id: string
    degree: string
    school: string
    year: string
    description?: string
  } | null
  onClose: () => void
}) {
  const add = useMutation(api.cv.education.add)
  const update = useMutation(api.cv.education.update)
  const remove = useMutation(api.cv.education.remove)
  const [pending, setPending] = React.useState(false)
  const [form, setForm] = React.useState({
    degree: entry?.degree ?? "",
    school: entry?.school ?? "",
    year: entry?.year ?? "",
    description: entry?.description ?? "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      const data = {
        degree: form.degree,
        school: form.school,
        year: form.year,
        description: form.description || undefined,
      }
      if (entry) {
        await update({ cvId, id: entry.id, patch: data })
        toast.success("Formation mise à jour.")
      } else {
        await add({ cvId, data })
        toast.success("Formation ajoutée.")
      }
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!entry || pending) return
    if (!window.confirm("Supprimer cette formation ?")) return
    setPending(true)
    try {
      await remove({ cvId, id: entry.id })
      toast.success("Formation supprimée.")
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label={icv.editor.sections.education.fields.degree}>
        <Input
          value={form.degree}
          onChange={(e) => setForm({ ...form, degree: e.target.value })}
        />
      </Field>
      <Field label={icv.editor.sections.education.fields.school}>
        <Input
          value={form.school}
          onChange={(e) => setForm({ ...form, school: e.target.value })}
        />
      </Field>
      <Field label={icv.editor.sections.education.fields.year}>
        <Input
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
          placeholder="2024"
        />
      </Field>
      <Field label={icv.editor.sections.education.fields.description}>
        <Textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          maxLength={2000}
        />
      </Field>
      <FormActions
        onCancel={onClose}
        onDelete={entry ? handleDelete : undefined}
        pending={pending}
      />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Formulaire COMPÉTENCE
// ─────────────────────────────────────────────────────────────────────────

const SKILL_LEVELS = ["Débutant", "Intermédiaire", "Avancé", "Expert"] as const

function SkillForm({
  cvId,
  entry,
  onClose,
}: {
  cvId: Id<"citizenCv">
  entry: {
    id: string
    name: string
    level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert"
  } | null
  onClose: () => void
}) {
  const add = useMutation(api.cv.skills.add)
  const update = useMutation(api.cv.skills.update)
  const remove = useMutation(api.cv.skills.remove)
  const [pending, setPending] = React.useState(false)
  const [form, setForm] = React.useState<{
    name: string
    level: (typeof SKILL_LEVELS)[number]
  }>({
    name: entry?.name ?? "",
    level: entry?.level ?? "Intermédiaire",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      if (entry) {
        await update({ cvId, id: entry.id, patch: form })
        toast.success("Compétence mise à jour.")
      } else {
        await add({ cvId, data: form })
        toast.success("Compétence ajoutée.")
      }
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!entry || pending) return
    if (!window.confirm("Supprimer cette compétence ?")) return
    setPending(true)
    try {
      await remove({ cvId, id: entry.id })
      toast.success("Compétence supprimée.")
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label={icv.editor.sections.skill.fields.name}>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          maxLength={60}
          placeholder="ex. TypeScript, Communication…"
        />
      </Field>
      <Field label={icv.editor.sections.skill.fields.level}>
        <Select
          value={form.level}
          onValueChange={(v) =>
            setForm({ ...form, level: v as (typeof SKILL_LEVELS)[number] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SKILL_LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <FormActions
        onCancel={onClose}
        onDelete={entry ? handleDelete : undefined}
        pending={pending}
      />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Formulaire LANGUE
// ─────────────────────────────────────────────────────────────────────────

const LANG_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Natif"] as const

function LanguageForm({
  cvId,
  entry,
  onClose,
}: {
  cvId: Id<"citizenCv">
  entry: {
    id: string
    name: string
    level: (typeof LANG_LEVELS)[number]
  } | null
  onClose: () => void
}) {
  const add = useMutation(api.cv.languages.add)
  const update = useMutation(api.cv.languages.update)
  const remove = useMutation(api.cv.languages.remove)
  const [pending, setPending] = React.useState(false)
  const [form, setForm] = React.useState<{
    name: string
    level: (typeof LANG_LEVELS)[number]
  }>({
    name: entry?.name ?? "",
    level: entry?.level ?? "B2",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    setPending(true)
    try {
      if (entry) {
        await update({ cvId, id: entry.id, patch: form })
        toast.success("Langue mise à jour.")
      } else {
        await add({ cvId, data: form })
        toast.success("Langue ajoutée.")
      }
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!entry || pending) return
    if (!window.confirm("Supprimer cette langue ?")) return
    setPending(true)
    try {
      await remove({ cvId, id: entry.id })
      toast.success("Langue supprimée.")
      onClose()
    } catch (e) {
      toast.error(icv.errors.saveFailed, { description: (e as Error).message })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label={icv.editor.sections.language.fields.name}>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          maxLength={40}
          placeholder="ex. Anglais, Fang…"
        />
      </Field>
      <Field label={icv.editor.sections.language.fields.level}>
        <Select
          value={form.level}
          onValueChange={(v) =>
            setForm({ ...form, level: v as (typeof LANG_LEVELS)[number] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANG_LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <FormActions
        onCancel={onClose}
        onDelete={entry ? handleDelete : undefined}
        pending={pending}
      />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers partagés
// ─────────────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function FormActions({
  onCancel,
  onDelete,
  pending,
}: {
  onCancel: () => void
  onDelete?: () => void
  pending: boolean
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-2">
      {onDelete ? (
        <Button
          type="button"
          variant="outline"
          onClick={onDelete}
          disabled={pending}
          className="mr-auto text-destructive"
        >
          Supprimer
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={pending}
      >
        {icv.editor.cancel}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {icv.editor.save}
      </Button>
    </div>
  )
}
