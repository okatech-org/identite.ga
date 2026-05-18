import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import { requireVerifiedAuth } from "../lib/auth"
import { rateLimiter } from "../rateLimiter"

/**
 * iDocument — Gestion de la Master Vault Key (MVK).
 * Cf. SPECS_FEATURES_CITIZEN.md §3 + plan §4.
 *
 * Modèle envelope encryption :
 *   • MVK AES-256-GCM générée côté client à l'activation.
 *   • MVK wrappée par une clé dérivée d'un mot de passe vault (PBKDF2-SHA256).
 *   • Optionnel : second wrap par une clé dérivée d'un code de récupération
 *     (BIP-39 24 mots) — affiché une fois au user à l'activation.
 *
 * Le serveur ne voit JAMAIS la MVK en clair. Toutes les opérations
 * cryptographiques se font côté client après déballage local.
 */

const ALGORITHM_VALIDATOR = v.union(v.literal("AES-256-GCM"))
const KDF_VALIDATOR = v.union(v.literal("PBKDF2-SHA256"))

const ENVELOPE_OUT = v.object({
  algorithm: ALGORITHM_VALIDATOR,
  kdf: KDF_VALIDATOR,
  kdfIterations: v.number(),
  passwordSalt: v.string(),
  wrappedMvk: v.string(),
})

const RECOVERY_ENVELOPE_OUT = v.object({
  algorithm: ALGORITHM_VALIDATOR,
  kdf: KDF_VALIDATOR,
  kdfIterations: v.number(),
  recoverySalt: v.string(),
  wrappedMvkRecovery: v.string(),
})

const STATUS_OUT = v.object({
  activated: v.boolean(),
  hasRecovery: v.boolean(),
  passwordHint: v.optional(v.string()),
})

// ─────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────

export const status = query({
  args: {},
  returns: STATUS_OUT,
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const key = await ctx.db
      .query("vaultKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!key) return { activated: false, hasRecovery: false }
    return {
      activated: true,
      hasRecovery: !!key.wrappedMvkRecovery,
      passwordHint: key.passwordHint,
    }
  },
})

export const getEnvelope = query({
  args: {},
  returns: v.union(ENVELOPE_OUT, v.null()),
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const key = await ctx.db
      .query("vaultKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!key) return null
    return {
      algorithm: key.algorithm as "AES-256-GCM",
      kdf: key.kdf as "PBKDF2-SHA256",
      kdfIterations: key.kdfIterations,
      passwordSalt: key.passwordSalt,
      wrappedMvk: key.wrappedMvk,
    }
  },
})

