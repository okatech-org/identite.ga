"use client"

import * as React from "react"
import { useAction, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  FileText,
  Sparkles,
  Target,
  Wand2,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { icv } from "../_content/fr"
import { ICV_AI_TOOLS, type AiToolId } from "../_content/ai-tools"

/**
 * Panneau gauche « Outils IA » de `/icv`.
 *
 * Comportement par outil :
 *   • improve_summary, suggest_skills, ats_check, generate_letter
 *     → appel direct de l'action ; le résultat est consulté ensuite
 *       (composants dédiés ou modal ATS).
 *   • optimize_job → ouvre un dialog via `onOpenOptimize` (paramètre offre).
 */

const ICON_BY_TOOL: Record<AiToolId, React.ComponentType<{ className?: string }>> = {
  improve_summary: Wand2,
  suggest_skills: Sparkles,
  optimize_job: Target,
  generate_letter: FileText,
  ats_check: Zap,
}

export function AiToolsPanel({
  cvId,
  onOpenOptimize,
  onAtsResult,
  onImproveSummaryResult,
  onSuggestSkillsResult,
  onLetterResult,
}: {
  cvId: Id<"citizenCv">
  onOpenOptimize: () => void
  onAtsResult?: () => void
  onImproveSummaryResult?: () => void
  onSuggestSkillsResult?: () => void
  onLetterResult?: () => void
}) {
  const router = useRouter()
  const improveSummary = useAction(api.cv.ai.improveSummary)
  const suggestSkills = useAction(api.cv.ai.suggestSkills)
  const atsCheck = useAction(api.cv.ai.atsCheck)
  const generateLetter = useAction(api.cv.ai.generateLetter)

  const [pending, setPending] = React.useState<AiToolId | null>(null)

  async function run(tool: AiToolId) {
    if (pending) return
    setPending(tool)
    try {
      // L'exécution est désormais asynchrone (pool IA) : l'action confirme le
      // lancement, le résultat arrive ensuite via `getLastResult` (carte/modale).
      if (tool === "improve_summary") {
        await improveSummary({ cvId })
        toast.success(icv.aiTools.inProgress)
        onImproveSummaryResult?.()
      } else if (tool === "suggest_skills") {
        await suggestSkills({ cvId })
        toast.success(icv.aiTools.inProgress)
        onSuggestSkillsResult?.()
      } else if (tool === "ats_check") {
        await atsCheck({ cvId })
        toast.success(icv.aiTools.inProgress)
        onAtsResult?.()
      } else if (tool === "generate_letter") {
        await generateLetter({ cvId, tone: "formal" })
        toast.success(icv.aiTools.inProgress)
        onLetterResult?.()
      }
    } catch (e) {
      const msg = (e as Error).message
      toast.error(
        msg.includes("RATE_LIMIT") || msg.includes("cvAi")
          ? icv.aiTools.quotaExceeded
          : icv.aiTools.failed,
        { description: msg },
      )
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-b from-purple-500/[0.08] to-transparent p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-purple-500" />
        <h3 className="text-sm font-bold text-foreground">
          {icv.aiTools.title}
        </h3>
      </div>

      <div className="flex flex-col gap-1">
        {ICV_AI_TOOLS.map((tool) => {
          const Icon = ICON_BY_TOOL[tool.id]
          const isPending = pending === tool.id
          const isOptimize = tool.id === "optimize_job"
          return (
            <button
              key={tool.id}
              type="button"
              disabled={pending !== null}
              onClick={() => (isOptimize ? onOpenOptimize() : run(tool.id))}
              className="group flex items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tool.bgClass}`}
                style={{ color: tool.color }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-foreground">
                  {tool.label}
                </div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {isPending ? icv.aiTools.inProgress : tool.desc}
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-50" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
