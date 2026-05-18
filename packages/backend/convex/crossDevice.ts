import { ConvexError, v } from "convex/values"

import { authComponent } from "./auth"
import { mutation, query } from "./_generated/server"
import { requireAuth } from "./lib/auth"
import { internal } from "./_generated/api"

/**
 * Cross-device login — login QR scan depuis le mobile.
 *
 * Flow :
 *  1. Le web appelle `createSession()` (anonyme), reçoit un `sessionCode`
 *     court (16 chars) et un `expiresAt` (5 min).
 *  2. Le web affiche un QR contenant ce code, poll `getStatus` toutes
 *     les 2-3s.
 *  3. Le mobile authentifié scanne le QR, décode le `sessionCode`, et
 *     appelle `approveSession({ sessionCode })`.
 *  4. La query `getStatus` du web retourne `approved` + l'email du
 *     compte. Le web propose alors à l'utilisateur un sign-in PIN
 *     pré-rempli (l'écran sign-in actuel sait gérer ça).
 *
 * Phase 1 : on ne fabrique pas de session Better Auth automatiquement
 * — la couche d'auth reste centralisée sur Better Auth et le PIN.
 * Une intégration native (plugin device-authorization) sera ajoutée
 * dans une V2.
 */

const SESSION_TTL_MS = 5 * 60 * 1000 // 5 minutes
const CODE_BYTES = 12

function generateSessionCode(): string {
  // 16 caractères base64url ≈ 96 bits d'entropie.
  const buf = new Uint8Array(CODE_BYTES)
  crypto.getRandomValues(buf)
  let s = ""
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]!)
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
}

export const createSession = mutation({
  args: {
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    sessionCode: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const sessionCode = generateSessionCode()
    const now = Date.now()
    const expiresAt = now + SESSION_TTL_MS
    await ctx.db.insert("crossDeviceSession", {
      sessionCode,
      status: "pending",
      userAgent: args.userAgent,
      createdAt: now,
      expiresAt,
    })
    return { sessionCode, expiresAt }
  },
})

export const getStatus = query({
  args: { sessionCode: v.string() },
  returns: v.union(
    v.object({
      status: v.literal("pending"),
      expiresAt: v.number(),
    }),
    v.object({
      status: v.literal("approved"),
      approvedEmail: v.string(),
      approvedAt: v.number(),
    }),
    v.object({
      status: v.literal("expired"),
    }),
    v.object({
      status: v.literal("cancelled"),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("crossDeviceSession")
      .withIndex("by_sessionCode", (q) => q.eq("sessionCode", args.sessionCode))
      .unique()
    if (!row) return null
    if (row.status === "pending" && row.expiresAt < Date.now()) {
      return { status: "expired" as const }
    }
    if (row.status === "approved" && row.approvedEmail && row.approvedAt) {
      return {
        status: "approved" as const,
        approvedEmail: row.approvedEmail,
        approvedAt: row.approvedAt,
      }
    }
    if (row.status === "pending") {
      return { status: "pending" as const, expiresAt: row.expiresAt }
    }
    if (row.status === "expired") return { status: "expired" as const }
    if (row.status === "cancelled") return { status: "cancelled" as const }
    return null
  },
})

export const approveSession = mutation({
  args: { sessionCode: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const row = await ctx.db
      .query("crossDeviceSession")
      .withIndex("by_sessionCode", (q) => q.eq("sessionCode", args.sessionCode))
      .unique()
    if (!row) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Session inconnue ou expirée.",
      })
    }
    if (row.status !== "pending") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette session ne peut plus être approuvée.",
      })
    }
    if (row.expiresAt < Date.now()) {
      await ctx.db.patch(row._id, { status: "expired" })
      throw new ConvexError({
        code: "EXPIRED",
        message: "Le QR a expiré, rafraîchissez-le sur l'autre appareil.",
      })
    }
    const authUser = await authComponent.getAnyUserById(ctx, user.userId)
    const email = (authUser as { email?: string } | null)?.email
    if (!email) {
      throw new ConvexError({
        code: "EMAIL_MISSING",
        message: "Email du compte introuvable.",
      })
    }
    const now = Date.now()
    await ctx.db.patch(row._id, {
      status: "approved",
      userId: user.userId,
      approvedEmail: email,
      approvedAt: now,
    })
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "login_success",
      targetType: "session",
      targetId: row._id,
      metadata: { module: "crossDevice", sessionCode: args.sessionCode },
    })
    return null
  },
})

export const cancelSession = mutation({
  args: { sessionCode: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("crossDeviceSession")
      .withIndex("by_sessionCode", (q) => q.eq("sessionCode", args.sessionCode))
      .unique()
    if (!row) return null
    if (row.status === "pending") {
      await ctx.db.patch(row._id, { status: "cancelled" })
    }
    return null
  },
})
