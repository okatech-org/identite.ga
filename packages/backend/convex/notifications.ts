import { ConvexError, v } from "convex/values"

import { internalMutation, mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import { sendKycEmail } from "./email/provider"
import { requireAuth } from "./lib/auth"

/**
 * Notifications in-app (cf. §3.4) + dispatcher KYC.
 */

const KYC_KIND = v.union(
  v.literal("complement_requested"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("complement_provided"),
)

const KYC_IN_APP: Record<
  | "complement_requested"
  | "approved"
  | "rejected"
  | "complement_provided",
  { title: string; body: (detail: string | null) => string }
> = {
  complement_requested: {
    title: "Complément demandé pour votre vérification",
    body: (msg) =>
      msg
        ? `Le contrôleur a écrit : « ${msg} » — ré-uploadez la pièce concernée depuis votre espace.`
        : "Le contrôleur a besoin d'un complément avant de valider votre demande.",
  },
  approved: {
    title: "Vérification d'identité validée (Niveau 2)",
    body: () =>
      "Votre identité a été vérifiée. Plus de services administratifs sont accessibles depuis votre tableau de bord.",
  },
  rejected: {
    title: "Demande de vérification refusée",
    body: (reason) =>
      reason
        ? `Motif : ${reason}`
        : "Votre demande n'a pas pu être validée. Consultez le détail dans votre espace.",
  },
  complement_provided: {
    title: "Le citoyen a fourni le complément demandé",
    body: () =>
      "La demande est de retour dans votre file d'attente — vous pouvez reprendre l'examen.",
  },
}

/**
 * Dispatch interne d'une notification KYC vers un utilisateur (citoyen
 * ou contrôleur). Pose une ligne in-app et — si la préférence l'autorise
 * et qu'on connaît l'email — délègue l'envoi à `sendKycEmail`.
 *
 * Respecte `notificationPreference` (par défaut tout activé pour la
 * catégorie `kyc` si aucune ligne explicite n'existe).
 */
export const dispatchKyc = internalMutation({
  args: {
    userId: v.string(),
    kind: KYC_KIND,
    kycRequestId: v.id("kycRequest"),
    /** Message contrôleur (complement) ou motif (rejet). */
    detail: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("notificationPreference")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique()
    const wantsInApp = prefs ? prefs.inApp.kyc : true
    const wantsEmail = prefs ? prefs.email.kyc : true

    const copy = KYC_IN_APP[args.kind]
    const body = copy.body(args.detail ?? null)
    const now = Date.now()

    if (wantsInApp) {
      await ctx.db.insert("notification", {
        userId: args.userId,
        channel: "in_app",
        category: "kyc",
        title: copy.title,
        body,
        metadata: {
          kycRequestId: args.kycRequestId,
          kind: args.kind,
        },
        createdAt: now,
      })
    }

    if (wantsEmail) {
      // L'email du destinataire est dans la table user du composant
      // Better Auth — il faut passer par l'adapter pour le récupérer.
      const user = await authComponent.getAnyUserById(ctx, args.userId)
      if (user?.email) {
        const recipientName =
          (user as { name?: string }).name ?? null
        await sendKycEmail(ctx, {
          to: user.email,
          kind: args.kind,
          recipientName,
          detail: args.detail ?? null,
        })
        // On laisse Resend gérer l'idempotency et la file. Pas de ref
        // emailMessageId persistée pour l'instant — `@convex-dev/resend`
        // expose ces infos via ses propres webhooks (cf. §audit).
      }
    }

    return null
  },
})

export const listMine = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("notification"),
      title: v.string(),
      body: v.string(),
      category: v.string(),
      metadata: v.optional(v.record(v.string(), v.any())),
      readAt: v.optional(v.number()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const limit = Math.min(args.limit ?? 20, 100)
    const docs = await ctx.db
      .query("notification")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .order("desc")
      .take(limit)
    return docs.map((d) => ({
      _id: d._id,
      title: d.title,
      body: d.body,
      category: d.category,
      metadata: d.metadata,
      readAt: d.readAt,
      createdAt: d.createdAt,
    }))
  },
})

export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const docs = await ctx.db
      .query("notification")
      .withIndex("by_userId_unread", (q) =>
        q.eq("userId", user.userId).eq("readAt", undefined),
      )
      .collect()
    return docs.length
  },
})

export const markAllRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const docs = await ctx.db
      .query("notification")
      .withIndex("by_userId_unread", (q) =>
        q.eq("userId", user.userId).eq("readAt", undefined),
      )
      .collect()
    const now = Date.now()
    for (const d of docs) {
      await ctx.db.patch(d._id, { readAt: now })
    }
    return null
  },
})

export const markRead = mutation({
  args: { notificationId: v.id("notification") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const notif = await ctx.db.get(args.notificationId)
    if (!notif || notif.userId !== user.userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Notification introuvable.",
      })
    }
    if (!notif.readAt) {
      await ctx.db.patch(args.notificationId, { readAt: Date.now() })
    }
    return null
  },
})
