"use node"

import { AccessToken } from "livekit-server-sdk"
import { v } from "convex/values"

import { internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"
import { action, type ActionCtx } from "../_generated/server"

type JoinContext = {
  roomName: string
  participantIdentity: string
  participantName: string
  role: "citizen" | "controller"
}

type JoinCredentials = {
  serverUrl: string
  token: string
  roomName: string
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`[level3/livekit] ${name} non configuré`)
  return value
}

/** Émet un jeton court, limité à la salle et au participant authentifié. */
export const issueJoinToken = action({
  args: { verificationId: v.id("level3Verification") },
  returns: v.object({
    serverUrl: v.string(),
    token: v.string(),
    roomName: v.string(),
  }),
  handler: async (
    ctx: ActionCtx,
    args: { verificationId: Id<"level3Verification"> },
  ): Promise<JoinCredentials> => {
    const context: JoinContext = await ctx.runQuery(internal.level3._getJoinContext, args)
    const serverUrl = requireEnv("LIVEKIT_URL")
    const apiKey = requireEnv("LIVEKIT_API_KEY")
    const apiSecret = requireEnv("LIVEKIT_API_SECRET")
    if (!serverUrl.startsWith("wss://") && !serverUrl.startsWith("ws://localhost")) {
      throw new Error("[level3/livekit] LIVEKIT_URL doit utiliser WSS")
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: context.participantIdentity,
      name: context.participantName,
      ttl: "15m",
      metadata: JSON.stringify({
        verificationId: args.verificationId,
        role: context.role,
      }),
    })
    accessToken.addGrant({
      room: context.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })
    return {
      serverUrl,
      token: await accessToken.toJwt(),
      roomName: context.roomName,
    }
  },
})
