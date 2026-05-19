/**
 * Catalogue des 5 outils IA iCV — verbatim SPECS_FEATURE_ICV.md §5.4.
 */

import type { ReactNode } from "react"

export type AiToolId =
  | "improve_summary"
  | "suggest_skills"
  | "optimize_job"
  | "generate_letter"
  | "ats_check"

export interface AiToolMeta {
  id: AiToolId
  label: string
  desc: string
  /** Couleur d'accent du tile dans le panneau gauche. */
  color: string
  bgClass: string
}

export const ICV_AI_TOOLS: AiToolMeta[] = [
  {
    id: "improve_summary",
    label: "Améliorer le Profil",
    desc: "Reformulez votre résumé",
    color: "#a855f7",
    bgClass: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300",
  },
  {
    id: "suggest_skills",
    label: "Suggérer Compétences",
    desc: "Basé sur vos expériences",
    color: "#3b82f6",
    bgClass: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300",
  },
  {
    id: "optimize_job",
    label: "Optimiser pour Poste",
    desc: "Adaptez à une offre",
    color: "#f97316",
    bgClass: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300",
  },
  {
    id: "generate_letter",
    label: "Lettre de Motivation",
    desc: "Générez automatiquement",
    color: "#22c55e",
    bgClass: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300",
  },
  {
    id: "ats_check",
    label: "Score ATS",
    desc: "Compatibilité recruteurs",
    color: "#f59e0b",
    bgClass: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  },
]

export function getAiToolById(id: string): AiToolMeta | undefined {
  return ICV_AI_TOOLS.find((t) => t.id === id)
}
