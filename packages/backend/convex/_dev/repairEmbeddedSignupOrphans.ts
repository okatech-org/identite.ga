import { ConvexError, v } from "convex/values"

import { components, internal } from "../_generated/api"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { internalMutation, internalQuery } from "../_generated/server"

const IDN_DOMAIN = "@idn.ga"
const MAX_EMAILS = 25
const CONFIRMATION = "SUPPRIMER LES INSCRIPTIONS IDN INCOMPLETES"

// Le parcours embarqué fautif a été introduit le 22 août 2026. La borne de
// fin est volontairement large : les autres garde-fous portent sur l'état
// réel du compte et empêchent de toucher un citoyen finalisé.
const INCIDENT_START = Date.UTC(2026, 7, 22)
const INCIDENT_END = Date.UTC(2026, 7, 27)

const inspectionValidator = v.object({
  email: v.string(),
  userId: v.union(v.string(), v.null()),
  createdAt: v.union(v.number(), v.null()),
  emailVerified: v.union(v.boolean(), v.null()),
  eligible: v.boolean(),
  reasons: v.array(v.string()),
  sessionCount: v.number(),
  accountCount: v.number(),
})

type ReadCtx = Pick<QueryCtx, "db" | "runQuery">

type BetterAuthUser = {
  _id: string
  email: string
  emailVerified: boolean
  createdAt: number
}

type BetterAuthPage = { page: Array<Record<string, unknown>> }

function normalizeEmails(emails: string[]): string[] {
  const normalized = [
    ...new Set(emails.map((email) => email.trim().toLowerCase())),
  ]
  if (normalized.length === 0 || normalized.length > MAX_EMAILS) {
    throw new ConvexError({
      code: "INVALID_BATCH",
      message: `Indiquez entre 1 et ${MAX_EMAILS} adresses IDN.`,
    })
  }
  if (normalized.some((email) => !email.endsWith(IDN_DOMAIN))) {
    throw new ConvexError({
      code: "INVALID_EMAIL",
      message: "Seules les adresses @idn.ga peuvent être réparées ici.",
    })
  }
  return normalized
}

async function findMany(
  ctx: ReadCtx,
  model:
    | "session"
    | "account"
    | "twoFactor"
    | "oauthApplication"
    | "oauthAccessToken"
    | "oauthConsent",
  userId: string,
): Promise<Array<Record<string, unknown>>> {
  const result = (await ctx.runQuery(components.betterAuth.adapter.findMany, {
    model,
    where: [{ field: "userId", value: userId, operator: "eq" }],
    paginationOpts: { numItems: 200, cursor: null },
  })) as BetterAuthPage
  return result.page
}

