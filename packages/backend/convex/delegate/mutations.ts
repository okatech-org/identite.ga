import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalQuery } from "../_generated/server"
import { internalMutation } from "../functions"
import { generateIdnId } from "../lib/idnId"
import { KYC_DOCUMENT_TYPES } from "../schema"

export const createDelegatedProfile = internalMutation({
  args: {
    userId: v.string(),
    profileType: v.union(v.literal("citizen"), v.literal("resident")),
    pivot: v.object({
      firstName: v.string(),
      lastName: v.string(),
      dateOfBirth: v.string(),
      gender: v.union(
        v.literal("M"),
        v.literal("F"),
        v.literal("O"),
        v.literal("N"),
      ),
      birthPlace: v.string(),
      nationality: v.string(),
      phone: v.optional(v.string()),
      nip: v.optional(v.string()),
    }),
    assignedLoa: v.union(v.literal(1), v.literal(2)),
    appClientId: v.string(),
    operatorUserId: v.string(),
    kycDocumentType: v.optional(
      v.union(...KYC_DOCUMENT_TYPES.map((t) => v.literal(t))),
    ),
    kycDocFront: v.optional(v.id("_storage")),
    kycDocBack: v.optional(v.id("_storage")),
    initialSecret: v.optional(v.string()),
  },
  returns: v.object({
    profileId: v.id("userProfile"),
    idnId: v.string(),
    delegatedIdentityId: v.id("delegatedIdentity"),
  }),
  handler: async (ctx, args) => {
    const now = Date.now()

    const idnId = await generateIdnId(ctx)

    const profileId = await ctx.db.insert("userProfile", {
      userId: args.userId,
      profileType: args.profileType,
      loa: args.assignedLoa,
      idnId,
      pivot: args.pivot,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert("userPreference", {
      userId: args.userId,
      language: "fr",
      theme: "auto",
      accessibility: {
        fontSize: "md",
        reducedMotion: false,
        highContrast: false,
      },
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.insert("notificationPreference", {
      userId: args.userId,
      email: { security: true, kyc: true, consent: true, comms: false },
      inApp: { security: true, kyc: true, consent: true, comms: true },
      updatedAt: now,
    })

    await ctx.runMutation(internal.iboite.accounts.ensurePersonal, {
      userId: args.userId,
    })

    let kycRequestId: string | undefined
    if (
      args.assignedLoa === 2 &&
      args.kycDocumentType &&
      args.kycDocFront
    ) {
      const kycId = await ctx.db.insert("kycRequest", {
        userId: args.userId,
        documentType: args.kycDocumentType,
        documentImages: {
          front: args.kycDocFront,
          back: args.kycDocBack,
        },
        status: "approved",
        reviewerId: args.operatorUserId,
        reviewedAt: now,
        submittedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      kycRequestId = kycId
    }

    const delegationData = {
      appClientId: args.appClientId,
      operatorUserId: args.operatorUserId,
      targetUserId: args.userId,
      targetProfileId: profileId,
      assignedLoa: args.assignedLoa,
      initialSecret: args.initialSecret,
      status: "created" as const,
      createdAt: now,
      updatedAt: now,
    }
    const delegatedIdentityId = kycRequestId
      ? await ctx.db.insert("delegatedIdentity", {
          ...delegationData,
          kycRequestId: kycRequestId as any,
        })
      : await ctx.db.insert("delegatedIdentity", delegationData)

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: args.operatorUserId,
      action: "delegated_identity_created",
      targetType: "user",
      targetId: args.userId,
      metadata: {
        appClientId: args.appClientId,
        idnId,
        assignedLoa: args.assignedLoa,
        delegated: true,
      },
    })

    return { profileId, idnId, delegatedIdentityId }
  },
})

export const claimDelegatedIdentity = internalMutation({
  args: {
    delegatedIdentityId: v.id("delegatedIdentity"),
    pinHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const delegation = await ctx.db.get(args.delegatedIdentityId)
    if (!delegation) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Identité déléguée introuvable.",
      })
    }
    if (delegation.status !== "created") {
      throw new ConvexError({
        code: "ALREADY_CLAIMED",
        message: "Cette identité a déjà été réclamée.",
      })
    }

    const now = Date.now()

    await ctx.db.patch(args.delegatedIdentityId, {
      status: "claimed",
      claimedAt: now,
      updatedAt: now,
      initialSecret: undefined,
    })

    const profile = await ctx.db.get(delegation.targetProfileId)
    if (profile) {
      await ctx.db.patch(profile._id, {
        pinHash: args.pinHash,
        updatedAt: now,
      })
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: delegation.targetUserId,
      action: "delegated_identity_claimed",
      targetType: "user",
      targetId: delegation.targetUserId,
      metadata: {
        appClientId: delegation.appClientId,
        delegatedIdentityId: args.delegatedIdentityId,
      },
    })

    return null
  },
})

export const lookupForDelegation = internalQuery({
  args: {
    nip: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      found: v.literal(true),
      idnId: v.optional(v.string()),
      loa: v.union(v.literal(1), v.literal(2), v.literal(3)),
      isDelegated: v.boolean(),
    }),
    v.object({ found: v.literal(false) }),
  ),
  handler: async (ctx, args) => {
    if (args.nip) {
      const profile = await ctx.db
        .query("userProfile")
        .withIndex("by_nip", (q) => q.eq("pivot.nip", args.nip!))
        .first()
      if (profile && !profile.deletedAt) {
        const delegation = await ctx.db
          .query("delegatedIdentity")
          .withIndex("by_targetUserId", (q) =>
            q.eq("targetUserId", profile.userId),
          )
          .first()
        return {
          found: true as const,
          idnId: profile.idnId,
          loa: profile.loa,
          isDelegated: delegation?.status === "created",
        }
      }
    }

    if (args.firstName && args.lastName && args.dateOfBirth) {
      const fn = args.firstName.trim().toLowerCase()
      const ln = args.lastName.trim().toLowerCase()
      const dob = args.dateOfBirth.trim()

      const candidates = await ctx.db
        .query("userProfile")
        .withIndex("by_pivot_dob", (q) => q.eq("pivot.dateOfBirth", dob))
        .collect()
      const match = candidates.find(
        (p) =>
          !p.deletedAt &&
          p.pivot &&
          p.pivot.firstName.toLowerCase() === fn &&
          p.pivot.lastName.toLowerCase() === ln,
      )
      if (match) {
        const delegation = await ctx.db
          .query("delegatedIdentity")
          .withIndex("by_targetUserId", (q) =>
            q.eq("targetUserId", match.userId),
          )
          .first()
        return {
          found: true as const,
          idnId: match.idnId,
          loa: match.loa,
          isDelegated: delegation?.status === "created",
        }
      }
    }

    return { found: false as const }
  },
})
