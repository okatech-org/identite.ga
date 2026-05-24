import { ConvexError, v } from "convex/values"

import { components, internal } from "../_generated/api"
import type { MutationCtx } from "../_generated/server"
import { mutation, query } from "../_generated/server"
import { requireAdmin } from "../lib/auth"

/**
 * Gestion des applications OAuth (§3.9 onglet "Applications OAuth").
 *
 * La table `oauthApplication` vit dans le composant Better Auth. Champs
 * intéressants : clientId, name, redirectUrls (string CSV), disabled,
 * userId (propriétaire), metadata (string JSON), createdAt/updatedAt.
 *
 * Convention pour les attributs métier IDN, encodés dans `metadata` (JSON) :
 *   { status: "production" | "pending" | "sandbox", loa: 1|2|3, scopes: "csv,list" }
 *
 * `disabled=true` prend toujours le dessus côté affichage ("désactivée").
 */

const STATUS = v.union(
  v.literal("production"),
  v.literal("pending"),
  v.literal("sandbox"),
  v.literal("disabled"),
)
const LOA = v.union(v.literal(1), v.literal(2), v.literal(3))

type AppMeta = {
  status?: "production" | "pending" | "sandbox"
  // Tolérance ascendante : on rencontre aussi `env` ("sandbox" / "production")
  // depuis le seed apps/developer. On y lit le statut s'il manque.
  env?: string
  loa?: 1 | 2 | 3
  // Côté UI on stocke en CSV ; côté legacy on rencontre des tableaux.
  scopes?: string | string[]
  // Sandbox → prod : liaison réciproque + état de la demande (sandbox side).
  linkedClientId?: string
  productionStatus?: "none" | "pending" | "approved" | "rejected"
  // Toutes les autres clés (description, services, testUsers, createdBy…)
  // sont conservées telles quelles lors des updates partiels.
  [key: string]: unknown
}

function parseMeta(raw: string | null | undefined): AppMeta {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as AppMeta
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function parseRedirects(raw: string | null | undefined): string {
  if (!raw) return ""
  // Better Auth stocke parfois en JSON `["https://...", "..."]`.
  if (raw.startsWith("[")) {
    try {
      const arr = JSON.parse(raw) as unknown
      if (Array.isArray(arr)) return arr.filter(Boolean).join(", ")
    } catch {
      // pas de souci, on retombe sur la chaîne brute
    }
  }
  return raw
}

function scopesToList(scopes: AppMeta["scopes"]): string[] {
  if (!scopes) return []
  if (Array.isArray(scopes)) return scopes.map((s) => String(s).trim()).filter(Boolean)
  return scopes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

type RawApp = {
  _id?: string
  clientId?: string | null
  name?: string | null
  redirectUrls?: string | null
  disabled?: boolean | null
  metadata?: string | null
  createdAt?: number | null
}

function appView(doc: RawApp) {
  const meta = parseMeta(doc.metadata)
  const scopesArr = scopesToList(meta.scopes)
  const envStatus: "production" | "pending" | "sandbox" =
    meta.status ??
    (meta.env === "production" || meta.env === "pending" || meta.env === "sandbox"
      ? (meta.env as "production" | "pending" | "sandbox")
      : "sandbox")
  // Une jumelle prod en attente est marquée `disabled=true` jusqu'à approbation
  // admin — on garde `status="pending"` pour qu'elle remonte dans le filtre des
  // demandes, sinon `disabled` masquerait l'état.
  const status: "production" | "pending" | "sandbox" | "disabled" =
    doc.disabled === true && envStatus !== "pending" ? "disabled" : envStatus
  return {
    id: String(doc._id ?? ""),
    clientId: doc.clientId ?? "",
    name: doc.name ?? "",
    redirectUrls: parseRedirects(doc.redirectUrls),
    scopes: scopesArr.join(", "),
    scopeCount: scopesArr.length,
    loa: (meta.loa ?? 1) as 1 | 2 | 3,
    status,
    disabled: doc.disabled === true,
    createdAt: doc.createdAt ?? 0,
    linkedClientId: typeof meta.linkedClientId === "string" ? meta.linkedClientId : null,
    productionStatus:
      meta.productionStatus === "pending" ||
      meta.productionStatus === "approved" ||
      meta.productionStatus === "rejected" ||
      meta.productionStatus === "none"
        ? meta.productionStatus
        : "none",
  }
}

const APP_RETURN = v.object({
  id: v.string(),
  clientId: v.string(),
  name: v.string(),
  redirectUrls: v.string(),
  scopes: v.string(),
  scopeCount: v.number(),
  loa: LOA,
  status: STATUS,
  disabled: v.boolean(),
  createdAt: v.number(),
  linkedClientId: v.union(v.string(), v.null()),
  productionStatus: v.union(
    v.literal("none"),
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
  ),
})

export const listApps = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(APP_RETURN),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const limit = Math.min(args.limit ?? 100, 500)
    const page = (await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: "oauthApplication",
        paginationOpts: { cursor: null, numItems: limit },
        sortBy: { field: "createdAt", direction: "desc" },
      },
    )) as { page: RawApp[] }
    return (page.page ?? []).map((d) => appView(d))
  },
})

