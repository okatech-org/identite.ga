import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalQuery } from "../_generated/server"
import { internalMutation } from "../functions"
import {
  CLAIM_LOCKOUT_MS,
  CLAIM_MAX_ATTEMPTS,
  hashClaimCode,
  timingSafeEqualHex,
} from "../lib/claimCode"
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
    /** SHA-256 du code de réclamation. Le clair ne transite jamais par ici. */
    claimCodeHash: v.string(),
    claimCodeExpiresAt: v.number(),
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
      claimCodeHash: args.claimCodeHash,
      claimCodeExpiresAt: args.claimCodeExpiresAt,
      claimAttempts: 0,
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

    // Usage UNIQUE : on efface le hash du code en même temps qu'on marque
    // l'identité réclamée. Un code rejoué après coup ne peut plus rien, même si
    // le papier remis au citoyen traîne ensuite.
    await ctx.db.patch(args.delegatedIdentityId, {
      status: "claimed",
      claimedAt: now,
      updatedAt: now,
      initialSecret: undefined,
      claimCodeHash: undefined,
      claimCodeExpiresAt: undefined,
      claimAttempts: undefined,
      claimLockedUntil: undefined,
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

/**
 * Vérifie un code de réclamation et consomme une tentative.
 *
 * Mutation (et non query) parce que compter les tentatives EST le mécanisme
 * anti-brute-force : 60 bits d'entropie ne protègent que si l'attaquant ne peut
 * pas essayer indéfiniment. Le compteur vit sur la ligne de la délégation, donc
 * il résiste au changement d'IP.
 *
 * Renvoie un booléen nu, volontairement sans détail : l'appelant ne doit pas
 * pouvoir distinguer « code faux » de « identité déjà réclamée » ou « verrouillé »
 * — cette distinction transformerait la route publique en oracle d'existence.
 * Le détail part dans l'audit, pas dans la réponse.
 */
export const verifyClaimCode = internalMutation({
  args: {
    delegatedIdentityId: v.id("delegatedIdentity"),
    claimCode: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const delegation = await ctx.db.get(args.delegatedIdentityId)
    if (!delegation) return false
    if (delegation.status !== "created") return false
    if (!delegation.claimCodeHash) return false

    const now = Date.now()
    if (delegation.claimLockedUntil && delegation.claimLockedUntil > now) {
      return false
    }
    if (delegation.claimCodeExpiresAt && delegation.claimCodeExpiresAt < now) {
      return false
    }

    const presented = await hashClaimCode(args.claimCode)
    if (timingSafeEqualHex(presented, delegation.claimCodeHash)) {
      if (delegation.claimAttempts) {
        await ctx.db.patch(args.delegatedIdentityId, {
          claimAttempts: 0,
          updatedAt: now,
        })
      }
      return true
    }

    const attempts = (delegation.claimAttempts ?? 0) + 1
    await ctx.db.patch(args.delegatedIdentityId, {
      claimAttempts: attempts,
      claimLockedUntil:
        attempts >= CLAIM_MAX_ATTEMPTS ? now + CLAIM_LOCKOUT_MS : undefined,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: undefined,
      action: "delegated_claim_code_failed",
      targetType: "user",
      targetId: delegation.targetUserId,
      metadata: {
        delegatedIdentityId: args.delegatedIdentityId,
        attempts,
        locked: attempts >= CLAIM_MAX_ATTEMPTS,
      },
    })

    return false
  },
})

/**
 * Réémet un code de réclamation sur une identité déjà créée.
 *
 * Deux usages :
 *   • MIGRATION — les identités créées avant l'introduction du code n'en ont
 *     aucun (`claimCodeHash` absent), donc elles ne sont plus réclamables. Sans
 *     cette réémission, les citoyens concernés seraient définitivement bloqués :
 *     le correctif de sécurité ne doit pas se payer en identités perdues.
 *   • EXPLOITATION — code perdu, papier détruit, ou code expiré.
 *
 * Réinitialise aussi le compteur de tentatives et lève le verrou : un nouveau
 * code mérite un nouveau quota.
 */
export const setClaimCodeHash = internalMutation({
  args: {
    delegatedIdentityId: v.id("delegatedIdentity"),
    claimCodeHash: v.string(),
    claimCodeExpiresAt: v.number(),
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
    await ctx.db.patch(args.delegatedIdentityId, {
      claimCodeHash: args.claimCodeHash,
      claimCodeExpiresAt: args.claimCodeExpiresAt,
      claimAttempts: 0,
      claimLockedUntil: undefined,
      updatedAt: Date.now(),
    })
    return null
  },
})

/** Identités en attente de réclamation SANS code — file de migration. */
export const listWithoutClaimCode = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      delegatedIdentityId: v.id("delegatedIdentity"),
      targetUserId: v.string(),
      appClientId: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("delegatedIdentity")
      .withIndex("by_status", (q) => q.eq("status", "created"))
      .collect()
    return rows
      .filter((r) => r.claimCodeHash === undefined)
      .map((r) => ({
        delegatedIdentityId: r._id,
        targetUserId: r.targetUserId,
        appClientId: r.appClientId,
        createdAt: r.createdAt,
      }))
  },
})

/**
 * Purge unique des `initialSecret` héritées (mots de passe en clair).
 *
 * À lancer une fois après déploiement :
 *   bunx convex run delegate/mutations:purgeInitialSecrets
 * Les comptes concernés restent réclamables : le mot de passe initial est
 * désormais dérivé de la clé d'environnement, pas relu depuis la base.
 */
export const purgeInitialSecrets = internalMutation({
  args: {},
  returns: v.object({ purged: v.number() }),
  handler: async (ctx) => {
    const rows = await ctx.db.query("delegatedIdentity").collect()
    let purged = 0
    for (const row of rows) {
      if (row.initialSecret !== undefined) {
        await ctx.db.patch(row._id, { initialSecret: undefined })
        purged++
      }
    }
    return { purged }
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
