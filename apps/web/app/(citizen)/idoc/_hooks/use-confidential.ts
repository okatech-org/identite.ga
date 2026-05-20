"use client"

import * as React from "react"

const KEY = "idn:idoc:confidential"

/**
 * Mode confidentiel : applique un blur sur les vignettes du coffre-fort.
 * Persisté en `localStorage` pour rester actif entre les pages iDoc.
 */
export function useConfidentialMode() {
  const [enabled, setEnabledState] = React.useState(false)

  React.useEffect(() => {
    try {
      setEnabledState(window.localStorage.getItem(KEY) === "1")
    } catch {
      // localStorage inaccessible (mode privé) — on reste sur false.
    }
  }, [])

  const setEnabled = React.useCallback((value: boolean) => {
    setEnabledState(value)
    try {
      window.localStorage.setItem(KEY, value ? "1" : "0")
    } catch {
      // ignore
    }
  }, [])

  const toggle = React.useCallback(() => {
    setEnabled(!enabled)
  }, [enabled, setEnabled])

  return { enabled, setEnabled, toggle }
}

const OPENED_KEY = "idn:idoc:opened-folders"

/**
 * Track les dossiers déjà visités (pour basculer leur icône en
 * `open-filled`). Persisté en `localStorage` (cf. SPECS §3.4.3).
 */
export function useOpenedFolders(): {
  isOpened: (folderId: string) => boolean
  markOpened: (folderId: string) => void
} {
  const [opened, setOpened] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OPENED_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) {
          setOpened(new Set(parsed.filter((x): x is string => typeof x === "string")))
        }
      }
    } catch {
      // ignore
    }
  }, [])

  const isOpened = React.useCallback((id: string) => opened.has(id), [opened])
  const markOpened = React.useCallback((id: string) => {
    setOpened((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      try {
        window.localStorage.setItem(OPENED_KEY, JSON.stringify([...next]))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return { isOpened, markOpened }
}
