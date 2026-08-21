import { v } from "convex/values"

import { usersByLoa } from "../aggregates"
import { components } from "../_generated/api"
import { query, type QueryCtx } from "../_generated/server"
import { requireAdmin } from "../lib/auth"
import { normalizeIdentityPart } from "../lib/identity"
import { PROFILE_TYPES } from "../schema"

/**
 * Liste comptes IDN — §3.9 onglet "Comptes IDN".
 * Joint userProfile + Better Auth user pour email & nom.
 */

const PROFILE_TYPE = v.union(...PROFILE_TYPES.map((t) => v.literal(t)))
const LOA = v.union(v.literal(1), v.literal(2), v.literal(3))

/**
 * Plafond de balayage de la table `userProfile`.
 *
 * La console a besoin de connaître la population entière pour deux choses
 * qu'aucun index ne donne : le nombre de pages, et la recherche par nom
 * (pas d'index texte sur le pivot). On lit donc au plus ce nombre de
 * documents — largement sous la limite Convex de 16 384 par query.
 *
 * Au-delà de quelques milliers de comptes, il faudra dénormaliser : un
 * champ `pivotKey` indexé pour la recherche, un rang ou un curseur pour la
 * pagination. Tant que ce seuil n'est pas franchi, `truncated` prévient
 * l'UI que le résultat est partiel plutôt que de mentir en silence.
 */
const SCAN_LIMIT = 2000

const PROFILE_ROW = v.object({
  _id: v.id("userProfile"),
  userId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  idnId: v.optional(v.string()),
  dateOfBirth: v.optional(v.string()),
  profileType: v.string(),
  loa: v.number(),
  hasPivot: v.boolean(),
  deletedAt: v.optional(v.number()),
  createdAt: v.number(),
})

type ProfileDoc = {
  _id: any
  userId: string
  idnId?: string
  pivot?: { firstName: string; lastName: string; dateOfBirth: string }
  profileType: string
  loa: number
  deletedAt?: number
  createdAt: number
}

/**
 * Enrichit un profil avec email + nom depuis Better Auth (le pivot KYC
 * prime sur le `name` Better Auth, généralement égal à l'email).
 */
async function toRow(ctx: QueryCtx, d: ProfileDoc) {
  const user = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "_id", value: d.userId }],
  })) as { email?: string; name?: string } | null
  // Le name Better Auth est généralement set à l'email côté apps/web
  // (sign-up §39). On préfère donc le pivot KYC quand il est dispo.
  const realName = d.pivot
    ? `${d.pivot.firstName} ${d.pivot.lastName}`.trim()
    : undefined
  const isPlaceholderName = !user?.name || user.name === user?.email
  return {
    _id: d._id,
    userId: d.userId,
    email: user?.email ?? "",
    name: realName ?? (isPlaceholderName ? undefined : user?.name),
    idnId: d.idnId,
    dateOfBirth: d.pivot?.dateOfBirth,
    profileType: d.profileType,
    loa: d.loa,
    hasPivot: !!d.pivot,
    deletedAt: d.deletedAt,
    createdAt: d.createdAt,
  }
}

/**
 * Page de comptes IDN, du plus récent au plus ancien.
 *
 * Pagination par NUMÉRO de page, pas par curseur : la console affiche des
 * numéros cliquables et doit pouvoir sauter directement à la page 5, ce
 * qu'un curseur Convex ne permet pas — il n'avance que d'une page à la fois.
 *
 * Savoir combien de pages existent suppose de connaître la population
 * entière, d'où le balayage plafonné. Convex garde la query en cache tant
 * que la table ne bouge pas, donc changer de page ne le refait pas.
 */
