"use client"

import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

import { iboite } from "../_content/fr"

export function useCourrierActions({
  letterId,
  onAfterMove,
}: {
  letterId: Id<"iboiteLetter">
  onAfterMove: () => void
}) {
  const move = useMutation(api.iboite.letters.move)
  // Lit le sujet pour nommer le fichier PDF. La query est déjà chargée par
  // `CourrierDetail` au même moment, donc Convex la déduplique.
  const letter = useQuery(api.iboite.letters.get, { letterId })

  async function moveTo(target: "pending" | "trash") {
    try {
      await move({ letterId, target })
      toast.success(
        target === "trash"
          ? iboite.toasts.movedToTrash
          : iboite.toasts.movedToPending,
      )
      onAfterMove()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : iboite.toasts.moveFailed)
    }
  }

  function onPrint() {
    if (typeof window !== "undefined") window.print()
  }

  /**
   * Capture la feuille A4 du courrier ouvert (sélecteur stable
   * `[data-letter-paper={letterId}]`) et déclenche le téléchargement d'un
   * PDF rendu via jsPDF + html2canvas-pro.
   *
   * Le module `letter-pdf` est chargé en `await import()` car jspdf dépend
   * de `fflate` qui référence `worker_threads` dans son bundle CJS — Next.js
   * échoue à le bundler en SSR. L'import dynamique le laisse côté client.
   */
  async function onDownload() {
    if (typeof document === "undefined") return
    const paper = document.querySelector<HTMLElement>(
      `[data-letter-paper="${letterId}"]`,
    )
    if (!paper) {
      toast.error(iboite.toasts.downloadFailed)
      return
    }
    try {
      const { exportLetterToPdf, safeFilename } = await import(
        "../_lib/letter-pdf"
      )
      const filename = `${safeFilename(letter?.subject ?? iboite.courriers.newLetter)}.pdf`
      await exportLetterToPdf(paper, filename)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : iboite.toasts.downloadFailed)
    }
  }

  function onReply() {
    toast.info(iboite.toasts.soonAvailable)
  }

  async function onShare({
    title,
    text,
  }: {
    title: string
    text: string
  }) {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({ title, text })
      } catch {
        /* user cancelled */
      }
    } else {
      toast.info(iboite.toasts.soonAvailable)
    }
  }

  return { moveTo, onPrint, onDownload, onReply, onShare }
}
