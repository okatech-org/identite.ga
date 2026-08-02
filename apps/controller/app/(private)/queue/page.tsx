import type { Metadata } from "next"

import { Button } from "@repo/ui/components/button"

import { OpHeader } from "../../_components/op-header"
import { queue } from "../../_content/fr"
import { QueueList } from "./_components/queue-list"
import { LevelThreeQueue } from "./_components/level-three-queue"
import { PendingCountSubtitle } from "./_components/pending-count-subtitle"

export const metadata: Metadata = { title: queue.meta.title }

/**
 * File de demandes — branchée sur `controller.queue.listPendingEnriched`
 * et `controller.queue.myCurrent`. Le bouton "Examiner" appelle
 * `controller.queue.claim` ; la carte "Cas en cours d'examen" se
 * met à jour automatiquement (Convex reactive query).
 */
export default function QueuePage() {
  return (
    <>
      <OpHeader
        sub={<PendingCountSubtitle fallback={queue.sub} />}
        title={queue.title}
        right={
          <Button variant="outline" size="sm">
            {queue.filtersCta}
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-7">
        <LevelThreeQueue />
        <QueueList />
      </div>
    </>
  )
}
