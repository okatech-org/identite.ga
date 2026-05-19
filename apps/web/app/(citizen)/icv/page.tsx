"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"
import { Edit3, FileText, Loader2, Plus, Upload } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"

import { AiResultCard } from "./_components/ai-result-card"
import { AiToolsPanel } from "./_components/ai-tools-panel"
import { AtsResultModal } from "./_components/ats-result-modal"
import { CreateCvModal } from "./_components/create-cv-modal"
import { CvPreviewA4, type PreviewCv } from "./_components/cv-preview-a4"
import { CvSelector } from "./_components/cv-selector"
import { ImportModal } from "./_components/import-modal"
import { OptimizeJobModal } from "./_components/optimize-job-modal"
import { PdfDownloadButton } from "./_components/pdf-download-button"
import { ProfileSummary } from "./_components/profile-summary"
import { ThemePicker } from "./_components/theme-picker"
import { ThemesGalleryModal } from "./_components/themes-gallery-modal"
import { icv } from "./_content/fr"
import { ICV_ACCENT } from "./_content/themes"
import { useActiveCv } from "./_hooks/use-active-cv"

export default function IcvPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryCvId = searchParams.get("cv") as Id<"citizenCv"> | null

  const { cvs, activeCvId, activeCv, setActiveCvId, isLoading } = useActiveCv()

  // Si ?cv=... est dans l'URL et matche un CV, on bascule dessus.
  React.useEffect(() => {
    if (queryCvId && cvs?.some((c) => c._id === queryCvId)) {
      setActiveCvId(queryCvId)
      // nettoie l'URL
      router.replace("/icv", { scroll: false })
    }
  }, [queryCvId, cvs, setActiveCvId, router])

  const fullCv = useQuery(
    api.cv.profile.get,
    activeCvId ? { cvId: activeCvId } : "skip",
  )

  const [createOpen, setCreateOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [galleryOpen, setGalleryOpen] = React.useState(false)
  const [optimizeOpen, setOptimizeOpen] = React.useState(false)
  const [atsOpen, setAtsOpen] = React.useState(false)
  const [improveOpen, setImproveOpen] = React.useState(false)
  const [skillsOpen, setSkillsOpen] = React.useState(false)
  const [letterOpen, setLetterOpen] = React.useState(false)

  // ── Loading
  if (isLoading) return <IcvLoading />

  // ── Empty state (premier login, avant le seed onboarding)
  if (!cvs || cvs.length === 0) {
    return <IcvEmpty onImport={() => setImportOpen(true)} />
  }

  if (!activeCvId || !activeCv) {
    return <IcvLoading />
  }

  const previewLoading = fullCv === undefined
  const fileName = activeCv.name || "CV"

  return (
    <>
      {/* Sub-header (titre + sélecteur + actions) */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-5 py-4 md:px-7 md:py-5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "#FCE7F3", color: ICV_ACCENT }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                {icv.title}
              </h1>
              <CvSelector
                cvs={cvs}
                activeCvId={activeCvId}
                onSelectCv={(id) => setActiveCvId(id)}
                onCreateClick={() => setCreateOpen(true)}
              />
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">
              {icv.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/icv/dashboard">
                <Edit3 className="h-3.5 w-3.5" />
                {icv.actions.edit}
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              {icv.actions.import}
            </Button>
            <PdfDownloadButton
              cvId={activeCvId}
              fileName={`CV_${fileName}`}
              className="h-9 px-3 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Corps */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-5 md:px-7 md:py-6">
        <div className="grid gap-4 md:grid-cols-[280px_1fr] md:gap-6">
          {/* Panneau gauche */}
          <div className="flex flex-col gap-3 md:gap-4">
            <ThemePicker
              cvId={activeCvId}
              activeTheme={activeCv.activeTheme}
              onOpenGallery={() => setGalleryOpen(true)}
            />
            <AiToolsPanel
              cvId={activeCvId}
              onOpenOptimize={() => setOptimizeOpen(true)}
              onAtsResult={() => setAtsOpen(true)}
              onImproveSummaryResult={() => setImproveOpen(true)}
              onSuggestSkillsResult={() => setSkillsOpen(true)}
              onLetterResult={() => setLetterOpen(true)}
            />
            {fullCv ? (
              <ProfileSummary
                firstName={fullCv.firstName}
                lastName={fullCv.lastName}
                email={fullCv.email}
                experiencesCount={fullCv.experiences.length}
                skillsCount={fullCv.skills.length}
              />
            ) : null}
          </div>

          {/* Panneau droit — aperçu */}
          <div className="relative flex min-h-[500px] items-start justify-center overflow-auto rounded-2xl border border-border bg-stone-200/60 p-4 dark:bg-stone-900/60 md:min-h-[680px] md:p-6">
            {previewLoading ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : fullCv ? (
              <div
                className="relative"
                style={{ width: 320 * 1.35, height: 452 * 1.35 }}
              >
                <CvPreviewA4 cv={fullCv as PreviewCv} scale={1.35} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {icv.errors.loadFailed}
              </div>
            )}
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] text-white">
              {icv.preview.a4Footer}
            </div>
          </div>
        </div>

        {/* Cartes résultats IA — affichées sous le layout principal quand l'utilisateur ouvre une suggestion. */}
        {improveOpen && fullCv ? (
          <div className="mt-6">
            <AiResultCard
              cvId={activeCvId}
              feature="improve_summary"
              currentSummary={fullCv.summary}
              onClose={() => setImproveOpen(false)}
            />
          </div>
        ) : null}
        {skillsOpen ? (
          <div className="mt-6">
            <AiResultCard
              cvId={activeCvId}
              feature="suggest_skills"
              onClose={() => setSkillsOpen(false)}
            />
          </div>
        ) : null}
        {letterOpen ? (
          <div className="mt-6">
            <AiResultCard
              cvId={activeCvId}
              feature="generate_letter"
              onClose={() => setLetterOpen(false)}
            />
          </div>
        ) : null}
      </section>

      {/* Modales */}
      <CreateCvModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingCvs={cvs}
      />
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        activeCvId={activeCvId}
      />
      <ThemesGalleryModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        cvId={activeCvId}
      />
      <OptimizeJobModal
        open={optimizeOpen}
        onOpenChange={setOptimizeOpen}
        cvId={activeCvId}
      />
      <AtsResultModal
        open={atsOpen}
        onOpenChange={setAtsOpen}
        cvId={activeCvId}
      />
    </>
  )
}

