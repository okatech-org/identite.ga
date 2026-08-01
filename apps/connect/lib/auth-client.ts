"use client"

import {
  convexClient,
  crossDomainClient,
} from "@convex-dev/better-auth/client/plugins"
import { oneTimeTokenClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

const SITE_URL =
  typeof window !== "undefined" ? window.location.origin : undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient: any = createAuthClient({
  baseURL: SITE_URL || undefined,
  plugins: [convexClient(), crossDomainClient(), oneTimeTokenClient()],
})
