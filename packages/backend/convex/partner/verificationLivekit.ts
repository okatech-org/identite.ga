"use node";

import { AccessToken } from "livekit-server-sdk";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction, type ActionCtx } from "../_generated/server";
import { ensureLiveKitReadyForToken } from "../level3/infrastructure";

/**
 * Jeton LiveKit pour un agent d'administration.ga.
 *
 * L'agent rejoint la MÊME salle que le citoyen (`idn-l3-<id>`), signée par la
 * même paire de clés : c'est ce qui lui permet de mener l'entretien depuis sa
 * propre plateforme, sans ouvrir la console contrôleur d'identite.ga. Le
 * citoyen, lui, ne change rien à ses habitudes.
 *
 * L'autorisation est décidée côté données (`partner/verifications.getJoinContext`) :
 * la demande doit être prise en charge PAR CET AGENT et la fenêtre du
 * rendez-vous ouverte. Le scope M2M autorise à demander un jeton, il ne
 * désigne pas quel entretien.
 */

type JoinCredentials = {
  serverUrl: string;
  token: string;
  roomName: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[partner/livekit] ${name} non configuré`);
  return value;
}

export const issueAgentJoinToken = internalAction({
  args: {
    verificationId: v.id("level3Verification"),
    agentSub: v.string(),
  },
  returns: v.object({
    serverUrl: v.string(),
    token: v.string(),
    roomName: v.string(),
  }),
  handler: async (ctx: ActionCtx, args): Promise<JoinCredentials> => {
    const context = await ctx.runQuery(
      internal.partner.verifications.getJoinContext,
      args,
    );
    await ensureLiveKitReadyForToken(ctx);

    const serverUrl = requireEnv("LIVEKIT_URL");
    const apiKey = requireEnv("LIVEKIT_API_KEY");
    const apiSecret = requireEnv("LIVEKIT_API_SECRET");
    if (
      !serverUrl.startsWith("wss://") &&
      !serverUrl.startsWith("ws://localhost")
    ) {
      throw new Error("[partner/livekit] LIVEKIT_URL doit utiliser WSS");
    }

    const accessToken = new AccessToken(apiKey, apiSecret, {
      identity: context.participantIdentity,
      name: context.participantName,
      // TTL court, comme pour le citoyen : un jeton qui traîne dans les logs
      // du partenaire cesse d'être exploitable en quinze minutes.
      ttl: "15m",
      metadata: JSON.stringify({
        verificationId: args.verificationId,
        role: "controller",
        via: "partner",
      }),
    });
    accessToken.addGrant({
      room: context.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return {
      serverUrl,
      token: await accessToken.toJwt(),
      roomName: context.roomName,
    };
  },
});
