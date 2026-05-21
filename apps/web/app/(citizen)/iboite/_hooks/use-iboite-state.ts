"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import type {
  CourrierFolder,
  EmailFolder,
  SectionKey,
} from "../_content/fr"

const VALID_SECTIONS: readonly SectionKey[] = [
  "courriers",
  "colis",
  "emails",
] as const
const VALID_COURRIER_FOLDERS: readonly CourrierFolder[] = [
  "inbox",
  "sent",
  "pending",
  "trash",
] as const
const VALID_EMAIL_FOLDERS: readonly EmailFolder[] = [
  "inbox",
  "starred",
  "sent",
  "trash",
] as const

export type IBoiteState = {
  section: SectionKey
  courrierFolder: CourrierFolder
  emailFolder: EmailFolder
  selectedId: string | null
  composeOpen: boolean
  /** Si renseigné, le compose s'ouvre en mode réponse au message d'id donné. */
  replyToId: string | null
}

function readSection(value: string | null): SectionKey {
  return VALID_SECTIONS.includes(value as SectionKey)
    ? (value as SectionKey)
    : "courriers"
}
function readCourrierFolder(value: string | null): CourrierFolder {
  return VALID_COURRIER_FOLDERS.includes(value as CourrierFolder)
    ? (value as CourrierFolder)
    : "inbox"
}
function readEmailFolder(value: string | null): EmailFolder {
  return VALID_EMAIL_FOLDERS.includes(value as EmailFolder)
    ? (value as EmailFolder)
    : "inbox"
}

/**
 * État UI de iBoîte, encodé dans l'URL pour être partageable et survivre au
 * back navigateur. Sept dimensions :
 *   - `section`              : Courriers / Colis / eMails
 *   - `courrierFolder`       : dossier actif section Courriers
 *   - `emailFolder`          : dossier actif section eMails
 *   - `selectedId`           : id du courrier/email ouvert dans le panneau droit
 *   - `composeOpen`          : modal de nouveau message
 *
 * Le compte actif (`accountId`) reste géré localement par `page.tsx` : il est
 * dérivé du premier compte du citoyen et changé via le dropdown.
 */
export function useIBoiteState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const state: IBoiteState = {
    section: readSection(searchParams.get("section")),
    courrierFolder: readCourrierFolder(searchParams.get("mfolder")),
    emailFolder: readEmailFolder(searchParams.get("efolder")),
    selectedId: searchParams.get("id"),
    composeOpen: searchParams.get("compose") === "1",
    replyToId: searchParams.get("reply"),
  }

  const replace = React.useCallback(
    (patch: Partial<IBoiteState>) => {
      const params = new URLSearchParams(searchParams.toString())
      const next = { ...state, ...patch }
      // Synchronise les paramètres URL avec l'état souhaité.
      if (next.section === "courriers") params.delete("section")
      else params.set("section", next.section)
      if (next.courrierFolder === "inbox") params.delete("mfolder")
      else params.set("mfolder", next.courrierFolder)
      if (next.emailFolder === "inbox") params.delete("efolder")
      else params.set("efolder", next.emailFolder)
      if (next.selectedId) params.set("id", next.selectedId)
      else params.delete("id")
      if (next.composeOpen) params.set("compose", "1")
      else params.delete("compose")
      if (next.replyToId) params.set("reply", next.replyToId)
      else params.delete("reply")
      const qs = params.toString()
      router.replace(qs ? `/iboite?${qs}` : "/iboite", { scroll: false })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, router, state.section, state.courrierFolder, state.emailFolder, state.selectedId, state.composeOpen, state.replyToId],
  )

  return {
    ...state,
    setSection: (section: SectionKey) =>
      replace({ section, selectedId: null }),
    setCourrierFolder: (folder: CourrierFolder) =>
      replace({ courrierFolder: folder, selectedId: null }),
    setEmailFolder: (folder: EmailFolder) =>
      replace({ emailFolder: folder, selectedId: null }),
    selectItem: (id: string | null) => replace({ selectedId: id }),
    /**
     * Ouvre le compose. Si `replyToId` est fourni, le ComposeModal pré-remplit
     * destinataire + sujet en lisant le message original via Convex.
     */
    openCompose: (replyToId?: string) =>
      replace({ composeOpen: true, replyToId: replyToId ?? null }),
    closeCompose: () =>
      replace({ composeOpen: false, replyToId: null }),
  }
}