export const getApp = query({
  args: { clientId: v.string() },
  returns: v.union(APP_RETURN, v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    const doc = (await ctx.runQuery(
      components.betterAuth.adapter.findOne,
      {
        model: "oauthApplication",
        where: [{ field: "clientId", value: args.clientId }],
      },
    )) as RawApp | null
    if (!doc) return null
    return appView(doc)
  },
})

export const createApp = mutation({
  args: {
    name: v.string(),
    redirectUrls: v.string(),
    scopes: v.string(),
    loa: LOA,
  },
  returns: v.object({ clientId: v.string() }),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)
    if (!args.name.trim()) {
      throw new ConvexError({
        code: "INVALID_NAME",
        message: "Le nom de l'application est obligatoire.",
      })
    }
    if (!args.redirectUrls.trim()) {
      throw new ConvexError({
        code: "INVALID_REDIRECTS",
        message: "Au moins une redirect URI est requise.",
      })
    }

    const slug = args.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
    const suffix = Math.random().toString(36).slice(2, 6)
    const clientId = `${slug || "app"}-${suffix}`

    const metadata = JSON.stringify({
      status: "pending" as const,
      loa: args.loa,
      scopes: args.scopes,
    })

    await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: "oauthApplication",
        data: {
          clientId,
          name: args.name.trim(),
          redirectUrls: args.redirectUrls.trim(),
          disabled: false,
          metadata,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "oauth_app_created",
      targetType: "app",
      targetId: clientId,
      metadata: { name: args.name, loa: args.loa },
    })

    return { clientId }
  },
})

async function setStatus(
  ctx: MutationCtx,
  clientId: string,
  status: "production" | "pending" | "sandbox",
  disabled: boolean,
) {
  const doc = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "oauthApplication",
    where: [{ field: "clientId", value: clientId }],
  })) as { _id: string; metadata?: string | null } | null
  if (!doc) {
    throw new ConvexError({
      code: "APP_NOT_FOUND",
      message: "Application introuvable.",
    })
  }
  const meta = parseMeta(doc.metadata)
  const newMeta = JSON.stringify({ ...meta, status })
  await ctx.runMutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: "oauthApplication",
      where: [{ field: "_id", value: doc._id }],
      update: { metadata: newMeta, disabled, updatedAt: Date.now() },
    },
  })
}

export const approveApp = mutation({
  args: { clientId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)
    await setStatus(ctx, args.clientId, "production", false)
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "oauth_app_modified",
      targetType: "app",
      targetId: args.clientId,
      metadata: { status: "production" },
    })
    return null
  },
})

export const disableApp = mutation({
  args: { clientId: v.string(), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)
    await setStatus(ctx, args.clientId, "sandbox", true)
    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "oauth_app_disabled",
      targetType: "app",
      targetId: args.clientId,
      metadata: { reason: args.reason ?? "" },
    })
    return null
  },
})

/**
 * Helper interne : récupère un doc par clientId.
 */
