import { ConvexError, v } from "convex/values"

import { mutation, query } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import { requireAuth } from "../lib/auth"
import { loadOwnedAccount } from "./accounts"
import { updateAccountCounters } from "./accountSync"

/**
 * iBoîte — Colis (cf. SPECS_FEATURES_CITIZEN.md §2.6 + §2.9.2).
 *
 * Création par les opérateurs (cf. iboite/admin.dropPackage). Côté citoyen :
 * lecture + marquage « retiré ».
 */

const STATUS = v.union(
  v.literal("pending"),
  v.literal("transit"),
  v.literal("available"),
  v.literal("delivered"),
)

const PACKAGE_OUT = v.object({
  _id: v.id("iboitePackage"),
  accountId: v.id("iboiteAccount"),
  trackingNumber: v.string(),
  senderName: v.string(),
  description: v.string(),
  status: STATUS,
  estimatedDeliveryAt: v.optional(v.number()),
  pickedUpAt: v.optional(v.number()),
  createdAt: v.number(),
})

async function loadOwnedPackage(
  ctx: { db: { get: any } },
  packageId: Id<"iboitePackage">,
  userId: string,
): Promise<Doc<"iboitePackage">> {
  const pkg = await ctx.db.get(packageId)
  if (!pkg || pkg.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Colis introuvable.",
    })
  }
  return pkg
}

function serializePackage(p: Doc<"iboitePackage">) {
  return {
    _id: p._id,
    accountId: p.accountId,
    trackingNumber: p.trackingNumber,
    senderName: p.senderName,
    description: p.description,
    status: p.status,
    estimatedDeliveryAt: p.estimatedDeliveryAt,
    pickedUpAt: p.pickedUpAt,
    createdAt: p.createdAt,
  }
}

export const listMine = query({
  args: { accountId: v.id("iboiteAccount") },
  returns: v.object({
    available: v.number(),
    transit: v.number(),
    items: v.array(PACKAGE_OUT),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    await loadOwnedAccount(ctx, args.accountId, user.userId)

    const items = await ctx.db
      .query("iboitePackage")
      .withIndex("by_account_status", (q) => q.eq("accountId", args.accountId))
      .order("desc")
      .take(200)

    const available = items.filter((p) => p.status === "available").length
    const transit = items.filter((p) => p.status === "transit").length
    return {
      available,
      transit,
      items: items.map(serializePackage),
    }
  },
})

export const markPickedUp = mutation({
  args: { packageId: v.id("iboitePackage") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const pkg = await loadOwnedPackage(ctx, args.packageId, user.userId)
    if (pkg.status !== "available") {
      throw new ConvexError({
        code: "INVALID_STATUS",
        message: "Le colis n'est pas disponible au retrait.",
      })
    }
    const now = Date.now()
    await ctx.db.patch(pkg._id, {
      status: "delivered",
      pickedUpAt: now,
    })
    const account = await ctx.db.get(pkg.accountId)
    if (account) {
      await updateAccountCounters(
        ctx,
        account,
        {
          ...account.counters,
          availablePackages: Math.max(
            0,
            account.counters.availablePackages - 1,
          ),
        },
        now,
      )
    }
    return null
  },
})
