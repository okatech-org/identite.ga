"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"
import {
  Briefcase,
  ChevronRight,
  FileText,
  GraduationCap,
  Heart,
  Languages as LanguagesIcon,
  Loader2,
  Mail,
  Share2,
  Star,
} from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"

import { CreateCvModal } from "./_components/create-cv-modal"
import { CvPreviewA4, type PreviewCv } from "./_components/cv-preview-a4"
import { CvSelector } from "./_components/cv-selector"
import { IcvEmpty } from "./_components/icv-empty"
import { ImportModal } from "./_components/import-modal"
import { PdfDownloadButton } from "./_components/pdf-download-button"
import { ThemesGalleryModal } from "./_components/themes-gallery-modal"
import { icv } from "./_content/fr"
import { ICV_ACCENT, getThemeById } from "./_content/themes"
import { useActiveCv } from "./_hooks/use-active-cv"

type SectionKey =
  | "experience"
  | "education"
  | "skill"
  | "language"
  | "info"
  | "hobby"

const SECTION_ICONS: Record<SectionKey, React.ComponentType<{ className?: string }>> = {
  experience: Briefcase,
  education: GraduationCap,
  skill: Star,
  language: LanguagesIcon,
  info: Mail,
  hobby: Heart,
}

const SECTION_COLORS: Record<
  SectionKey,
  { color: string; bgClass: string }
> = {
  experience: {
    color: "#f97316",
    bgClass: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
  },
  education: {
    color: "#3b82f6",
    bgClass: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  },
  skill: {
    color: "#a855f7",
    bgClass: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  },
  info: {
    color: "#22c55e",
    bgClass: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300",
  },
  language: {
    color: "#06b6d4",
    bgClass: "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300",
  },
  hobby: {
    color: "#94a3b8",
    bgClass: "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300",
  },
}

const SECTION_LABELS: Record<SectionKey, string> = {
  experience: "Expériences",
  education: "Formation",
  skill: "Compétences",
  info: "Infos",
  language: "Langues",
  hobby: "Hobbies",
}

const SHORT_MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avril",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
]

function formatLastUpdate(timestamp: number): string {
  const d = new Date(timestamp)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) return icv.dashboard.lastUpdateToday
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  if (isYesterday) return icv.dashboard.lastUpdateYesterday
  return icv.dashboard.lastUpdateOlder(
    `${d.getDate()} ${SHORT_MONTHS_FR[d.getMonth()]?.replace(".", "")}`,
  )
}

const SUGGESTION_IMPACT_LABEL: Record<"high" | "medium" | "low", string> = {
  high: "+15 %",
  medium: "+10 %",
  low: "+5 %",
}

