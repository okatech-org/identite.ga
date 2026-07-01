import { v } from "convex/values"

import { components } from "../_generated/api"
import { internalQuery, query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"

type RawApp = {
  _id: string
  clientId?: string
  metadata?: string
  userId?: string
  disabled?: boolean
}

function parseMeta(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export const getAppDelegation = internalQuery({
  args: { developerUserId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      clientId: v.string(),
      enabled: v.boolean(),
      maxLoa: v.union(v.literal(1), v.literal(2)),
    }),
  ),
  handler: async (ctx, args) => {
    const result = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "oauthApplication",
        where: [{ field: "userId", value: args.developerUserId }],
        paginationOpts: { cursor: null, numItems: 50 },
      },
    )) as { page: RawApp[] }

    for (const app of result.page ?? []) {
      if (app.disabled) continue
      const meta = parseMeta(app.metadata)
      const delegation = meta.delegation as
        | { enabled?: boolean; maxLoa?: number }
        | undefined
      if (delegation?.enabled && app.clientId) {
        return {
          clientId: app.clientId,
          enabled: true,
          maxLoa: (delegation.maxLoa === 2 ? 2 : 1) as 1 | 2,
        }
      }
    }
    return null
  },
})

export const listByApp = query({
  args: {
    appClientId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("delegatedIdentity"),
      idnId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      assignedLoa: v.union(v.literal(1), v.literal(2)),
      status: v.union(v.literal("created"), v.literal("claimed")),
      createdAt: v.number(),
      claimedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const limit = args.limit ?? 50
    const delegations = await ctx.db
      .query("delegatedIdentity")
      .withIndex("by_appClientId", (q) =>
        q.eq("appClientId", args.appClientId),
      )
      .order("desc")
      .take(limit)

    const results = await Promise.all(
      delegations.map(async (d) => {
        const profile = await ctx.db.get(d.targetProfileId)
        return {
          _id: d._id,
          idnId: profile?.idnId,
          firstName: profile?.pivot?.firstName,
          lastName: profile?.pivot?.lastName,
          assignedLoa: d.assignedLoa,
          status: d.status,
          createdAt: d.createdAt,
          claimedAt: d.claimedAt,
        }
      }),
    )

    return results
  },
})

export const lookupForClaim = internalQuery({
  args: {
    nip: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      delegatedIdentityId: v.id("delegatedIdentity"),
      idnId: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      loa: v.union(v.literal(1), v.literal(2), v.literal(3)),
    }),
  ),
  handler: async (ctx, args) => {
    let profile = null

    if (args.nip) {
      profile = await ctx.db
        .query("userProfile")
        .withIndex("by_nip", (q) => q.eq("pivot.nip", args.nip!))
        .first()
    }

    if (!profile && args.firstName && args.lastName && args.dateOfBirth) {
      const fn = args.firstName.trim().toLowerCase()
      const ln = args.lastName.trim().toLowerCase()
      const dob = args.dateOfBirth.trim()
      const candidates = await ctx.db
        .query("userProfile")
        .withIndex("by_pivot_dob", (q) => q.eq("pivot.dateOfBirth", dob))
        .collect()
      profile =
        candidates.find(
          (p) =>
            !p.deletedAt &&
            p.pivot &&
            p.pivot.firstName.toLowerCase() === fn &&
            p.pivot.lastName.toLowerCase() === ln,
        ) ?? null
    }

    if (!profile || profile.deletedAt) return null

    const delegation = await ctx.db
      .query("delegatedIdentity")
      .withIndex("by_targetUserId", (q) =>
        q.eq("targetUserId", profile!.userId),
      )
      .first()

    if (!delegation || delegation.status !== "created") return null

    return {
      delegatedIdentityId: delegation._id,
      idnId: profile.idnId,
      firstName: profile.pivot?.firstName,
      lastName: profile.pivot?.lastName,
      loa: profile.loa,
    }
  },
})

export const getClaimInfo = internalQuery({
  args: { id: v.id("delegatedIdentity") },
  returns: v.union(
    v.null(),
    v.object({
      targetUserId: v.string(),
      targetProfileId: v.id("userProfile"),
      status: v.union(v.literal("created"), v.literal("claimed")),
      initialSecret: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const d = await ctx.db.get(args.id)
    if (!d) return null
    return {
      targetUserId: d.targetUserId,
      targetProfileId: d.targetProfileId,
      status: d.status,
      initialSecret: d.initialSecret,
    }
  },
})

export const getBaUser = internalQuery({
  args: { userId: v.string() },
  returns: v.union(v.null(), v.object({ id: v.string(), email: v.string() })),
  handler: async (ctx, args) => {
    const result = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "user",
        where: [{ field: "id", value: args.userId }],
      },
    )) as { id?: string; email?: string } | null
    if (!result) return null
    return { id: result.id ?? "", email: result.email ?? "" }
  },
})

export const getById = internalQuery({
  args: { id: v.id("delegatedIdentity") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("delegatedIdentity"),
      appClientId: v.string(),
      idnId: v.optional(v.string()),
      assignedLoa: v.union(v.literal(1), v.literal(2)),
      status: v.union(v.literal("created"), v.literal("claimed")),
      createdAt: v.number(),
      claimedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const d = await ctx.db.get(args.id)
    if (!d) return null
    const profile = await ctx.db.get(d.targetProfileId)
    return {
      _id: d._id,
      appClientId: d.appClientId,
      idnId: profile?.idnId,
      assignedLoa: d.assignedLoa,
      status: d.status,
      createdAt: d.createdAt,
      claimedAt: d.claimedAt,
    }
  },
})
