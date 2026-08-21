import * as React from "react"
import type { Metadata } from "next"

import { OpHeader } from "../../_components/op-header"
import { queue } from "../../_content/fr"
import { PendingCountSubtitle } from "./_components/pending-count-subtitle"
import { RequestDetail } from "./_components/request-detail"
import { RequestList } from "./_components/request-list"

export const metadata: Metadata = { title: queue.meta.title }

/**
 * Traitement des demandes KYC en maître-détail : file paginée et cherchable
 * à gauche, examen de la demande sélectionnée à droite.
 *
 * La sélection et les filtres vivent dans l'URL (`?id`, `?status`, `?q`,
 * `?page`) — recharger la page ne fait pas perdre le dossier ouvert. D'où
 * le `Suspense` : `useSearchParams` l'exige côté App Router.
 */
export default function QueuePage() {
  return (
    <>
      <OpHeader sub={<PendingCountSubtitle fallback={queue.sub} />} title={queue.title} />
      <div className="grid min-h-0 flex-1 grid-cols-[340px_1fr] overflow-hidden">
        <React.Suspense fallback={<div className="border-r border-idn-border bg-idn-surface" />}>
          <RequestList />
        </React.Suspense>
        <div className="min-h-0 overflow-auto">
          <React.Suspense fallback={null}>
            <RequestDetail />
          </React.Suspense>
        </div>
      </div>
    </>
  )
}