export default function IcvPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryCvId = searchParams.get("cv") as Id<"citizenCv"> | null

  const { cvs, activeCvId, activeCv, setActiveCvId, isLoading } = useActiveCv()
  const fullCv = useQuery(
    api.cv.profile.get,
    activeCvId ? { cvId: activeCvId } : "skip",
  )
  const scoreData = useQuery(
    api.cv.score.get,
    activeCvId ? { cvId: activeCvId } : "skip",
  )
  const [createOpen, setCreateOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [galleryOpen, setGalleryOpen] = React.useState(false)

  // Si ?cv=... est dans l'URL et matche un CV existant, on bascule dessus
  // puis on nettoie l'URL. Utilisé après création / import / duplication
  // pour ouvrir le tableau de bord sur le bon CV.
  React.useEffect(() => {
    if (queryCvId && cvs?.some((c) => c._id === queryCvId)) {
      setActiveCvId(queryCvId)
      router.replace("/icv", { scroll: false })
    }
  }, [queryCvId, cvs, setActiveCvId, router])

  // ── Loading
  if (isLoading) {
    return (
      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }

  // ── Empty state : aucun CV, on propose la création / import.
  if (!cvs || cvs.length === 0) {
    return (
      <>
        <IcvEmpty
          onStart={() => setCreateOpen(true)}
          onImport={() => setImportOpen(true)}
        />
        <CreateCvModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          existingCvs={[]}
        />
        <ImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          activeCvId={null}
        />
      </>
    )
  }

  if (!activeCv || !activeCvId) {
    return (
      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }

  return (
    <>
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex w-full flex-wrap items-center gap-3 px-5 py-4 md:px-4 md:py-5 lg:px-20">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "#FCE7F3", color: ICV_ACCENT }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight md:text-xl">
                {icv.dashboard.title}
              </h1>
              <CvSelector
                cvs={cvs}
                activeCvId={activeCvId}
                onSelectCv={(id) => setActiveCvId(id)}
                onCreateClick={() => setCreateOpen(true)}
              />
            </div>
            {fullCv ? (
              <p className="text-xs text-muted-foreground">
                {icv.dashboard.subtitle(
                  formatLastUpdate(activeCv.updatedAt),
                  `${fullCv.firstName} ${fullCv.lastName}`.trim() ||
                    activeCv.name,
                )}
              </p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title={icv.dashboard.shareComingSoon}
            >
              <Share2 className="h-3.5 w-3.5" />
              {icv.dashboard.share}
            </Button>
            <Button asChild size="sm">
              <Link href="/icv/studio">{icv.dashboard.editCv}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:gap-6">
          {/* Colonne gauche : Score + suggestions */}
          <div className="flex flex-col gap-4">
            <ScoreCard
              score={scoreData?.score ?? activeCv.completionScore}
              level={scoreData?.level ?? "Débutant"}
            />
            <SuggestionsCard suggestions={scoreData?.suggestions ?? []} />
          </div>

          {/* Colonne droite : Sections + mini aperçu */}
          <div>
            <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
              {icv.dashboard.sectionsTitle}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SectionCard
                kind="experience"
                count={fullCv?.experiences.length ?? 0}
                cvId={activeCvId}
              />
              <SectionCard
                kind="education"
                count={fullCv?.education.length ?? 0}
                cvId={activeCvId}
              />
              <SectionCard
                kind="skill"
                count={fullCv?.skills.length ?? 0}
                cvId={activeCvId}
              />
              <SectionCard
                kind="info"
                count={contactCompleteness(fullCv)}
                hint="%"
                cvId={activeCvId}
              />
              <SectionCard
                kind="language"
                count={fullCv?.languages.length ?? 0}
                cvId={activeCvId}
              />
              <SectionCard
                kind="hobby"
                count={fullCv?.hobbies.length ?? 0}
                cvId={activeCvId}
              />
            </div>

            <MiniPreviewCard
              cv={fullCv ?? null}
              themeLabel={getThemeById(activeCv.activeTheme).label}
              onChangeTheme={() => setGalleryOpen(true)}
              cvId={activeCvId}
              fileName={`CV_${activeCv.name}`}
            />
          </div>
        </div>
      </section>

      <CreateCvModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingCvs={cvs}
      />
      <ThemesGalleryModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        cvId={activeCvId}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Score (anneau SVG)
// ─────────────────────────────────────────────────────────────────────────

function ScoreCard({
  score,
  level,
}: {
  score: number
  level: "Débutant" | "Bon" | "Expert"
}) {
  const r = 60
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(100, score)) / 100)
  const desc =
    level === "Expert"
      ? icv.dashboard.descExpert
      : level === "Bon"
        ? icv.dashboard.descGood
        : icv.dashboard.descBeginner
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="mx-auto">
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="12"
        />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#0E7C3A"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 90 90)"
        />
        <text
          x="90"
          y="88"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "inherit",
            fontSize: 38,
            fontWeight: 700,
            fill: "currentColor",
          }}
        >
          {score}
        </text>
        <text
          x="90"
          y="112"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontFamily: "inherit",
            fontSize: 10,
            fill: "currentColor",
            opacity: 0.6,
            letterSpacing: 1.2,
            fontWeight: 600,
          }}
        >
          {icv.dashboard.score}
        </text>
      </svg>
      <div className="mt-1 text-lg font-bold tracking-tight">
        {level === "Expert"
          ? icv.dashboard.levelExpert
          : level === "Bon"
            ? icv.dashboard.levelGood
            : icv.dashboard.levelBeginner}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Suggestions
// ─────────────────────────────────────────────────────────────────────────

function SuggestionsCard({
  suggestions,
}: {
  suggestions: Array<{ id: string; title: string; impact: "high" | "medium" | "low" }>
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[1.4px] text-muted-foreground">
        {icv.dashboard.suggestionsTitle}
      </p>
      {suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Excellent ! Aucune suggestion pour l'instant.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s) => (
            <li key={s.id}>
              <div className="flex items-start gap-3 rounded-lg bg-secondary/60 px-3 py-2.5">
                <p className="flex-1 text-[12.5px] font-semibold leading-snug text-foreground">
                  {s.title}
                </p>
                <span className="whitespace-nowrap text-[13px] font-bold text-idn-green dark:text-idn-green-on-dark">
                  {SUGGESTION_IMPACT_LABEL[s.impact]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Carte section
// ─────────────────────────────────────────────────────────────────────────

function SectionCard({
  kind,
  count,
  hint,
  cvId,
}: {
  kind: SectionKey
  count: number
  hint?: string
  cvId: Id<"citizenCv">
}) {
  const Icon = SECTION_ICONS[kind]
  const colors = SECTION_COLORS[kind]
  const href =
    kind === "info"
      ? `/icv/edit?section=info&cv=${cvId}`
      : `/icv/edit?section=${kind}&cv=${cvId}`
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.bgClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{SECTION_LABELS[kind]}</p>
        <p className="text-[11px] text-muted-foreground">
          {count}
          {hint ? hint : ""} {!hint && countWordFor(kind, count)}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

function countWordFor(kind: SectionKey, count: number): string {
  switch (kind) {
    case "experience":
      return count <= 1 ? "poste" : "postes"
    case "education":
      return count <= 1 ? "diplôme" : "diplômes"
    case "skill":
      return count <= 1 ? "compétence" : "compétences"
    case "language":
      return count <= 1 ? "langue" : "langues"
    case "hobby":
      return count <= 1 ? "centre d'intérêt" : "centres d'intérêt"
    default:
      return ""
  }
}

function contactCompleteness(
  cv:
    | { firstName: string; lastName: string; email: string; phone: string }
    | null
    | undefined,
): number {
  if (!cv) return 0
  const filled = [cv.firstName, cv.lastName, cv.email, cv.phone].filter(
    (s) => s.trim().length > 0,
  ).length
  return Math.round((filled / 4) * 100)
}

// ─────────────────────────────────────────────────────────────────────────
// Mini aperçu
// ─────────────────────────────────────────────────────────────────────────

function MiniPreviewCard({
  cv,
  themeLabel,
  onChangeTheme,
  cvId,
  fileName,
}: {
  cv: PreviewCv | null
  themeLabel: string
  onChangeTheme: () => void
  cvId: Id<"citizenCv">
  fileName: string
}) {
  return (
    <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="relative h-[170px] w-[120px] shrink-0 overflow-hidden rounded bg-stone-200/40 dark:bg-stone-900/40">
        {cv ? (
          <CvPreviewA4 cv={cv} targetWidth={120} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {icv.dashboard.currentPreviewTitle}
        </p>
        <p className="mt-1 text-base font-semibold">
          {icv.dashboard.themeLabel(themeLabel)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Format A4 · Mise à jour automatique
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onChangeTheme}>
            {icv.dashboard.changeTheme}
          </Button>
          <PdfDownloadButton
            cvId={cvId}
            fileName={fileName}
            className="h-9 px-3 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
