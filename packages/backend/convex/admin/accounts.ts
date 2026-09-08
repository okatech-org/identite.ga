import { ConvexError, v } from "convex/values"

import { components, internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"
import { mutation } from "../functions"
import { requireAdmin } from "../lib/auth"

/**
 * Actions destructrices de l'admin sur un compte IDN.
 *
 * Séparé de `admin/users.ts` (lecture seule) pour que la frontière entre
 * consultation et destruction soit lisible d'un coup d'œil.
 *
 * Deux niveaux, volontairement distincts :
 *
 *   • `anonymizeUser` — purge les données personnelles mais laisse vivre le
 *     compte Better Auth. Le handle `@idn.ga` reste réservé, l'email ne peut
 *     pas être réattribué. C'est le mode « vrai citoyen » : réversible côté
 *     état civil, conforme au parcours RGPD §3.4.
 *
 *   • `deleteUserPermanently` — supprime en plus le compte Better Auth et la
 *     ligne `userProfile`. Le handle redevient disponible. C'est le mode
 *     « compte de test / doublon » : irréversible.
 *
 * Dans les deux cas les `auditLog` sont préservés — conservation 5 ans
 * (loi gabonaise 001/2011). Pour le hard delete, l'email et l'IDN sont
 * recopiés dans les métadonnées d'audit AVANT la purge : un journal qui ne
 * dit plus qui a été supprimé ne vaut rien.
 *
 * IMPORTANT : `mutation` est importée depuis `../functions` (et non
 * `_generated/server`) pour que les triggers tiennent les agrégats
 * `usersByLoa` / `usersByProfile` à jour lors du `ctx.db.delete()`. Sans
 * cela le tableau de bord admin dériverait en silence.
 */

/** Profil résolu + garde-fous passés. */
async function loadTarget(
  ctx: MutationCtx,
  userId: string,
  confirmIdnId: string,
) {
  const admin = await requireAdmin(ctx)

  if (userId === admin.userId) {
    throw new ConvexError({
      code: "FORBIDDEN_SELF_DELETE",
      message: "Vous ne pouvez pas supprimer votre propre compte.",
    })
  }

  const roles = await ctx.db
    .query("userRole")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect()
  if (roles.some((r) => r.role === "admin" && !r.revokedAt)) {
    throw new ConvexError({
      code: "FORBIDDEN_ADMIN_TARGET",
      message:
        "Ce compte porte le rôle administrateur. Retirez-lui ce rôle depuis Rôles & habilitations avant de le supprimer.",
    })
  }

  const profile = await ctx.db
    .query("userProfile")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique()
  if (!profile) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Compte introuvable.",
    })
  }

  const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "_id", value: userId }],
  })) as { email?: string } | null
  const email = user?.email ?? ""

  // La modale seule ne suffit pas : l'action est irréversible, on exige la
  // recopie de l'identifiant affiché. À défaut d'IDN (profil incomplet),
  // c'est l'email qui fait foi.
  const expected = profile.idnId ?? email
  if (!expected || confirmIdnId.trim().toUpperCase() !== expected.toUpperCase()) {
    throw new ConvexError({
      code: "CONFIRMATION_MISMATCH",
      message: "L'identifiant saisi ne correspond pas à ce compte.",
    })
  }

  return { admin, profile, email }
}

export const anonymizeUser = mutation({
  args: {
    userId: v.string(),
    confirmIdnId: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { admin, profile } = await loadTarget(
      ctx,
      args.userId,
      args.confirmIdnId,
    )

    if (profile.deletedAt) {
      throw new ConvexError({
        code: "ALREADY_ANONYMIZED",
        message: "Ce compte est déjà anonymisé.",
      })
    }

    // Toute la purge vit dans le parcours RGPD — on ne la duplique pas.
    // Différence avec le parcours citoyen : pas de cooldown 30 j, l'action
    // administrative est immédiate et non annulable par le citoyen.
    await ctx.runMutation(internal.privacy.deletion.anonymizeAccount, {
      userId: args.userId,
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: admin.userId,
      action: "account_disabled",
      targetType: "user",
      targetId: args.userId,
      metadata: { kind: "admin_anonymize", reason: args.reason },
    })

    return null
  },
})

export const deleteUserPermanently = mutation({
  args: {
    userId: v.string(),
    confirmIdnId: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { admin, profile, email } = await loadTarget(
      ctx,
      args.userId,
      args.confirmIdnId,
    )
    const idnId = profile.idnId

    // 1. Enfants de tables que `purgeUserData` supprime sans purger leur
    //    descendance : les capturer AVANT l'anonymisation, sinon leurs
    //    parents auront disparu et on ne saura plus les retrouver.
    const kycReviewIds: Array<Id<"kycReview">> = []
    const kycRequests = await ctx.db
      .query("kycRequest")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
    for (const r of kycRequests) {
      const reviews = await ctx.db
        .query("kycReview")
        .withIndex("by_kycRequest", (q) => q.eq("kycRequestId", r._id))
        .collect()
      kycReviewIds.push(...reviews.map((x) => x._id))
    }

    // 2. Purge applicative + storage + révocation des sessions.
    await ctx.runMutation(internal.privacy.deletion.anonymizeAccount, {
      userId: args.userId,
    })

    for (const id of kycReviewIds) await ctx.db.delete(id)

    // 3. Tables user-scoped qu'`anonymizeAccount` n'atteint pas : elles
    //    survivent volontairement à une anonymisation (le compte existe
    //    encore), mais une suppression définitive qui les laisserait en
    //    place fabriquerait exactement les orphelins qu'elle prétend éviter.
    const apiKeys = await ctx.db
      .query("developerApiKey")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
    for (const k of apiKeys) await ctx.db.delete(k._id)

    const signatures = await ctx.db
      .query("documentSignature")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
    for (const s of signatures) await ctx.db.delete(s._id)

    const verifications = await ctx.db
      .query("level3Verification")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect()
    for (const verif of verifications) {
      const reviews = await ctx.db
        .query("level3Review")
        .withIndex("by_verificationId", (q) => q.eq("verificationId", verif._id))
        .collect()
      for (const r of reviews) await ctx.db.delete(r._id)
      await ctx.db.delete(verif._id)
    }

    const delegations = await ctx.db
      .query("delegatedIdentity")
      .withIndex("by_targetUserId", (q) => q.eq("targetUserId", args.userId))
      .collect()
    for (const d of delegations) await ctx.db.delete(d._id)

    // 4. La ligne de profil elle-même — via le wrapper à triggers, pour que
    //    les agrégats se décrémentent.
    await ctx.db.delete(profile._id)

    // 5. Better Auth : enfants d'abord, parent ensuite.
    for (const model of [
      "session",
      "account",
      "twoFactor",
      "oauthAccessToken",
      "oauthConsent",
    ] as const) {
      await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        input: {
          model,
          where: [{ field: "userId", value: args.userId, operator: "eq" }],
        },
        paginationOpts: { numItems: 200, cursor: null },
      })
    }
    await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: "user",
        where: [{ field: "_id", value: args.userId }],
      },
    })

    // 6. Seule trace restante — d'où la recopie de l'email et de l'IDN.
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: admin.userId,
      action: "admin_action",
      targetType: "user",
      targetId: args.userId,
      metadata: {
        kind: "account_hard_deleted",
        email,
        idnId,
        reason: args.reason,
      },
    })

    return null
  },
})