export const listProfiles = query({
  args: {
    page: v.number(),
    pageSize: v.number(),
    profileType: v.optional(PROFILE_TYPE),
    loa: v.optional(LOA),
    includeDeleted: v.optional(v.boolean()),
  },
  returns: v.object({
    rows: v.array(PROFILE_ROW),
    page: v.number(),
    pageCount: v.number(),
    total: v.number(),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const pageSize = Math.min(Math.max(Math.trunc(args.pageSize), 1), 100)

    let q
    if (args.profileType) {
      const pt = args.profileType
      q = ctx.db
        .query("userProfile")
        .withIndex("by_profileType", (i) => i.eq("profileType", pt))
    } else if (args.loa) {
      const loa = args.loa
      q = ctx.db
        .query("userProfile")
        .withIndex("by_loa", (i) => i.eq("loa", loa))
    } else {
      q = ctx.db.query("userProfile")
    }

    const scanned = await q.order("desc").take(SCAN_LIMIT)
    // Un compte anonymisé a perdu son pivot à la purge RGPD : plus de nom,
    // plus d'email. Le lister n'apprendrait rien et fausserait le décompte
    // des pages.
    const matching = args.includeDeleted
      ? scanned
      : scanned.filter((d) => d.deletedAt === undefined)

    const pageCount = Math.max(1, Math.ceil(matching.length / pageSize))
    const page = Math.min(Math.max(Math.trunc(args.page), 0), pageCount - 1)
    const slice = matching.slice(page * pageSize, page * pageSize + pageSize)

    return {
      rows: await Promise.all(slice.map((d) => toRow(ctx, d as ProfileDoc))),
      page,
      pageCount,
      total: matching.length,
      truncated: scanned.length === SCAN_LIMIT,
    }
  },
})

/**
 * Nombre total de comptes IDN, en O(log N) via l'agrégat `usersByLoa`
 * (maintenu par les triggers de `functions.ts`). Appelé par la sidebar sur
 * chaque page : un `.collect()` sur toute la table y était un coût fixe
 * croissant.
 *
 * Comme le `.collect().length` qu'il remplace, ce total inclut les comptes
 * soft-deleted — il peut donc dépasser le `total` de `listProfiles`, qui
 * les écarte.
 */
export const totalAccounts = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdmin(ctx)
    return await usersByLoa.count(ctx)
  },
})

/* -------------------------------------------------------------------------- */
/*  Recherche                                                                 */
/* -------------------------------------------------------------------------- */

const IDN_ID_RE = /^GA-[0-9A-Z]{4}-[0-9A-Z]{4}$/i
const NIP_RE = /^\d{14}$/

/**
 * Recherche un compte par email, ID IDN, NIP ou nom.
 *
 * L'aiguillage sur la forme de la saisie évite le balayage quand un index
 * existe — seule la recherche par nom en est réduite à scanner.
 */
export const searchProfiles = query({
  args: { q: v.string(), limit: v.optional(v.number()) },
  returns: v.object({
    results: v.array(PROFILE_ROW),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const raw = args.q.trim()
    if (raw.length < 2) return { results: [], truncated: false }
    const limit = Math.min(args.limit ?? 25, 100)

    /* ---- ID IDN exact ---- */
    if (IDN_ID_RE.test(raw)) {
      const hit = await ctx.db
        .query("userProfile")
        .withIndex("by_idnId", (i) => i.eq("idnId", raw.toUpperCase()))
        .first()
      return {
        results: hit ? [await toRow(ctx, hit as ProfileDoc)] : [],
        truncated: false,
      }
    }

    /* ---- NIP exact ---- */
    if (NIP_RE.test(raw)) {
      const hit = await ctx.db
        .query("userProfile")
        .withIndex("by_nip", (i) => i.eq("pivot.nip", raw))
        .first()
      return {
        results: hit ? [await toRow(ctx, hit as ProfileDoc)] : [],
        truncated: false,
      }
    }

    /* ---- Email (fragment) : résolu côté Better Auth ---- */
    if (raw.includes("@")) {
      // L'adapter Convex de Better Auth ne gère pas `mode: "insensitive"` —
      // il lève une erreur explicite. Better Auth normalise les emails en
      // minuscules à l'écriture, on interroge donc la forme normalisée.
      const users = (await ctx.runQuery(
        components.betterAuth.adapter.findMany,
        {
          model: "user",
          where: [
            { field: "email", value: raw.toLowerCase(), operator: "contains" },
          ],
          paginationOpts: { numItems: limit, cursor: null },
        },
      )) as { page: Array<{ _id: string }> }

      const rows = []
      for (const u of users.page) {
        const profile = await ctx.db
          .query("userProfile")
          .withIndex("by_userId", (i) => i.eq("userId", u._id))
          .unique()
        if (profile && !profile.deletedAt) {
          rows.push(await toRow(ctx, profile as ProfileDoc))
        }
      }
      return { results: rows, truncated: false }
    }

    /* ---- Nom / prénom : balayage plafonné ---- */
    const needle = normalizeIdentityPart(raw)
    const scanned = await ctx.db.query("userProfile").take(SCAN_LIMIT)
    const matches = scanned.filter((p) => {
      if (p.deletedAt || !p.pivot) return false
      const haystack = normalizeIdentityPart(
        `${p.pivot.firstName} ${p.pivot.lastName}`,
      )
      return haystack.includes(needle)
    })

    return {
      results: await Promise.all(
        matches.slice(0, limit).map((p) => toRow(ctx, p as ProfileDoc)),
      ),
      truncated: scanned.length === SCAN_LIMIT,
    }
  },
})