export const getRecoveryEnvelope = query({
  args: {},
  returns: v.union(RECOVERY_ENVELOPE_OUT, v.null()),
  handler: async (ctx) => {
    const user = await requireVerifiedAuth(ctx)
    const key = await ctx.db
      .query("vaultKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!key || !key.wrappedMvkRecovery || !key.recoverySalt) return null
    return {
      algorithm: key.algorithm as "AES-256-GCM",
      kdf: key.kdf as "PBKDF2-SHA256",
      kdfIterations: key.kdfIterations,
      recoverySalt: key.recoverySalt,
      wrappedMvkRecovery: key.wrappedMvkRecovery,
    }
  },
})

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

const MIN_ITERATIONS = 100_000 // borne basse — refuse les configs trop faibles
const MAX_ITERATIONS = 5_000_000

function assertValidIterations(iterations: number) {
  if (
    !Number.isFinite(iterations) ||
    iterations < MIN_ITERATIONS ||
    iterations > MAX_ITERATIONS
  ) {
    throw new ConvexError({
      code: "INVALID",
      message: `kdfIterations doit être entre ${MIN_ITERATIONS} et ${MAX_ITERATIONS}.`,
    })
  }
}

function assertValidBase64(input: string, field: string, minLen = 16) {
  if (input.length < minLen) {
    throw new ConvexError({
      code: "INVALID",
      message: `Champ ${field} trop court.`,
    })
  }
}

export const activate = mutation({
  args: {
    algorithm: ALGORITHM_VALIDATOR,
    kdf: KDF_VALIDATOR,
    kdfIterations: v.number(),
    passwordSalt: v.string(),
    wrappedMvk: v.string(),
    recoverySalt: v.optional(v.string()),
    wrappedMvkRecovery: v.optional(v.string()),
    passwordHint: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "vaultKeyOp", {
      key: user.userId,
      throws: true,
    })

    const existing = await ctx.db
      .query("vaultKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (existing) {
      throw new ConvexError({
        code: "ALREADY_ACTIVATED",
        message: "Le coffre-fort est déjà activé. Utilisez changePassword.",
      })
    }

    assertValidIterations(args.kdfIterations)
    assertValidBase64(args.passwordSalt, "passwordSalt")
    assertValidBase64(args.wrappedMvk, "wrappedMvk")
    if (args.wrappedMvkRecovery !== undefined) {
      if (!args.recoverySalt) {
        throw new ConvexError({
          code: "INVALID",
          message: "recoverySalt requis avec wrappedMvkRecovery.",
        })
      }
      assertValidBase64(args.recoverySalt, "recoverySalt")
      assertValidBase64(args.wrappedMvkRecovery, "wrappedMvkRecovery")
    }
    if (args.passwordHint && args.passwordHint.length > 200) {
      throw new ConvexError({
        code: "INVALID",
        message: "L'indice est trop long (200 caractères max).",
      })
    }

    const now = Date.now()
    await ctx.db.insert("vaultKey", {
      userId: user.userId,
      algorithm: args.algorithm,
      kdf: args.kdf,
      kdfIterations: args.kdfIterations,
      passwordSalt: args.passwordSalt,
      wrappedMvk: args.wrappedMvk,
      passwordHint: args.passwordHint?.trim() || undefined,
      recoverySalt: args.recoverySalt,
      wrappedMvkRecovery: args.wrappedMvkRecovery,
      activatedAt: now,
      updatedAt: now,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "vault", op: "activate" },
    })
    return null
  },
})

export const changePassword = mutation({
  args: {
    newPasswordSalt: v.string(),
    newWrappedMvk: v.string(),
    kdfIterations: v.number(),
    newPasswordHint: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "vaultKeyOp", {
      key: user.userId,
      throws: true,
    })

    const key = await ctx.db
      .query("vaultKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!key) {
      throw new ConvexError({
        code: "NOT_ACTIVATED",
        message: "Le coffre-fort n'est pas activé.",
      })
    }

    assertValidIterations(args.kdfIterations)
    assertValidBase64(args.newPasswordSalt, "newPasswordSalt")
    assertValidBase64(args.newWrappedMvk, "newWrappedMvk")

    await ctx.db.patch(key._id, {
      passwordSalt: args.newPasswordSalt,
      wrappedMvk: args.newWrappedMvk,
      kdfIterations: args.kdfIterations,
      passwordHint:
        args.newPasswordHint?.trim() || key.passwordHint,
      updatedAt: Date.now(),
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "account_modified",
      targetType: "user",
      targetId: user.userId,
      metadata: { module: "vault", op: "changePassword" },
    })
    return null
  },
})

export const setRecovery = mutation({
  args: {
    recoverySalt: v.string(),
    wrappedMvkRecovery: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireVerifiedAuth(ctx)
    await rateLimiter.limit(ctx, "vaultKeyOp", {
      key: user.userId,
      throws: true,
    })
    const key = await ctx.db
      .query("vaultKey")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!key) {
      throw new ConvexError({
        code: "NOT_ACTIVATED",
        message: "Le coffre-fort n'est pas activé.",
      })
    }
    assertValidBase64(args.recoverySalt, "recoverySalt")
    assertValidBase64(args.wrappedMvkRecovery, "wrappedMvkRecovery")
    await ctx.db.patch(key._id, {
      recoverySalt: args.recoverySalt,
      wrappedMvkRecovery: args.wrappedMvkRecovery,
      updatedAt: Date.now(),
    })
    return null
  },
})
