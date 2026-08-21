import { v } from "convex/values"

import { components } from "../_generated/api"
import { query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import { normalizeIdentityKey } from "../lib/identity"

/**
 * Inventaire des comptes en double — même nom, même prénom, même date de
 * naissance.
 *
 * Rien n'empêche aujourd'hui un citoyen de s'inscrire plusieurs fois :
 * `onboarding.completeSignup` ne vérifie que l'unicité du `userId`. Cette
 * vue expose le résultat pour arbitrage manuel ; elle ne décide rien.
 *
 * On parcourt l'index `by_pivot_dob`, qui trie par date de naissance : les
 * candidats d'un même groupe y sont adjacents. On peut donc n'accumuler
 * qu'une fenêtre de travail par date plutôt qu'une table de hachage sur
 * toute la population.
 *
 * Comptes sans pivot (LoA 1, identité jamais complétée) : invisibles ici,
 * il n'y a rien à comparer. Un même individu peut donc détenir plusieurs
 * comptes LoA 1 sans que ce rapport ne les signale.
 */

/**
 * Plafond de balayage. Même raisonnement que `admin/users.ts:SCAN_LIMIT` :
 * tient sous la limite Convex de 16 384 documents lus par query, et devra
 * céder la place à un champ `pivotKey` indexé au-delà de quelques milliers
 * de comptes. `truncated` dit à l'UI que le rapport est partiel.
 */
const SCAN_LIMIT = 2000

const DUPLICATE_ACCOUNT = v.object({
  userId: v.string(),
  profileId: v.id("userProfile"),
  idnId: v.optional(v.string()),
  email: v.string(),
  loa: v.number(),
  profileType: v.string(),
  hasPivot: v.boolean(),
  hasKyc: v.boolean(),
  createdAt: v.number(),
})

export const listDuplicateGroups = query({
  args: { limit: v.optional(v.number()) },
  returns: v.object({
    groups: v.array(
      v.object({
        key: v.string(),
        firstName: v.string(),
        lastName: v.string(),
        dateOfBirth: v.string(),
        accounts: v.array(DUPLICATE_ACCOUNT),
      }),
    ),
    scanned: v.number(),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const maxGroups = Math.min(args.limit ?? 100, 500)

    // `pivot.dateOfBirth` absent trie avant toute valeur dans l'index : la
    // borne basse écarte donc les profils sans pivot sans les lire (les
    // dates ISO commencent toutes par un chiffre). Le `if (!p.pivot)`
    // ci-dessous reste le filet de sécurité si l'ordre change.
    const scanned = await ctx.db
      .query("userProfile")
      .withIndex("by_pivot_dob", (q) => q.gte("pivot.dateOfBirth", "0"))
      .take(SCAN_LIMIT)

    const byKey = new Map<
      string,
      {
        firstName: string
        lastName: string
        dateOfBirth: string
        docs: typeof scanned
      }
    >()

    for (const p of scanned) {
      if (p.deletedAt || !p.pivot) continue
      const key = normalizeIdentityKey(
        p.pivot.firstName,
        p.pivot.lastName,
        p.pivot.dateOfBirth,
      )
      const bucket = byKey.get(key)
      if (bucket) {
        bucket.docs.push(p)
      } else {
        byKey.set(key, {
          firstName: p.pivot.firstName,
          lastName: p.pivot.lastName,
          dateOfBirth: p.pivot.dateOfBirth,
          docs: [p],
        })
      }
    }

    const groups = []
    for (const [key, bucket] of byKey) {
      if (bucket.docs.length < 2) continue
      if (groups.length >= maxGroups) break

      // Le plus ancien d'abord : c'est en général celui qu'on conserve,
      // mais c'est l'admin qui tranche — la vue n'en présume rien.
      const ordered = [...bucket.docs].sort((a, b) => a.createdAt - b.createdAt)

      const accounts = []
      for (const d of ordered) {
        const user = (await ctx.runQuery(
          components.betterAuth.adapter.findOne,
          { model: "user", where: [{ field: "_id", value: d.userId }] },
        )) as { email?: string } | null
        const kyc = await ctx.db
          .query("kycRequest")
          .withIndex("by_userId", (q) => q.eq("userId", d.userId))
          .first()
        accounts.push({
          userId: d.userId,
          profileId: d._id,
          idnId: d.idnId,
          email: user?.email ?? "",
          loa: d.loa,
          profileType: d.profileType,
          hasPivot: !!d.pivot,
          hasKyc: kyc !== null,
          createdAt: d.createdAt,
        })
      }

      groups.push({
        key,
        firstName: bucket.firstName,
        lastName: bucket.lastName,
        dateOfBirth: bucket.dateOfBirth,
        accounts,
      })
    }

    return {
      groups,
      scanned: scanned.length,
      truncated: scanned.length === SCAN_LIMIT,
    }
  },
})

/** Nombre de groupes en double — badge sidebar. */
export const duplicateGroupCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const scanned = await ctx.db
      .query("userProfile")
      .withIndex("by_pivot_dob", (q) => q.gte("pivot.dateOfBirth", "0"))
      .take(SCAN_LIMIT)

    const counts = new Map<string, number>()
    for (const p of scanned) {
      if (p.deletedAt || !p.pivot) continue
      const key = normalizeIdentityKey(
        p.pivot.firstName,
        p.pivot.lastName,
        p.pivot.dateOfBirth,
      )
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    let n = 0
    for (const c of counts.values()) if (c > 1) n++
    return n
  },
})