function IcvLoading() {
  return (
    <section className="mx-auto w-full max-w-[1080px] px-5 py-6 md:px-7 md:py-8">
      <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      </div>
    </section>
  )
}

function IcvEmpty({ onImport }: { onImport: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-[1080px] flex-1 items-center justify-center px-5 py-12 md:px-7 md:py-20">
      <div className="grid gap-8 md:grid-cols-2 md:items-center md:gap-16">
        <div>
          <div
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "#FCE7F3", color: ICV_ACCENT }}
          >
            <FileText className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            iCV · NOUVEAU
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Votre CV professionnel,
            <br />
            <span style={{ color: ICV_ACCENT }}>en quelques minutes.</span>
          </h2>
          <p className="mt-4 max-w-[440px] text-sm text-muted-foreground md:text-base">
            12 thèmes professionnels, 5 outils IA pour reformuler, suggérer
            des compétences ou évaluer votre score ATS. Synchronisé avec
            votre identité IDN.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/icv/dashboard">
                <Plus className="h-4 w-4" />
                Démarrer mon CV
              </Link>
            </Button>
            <Button variant="outline" onClick={onImport}>
              <Upload className="h-4 w-4" />
              Importer un CV
            </Button>
          </div>
          <div className="mt-8 grid grid-cols-4 gap-5">
            {[
              { l: "12", d: "Thèmes pro" },
              { l: "5", d: "Outils IA" },
              { l: "PDF", d: "Export 1 clic" },
              { l: "ATS", d: "Score auto" },
            ].map((s) => (
              <div key={s.d}>
                <div className="font-mono text-2xl font-bold text-foreground">
                  {s.l}
                </div>
                <div className="mt-1 text-[11px] tracking-wide text-muted-foreground">
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative hidden h-[460px] md:block">
          <div
            className="absolute left-1/2 top-10 -translate-x-1/2"
            style={{ transform: "translateX(-50%) rotate(-3deg)" }}
          >
            <div className="rounded-md shadow-2xl">
              <div className="origin-top-left scale-[0.85]">
                <CvPreviewA4
                  cv={{
                    firstName: "Aïsha",
                    lastName: "Ndong",
                    email: "aisha.ndong@idn.ga",
                    phone: "+241 06 12 34 56",
                    address: "Libreville · Gabon",
                    summary:
                      "Chef de Projet Digital — 7 ans d'expérience en transformation numérique pour le secteur public et privé africain.",
                    activeTheme: "creative",
                    experiences: [],
                    education: [],
                    skills: [],
                    languages: [],
                    hobbies: [],
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
