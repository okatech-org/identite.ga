import { ConvexError, v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { internal } from "./_generated/api"
import {
  getCurrentAuthUser,
  requireAuth,
  requireController,
} from "./lib/auth"
import { rateLimiter } from "./rateLimiter"
import { PROFILE_TYPES } from "./schema"

/**
 * Présentation d'identité — QR éphémère affiché par le citoyen
 * sur `apps/mobile/src/app/id-card.tsx`.
 *
 * Le QR contient un token signé HMAC-SHA256 valide 30 s qu'un
 * contrôleur d'identité peut scanner pour vérifier le pivot (idnId,
 * nom, prénom, dob, LoA, profileType). L'app mobile renouvelle le
 * token automatiquement avant expiration.
 *
 * Format du token :
 *   `idn:p1:<payload_b64url>.<signature_b64url>`
 * où `payload_b64url` est l'encodage base64url-sans-padding de
 *   { v, uid, idn, fn, ln, dob, pt, loa, iat, exp }  (clés courtes pour
 * garder le QR dense lisible). Les clés sont volontairement abrégées
 * pour réduire la densité du QR — la vérification côté contrôleur
 * doit utiliser la même structure.
 *
 * Sécurité :
 *   • Clé HMAC partagée via `PRESENTATION_HMAC_KEY` (env Convex). Si
 *     absente, mintToken throw — pas de fallback silencieux (Rule 12).
 *   • Signature et `exp` doivent tous les deux être vérifiés côté
 *     contrôleur (la signature seule ne prouve pas la fraîcheur).
 *   • Chaque mint génère un événement `presentation_minted` dans
 *     `auditLog` (cf. apps/mobile/src/app/activity.tsx).
 */

const TOKEN_TTL_MS = 30_000
const TOKEN_PREFIX = "idn:p1:"

function base64urlEncode(bytes: Uint8Array): string {
  let s = ""
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")
}

function base64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4))
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function importHmacKey(usage: "sign" | "verify"): Promise<CryptoKey> {
  const key = process.env.PRESENTATION_HMAC_KEY
  if (!key) {
    throw new ConvexError({
      code: "CONFIG_MISSING",
      message:
        "PRESENTATION_HMAC_KEY non configurée. " +
        "Lancer : bunx convex env set PRESENTATION_HMAC_KEY \"$(openssl rand -hex 32)\"",
    })
  }
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  )
}

async function signPayload(payload: string): Promise<string> {
  const cryptoKey = await importHmacKey("sign")
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    new TextEncoder().encode(payload),
  )
  return base64urlEncode(new Uint8Array(sig))
}

