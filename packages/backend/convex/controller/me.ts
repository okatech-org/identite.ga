import { v } from "convex/values"

import { query } from "../_generated/server"
import { requireController } from "../lib/auth"

/**
 * Espace contrôleur — infos de session pour la sidebar.
 *
 * Retourne le nom à afficher (à partir du pivot ou de l'email Better Auth)
 * et les initiales pour le badge avatar. La sidebar utilise cette query
 * via `useQuery` pour rester réactive si le profil change.
 */
export const current = query({
  args: {},
  returns: v.object({
    userId: v.string(),
    email: v.string(),
    displayName: v.string(),
    initials: v.string(),
    role: v.union(v.literal("identity_controller")),
  }),
  handler: async (ctx) => {
    const me = await requireController(ctx)

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", me.userId))
      .unique()

    const fn = profile?.pivot?.firstName ?? ""
    const ln = profile?.pivot?.lastName ?? ""
    const fullName = [fn, ln].filter(Boolean).join(" ")
    const fallback = me.email.split("@")[0] ?? "Agent"
    const displayName = fullName || `Agent ${fallback}`

    const initials = computeInitials(fullName || fallback)

    return {
      userId: me.userId,
      email: me.email,
      displayName,
      initials,
      role: "identity_controller" as const,
    }
  },
})

function computeInitials(s: string): string {
  const parts = s
    .split(/\s+|\./)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? "")
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2)
  return (parts[0]! + parts[parts.length - 1]!).slice(0, 2)
}
