"use client"

import { useQuery } from "convex/react"
import { useEffect, useMemo, useState } from "react"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"

const LS_KEY = "idn:icv:active-cv-id"

/**
 * Hook centralisé pour la sélection du CV actif :
 *   • charge la liste des CV de l'utilisateur (cv.cvs.listMine)
 *   • détermine le CV à afficher : localStorage > default > premier
 *   • expose setActiveCvId qui persiste dans localStorage
 *
 * Renvoie `undefined` pour `cvs` tant que la query Convex n'a pas chargé.
 * Renvoie `[]` si l'utilisateur n'a pas (encore) de CV — l'écran principal
 * affiche alors l'empty state d'onboarding.
 */
export function useActiveCv() {
  const cvs = useQuery(api.cv.cvs.listMine)
  const [storedId, setStoredId] = useState<Id<"citizenCv"> | null>(null)

  // Lecture initiale de localStorage (côté client uniquement)
  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(LS_KEY)
    if (raw) setStoredId(raw as Id<"citizenCv">)
  }, [])

  const activeCvId = useMemo<Id<"citizenCv"> | null>(() => {
    if (!cvs || cvs.length === 0) return null
    // Si le storedId pointe vers un CV existant, on l'utilise.
    if (storedId && cvs.some((c) => c._id === storedId)) return storedId
    // Sinon : default → premier.
    const def = cvs.find((c) => c.isDefault)
    return def?._id ?? cvs[0]!._id
  }, [cvs, storedId])

  const activeCv = useMemo(
    () => cvs?.find((c) => c._id === activeCvId) ?? null,
    [cvs, activeCvId],
  )

  function setActiveCvId(id: Id<"citizenCv">) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, id as unknown as string)
    }
    setStoredId(id as Id<"citizenCv">)
  }

  return {
    /** Liste de tous les CV de l'utilisateur (`undefined` pendant le load). */
    cvs,
    /** Id du CV actif (`null` si l'utilisateur n'a aucun CV). */
    activeCvId,
    /** Données du CV actif (summary, sans sections — pour les sections, voir `useQuery(api.cv.profile.get, { cvId })`). */
    activeCv,
    /** Persiste un nouvel actif et mémorise en localStorage. */
    setActiveCvId,
    /** True tant que la liste n'a pas chargé. */
    isLoading: cvs === undefined,
  }
}
