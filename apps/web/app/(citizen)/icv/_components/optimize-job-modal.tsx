"use client"

import * as React from "react"
import { useAction, useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, Target } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"
import { Textarea } from "@repo/ui/components/textarea"

import { icv } from "../_content/fr"

/**
 * Modale « Optimiser pour un poste » — l'IA crée un NOUVEAU CV variant
 * (`source = "ai_optimize"`, `derivedFromCvId = cvId`) avec le résumé
 * réécrit, les expériences réordonnées et les compétences suggérées
 * ajoutées.
 */
export function OptimizeJobModal({
  open,
  onOpenChange,
  cvId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cvId: Id<"citizenCv"> | null
}) {
  const optimizeForJob = useAction(api.cv.ai.optimizeForJob)
  const router = useRouter()
  const [offer, setOffer] = React.useState("")
  const [name, setName] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [activeJobId, setActiveJobId] =
    React.useState<Id<"citizenCvAiJob"> | null>(null)

  // L'action `optimizeForJob` délègue désormais l'exécution au pool IA et ne
  // renvoie plus le `derivedCvId` en synchrone. On suit donc le job via la
  // query réactive et on navigue une fois le CV dérivé créé.
  const job = useQuery(
    api.cv.ai.getLastResult,
    activeJobId && cvId ? { cvId, feature: "optimize_job" } : "skip",
  )

  React.useEffect(() => {
    if (open) {
      setOffer("")
      setName("")
      setPending(false)
      setActiveJobId(null)
    }
  }, [open])

  React.useEffect(() => {
    if (!activeJobId || !job || job._id !== activeJobId) return
    if (job.status === "completed" && job.derivedCvId) {
      setActiveJobId(null)
      setPending(false)
      toast.success(icv.optimizeJob.success, {
        description: icv.optimizeJob.successDesc,
      })
      onOpenChange(false)
      router.push(`/icv?cv=${job.derivedCvId}`)
    } else if (job.status === "failed") {
      setActiveJobId(null)
      setPending(false)
      toast.error("Impossible d'optimiser.", {
        description: job.errorMessage ?? undefined,
      })
    }
  }, [activeJobId, job, onOpenChange, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cvId || pending) return
    const trimmed = offer.trim()
    if (trimmed.length < 30) {
      toast.error("Le texte de l'offre est trop court (30 caractères min).")
      return
    }
    setPending(true)
    try {
      const { jobId } = await optimizeForJob({
        cvId,
        jobOfferText: trimmed,
        newCvName: name.trim() || undefined,
      })
      // On reste en `pending` (spinner « Optimisation en cours… ») jusqu'à la
      // complétion, gérée par l'effet ci-dessus.
      setActiveJobId(jobId)
    } catch (e) {
      setPending(false)
      const msg = (e as Error).message
      if (msg.includes("cvAi") || msg.includes("RATE_LIMIT")) {
        toast.error(icv.aiTools.quotaExceeded)
      } else {
        toast.error("Impossible d'optimiser.", { description: msg })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-500" />
              {icv.optimizeJob.title}
            </DialogTitle>
            <DialogDescription>{icv.optimizeJob.desc}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-offer">{icv.optimizeJob.offerLabel}</Label>
              <Textarea
                id="job-offer"
                rows={8}
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder={icv.optimizeJob.offerPh}
                disabled={pending}
                maxLength={8000}
              />
              <div className="text-right text-[10px] text-muted-foreground">
                {offer.length} / 8000
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">{icv.optimizeJob.nameLabel}</Label>
              <Input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={icv.optimizeJob.namePh}
                disabled={pending}
                maxLength={80}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              {icv.optimizeJob.cancel}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {icv.optimizeJob.running}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {icv.optimizeJob.submit}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
