import { genericOAuthClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient: any = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3010",
  plugins: [genericOAuthClient()],
})
