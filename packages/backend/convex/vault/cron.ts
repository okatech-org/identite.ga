import { v } from "convex/values"

import { internal } from "../_generated/api"
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server"

/**
 * iDocument — Cron de notifications d'expiration.
 *
 * Tourne une fois par jour (cf. `convex/crons.ts`). Pour chaque user ayant
 * au moins un item iDocument :
 *   • Calcule les paliers atteints (30j / 7j / expired).
 *   • Dispatch une notif `documents` par item × palier en dédupliquant via
 *     `vaultExpirationNotice` (un enregistrement par (item, palier)).
 *
 * Architecture en deux temps :
 *   • `_listExpiringUsers` (internalQuery) renvoie la liste des userIds
 *     ayant au moins un item avec expirationDate non null.
 *   • `_processUser` (internalMutation) calcule + insère les notifs pour
 *     un user donné. Appelé en boucle depuis l'action pour rester dans
 *     les limites de transaction.
 */

type Tier = "30d" | "7d" | "expired"

const MS_PER_DAY = 24 * 60 * 60 * 1000

function diffDays(target: number, now: number): number {
  return Math.floor((target - now) / MS_PER_DAY)
}

function classify(now: number, expirationDate: string): Tier | null {
  const target = Date.parse(expirationDate)
  if (Number.isNaN(target)) return null
  const days = diffDays(target, now)
  if (days < 0) return "expired"
  if (days <= 7) return "7d"
  if (days <= 30) return "30d"
  return null
}

function fmt(date: string): string {
  // YYYY-MM-DD → "DD/MM/YYYY" pour affichage français.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  const [y, m, d] = date.split("-") as [string, string, string]
  return `${d}/${m}/${y}`
}

export const _listExpiringUsers = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    // L'index dédié `by_expiration` permet de balayer uniquement les items
    // qui ont une expirationDate (range query globale, pas par user).
    const items = await ctx.db
      .query("vaultItem")
      .withIndex("by_expiration", (q) => q.gte("expirationDate", "0000-00-00"))
      .take(5000)
    const userIds = new Set<string>()
    for (const it of items) {
      if (it.deletedAt === undefined && it.expirationDate) {
        userIds.add(it.userId)
      }
    }
    return [...userIds]
  },
})

export const _processUser = internalMutation({
  args: { userId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now()

    const items = await ctx.db
      .query("vaultItem")
      .withIndex("by_userId_expiration", (q) =>
        q.eq("userId", args.userId).gte("expirationDate", "0000-00-00"),
      )
      .take(1000)

    for (const item of items) {
      if (item.deletedAt !== undefined) continue
      if (!item.expirationDate) continue
      const tier = classify(now, item.expirationDate)
      if (!tier) continue

      // Déduplication : a-t-on déjà notifié pour ce (item, palier) ?
      const existing = await ctx.db
        .query("vaultExpirationNotice")
        .withIndex("by_item_tier", (q) =>
          q.eq("vaultItemId", item._id).eq("tier", tier),
        )
        .first()
      if (existing) continue

      await ctx.db.insert("vaultExpirationNotice", {
        userId: args.userId,
        vaultItemId: item._id,
        tier,
        notifiedAt: now,
      })

      // Si on est en `expired`, on passe aussi le statut de l'item à
      // `expired` (sans toucher au ciphertext).
      if (tier === "expired" && item.status !== "expired") {
        await ctx.db.patch(item._id, { status: "expired", updatedAt: now })
      }

      const title =
        tier === "expired"
          ? "Document expiré"
          : tier === "7d"
            ? "Document expirant cette semaine"
            : "Document expirant bientôt"
      const body =
        tier === "expired"
          ? `Un document du dossier « ${item.folderId} » a expiré le ${fmt(item.expirationDate)}. Pensez à initier son renouvellement.`
          : `Un document du dossier « ${item.folderId} » expire le ${fmt(item.expirationDate)}. Pensez à initier son renouvellement.`

      await ctx.runMutation(internal.notifications.dispatch, {
        userId: args.userId,
        category: "documents",
        title,
        body,
        metadata: {
          module: "vault",
          kind: "expiration",
          vaultItemId: item._id,
          tier,
        },
        sendEmail: tier !== "30d",
      })
    }
    return null
  },
})

export const checkExpirations = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userIds: string[] = await ctx.runQuery(
      internal.vault.cron._listExpiringUsers,
      {},
    )
    for (const userId of userIds) {
      await ctx.runMutation(internal.vault.cron._processUser, { userId })
    }
    return null
  },
})
