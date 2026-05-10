import { ConvexError, v } from "convex/values"

import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { authComponent, createAuth } from "./auth"
import { getCurrentAuthUser, requireAuth } from "./lib/auth"

/**
 * Sessions utilisateur (§3.4 — Paramètres / Appareils & sessions).
 *
 * Better Auth gère la persistance des sessions dans son composant isolé
 * (table `session`). On expose ici des wrappers qui :
 *   - lisent les sessions actives via `auth.api.listSessions`
 *   - identifient la session courante via le token d'auth en cours
 *   - révoquent une session ou toutes-sauf-courante (`auth.api.revoke*`)
 *   - écrivent un audit trail à chaque révocation
 */

type SessionDoc = {
  id: string
  token: string
  userId: string
  ipAddress?: string | null
  userAgent?: string | null
  createdAt: Date | number
  expiresAt: Date | number
}

function tsOf(value: Date | number | undefined | null): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  return value
}

/**
 * Parser UA → libellé "Device · Browser" lisible (best-effort).
 */
function describeUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Appareil inconnu"
  const isiPhone = /iPhone/i.test(ua)
  const isiPad = /iPad/i.test(ua)
  const isMac = /Macintosh/i.test(ua)
  const isAndroid = /Android/i.test(ua)
  const isWindows = /Windows/i.test(ua)
  const isLinux = /Linux/i.test(ua) && !isAndroid

  let device = "Appareil"
  if (isiPhone) device = "iPhone"
  else if (isiPad) device = "iPad"
  else if (isMac) device = "MacBook"
  else if (isAndroid) device = "Android"
  else if (isWindows) device = "Windows"
  else if (isLinux) device = "Linux"

  let browser = "Navigateur"
  if (/Edg\//.test(ua)) browser = "Edge"
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome"
  else if (/Firefox\//.test(ua)) browser = "Firefox"
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari"

  return `${device} · ${browser}`
}

export const listMine = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      device: v.string(),
      ipAddress: v.union(v.string(), v.null()),
      userAgent: v.union(v.string(), v.null()),
      createdAt: v.number(),
      expiresAt: v.number(),
      isCurrent: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    // Lecture gracieuse : si la session client n'est pas encore prête (premier
    // render ConvexBetterAuthProvider), on renvoie [] au lieu de throw — le
    // client recevra la liste réelle dès que le JWT sera disponible.
    const auth0 = await getCurrentAuthUser(ctx)
    if (!auth0) return []

    let result: { auth: ReturnType<typeof createAuth>; headers: Headers }
    try {
      result = await authComponent.getAuth(createAuth, ctx)
    } catch {
      return []
    }
    const { auth, headers } = result

    let sessions: SessionDoc[] = []
    let currentToken: string | null = null
    try {
      const list = (await auth.api.listSessions({ headers })) as SessionDoc[]
      sessions = list ?? []
      // Identifie la session courante via le bearer token contenu dans headers
      const authHeader = headers.get("authorization") ?? ""
      const match = authHeader.match(/^Bearer\s+(.+)$/i)
      currentToken = match?.[1] ?? null
    } catch {
      return []
    }

    return sessions
      .map((s) => ({
        id: s.id,
        device: describeUserAgent(s.userAgent ?? null),
        ipAddress: s.ipAddress ?? null,
        userAgent: s.userAgent ?? null,
        createdAt: tsOf(s.createdAt),
        expiresAt: tsOf(s.expiresAt),
        isCurrent: currentToken !== null && s.token === currentToken,
      }))
      .sort((a, b) => {
        if (a.isCurrent && !b.isCurrent) return -1
        if (!a.isCurrent && b.isCurrent) return 1
        return b.createdAt - a.createdAt
      })
  },
})

export const revoke = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx)
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    const sessions = (await auth.api.listSessions({ headers })) as SessionDoc[]
    const target = sessions?.find((s) => s.id === args.sessionId)
    if (!target) {
      throw new ConvexError({
        code: "SESSION_NOT_FOUND",
        message: "Session introuvable.",
      })
    }
    if (target.userId !== user.userId) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Cette session ne vous appartient pas.",
      })
    }

    const authHeader = headers.get("authorization") ?? ""
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    const currentToken = match?.[1] ?? null
    if (currentToken && target.token === currentToken) {
      throw new ConvexError({
        code: "CANNOT_REVOKE_CURRENT",
        message: "Utilisez la déconnexion pour fermer la session courante.",
      })
    }

    await auth.api.revokeSession({ body: { token: target.token }, headers })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "session_revoked",
      targetType: "session",
      targetId: args.sessionId,
      metadata: { device: describeUserAgent(target.userAgent ?? null) },
    })

    return null
  },
})

export const revokeAllOthers = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx)
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx)

    await auth.api.revokeOtherSessions({ headers })

    await ctx.runMutation(internal.audit.recordAudit, {
      actorId: user.userId,
      action: "session_revoked_global",
      targetType: "session",
      targetId: user.userId,
    })

    return null
  },
})
