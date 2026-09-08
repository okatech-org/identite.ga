import type { Metadata } from "next"

import { OpHeader } from "../../_components/op-header"
import { agenda } from "../../_content/fr"
import { Level3Agenda } from "./_components/level3-agenda"

export const metadata: Metadata = { title: agenda.meta.title }

/**
 * Agenda des entretiens Niveau 3 — disponibilités publiées, rendez-vous
 * réservés et salle vidéo. Séparé de la file de demandes : c'est un outil
 * de planification, pas de traitement de dossiers.
 */
export default function AgendaPage() {
  return (
    <>
      <OpHeader sub={agenda.sub} title={agenda.title} />
      <div className="flex-1 overflow-auto p-7">
        <Level3Agenda />
      </div>
    </>
  )
}
