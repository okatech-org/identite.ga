"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

import { useIDNClient } from "./hooks.js"

export interface IDNCallbackProps {
  /** Callback appelée après succès — typiquement router.push("/") */
  onSuccess?: (sessionUserSub: string) => void
  /** Callback en cas d'erreur */
  onError?: (error: Error) => void
  /** Rendu pendant le traitement (par défaut : null) */
  loading?: ReactNode
  /** Rendu après succès si pas de onSuccess (par défaut : null) */
  done?: ReactNode
}

/**
 * Composant à monter sur la route callback OAuth.
 * Lit la query string, échange le code, persiste la session.
 */
export const IDNCallback = ({ onSuccess, onError, loading, done }: IDNCallbackProps) => {
  const client = useIDNClient()
  const ran = useRef(false)
  const [phase, setPhase] = useState<"running" | "done" | "error">("running")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void client
      .handleCallback()
      .then((session) => {
        setPhase("done")
        onSuccess?.(session.user.sub)
      })
      .catch((err: Error) => {
        setPhase("error")
        setErrorMsg(err.message)
        onError?.(err)
      })
  }, [client, onSuccess, onError])

  if (phase === "running") return <>{loading ?? null}</>
  if (phase === "error") return <>{errorMsg}</>
  return <>{done ?? null}</>
}
