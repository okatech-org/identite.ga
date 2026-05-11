"use client"

import { createContext } from "react"
import type { IDNClient, IDNSession } from "@idn-ga/core"

export interface IDNContextValue {
  client: IDNClient
  session: IDNSession | null
  isLoading: boolean
  error: Error | null
  /** Re-fetch userinfo et reset l'état local. */
  refresh: () => Promise<void>
}

export const IDNContext = createContext<IDNContextValue | null>(null)
