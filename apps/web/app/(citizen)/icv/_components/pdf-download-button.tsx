"use client"

import * as React from "react"
import { useAction } from "convex/react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import { cn } from "@repo/ui/lib/utils"

import { icv } from "../_content/fr"

/**
 * Bouton « PDF » qui appelle `cv.export.renderPdf` côté serveur et
 * déclenche le téléchargement automatique. Affiche un loader 1-3s pendant
 * le rendu, toast succès au retour.
 */
export function PdfDownloadButton({
  cvId,
  fileName,
  className,
  variant = "default",
}: {
  cvId: Id<"citizenCv">
  fileName: string
  className?: string
  variant?: "default" | "outline" | "ghost"
}) {
  const renderPdf = useAction(api.cv.export.renderPdf)
  const [pending, setPending] = React.useState(false)

  async function handleClick() {
    if (pending) return
    setPending(true)
    try {
      const result = await renderPdf({ cvId })
      // Téléchargement déclenché côté client via un <a download>.
      const a = document.createElement("a")
      a.href = result.url
      a.download = sanitize(fileName) + ".pdf"
      // Sur Safari iOS le download attribute est ignoré — fallback simple :
      // ouverture dans un nouvel onglet.
      a.target = "_blank"
      a.rel = "noopener noreferrer"
      document.body.appendChild(a)
      a.click()
      a.remove()

      toast.success(icv.actions.pdfReady, {
        description: icv.actions.pdfReadyDesc,
      })
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes("cvExport") || msg.includes("RATE_LIMIT")) {
        toast.error(icv.actions.rateLimitPdf)
      } else {
        toast.error(icv.actions.renderFailed, { description: msg })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleClick}
      disabled={pending}
      className={cn(className)}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {icv.actions.preparing}
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          {icv.actions.pdf}
        </>
      )}
    </Button>
  )
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "")
}
