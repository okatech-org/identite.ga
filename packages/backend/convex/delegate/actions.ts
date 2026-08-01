import { ConvexError, v } from "convex/values"

import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"
import { authComponent, createAuth } from "../auth"
import { CLAIM_CODE_TTL_MS, generateClaimCode } from "../lib/claimCode"
import { KYC_DOCUMENT_TYPES } from "../schema"

/**
 * Mot de passe Better Auth initial d'un compte délégué, DÉRIVÉ au lieu d'être
 * stocké.
 *
 * Avant, ce mot de passe était persisté en clair dans `delegatedIdentity.
 * initialSecret` jusqu'à la réclamation : tout accès en lecture à la base (ou
 * une query trop bavarde) donnait le contrôle de n'importe quelle identité non
 * encore réclamée. En le dérivant d'une clé d'environnement, la base ne contient
 * plus rien d'exploitable — il faut la clé, qui ne quitte jamais l'env Convex.
 *
 * Better Auth n'expose pas ici de plugin `admin` permettant de forcer un mot de
 * passe sans connaître l'actuel (cf. plugins dans auth.ts) : le flux de
 * réclamation doit donc pouvoir REPRODUIRE ce mot de passe initial, d'où une
 * dérivation déterministe plutôt qu'un aléa jeté.
 *
 * Rotation : changer DELEGATE_PASSWORD_KEY rendrait irréclamables les identités
 * déléguées encore en statut "created". Ne la faire tourner qu'après avoir vidé
 * cette file (ou en acceptant de réémettre ces identités).
 */
async function deriveInitialPassword(email: string): Promise<string> {
  const secret = process.env.DELEGATE_PASSWORD_KEY
  if (!secret) {
    throw new ConvexError({
      code: "CONFIG_MISSING",
      message:
        "DELEGATE_PASSWORD_KEY non configurée. Générer 32 octets aléatoires " +
        'puis `bunx convex env set DELEGATE_PASSWORD_KEY "<hex>"`.',
    })
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    // Dérivé de l'email (généré avant l'inscription) et non de l'userId, que
    // Better Auth n'attribue qu'APRÈS — le mot de passe est nécessaire pour
    // l'appel signUpEmail lui-même.
    new TextEncoder().encode(`idn:delegate:initial-password:${email}`) as BufferSource,
  )
  const bytes = new Uint8Array(mac)
  let hex = ""
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0")
  }
  // Préfixe pour satisfaire d'éventuelles règles de complexité Better Auth ;
  // l'entropie vient des 256 bits du HMAC.
  return `Idn!${hex}`
}

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
    /**
     * Code de réclamation EN CLAIR — renvoyé une seule fois, à remettre au
     * citoyen par l'opérateur. Non relisible ensuite (seul son hash est
     * persisté). Sans lui, l'identité ne peut pas être réclamée.
     */
    claimCode: v.string(),
  }),
  handler: async (ctx, args) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    const uuid = crypto.randomUUID()
    const email = `delegated.${uuid}@idn.ga`
    const password = await deriveInitialPassword(email)
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

    // Code de réclamation : généré ici, hashé avant d'atteindre la base. Le
    // clair ne vit que dans la réponse HTTP à l'opérateur.
    const { code: claimCode, codeHash } = await generateClaimCode()

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
        claimCodeHash: codeHash,
        claimCodeExpiresAt: Date.now() + CLAIM_CODE_TTL_MS,
      },
    )

    return {
      userId,
      idnId: profileResult.idnId,
      delegatedIdentityId: profileResult.delegatedIdentityId as any,
      claimCode,
    }
  },
})

/**
 * Réémet un code de réclamation et le renvoie EN CLAIR (une seule fois).
 *
 * Nécessaire pour la file de migration : les identités créées avant
 * l'introduction du code n'en ont pas et sont donc devenues non réclamables.
 * Lister la file :
 *   bunx convex run delegate/mutations:listWithoutClaimCode
 * Réémettre pour une identité :
 *   bunx convex run delegate/actions:reissueClaimCode '{"delegatedIdentityId":"..."}'
 * Le code obtenu doit être remis au citoyen par le canal habituel (agent).
 */
export const reissueClaimCode = internalAction({
  args: { delegatedIdentityId: v.id("delegatedIdentity") },
  returns: v.object({ claimCode: v.string(), expiresAt: v.number() }),
  handler: async (ctx, args) => {
    const { code, codeHash } = await generateClaimCode()
    const expiresAt = Date.now() + CLAIM_CODE_TTL_MS
    await ctx.runMutation(internal.delegate.mutations.setClaimCodeHash, {
      delegatedIdentityId: args.delegatedIdentityId,
      claimCodeHash: codeHash,
      claimCodeExpiresAt: expiresAt,
    })
    return { claimCode: code, expiresAt }
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
    /** Preuve de possession — cf. lib/claimCode.ts. Vérifié AVANT toute action. */
    claimCode: v.string(),
    password: v.string(),
    pin: v.string(),
  },
  returns: v.object({ userId: v.string(), email: v.string() }),
  handler: async (ctx, args): Promise<{ userId: string; email: string }> => {
    // Vérification du code EN PREMIER, avant même de lire l'identité : cette
    // route est publique, et sans cette barrière le seul fait de connaître un
    // `delegatedIdentityId` (obtenu d'un NIP via /api/claim/lookup) permettait
    // de poser mot de passe et PIN sur l'identité d'un citoyen.
    const codeOk: boolean = await ctx.runMutation(
      internal.delegate.mutations.verifyClaimCode,
      {
        delegatedIdentityId: args.delegatedIdentityId,
        claimCode: args.claimCode,
      },
    )
    if (!codeOk) {
      // Message unique : ne pas révéler si l'échec vient du code, d'une
      // identité déjà réclamée, d'un verrouillage ou d'un id inexistant.
      throw new ConvexError({
        code: "CLAIM_REJECTED",
        message: "Code de réclamation invalide ou identité non réclamable.",
      })
    }

    const delegation: {
      targetUserId: string
      targetProfileId: string
      status: "created" | "claimed"
    } | null = await ctx.runQuery(
      internal.delegate.queries.getClaimInfo,
      { id: args.delegatedIdentityId },
    )
    if (!delegation) {
      throw new ConvexError({
        code: "CLAIM_REJECTED",
        message: "Code de réclamation invalide ou identité non réclamable.",
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

    // Ouvrir une session BA avec le password initial pour pouvoir le changer.
    // Ce password est DÉRIVÉ (clé d'env + email) pour toute identité créée
    // depuis le correctif. Repli sur l'ancien secret stocké pour les identités
    // héritées, dont le password était un aléa non reproductible — sinon le
    // correctif les rendrait définitivement non réclamables.
    const legacySecret: string | null = await ctx.runQuery(
      internal.delegate.queries.getLegacyInitialSecret,
      { id: args.delegatedIdentityId },
    )
    const initialPassword =
      legacySecret ?? (await deriveInitialPassword(baUser.email))
    try {
      const signInResult = await auth.api.signInEmail({
        body: { email: baUser.email, password: initialPassword },
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
            currentPassword: initialPassword,
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
