"use client"

import type { SignInOptions, SignOutOptions } from "@idn-ga/core"
import { useCallback, useContext, useEffect, useState } from "react"

import { IDNContext, type IDNContextValue } from "./context.js"

const useIDNContext = (): IDNContextValue => {
  const ctx = useContext(IDNContext)
  if (!ctx) {
    throw new Error(
      "[@idn-ga/react] Hook hors <IDNProvider> — wrap votre app avec <IDNProvider />",
    )
  }
  return ctx
}

export const useIDN = () => {
  const { client, session, isLoading, error } = useIDNContext()
  const signIn = useCallback(
    (opts?: SignInOptions) => client.signIn(opts),
    [client],
  )
  const signOut = useCallback(
    (opts?: SignOutOptions) => client.signOut(opts),
    [client],
  )
  return {
    isAuthenticated: session !== null,
    isLoading,
    error,
    signIn,
    signOut,
  }
}

export const useUser = () => {
  const { session, isLoading, error } = useIDNContext()
  return { user: session?.user ?? null, isLoading, error }
}

export const useSession = () => {
  const { session, isLoading } = useIDNContext()
  return {
    session,
    accessToken: session?.tokens.accessToken ?? null,
    isLoading,
  }
}

export const useAccessToken = (): string | null => {
  const { client, session } = useIDNContext()
  const [token, setToken] = useState<string | null>(
    session?.tokens.accessToken ?? null,
  )
  useEffect(() => {
    let cancelled = false
    void client.getAccessToken().then((t) => {
      if (!cancelled) setToken(t)
    })
    return () => {
      cancelled = true
    }
  }, [client, session?.tokens.expiresAt])
  return token
}

export interface UseLoAResult {
  loa: 1 | 2 | 3 | null
  acr: "eidas1" | "eidas2" | "eidas3" | null
  hasMinimum: (level: 1 | 2 | 3) => boolean
}

export const useLoA = (): UseLoAResult => {
  const { session } = useIDNContext()
  const loa = session?.user.loa ?? null
  const acr = session?.user.acr ?? null
  const hasMinimum = useCallback(
    (level: 1 | 2 | 3) => (loa ?? 0) >= level,
    [loa],
  )
  return { loa, acr, hasMinimum }
}

/** Accès direct au client (échappatoire avancée). */
export const useIDNClient = () => useIDNContext().client
