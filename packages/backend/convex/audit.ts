import { v } from "convex/values"

import { internalMutation } from "./_generated/server"
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from "./schema"

/**
 * Journal d'audit IDN — append-only.
 *
 * Aucune fonction n'expose patch/delete sur la table `auditLog`.
 * Phase 1 : signature HMAC-SHA256 simple (à brancher quand `AUDIT_HMAC_KEY`
 * sera configurée). Phase 2 : RSA + chaînage Merkle pour intégrité.
 *
 * Toutes les mutations sensibles (auth, KYC, OAuth, admin, contrôleur)
 * doivent appeler `recordAudit` via `ctx.runMutation(internal.audit.recordAudit, ...)`.
 */

const AUDIT_ACTION_VALIDATOR = v.union(
  ...AUDIT_ACTIONS.map((a) => v.literal(a)),
)
const AUDIT_TARGET_TYPE_VALIDATOR = v.union(
  ...AUDIT_TARGET_TYPES.map((t) => v.literal(t)),
)

export const recordAudit = internalMutation({
  args: {
    actorId: v.optional(v.string()),
    action: AUDIT_ACTION_VALIDATOR,
    targetType: AUDIT_TARGET_TYPE_VALIDATOR,
    targetId: v.string(),
    ip: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("auditLog"),
  handler: async (ctx, args) => {
    const createdAt = Date.now()
    const signature = await signEntry({ ...args, createdAt })

    return await ctx.db.insert("auditLog", {
      actorId: args.actorId,
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      ip: args.ip,
      userAgent: args.userAgent,
      metadata: args.metadata,
      signature,
      createdAt,
    })
  },
})

async function signEntry(entry: {
  actorId?: string
  action: string
  targetType: string
  targetId: string
  createdAt: number
}): Promise<string | undefined> {
  const key = process.env.AUDIT_HMAC_KEY
  if (!key) return undefined

  const payload = JSON.stringify({
    actorId: entry.actorId ?? null,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    createdAt: entry.createdAt,
  })

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(payload),
  )
  return [...new Uint8Array(signature)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