async function inspectOne(ctx: ReadCtx, email: string) {
  const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "email", value: email, operator: "eq" }],
  })) as BetterAuthUser | null

  if (!user) {
    return {
      email,
      userId: null,
      createdAt: null,
      emailVerified: null,
      eligible: false,
      reasons: ["USER_NOT_FOUND"],
      sessionCount: 0,
      accountCount: 0,
    }
  }

  const profile = await ctx.db
    .query("userProfile")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .unique()
  const roles = await ctx.db
    .query("userRole")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .take(1)
  const accountCreatedAudit = await ctx.db
    .query("auditLog")
    .withIndex("by_target", (q) =>
      q.eq("targetType", "user").eq("targetId", user._id),
    )
    .take(20)

  const [
    sessions,
    accounts,
    twoFactors,
    oauthApplications,
    accessTokens,
    consents,
  ] = await Promise.all([
    findMany(ctx, "session", user._id),
    findMany(ctx, "account", user._id),
    findMany(ctx, "twoFactor", user._id),
    findMany(ctx, "oauthApplication", user._id),
    findMany(ctx, "oauthAccessToken", user._id),
    findMany(ctx, "oauthConsent", user._id),
  ])

  const reasons: string[] = []
  if (user.email.toLowerCase() !== email) reasons.push("EMAIL_MISMATCH")
  if (user.emailVerified) reasons.push("EMAIL_ALREADY_VERIFIED")
  if (user.createdAt < INCIDENT_START || user.createdAt >= INCIDENT_END) {
    reasons.push("OUTSIDE_INCIDENT_WINDOW")
  }
  if (profile) reasons.push("PROFILE_EXISTS")
  if (roles.length > 0) reasons.push("ROLE_EXISTS")
  if (accountCreatedAudit.some((entry) => entry.action === "account_created")) {
    reasons.push("ACCOUNT_CREATED_AUDIT_EXISTS")
  }
  if (accounts.some((account) => account.providerId !== "credential")) {
    reasons.push("NON_CREDENTIAL_ACCOUNT_EXISTS")
  }
  if (twoFactors.length > 0) reasons.push("TWO_FACTOR_EXISTS")
  if (oauthApplications.length > 0) reasons.push("OAUTH_APPLICATION_EXISTS")
  if (accessTokens.length > 0) reasons.push("OAUTH_ACCESS_TOKEN_EXISTS")
  if (consents.length > 0) reasons.push("OAUTH_CONSENT_EXISTS")

  return {
    email,
    userId: user._id,
    createdAt: user.createdAt,
    emailVerified: user.emailVerified,
    eligible: reasons.length === 0,
    reasons,
    sessionCount: sessions.length,
    accountCount: accounts.length,
  }
}

/** Audit en lecture seule. Toujours exécuter cette fonction avant `run`. */
export const inspect = internalQuery({
  args: { emails: v.array(v.string()) },
  returns: v.array(inspectionValidator),
  handler: async (ctx, args) => {
    const emails = normalizeEmails(args.emails)
    return await Promise.all(emails.map((email) => inspectOne(ctx, email)))
  },
})

/**
 * Supprime uniquement les coquilles Better Auth créées pendant l'incident.
 * La transaction entière échoue si une seule adresse ne passe plus l'audit.
 */
export const run = internalMutation({
  args: {
    emails: v.array(v.string()),
    confirm: v.string(),
  },
  returns: v.object({ deleted: v.array(v.string()) }),
  handler: async (ctx, args) => {
    if (args.confirm !== CONFIRMATION) {
      throw new ConvexError({
        code: "CONFIRMATION_MISMATCH",
        message: `Confirmation requise : ${CONFIRMATION}`,
      })
    }

    const emails = normalizeEmails(args.emails)
    const inspections = await Promise.all(
      emails.map((email) => inspectOne(ctx, email)),
    )
    const blocked = inspections.filter((item) => !item.eligible)
    if (blocked.length > 0) {
      throw new ConvexError({
        code: "UNSAFE_TO_DELETE",
        message:
          "Au moins un compte ne correspond plus à une inscription incomplète.",
        details: blocked.map((item) => ({
          email: item.email,
          reasons: item.reasons,
        })),
      })
    }

    for (const item of inspections) {
      const userId = item.userId!
      for (const model of ["session", "account"] as const) {
        await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
          input: {
            model,
            where: [{ field: "userId", value: userId, operator: "eq" }],
          },
          paginationOpts: { numItems: 200, cursor: null },
        })
      }
      await ctx.runMutation(components.betterAuth.adapter.deleteMany, {
        input: {
          model: "verification",
          where: [{ field: "identifier", value: item.email, operator: "eq" }],
        },
        paginationOpts: { numItems: 200, cursor: null },
      })
      await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: {
          model: "user",
          where: [{ field: "_id", value: userId }],
        },
      })
      await ctx.runMutation(internal.audit.recordAudit, {
        action: "admin_action",
        targetType: "user",
        targetId: userId,
        metadata: {
          kind: "embedded_signup_orphan_deleted",
          email: item.email,
          incident: "gabon-diplomatie-completeSignup-contract-2026-08",
        },
      })
    }

    return { deleted: emails }
  },
})
