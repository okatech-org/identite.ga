/**
 * Annuaire partenaire — résolution d'identité pour applications relying party.
 *
 * Permet à une application tierce AUTORISÉE (clé API M2M avec scope
 * `citizens:resolve`, cf. developer/apiKeys.ts) de retrouver une identité
 * identité.ga par :
 *   - NIP exact (index `by_nip`)
 *   - alias `@idn.ga` exact (index `iboiteAccount.by_emailAlias`)
 *   - Nom + Prénom (recherche, restreinte aux identités VÉRIFIÉES loa ≥ 2)
 *
 * Renvoie une « carte d'identité » MINIMALE — jamais de données sensibles
 * (date de naissance, photo, KYC). Conçu pour le cas d'usage « ajouter un
 * agent à une administration » : l'app appelante a déjà l'un des identifiants
 * exacts (NIP / @idn.ga) ou un nom, et a besoin de lier l'agent à son identité
 * souveraine stable (`sub` = subject OIDC) pour le SSO ultérieur.
 *
 * ⚠️ La résolution par Nom n'est ouverte qu'aux identités vérifiées pour
 * limiter l'exposition de PII (un nom seul ne suffit pas à divulguer un
 * citoyen non vérifié).
 */

import { v } from "convex/values"
import { internalQuery } from "../_generated/server"
import type { Doc } from "../_generated/dataModel"

// Carte d'identité minimale renvoyée à l'app partenaire.
const CITIZEN_CARD = v.object({
  // Subject OIDC stable (= userProfile.userId = id Better Auth). Clé de liaison
  // SSO côté relying party (claim `sub` au login).
  sub: v.string(),
  idnId: v.union(v.string(), v.null()), // Identifiant public GA-XXXX-XXXX
  firstName: v.union(v.string(), v.null()),
  lastName: v.union(v.string(), v.null()),
  nip: v.union(v.string(), v.null()),
  emailAlias: v.union(v.string(), v.null()), // alias @idn.ga
  loa: v.number(),
  verified: v.boolean(), // loa >= 2
})

const MAX_RESULTS = 20
// Plafond de balayage pour la recherche par nom (identités vérifiées par niveau).
const NAME_SCAN_CAP = 200

async function emailAliasForUser(
  ctx: { db: any },
  userId: string,
): Promise<string | null> {
  const account = await ctx.db
    .query("iboiteAccount")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .first()
  return account?.emailAlias ?? null
}

function toCard(profile: Doc<"userProfile">, emailAlias: string | null) {
  return {
    sub: profile.userId,
    idnId: profile.idnId ?? null,
    firstName: profile.pivot?.firstName ?? null,
    lastName: profile.pivot?.lastName ?? null,
    nip: profile.pivot?.nip ?? null,
    emailAlias,
    loa: profile.loa,
    verified: profile.loa >= 2,
  }
}

/**
 * Résout 0..N identités selon le critère fourni. Exactement un critère parmi
 * `sub`, `nip`, `emailAlias`, `name` est attendu (ordre de priorité ci-dessous).
 */
export const resolveDirectory = internalQuery({
  args: {
    sub: v.optional(v.string()),
    nip: v.optional(v.string()),
    emailAlias: v.optional(v.string()),
    name: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(CITIZEN_CARD),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 8, 1), MAX_RESULTS)
    const matches: Doc<"userProfile">[] = []

    // 1. Résolution exacte par subject OIDC (re-résolution autoritaire).
    if (args.sub) {
      const profile = await ctx.db
        .query("userProfile")
        .withIndex("by_userId", (q) => q.eq("userId", args.sub!))
        .first()
      if (profile && !profile.deletedAt) matches.push(profile)
    }
    // 2. Résolution exacte par alias @idn.ga.
    else if (args.emailAlias) {
      const alias = args.emailAlias.trim().toLowerCase()
      const account = await ctx.db
        .query("iboiteAccount")
        .withIndex("by_emailAlias", (q) => q.eq("emailAlias", alias))
        .first()
      if (account) {
        const profile = await ctx.db
          .query("userProfile")
          .withIndex("by_userId", (q) => q.eq("userId", account.userId))
          .first()
        if (profile && !profile.deletedAt) matches.push(profile)
      }
    }
    // 3. Résolution exacte par NIP.
    else if (args.nip) {
      const nip = args.nip.trim()
      const profiles = await ctx.db
        .query("userProfile")
        .withIndex("by_nip", (q) => q.eq("pivot.nip", nip))
        .take(limit)
      for (const p of profiles) if (!p.deletedAt) matches.push(p)
    }
    // 4. Recherche par Nom + Prénom — VÉRIFIÉES uniquement (loa 2 puis 3).
    else if (args.name) {
      const tokens = args.name.toLowerCase().split(/\s+/).filter(Boolean)
      if (tokens.length > 0) {
        for (const lvl of [2, 3] as const) {
          if (matches.length >= limit) break
          const profiles = await ctx.db
            .query("userProfile")
            .withIndex("by_loa", (q) => q.eq("loa", lvl))
            .take(NAME_SCAN_CAP)
          for (const p of profiles) {
            if (p.deletedAt) continue
            const full = `${p.pivot?.firstName ?? ""} ${p.pivot?.lastName ?? ""}`
              .toLowerCase()
              .trim()
            if (full && tokens.every((tok) => full.includes(tok))) {
              matches.push(p)
              if (matches.length >= limit) break
            }
          }
        }
      }
    }

    const sliced = matches.slice(0, limit)
    return await Promise.all(
      sliced.map(async (p) => toCard(p, await emailAliasForUser(ctx, p.userId))),
    )
  },
})