export const getCurrentPresentation = query({
  args: {},
  returns: v.union(
    v.object({
      idnId: v.string(),
      firstName: v.string(),
      lastName: v.string(),
      dateOfBirth: v.string(),
      profileType: v.union(...PROFILE_TYPES.map((t) => v.literal(t))),
      loa: v.union(v.literal(1), v.literal(2), v.literal(3)),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const auth = await getCurrentAuthUser(ctx)
    if (!auth) return null

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", auth.userId))
      .unique()
    if (!profile || !profile.idnId || !profile.pivot) return null

    return {
      idnId: profile.idnId,
      firstName: profile.pivot.firstName,
      lastName: profile.pivot.lastName,
      dateOfBirth: profile.pivot.dateOfBirth,
      profileType: profile.profileType,
      loa: profile.loa,
    }
  },
})

export const mintToken = mutation({
  args: {},
  returns: v.object({
    token: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    await rateLimiter.limit(ctx, "presentationMint", {
      key: user.userId,
      throws: true,
    })

    const profile = await ctx.db
      .query("userProfile")
      .withIndex("by_userId", (q) => q.eq("userId", user.userId))
      .unique()
    if (!profile) {
      throw new ConvexError({
        code: "PROFILE_NOT_FOUND",
        message: "Profil introuvable.",
      })
    }
    if (!profile.idnId || !profile.pivot) {
      throw new ConvexError({
        code: "PROFILE_INCOMPLETE",
        message: "Complétez votre identité avant de présenter votre QR.",
      })
    }

    const now = Date.now()
    const exp = now + TOKEN_TTL_MS

    const payload = {
      v: 1 as const,
      uid: user.userId,
      idn: profile.idnId,
      fn: profile.pivot.firstName,
      ln: profile.pivot.lastName,
      dob: profile.pivot.dateOfBirth,
      pt: profile.profileType,
      loa: profile.loa,
      iat: now,
      exp,
    }

    const payloadEncoded = base64urlEncode(
      new TextEncoder().encode(JSON.stringify(payload)),
    )
    const sig = await signPayload(payloadEncoded)
    const token = `${TOKEN_PREFIX}${payloadEncoded}.${sig}`

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "presentation_minted",
      targetType: "user",
      targetId: user.userId,
      metadata: { idnId: profile.idnId, exp },
    })

    return { token, expiresAt: exp }
  },
})

/**
 * Vérifie un token de présentation scanné par un contrôleur d'identité.
 *
 * Étapes :
 *   1. RBAC — réservé au rôle `identity_controller`.
 *   2. Parse le format `idn:p1:<payload>.<sig>`.
 *   3. Vérifie la signature HMAC-SHA256 (constant-time via subtle.verify).
 *   4. Vérifie `exp > now`.
 *   5. Audit `identity_check_performed` (cible = le citoyen scanné).
 *
 * Retourne le pivot vérifié pour affichage côté contrôleur.
 * `location` est optionnel et stocké dans l'audit metadata pour le
 * journal des contrôles (cf. controller/history.ts).
 */
export const verifyToken = mutation({
  args: {
    token: v.string(),
    location: v.optional(v.string()),
  },
  returns: v.object({
    idnId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    profileType: v.union(...PROFILE_TYPES.map((t) => v.literal(t))),
    loa: v.union(v.literal(1), v.literal(2), v.literal(3)),
    issuedAt: v.number(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const controller = await requireController(ctx)
    await rateLimiter.limit(ctx, "presentationVerify", {
      key: controller.userId,
      throws: true,
    })

    if (!args.token.startsWith(TOKEN_PREFIX)) {
      throw new ConvexError({
        code: "INVALID_TOKEN_FORMAT",
        message: "Ce QR n'est pas un token de présentation IDN.",
      })
    }
    const body = args.token.slice(TOKEN_PREFIX.length)
    const dot = body.lastIndexOf(".")
    if (dot < 0) {
      throw new ConvexError({
        code: "INVALID_TOKEN_FORMAT",
        message: "Token malformé.",
      })
    }
    const payloadEncoded = body.slice(0, dot)
    const sigEncoded = body.slice(dot + 1)

    const cryptoKey = await importHmacKey("verify")
    const ok = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      base64urlDecode(sigEncoded),
      new TextEncoder().encode(payloadEncoded),
    )
    if (!ok) {
      throw new ConvexError({
        code: "INVALID_SIGNATURE",
        message: "Signature invalide — token non émis par IDN.",
      })
    }

    let payload: unknown
    try {
      payload = JSON.parse(
        new TextDecoder().decode(base64urlDecode(payloadEncoded)),
      )
    } catch {
      throw new ConvexError({
        code: "INVALID_PAYLOAD",
        message: "Payload illisible.",
      })
    }
    if (
      !payload ||
      typeof payload !== "object" ||
      (payload as { v?: unknown }).v !== 1
    ) {
      throw new ConvexError({
        code: "INVALID_PAYLOAD",
        message: "Version de token non supportée.",
      })
    }
    const p = payload as {
      v: 1
      uid: string
      idn: string
      fn: string
      ln: string
      dob: string
      pt: (typeof PROFILE_TYPES)[number]
      loa: 1 | 2 | 3
      iat: number
      exp: number
    }

    const now = Date.now()
    if (typeof p.exp !== "number" || p.exp <= now) {
      throw new ConvexError({
        code: "TOKEN_EXPIRED",
        message: "Ce QR a expiré, demandez au citoyen de le rafraîchir.",
      })
    }

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: controller.userId,
      action: "identity_check_performed",
      targetType: "user",
      targetId: p.uid,
      metadata: {
        idnId: p.idn,
        loa: p.loa,
        ...(args.location ? { location: args.location } : {}),
      },
    })

    // Transparence (cf. mockup scan.result.notice) — le citoyen est
    // notifié in-app à chaque contrôle terrain de son identité.
    // Catégorie `security` : un tiers a accédé au pivot identitaire.
    await ctx.runMutation(internal.notifications.dispatch, {
      userId: p.uid,
      category: "security",
      title: "Identité vérifiée par un contrôleur",
      body: args.location
        ? `Votre identité a été présentée à un contrôleur à ${args.location}. Détail dans votre journal d'activité.`
        : "Votre identité a été présentée à un contrôleur. Détail dans votre journal d'activité.",
      metadata: {
        idnId: p.idn,
        loa: p.loa,
        ...(args.location ? { location: args.location } : {}),
      },
    })

    return {
      idnId: p.idn,
      firstName: p.fn,
      lastName: p.ln,
      dateOfBirth: p.dob,
      profileType: p.pt,
      loa: p.loa,
      issuedAt: p.iat,
      expiresAt: p.exp,
    }
  },
})
