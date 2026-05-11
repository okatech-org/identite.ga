"use client"

import { createIDNClient, type IDNClientConfig, type IDNSession } from "@idn-ga/core"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { IDNContext } from "./context.js"

export interface IDNProviderProps extends IDNClientConfig {
  children: ReactNode
  /**
   * Si vrai (défaut), tente de hydrater la session au mount via getSession().
   * Mettre à `false` si l'app gère la callback ailleurs et appelle refresh manuellement.
   */
  autoHydrate?: boolean
}

export const IDNProvider = ({
  children,
  autoHydrate = true,
  ...config
}: IDNProviderProps) => {
  // Le client est stable pour la durée de vie du provider — sérialise la config
  // pour invalider l'instance si une prop critique change.
  const configKey = useMemo(
    () => JSON.stringify(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    Object.values(config),
  )
  const client = useMemo(
    () => createIDNClient(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configKey],
  )

  const [session, setSession] = useState<IDNSession | null>(null)
  const [isLoading, setIsLoading] = useState(autoHydrate)
  const [error, setError] = useState<Error | null>(null)
  const mounted = useRef(true)

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      const next = await client.getSession()
      if (mounted.current) {
        setSession(next)
        setError(null)
      }
    } catch (err) {
      if (mounted.current) setError(err as Error)
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [client])

  useEffect(() => {
    mounted.current = true
    if (autoHydrate) {
      void refresh()
    } else {
      setIsLoading(false)
    }
    const offSignIn = client.on("signIn", ({ session: next }) => {
      if (mounted.current) setSession(next)
    })
    const offSignOut = client.on("signOut", () => {
      if (mounted.current) setSession(null)
    })
    const offExpired = client.on("session:expired", () => {
      if (mounted.current) setSession(null)
    })
    const offRefreshed = client.on("token:refreshed", ({ tokens }) => {
      if (!mounted.current) return
      setSession((prev) => (prev ? { ...prev, tokens } : prev))
    })
    const offError = client.on("error", ({ error: err }) => {
      if (mounted.current) setError(err)
    })
    return () => {
      mounted.current = false
      offSignIn()
      offSignOut()
      offExpired()
      offRefreshed()
      offError()
    }
  }, [client, autoHydrate, refresh])

  const value = useMemo(
    () => ({ client, session, isLoading, error, refresh }),
    [client, session, isLoading, error, refresh],
  )

  return <IDNContext.Provider value={value}>{children}</IDNContext.Provider>
}
