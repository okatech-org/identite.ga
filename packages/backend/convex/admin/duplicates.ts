import { v } from "convex/values"

import { components } from "../_generated/api"
import { query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"

/**
 * Inventaire des comptes en double — même nom, même prénom, même date de
 * naissance.
 *
 * Vue d'arbitrage : elle expose, elle ne décide rien. La prévention, elle, est
 * en amont — `onboarding.completeSignup` refuse désormais une identité déjà
 * portée par un compte vérifié et signale les collisions déclaratives
 * (cf. `lib/duplicateGuard.ts`). Cet inventaire garde deux usages que la file
 * de signalements (`duplicates/queries.ts`) ne couvre pas : les doublons
 * antérieurs à la mise en place du contrôle, et une relecture exhaustive
 * indépendante de ce qui a été détecté à l'écriture.
 *
 * On parcourt l'index `by_pivotKey`. Les comptes d'un même groupe y sont
 * **adjacents**, ce qui change la nature du balayage : plus besoin d'une table
 * de hachage sur toute la population, un tampon d'un groupe suffit, et surtout
 * on peut s'arrêter dès qu'on a rassemblé assez de groupes — ce qu'un
 * regroupement par date de naissance ne permettait pas.
 *
 * Comptes sans identité pivot (LoA 1 jamais complété) : invisibles ici, il n'y
 * a rien à comparer. Un même individu peut donc détenir plusieurs comptes
 * LoA 1 vides sans que ce rapport ne les signale.
 */

/**
 * Plafond de documents lus par appel. Tient sous la limite Convex de 16 384
 * documents par transaction. Contrairement à la version précédente, ce plafond
 * n'est plus un plafond de *résultats* : le parcours étant trié par clé, on
 * rend `maxGroups` groupes complets bien avant de l'atteindre dès qu'il y a
 * des doublons. Il ne mord que sur une base presque sans doublon — cas où le
 * rapport est de toute façon vide.
 */
const SCAN_LIMIT = 8000
const PAGE_SIZE = 500

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

    type Row = {
      _id: import("../_generated/dataModel").Id<"userProfile">
      userId: string
      idnId?: string
      loa: number
      profileType: string
      createdAt: number
      pivot?: {
        firstName: string
        lastName: string
        dateOfBirth: string
      }
    }

    const groups: {
      key: string
      firstName: string
      lastName: string
      dateOfBirth: string
      docs: Row[]
    }[] = []

    // Tampon du groupe en cours de constitution. Il traverse les frontières de
    // page : un groupe coupé en deux par la pagination doit ressortir entier.
    let currentKey: string | null = null
    let currentDocs: Row[] = []
    let scanned = 0
    let cursor: string | null = null
    let exhausted = false

    const flush = () => {
      if (currentKey && currentDocs.length >= 2) {
        const p = currentDocs[0]!.pivot!
        groups.push({
          key: currentKey,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dateOfBirth,
          docs: [...currentDocs],
        })
      }
      currentKey = null
      currentDocs = []
    }

    while (groups.length < maxGroups && scanned < SCAN_LIMIT) {
      // `undefined` trie avant toute chaîne dans un index Convex : la borne
      // basse écarte les profils sans clé sans les lire.
      const page = await ctx.db
        .query("userProfile")
        .withIndex("by_pivotKey", (q) => q.gte("pivotKey", ""))
        .paginate({ numItems: PAGE_SIZE, cursor })

      for (const p of page.page) {
        scanned++
        if (p.deletedAt || !p.pivot || !p.pivotKey) continue
        if (p.pivotKey !== currentKey) {
          flush()
          currentKey = p.pivotKey
        }
        currentDocs.push(p as Row)
      }

      cursor = page.continueCursor
      if (page.isDone) {
        exhausted = true
        break
      }
    }
    // Le dernier groupe n'est suivi d'aucun changement de clé qui l'émettrait.
    flush()

    const limited = groups.slice(0, maxGroups)

    const out = []
    for (const bucket of limited) {
      // Le plus ancien d'abord : c'est en général celui qu'on conserve, mais
      // c'est l'admin qui tranche — la vue n'en présume rien.
      const ordered = [...bucket.docs].sort((a, b) => a.createdAt - b.createdAt)

      const accounts = []
      for (const d of ordered) {
        const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
          model: "user",
          where: [{ field: "_id", value: d.userId }],
        })) as { email?: string } | null
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
          hasPivot: true,
          hasKyc: kyc !== null,
          createdAt: d.createdAt,
        })
      }

      out.push({
        key: bucket.key,
        firstName: bucket.firstName,
        lastName: bucket.lastName,
        dateOfBirth: bucket.dateOfBirth,
        accounts,
      })
    }

    return {
      groups: out,
      scanned,
      // Le rapport n'est partiel que si l'on s'est arrêté avant la fin de la
      // table sans avoir rempli le quota de groupes demandé.
      truncated: !exhausted && out.length < maxGroups,
    }
  },
})

/** Nombre de groupes en double — badge sidebar. */
export const duplicateGroupCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdmin(ctx)

    let count = 0
    let currentKey: string | null = null
    let currentSize = 0
    let scanned = 0
    let cursor: string | null = null

    while (scanned < SCAN_LIMIT) {
      const page = await ctx.db
        .query("userProfile")
        .withIndex("by_pivotKey", (q) => q.gte("pivotKey", ""))
        .paginate({ numItems: PAGE_SIZE, cursor })

      for (const p of page.page) {
        scanned++
        if (p.deletedAt || !p.pivotKey) continue
        if (p.pivotKey !== currentKey) {
          currentKey = p.pivotKey
          currentSize = 1
        } else {
          currentSize++
          // Compté au passage du deuxième membre : un groupe de cinq comptes
          // reste un doublon, pas quatre.
          if (currentSize === 2) count++
        }
      }

      cursor = page.continueCursor
      if (page.isDone) break
    }
    return count
  },
})
