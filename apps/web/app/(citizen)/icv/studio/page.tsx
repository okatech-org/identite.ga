"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"
import { ArrowLeft, FileText, Loader2, ZoomIn, ZoomOut } from "lucide-react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"

import { AiResultCard } from "../_components/ai-result-card"
import { AiToolsPanel } from "../_components/ai-tools-panel"
import { AtsResultModal } from "../_components/ats-result-modal"
import { CreateCvModal } from "../_components/create-cv-modal"
import { CvPreviewA4, type PreviewCv } from "../_components/cv-preview-a4"
import { CvSelector } from "../_components/cv-selector"
import { ImportModal } from "../_components/import-modal"
import { OptimizeJobModal } from "../_components/optimize-job-modal"
import { PdfDownloadButton } from "../_components/pdf-download-button"
import { ProfileSummary } from "../_components/profile-summary"
import { ThemePicker } from "../_components/theme-picker"
import { ThemesGalleryModal } from "../_components/themes-gallery-modal"
import { icv } from "../_content/fr"
import { ICV_ACCENT } from "../_content/themes"
import { useActiveCv } from "../_hooks/use-active-cv"

// Dimensions naturelles du composant CvPreviewA4 (cf. cv-preview-a4.tsx)
const CV_NATURAL_WIDTH = 320
const CV_NATURAL_HEIGHT = 452
const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2.5

/**
 * Hook : calcule le scale auto qui fait tenir le CV (CV_NATURAL_HEIGHT)
 * dans la hauteur du conteneur, moins un padding.
 */
function useFitScale(containerRef: React.RefObject<HTMLElement | null>) {
  const [autoScale, setAutoScale] = React.useState(1)
  React.useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const compute = () => {
      const h = el.clientHeight - 48 // padding vertical
      const w = el.clientWidth - 48
      const sH = h / CV_NATURAL_HEIGHT
      const sW = w / CV_NATURAL_WIDTH
      const s = Math.min(sH, sW)
      setAutoScale(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, s)))
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [containerRef])
  return autoScale
}

export default function IcvStudioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryCvId = searchParams.get("cv") as Id<"citizenCv"> | null

  const { cvs, activeCvId, activeCv, setActiveCvId, isLoading } = useActiveCv()

  // Si ?cv=... est dans l'URL et matche un CV, on bascule dessus.
  React.useEffect(() => {
    if (queryCvId && cvs?.some((c) => c._id === queryCvId)) {
      setActiveCvId(queryCvId)
      router.replace("/icv/studio", { scroll: false })
    }
  }, [queryCvId, cvs, setActiveCvId, router])

  // Sans CV, on renvoie sur /icv (gère l'empty state).
  React.useEffect(() => {
    if (!isLoading && cvs && cvs.length === 0) {
      router.replace("/icv")
    }
  }, [isLoading, cvs, router])

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

  const [zoomMultiplier, setZoomMultiplier] = React.useState(1)
  const previewContainerRef = React.useRef<HTMLDivElement>(null)
  const autoScale = useFitScale(previewContainerRef)
  const finalScale = Math.max(
    ZOOM_MIN,
    Math.min(ZOOM_MAX, autoScale * zoomMultiplier),
  )

  if (isLoading || !cvs || !activeCvId || !activeCv) {
    return (
      <section className="mx-auto w-full px-5 py-6 md:px-4 md:py-8 lg:px-20">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }

  const previewLoading = fullCv === undefined
  const fileName = activeCv.name || "CV"

  return (
    <>
      {/* Conteneur plein écran : header fixe + zone scroll interne sidebar + preview */}
      <div className="flex h-[calc(100svh-60px)] flex-col">
        {/* Sub-header fixe (titre + sélecteur + actions) */}
        <section className="shrink-0 border-b border-border bg-background">
          <div className="mx-auto flex w-full flex-wrap items-center gap-3 px-5 py-3 md:px-4 md:py-4 lg:px-20">
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              aria-label="Retour au tableau de bord"
            >
              <Link href="/icv">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setImportOpen(true)}
              >
                {icv.actions.import}
              </Button>
              <PdfDownloadButton
                cvId={activeCvId}
                fileName={`CV_${fileName}`}
                className="h-9 px-3 text-sm"
              />
              <Button asChild size="sm">
                <Link href="/icv">{icv.studio.done}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Corps : sidebar scrollable + preview fit-to-height */}
        <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
          {/* Panneau gauche scrollable */}
          <aside className="flex shrink-0 flex-col gap-3 overflow-y-auto border-b border-border bg-background p-4 md:w-[300px] md:border-b-0 md:border-r md:p-5">
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

            {/* Cartes résultats IA — affichées sous la sidebar quand l'utilisateur ouvre une suggestion. */}
            {improveOpen && fullCv ? (
              <AiResultCard
                cvId={activeCvId}
                feature="improve_summary"
                currentSummary={fullCv.summary}
                onClose={() => setImproveOpen(false)}
              />
            ) : null}
            {skillsOpen ? (
              <AiResultCard
                cvId={activeCvId}
                feature="suggest_skills"
                onClose={() => setSkillsOpen(false)}
              />
            ) : null}
            {letterOpen ? (
              <AiResultCard
                cvId={activeCvId}
                feature="generate_letter"
                onClose={() => setLetterOpen(false)}
              />
            ) : null}
          </aside>

          {/* Preview : fit-to-height par défaut, contrôles de zoom */}
          <main
            ref={previewContainerRef}
            className="relative flex flex-1 items-center justify-center overflow-hidden bg-stone-200/60 dark:bg-stone-900/60"
          >
            {previewLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : fullCv ? (
              <div
                style={{
                  width: CV_NATURAL_WIDTH * finalScale,
                  height: CV_NATURAL_HEIGHT * finalScale,
                }}
              >
                <CvPreviewA4 cv={fullCv as PreviewCv} scale={finalScale} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {icv.errors.loadFailed}
              </p>
            )}

            {/* Contrôles zoom */}
            <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-1 rounded-full border border-border bg-card/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={icv.studio.zoomOut}
                disabled={zoomMultiplier <= 0.5}
                onClick={() =>
                  setZoomMultiplier((z) => Math.max(0.5, z - ZOOM_STEP))
                }
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-[44px] text-center font-mono text-[11px] tabular-nums text-muted-foreground">
                {Math.round(finalScale * 100)}%
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={icv.studio.zoomIn}
                disabled={zoomMultiplier >= 2}
                onClick={() =>
                  setZoomMultiplier((z) => Math.min(2, z + ZOOM_STEP))
                }
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] text-white">
              {icv.preview.a4Footer}
            </div>
          </main>
        </div>
      </div>

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
