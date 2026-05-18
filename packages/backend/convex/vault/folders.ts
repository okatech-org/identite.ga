import { v } from "convex/values"

import { query } from "../_generated/server"
import { requireVerifiedAuth } from "../lib/auth"
import { VAULT_FOLDERS } from "../schema"

/**
 * iDocument — Synthèse par dossier.
 * Cf. SPECS_FEATURES_CITIZEN.md §3.4.3 (vue d'accueil — compteurs + flag
 * "hasExpiring" pour distinguer les dossiers contenant un document qui
 * expire dans les 30 prochains jours).
 */

const FOLDER_VALIDATOR = v.union(
  ...VAULT_FOLDERS.map((f) => v.literal(f)),
)

const SUMMARY_VALUE = v.object({
  count: v.number(),
  hasExpiring: v.boolean(),
})

const SUMMARY_OUT = v.array(
  v.object({
    folderId: FOLDER_VALIDATOR,
    count: v.number(),
    hasExpiring: v.boolean(),
  }),
)

const EXPIRING_WINDOW_DAYS = 30
const MS_PER_DAY = 24 * 60 * 60 * 1000

export const summary = query({
  args: {},
  returns: SUMMARY_OUT,
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const items = await ctx.db
      .query("vaultItem")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .take(2000)

    const today = Date.now()
    const limit = today + EXPIRING_WINDOW_DAYS * MS_PER_DAY

    const init: Record<
      string,
      { count: number; hasExpiring: boolean }
    > = {}
    for (const f of VAULT_FOLDERS) init[f] = { count: 0, hasExpiring: false }

    for (const it of items) {
      if (it.deletedAt !== undefined) continue
      const slot = init[it.folderId]!
      slot.count += 1
      if (it.expirationDate) {
        const ts = Date.parse(it.expirationDate)
        if (!Number.isNaN(ts) && ts <= limit) {
          slot.hasExpiring = true
        }
      }
    }

    return VAULT_FOLDERS.map((f) => ({
      folderId: f,
      count: init[f]!.count,
      hasExpiring: init[f]!.hasExpiring,
    }))
  },
})