async function findByClientId(
  ctx: MutationCtx,
  clientId: string,
): Promise<{ _id: string; metadata?: string | null } | null> {
  const doc = (await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "oauthApplication",
    where: [{ field: "clientId", value: clientId }],
  })) as { _id: string; metadata?: string | null } | null
  return doc
}

/**
 * Approuve une demande de passage en production déclenchée par un dev via
 * `developer/apps.requestProduction`. L'argument est le `clientId` de la
 * **sandbox** — on remonte à la jumelle prod via `metadata.linkedClientId`,
 * on l'active, puis on flip le `productionStatus` côté sandbox.
 */
export const approveProductionRequest = mutation({
  args: { clientId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)
    const sandbox = await findByClientId(ctx, args.clientId)
    if (!sandbox) {
      throw new ConvexError({
        code: "APP_NOT_FOUND",
        message: "Application sandbox introuvable.",
      })
    }
    const sandboxMeta = parseMeta(sandbox.metadata)
    if (sandboxMeta.productionStatus !== "pending") {
      throw new ConvexError({
        code: "NOT_PENDING",
        message:
          "Cette application n'a pas de demande de production en attente.",
      })
    }
    const prodClientId = sandboxMeta.linkedClientId
    if (typeof prodClientId !== "string" || prodClientId.length === 0) {
      throw new ConvexError({
        code: "MISSING_TWIN",
        message:
          "La jumelle production de cette application est introuvable.",
      })
    }
    const prod = await findByClientId(ctx, prodClientId)
    if (!prod) {
      throw new ConvexError({
        code: "MISSING_TWIN",
        message: "La jumelle production de cette application est introuvable.",
      })
    }
    const prodMeta = parseMeta(prod.metadata)
    const now = Date.now()

    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "oauthApplication",
        where: [{ field: "_id", value: prod._id }],
        update: {
          metadata: JSON.stringify({ ...prodMeta, status: "production" }),
          disabled: false,
          updatedAt: now,
        },
      },
    })
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "oauthApplication",
        where: [{ field: "_id", value: sandbox._id }],
        update: {
          metadata: JSON.stringify({
            ...sandboxMeta,
            productionStatus: "approved",
          }),
          updatedAt: now,
        },
      },
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "oauth_app_modified",
      targetType: "app",
      targetId: prodClientId,
      metadata: { sandboxClientId: args.clientId, status: "production" },
    })
    return null
  },
})

/**
 * Rejette une demande de production : supprime la jumelle prod (créée
 * disabled=true par `requestProduction`), nettoie le lien côté sandbox et
 * marque `productionStatus="rejected"` avec la raison archivée dans l'audit.
 */
export const rejectProductionRequest = mutation({
  args: { clientId: v.string(), reason: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx)
    const sandbox = await findByClientId(ctx, args.clientId)
    if (!sandbox) {
      throw new ConvexError({
        code: "APP_NOT_FOUND",
        message: "Application sandbox introuvable.",
      })
    }
    const sandboxMeta = parseMeta(sandbox.metadata)
    if (sandboxMeta.productionStatus !== "pending") {
      throw new ConvexError({
        code: "NOT_PENDING",
        message:
          "Cette application n'a pas de demande de production en attente.",
      })
    }
    const prodClientId = sandboxMeta.linkedClientId
    const now = Date.now()
    if (typeof prodClientId === "string" && prodClientId.length > 0) {
      const prod = await findByClientId(ctx, prodClientId)
      if (prod) {
        await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
          input: {
            model: "oauthApplication",
            where: [{ field: "_id", value: prod._id }],
          },
        })
      }
    }
    const nextMeta = { ...sandboxMeta }
    delete nextMeta.linkedClientId
    nextMeta.productionStatus = "rejected"
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: "oauthApplication",
        where: [{ field: "_id", value: sandbox._id }],
        update: {
          metadata: JSON.stringify(nextMeta),
          updatedAt: now,
        },
      },
    })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: actor.userId,
      action: "oauth_app_modified",
      targetType: "app",
      targetId: args.clientId,
      metadata: {
        productionStatus: "rejected",
        reason: args.reason ?? "",
      },
    })
    return null
  },
})
