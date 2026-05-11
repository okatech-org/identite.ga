import type { Metadata } from "next"

import { OpHeader } from "../../_components/op-header"
import { history } from "../../_content/fr"
import { HistoryList } from "./_components/history-list"

export const metadata: Metadata = { title: history.meta.title }

/**
 * Historique de contrôles — branché sur `controller.history.listMine`
 * (audit log filtré sur le contrôleur courant).
 */
export default function HistoryPage() {
  return (
    <>
      <OpHeader sub={history.sub} title={history.title} />
      <div className="flex-1 overflow-auto p-7">
        <HistoryList />
      </div>
    </>
  )
}
