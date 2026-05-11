import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { mutation, query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"

/**
 * Providers email & SMS — §3.9 onglet "Providers".
 *
 * V1 : on stocke uniquement l'identifiant du provider actif par canal
 * dans `systemConfig` (clés `provider.email.active` et `provider.sms.active`).
 * La liste des providers candidats est figée côté code (et reflétée dans
 * les maquettes). L'envoi réel reste pour l'instant câblé en dur sur Resend
 * via `RESEND_API_KEY` ; cette UI prépare le terrain pour Phase 2.
 */

const CHANNEL = v.union(v.literal("email"), v.literal("sms"))

const EMAIL_PROVIDER_IDS = ["resend", "sendgrid", "aws-ses", "smtp"] as const
const SMS_PROVIDER_IDS = ["twilio", "vonage", "africastalking"] as const
const EMAIL_DEFAULT = "resend"

const ALL_IDS = new Set<string>([...EMAIL_PROVIDER_IDS, ...SMS_PROVIDER_IDS])

function keyFor(channel: "email" | "sms") {
  return `provider.${channel}.active`
}

export const getActive = query({
  args: {},
  returns: v.object({
    email: v.union(v.string(), v.null()),
    sms: v.union(v.string(), v.null()),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const [emailRow, smsRow] = await Promise.all([
      ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q) => q.eq("key", keyFor("email")))
        .unique(),
      ctx.db
        .query("systemConfig")
        .withIndex("by_key", (q) => q.eq("key", keyFor("sms")))
        .unique(),
    ])
    const email =
      (emailRow?.value as { id?: string } | undefined)?.id ?? EMAIL_DEFAULT
    const sms = (smsRow?.value as { id?: string } | undefined)?.id ?? null
    return { email, sms }
  },
})

export const setActive = mutation({
  args: {
    channel: CHANNEL,
    providerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)
    if (!ALL_IDS.has(args.providerId)) {
      throw new ConvexError({
        code: "UNKNOWN_PROVIDER",
        message: "Provider inconnu.",
      })
    }
    const candidates =
      args.channel === "email" ? EMAIL_PROVIDER_IDS : SMS_PROVIDER_IDS
    if (!(candidates as readonly string[]).includes(args.providerId)) {
      throw new ConvexError({
        code: "PROVIDER_CHANNEL_MISMATCH",
        message: "Ce provider n'est pas disponible sur ce canal.",
      })
    }

    const key = keyFor(args.channel)
    const existing = await ctx.db
      .query("systemConfig")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: { id: args.providerId },
        updatedAt: Date.now(),
        updatedBy: actor.userId,
      })
    } else {
      await ctx.db.insert("systemConfig", {
        key,
        value: { id: args.providerId },
        updatedAt: Date.now(),
        updatedBy: actor.userId,
      })
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "admin_action",
      targetType: "system",
      targetId: key,
      metadata: { provider: args.providerId, channel: args.channel },
    })

    return null
  },
})
