"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { AlertCircle, Check, Loader2, Zap } from "lucide-react"

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

import { icv } from "../_content/fr"

/**
 * Modale résultat ATS — lit le dernier job `ats_check` du CV courant.
 * À ouvrir après l'appel à `cv.ai.atsCheck` (qui ne renvoie que le jobId).
 */
export function AtsResultModal({
  open,
  onOpenChange,
  cvId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cvId: Id<"citizenCv"> | null
}) {
  const job = useQuery(
    api.cv.ai.getLastResult,
    cvId && open ? { cvId, feature: "ats_check" } : "skip",
  )

  const isLoading = job === undefined && open
  const isPending = job?.status === "queued" || job?.status === "running"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            {icv.ats.title}
          </DialogTitle>
          <DialogDescription>{icv.ats.desc}</DialogDescription>
        </DialogHeader>

        {isLoading || isPending ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Analyse en cours…</p>
          </div>
        ) : !job || job.status === "failed" || !job.result ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            <p className="text-sm font-bold">Aucune analyse disponible.</p>
            <p className="text-xs text-muted-foreground">
              Lancez l'outil « Score ATS » dans le panneau iCV.
            </p>
          </div>
        ) : (
          <AtsResultBody result={job.result as AtsResult} />
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {icv.ats.later}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AtsResult {
  score?: number
  breakdown?: Record<string, number>
  recommendations?: string[]
}

function AtsResultBody({ result }: { result: AtsResult }) {
  const score = clampScore(result.score)
  const tone =
    score >= 80
      ? { label: icv.ats.resultGood, fg: "#15803D", bg: "#DCFCE7" }
      : score >= 50
        ? { label: icv.ats.resultMid, fg: "#92400E", bg: "#FEF3C7" }
        : { label: icv.ats.resultBad, fg: "#9F1239", bg: "#FFE4E6" }

  const r = 60
  const c = 2 * Math.PI * r
  const off = c * (1 - score / 100)

  return (
    <div className="space-y-4">
      <div
        className="flex items-center gap-5 rounded-2xl border p-5"
        style={{ background: tone.bg, borderColor: tone.fg + "33" }}
      >
        <svg width="140" height="140" viewBox="0 0 160 160" className="shrink-0">
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="11"
          />
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={tone.fg}
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={off}
            transform="rotate(-90 80 80)"
          />
          <text
            x="80"
            y="78"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "inherit",
              fontSize: 32,
              fontWeight: 700,
              fill: tone.fg,
            }}
          >
            {score}
          </text>
          <text
            x="80"
            y="102"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "inherit",
              fontSize: 9,
              fill: tone.fg,
              letterSpacing: 1.2,
              fontWeight: 600,
            }}
          >
            SCORE ATS
          </text>
        </svg>
        <div className="flex-1">
          <p
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: tone.fg }}
          >
            {icv.ats.resultEyebrow}
          </p>
          <p
            className="mt-1 text-2xl font-bold tracking-tight"
            style={{ color: tone.fg }}
          >
            {tone.label}
          </p>
          {result.breakdown ? (
            <div className="mt-3 grid grid-cols-2 gap-1 text-[12px]">
              {Object.entries(result.breakdown).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-2 rounded bg-white/40 px-2 py-1"
                >
                  <span className="capitalize" style={{ color: tone.fg }}>
                    {k}
                  </span>
                  <span
                    className="font-mono font-bold"
                    style={{ color: tone.fg }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {result.recommendations && result.recommendations.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Recommandations
          </p>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-foreground">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function clampScore(score: unknown): number {
  if (typeof score === "number" && Number.isFinite(score)) {
    return Math.max(0, Math.min(100, Math.round(score)))
  }
  return 0
}
