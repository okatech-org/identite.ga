"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { Check, Copy, Loader2, Sparkles, X } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"

import { icv } from "../_content/fr"

type Feature = "improve_summary" | "suggest_skills" | "generate_letter"

/**
 * Carte verte « Suggestion de l'IA » — affichée après un appel à
 * `improve_summary`, `suggest_skills` ou `generate_letter`. Lit le dernier
 * job correspondant (via `getLastResult`) et expose les actions adéquates.
 */
export function AiResultCard({
  cvId,
  feature,
  currentSummary,
  onClose,
}: {
  cvId: Id<"citizenCv">
  feature: Feature
  currentSummary?: string
  onClose: () => void
}) {
  const job = useQuery(api.cv.ai.getLastResult, { cvId, feature })
  const upsert = useMutation(api.cv.profile.upsert)
  const addSkill = useMutation(api.cv.skills.add)
  const [busy, setBusy] = React.useState(false)

  // Exécution asynchrone (pool IA) : on affiche un état « en cours » tant que
  // le job n'est pas terminé, puis le résultat dès qu'il est disponible.
  if (job && (job.status === "queued" || job.status === "running")) {
    return (
      <CardShell onClose={onClose} title={icv.aiTools.cardTitle}>
        <div className="flex items-center gap-2 text-sm italic text-emerald-900 dark:text-emerald-100">
          <Loader2 className="h-4 w-4 animate-spin" />
          {icv.aiTools.inProgress}
        </div>
      </CardShell>
    )
  }

  if (!job || job.status !== "completed" || !job.result) {
    return null
  }

  // ── Feature 1: improve_summary
  if (feature === "improve_summary") {
    const rewritten = (job.result.rewrittenSummary as string | undefined) ?? ""
    async function accept() {
      if (busy) return
      setBusy(true)
      try {
        await upsert({ cvId, patch: { summary: rewritten } })
        toast.success("Résumé mis à jour.")
        onClose()
      } catch (e) {
        toast.error("Échec.", { description: (e as Error).message })
      } finally {
        setBusy(false)
      }
    }
    return (
      <CardShell onClose={onClose} title={icv.aiTools.cardTitle}>
        {currentSummary ? (
          <div className="mb-3 rounded-lg bg-white/40 p-3 text-xs text-emerald-900/70 dark:bg-white/5 dark:text-emerald-100/70">
            <p className="font-bold uppercase tracking-wider">Actuel</p>
            <p className="mt-1 italic">{currentSummary || "—"}</p>
          </div>
        ) : null}
        <p className="text-sm italic text-emerald-900 dark:text-emerald-100">
          « {rewritten} »
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={accept}
            disabled={busy}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Check className="h-4 w-4" />
            {icv.aiTools.accept}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            {icv.aiTools.ignore}
          </Button>
        </div>
      </CardShell>
    )
  }

  // ── Feature 2: suggest_skills
  if (feature === "suggest_skills") {
    const suggestions = (job.result.suggestions as Array<{
      name: string
      level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert"
      rationale: string
    }> | undefined) ?? []
    async function add(name: string, level: "Débutant" | "Intermédiaire" | "Avancé" | "Expert") {
      if (busy) return
      setBusy(true)
      try {
        await addSkill({ cvId, data: { name, level } })
        toast.success(`« ${name} » ajouté aux compétences.`)
      } catch (e) {
        toast.error("Échec.", { description: (e as Error).message })
      } finally {
        setBusy(false)
      }
    }
    return (
      <CardShell onClose={onClose} title="Compétences suggérées par l'IA">
        {suggestions.length === 0 ? (
          <p className="text-sm italic text-emerald-900 dark:text-emerald-100">
            Aucune suggestion (votre CV couvre déjà les principales compétences).
          </p>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 rounded-lg bg-white/40 px-3 py-2 dark:bg-white/5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-900 dark:text-emerald-100">
                      {s.name}
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-[1px] text-[10px] font-medium text-emerald-800 dark:text-emerald-200">
                      {s.level}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs italic text-emerald-900/70 dark:text-emerald-100/70">
                    {s.rationale}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => add(s.name, s.level)}
                  disabled={busy}
                  className="shrink-0 border-emerald-300 bg-white/40 text-emerald-900 hover:bg-white/70"
                >
                  Ajouter
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex justify-end">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </CardShell>
    )
  }

  // ── Feature 3: generate_letter
  const letter = (job.result.letter as string | undefined) ?? ""
  async function copy() {
    if (busy) return
    setBusy(true)
    try {
      await navigator.clipboard.writeText(letter)
      toast.success("Lettre copiée dans le presse-papier.")
    } catch (e) {
      toast.error("Impossible de copier.", { description: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <CardShell onClose={onClose} title="Lettre de motivation générée">
      <div className="max-h-[420px] overflow-auto whitespace-pre-line rounded-lg bg-white/40 p-3 text-sm text-emerald-900 dark:bg-white/5 dark:text-emerald-100">
        {letter}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={copy} disabled={busy}>
          <Copy className="h-4 w-4" />
          Copier
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </CardShell>
  )
}

function CardShell({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-600" />
        <p className="flex-1 text-sm font-bold text-emerald-800 dark:text-emerald-200">
          {title}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-emerald-800/70 transition-colors hover:bg-white/40 dark:text-emerald-200/70"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}
