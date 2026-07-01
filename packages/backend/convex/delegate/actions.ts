import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"
import { authComponent, createAuth } from "../auth"
import { KYC_DOCUMENT_TYPES } from "../schema"

export const createDelegatedUser = internalAction({
  args: {
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
    profileType: v.union(v.literal("citizen"), v.literal("resident")),
    assignedLoa: v.union(v.literal(1), v.literal(2)),
    appClientId: v.string(),
    operatorUserId: v.string(),
    kycDocumentType: v.optional(
      v.union(...KYC_DOCUMENT_TYPES.map((t) => v.literal(t))),
    ),
    kycDocFront: v.optional(v.id("_storage")),
    kycDocBack: v.optional(v.id("_storage")),
  },
  returns: v.object({
    userId: v.string(),
    idnId: v.string(),
    delegatedIdentityId: v.id("delegatedIdentity"),
  }),
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    const uuid = crypto.randomUUID()
    const email = `delegated.${uuid}@idn.ga`
    const password = crypto.randomUUID() + crypto.randomUUID()
    const name = `${args.pivot.firstName} ${args.pivot.lastName}`

    let userId: string
    try {
      const result = await auth.api.signUpEmail({
        body: { email, password, name },
        headers,
      })
      userId = (result as { user?: { id?: string } })?.user?.id ?? ""
      if (!userId) throw new Error("Better Auth n'a pas renvoyé d'userId.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Création utilisateur impossible."
      throw new ConvexError({ code: "SIGNUP_FAILED", message })
    }

    const profileResult: {
      profileId: string
      idnId: string
      delegatedIdentityId: string
    } = await ctx.runMutation(
      internal.delegate.mutations.createDelegatedProfile,
      {
        userId,
        profileType: args.profileType,
        pivot: args.pivot,
        assignedLoa: args.assignedLoa,
        appClientId: args.appClientId,
        operatorUserId: args.operatorUserId,
        kycDocumentType: args.kycDocumentType,
        kycDocFront: args.kycDocFront,
        kycDocBack: args.kycDocBack,
        initialSecret: password,
      },
    )

    return {
      userId,
      idnId: profileResult.idnId,
      delegatedIdentityId: profileResult.delegatedIdentityId as any,
    }
  },
})

async function derivePinHash(pin: string, userId: string): Promise<string> {
  const salt = new TextEncoder().encode(`idn:pin:${userId}`)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600_000, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  return [...new Uint8Array(bits)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export const claimAccount = internalAction({
  args: {
    delegatedIdentityId: v.id("delegatedIdentity"),
    password: v.string(),
    pin: v.string(),
  },
  returns: v.object({ userId: v.string(), email: v.string() }),
  handler: async (ctx, args): Promise<{ userId: string; email: string }> => {
    const delegation: {
      targetUserId: string
      targetProfileId: string
      status: "created" | "claimed"
      initialSecret?: string
    } | null = await ctx.runQuery(
      internal.delegate.queries.getClaimInfo,
      { id: args.delegatedIdentityId },
    )
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
    if (!delegation.initialSecret) {
      throw new ConvexError({
        code: "MISSING_SECRET",
        message: "Données de réclamation corrompues.",
      })
    }

    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    const baUser: { id: string; email: string } | null = await ctx.runQuery(
      internal.delegate.queries.getBaUser,
      { userId: delegation.targetUserId },
    )
    if (!baUser) {
      throw new ConvexError({
        code: "USER_NOT_FOUND",
        message: "Compte utilisateur introuvable.",
      })
    }

    // Ouvrir une session BA avec le password initial pour pouvoir le changer
    try {
      const signInResult = await auth.api.signInEmail({
        body: { email: baUser.email, password: delegation.initialSecret },
        headers,
      })
      const sessionToken =
        (signInResult as { token?: string })?.token ?? ""

      if (sessionToken) {
        const sessionHeaders = new Headers()
        sessionHeaders.set(
          "authorization",
          `Bearer ${sessionToken}`,
        )
        await auth.api.changePassword({
          body: {
            currentPassword: delegation.initialSecret,
            newPassword: args.password,
            revokeOtherSessions: true,
          },
          headers: sessionHeaders,
        })
      }
    } catch (err) {
      throw new ConvexError({
        code: "PASSWORD_CHANGE_FAILED",
        message:
          err instanceof Error
            ? err.message
            : "Impossible de changer le mot de passe.",
      })
    }

    const pinHash = await derivePinHash(args.pin, delegation.targetUserId)

    await ctx.runMutation(
      internal.delegate.mutations.claimDelegatedIdentity,
      {
        delegatedIdentityId: args.delegatedIdentityId,
        pinHash,
      },
    )

    return { userId: delegation.targetUserId, email: baUser.email }
  },
})
