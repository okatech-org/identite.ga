"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAction, useMutation, useQuery } from "convex/react"
import {
  ArrowLeft,
  Copy,
  Crown,
  Download,
  FileText,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Doc, Id } from "@repo/backend/convex/_generated/dataModel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog"
import { Button } from "@repo/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu"

import { CreateCvModal } from "../_components/create-cv-modal"
import { CvPreviewA4, type PreviewCv } from "../_components/cv-preview-a4"
import { RenameCvModal } from "../_components/rename-cv-modal"
import { icv } from "../_content/fr"
import { ICV_ACCENT } from "../_content/themes"

const SOURCE_BADGE_LABEL: Record<string, string> = {
  onboarding: icv.selector.sourceOnboarding,
  manual: icv.selector.sourceManual,
  ai_optimize: icv.selector.sourceAiOptimize,
  import: icv.selector.sourceImport,
}

const SOURCE_BADGE_CLASS: Record<string, string> = {
  onboarding: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  manual: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ai_optimize: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  import: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
}

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export default function IcvListPage() {
  const cvs = useQuery(api.cv.cvs.listMine)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [renameTarget, setRenameTarget] = React.useState<{
    id: Id<"citizenCv">
    name: string
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<{
    id: Id<"citizenCv">
    name: string
  } | null>(null)

  if (cvs === undefined) {
    return (
      <section className="mx-auto w-full max-w-[1280px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl bg-secondary"
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-[1280px] px-5 py-6 md:px-7 md:py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/icv">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {icv.list.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {icv.list.description} · {cvs.length}/10
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={cvs.length >= 10}
          title={cvs.length >= 10 ? icv.list.limitReached : undefined}
        >
          <Plus className="h-4 w-4" />
          {icv.list.newCv}
        </Button>
      </div>

      {/* Grille */}
      {cvs.length === 0 ? (
        <EmptyState onStart={() => setCreateOpen(true)} />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <CvCard
              key={cv._id}
              cv={cv}
              defaultDisabled={cvs.length === 1}
              onRename={() =>
                setRenameTarget({ id: cv._id, name: cv.name })
              }
              onDelete={() =>
                setDeleteTarget({ id: cv._id, name: cv.name })
              }
            />
          ))}
        </div>
      )}

      <CreateCvModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingCvs={cvs}
      />
      <RenameCvModal
        open={renameTarget !== null}
        onOpenChange={(v) => !v && setRenameTarget(null)}
        cvId={renameTarget?.id ?? null}
        currentName={renameTarget?.name ?? ""}
      />
      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Carte CV
// ─────────────────────────────────────────────────────────────────────────

type CvSummary = {
  _id: Id<"citizenCv">
  name: string
  isDefault: boolean
  source: "onboarding" | "manual" | "ai_optimize" | "import"
  activeTheme: string
  completionScore: number
  updatedAt: number
}

function CvCard({
  cv,
  defaultDisabled,
  onRename,
  onDelete,
}: {
  cv: CvSummary
  defaultDisabled: boolean
  onRename: () => void
  onDelete: () => void
}) {
  const router = useRouter()
  const fullCv = useQuery(api.cv.profile.get, { cvId: cv._id })
  const create = useMutation(api.cv.cvs.create)
  const setDefault = useMutation(api.cv.cvs.setDefault)
  const renderPdf = useAction(api.cv.export.renderPdf)
  const [actionPending, setActionPending] = React.useState(false)

  async function handleDuplicate() {
    if (actionPending) return
    setActionPending(true)
    try {
      const id = await create({
        name: `${cv.name} (copie)`,
        copyFromCvId: cv._id,
      })
      toast.success("CV dupliqué.")
      router.push(`/icv?cv=${id}`)
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes("CV_LIMIT_REACHED")) {
        toast.error(icv.list.limitReached)
      } else {
        toast.error("Impossible de dupliquer.", { description: msg })
      }
    } finally {
      setActionPending(false)
    }
  }

  async function handleSetDefault() {
    if (actionPending || cv.isDefault) return
    setActionPending(true)
    try {
      await setDefault({ cvId: cv._id })
      toast.success(`« ${cv.name} » est désormais votre CV principal.`)
    } catch (e) {
      toast.error("Échec.", { description: (e as Error).message })
    } finally {
      setActionPending(false)
    }
  }

  async function handleDownload() {
    if (actionPending) return
    setActionPending(true)
    try {
      const result = await renderPdf({ cvId: cv._id })
      const a = document.createElement("a")
      a.href = result.url
      a.download = `CV_${cv.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}.pdf`
      a.target = "_blank"
      a.rel = "noopener noreferrer"
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success(icv.actions.pdfReady)
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes("cvExport") || msg.includes("RATE_LIMIT")) {
        toast.error(icv.actions.rateLimitPdf)
      } else {
        toast.error(icv.actions.renderFailed, { description: msg })
      }
    } finally {
      setActionPending(false)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md">
      <Link href={`/icv?cv=${cv._id}`} className="block">
        <div className="relative aspect-[1.4] overflow-hidden bg-stone-200/40 dark:bg-stone-900/40">
          {fullCv ? (
            <div className="absolute inset-0 flex items-start justify-center pt-3">
              <div className="origin-top">
                <div className="scale-[0.65]" style={{ transformOrigin: "top center" }}>
                  <CvPreviewA4 cv={fullCv as PreviewCv} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <div className="border-t border-border p-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-bold">{cv.name}</h3>
              {cv.isDefault ? (
                <span
                  className="rounded-full px-1.5 py-[1px] text-[9px] font-bold"
                  style={{ color: ICV_ACCENT, background: "#FCE7F3" }}
                >
                  {icv.selector.principalBadge}
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`rounded px-1.5 py-[1px] text-[10px] font-medium ${SOURCE_BADGE_CLASS[cv.source]}`}
              >
                {SOURCE_BADGE_LABEL[cv.source]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Score {cv.completionScore}/100
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {icv.list.updatedAt(DATE_FORMAT.format(new Date(cv.updatedAt)))}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Actions"
                disabled={actionPending}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/icv?cv=${cv._id}`}>
                  <FileText className="h-3.5 w-3.5" />
                  {icv.list.actions.open}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onRename}>
                <Pencil className="h-3.5 w-3.5" />
                {icv.list.actions.rename}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDuplicate}>
                <Copy className="h-3.5 w-3.5" />
                {icv.list.actions.duplicate}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={handleSetDefault}
                disabled={cv.isDefault}
              >
                <Crown className="h-3.5 w-3.5" />
                {icv.list.actions.setDefault}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleDownload}>
                <Download className="h-3.5 w-3.5" />
                {icv.list.actions.download}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onDelete}
                disabled={cv.isDefault}
                className="text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {icv.list.actions.remove}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Confirmation suppression
// ─────────────────────────────────────────────────────────────────────────

function DeleteDialog({
  target,
  onClose,
}: {
  target: { id: Id<"citizenCv">; name: string } | null
  onClose: () => void
}) {
  const remove = useMutation(api.cv.cvs.remove)
  const [pending, setPending] = React.useState(false)

  async function handleConfirm() {
    if (!target || pending) return
    setPending(true)
    try {
      await remove({ cvId: target.id })
      toast.success("CV supprimé.")
      onClose()
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes("CANNOT_DELETE_DEFAULT")) {
        toast.error(icv.list.cannotDeleteDefault)
      } else {
        toast.error("Échec.", { description: msg })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={(v) => !v && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce CV ?</AlertDialogTitle>
          <AlertDialogDescription>
            {target ? icv.list.confirmRemove(target.name) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {icv.create.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
            {icv.list.actions.remove}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ background: "#FCE7F3", color: ICV_ACCENT }}
      >
        <FileText className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-bold">{icv.list.empty.title}</h2>
      <Button onClick={onStart} className="mt-4">
        <Plus className="h-4 w-4" />
        {icv.list.empty.cta}
      </Button>
    </div>
  )
}
