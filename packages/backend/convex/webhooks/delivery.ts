"use node"

import { lookup } from "node:dns/promises"
import { request as httpsRequest } from "node:https"
import type { LookupAddress } from "node:dns"
import { randomBytes, randomUUID } from "node:crypto"
import { isIP } from "node:net"
import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalAction } from "../_generated/server"
import {
  isWebhookDeliveryAuthorized,
  loadAuthorizedWebhookApp,
} from "./authorization"
import { decryptWebhookSecret, signWebhookDelivery } from "./crypto"
import { parseRetryAfterMs } from "./policy"
import { isForbiddenIp, validateWebhookUrl } from "./urlSafety"

type HttpResult = { status: number; retryAfter?: string; body: string }

async function resolveSafeAddress(hostname: string): Promise<LookupAddress> {
  const addresses = await lookup(hostname, { all: true, verbatim: true })
  if (addresses.length === 0) throw new Error("DNS_NO_ADDRESS")
  if (addresses.some((entry) => isForbiddenIp(entry.address))) {
    throw new Error("SSRF_ADDRESS_FORBIDDEN")
  }
  return addresses[0]!
}

export async function postPinned(
  rawUrl: string,
  headers: Record<string, string>,
  body: string,
): Promise<HttpResult> {
  const safe = validateWebhookUrl(rawUrl, "production")
  if (!safe.ok) throw new Error(safe.code)
  const url = new URL(safe.url)
  const hostname = url.hostname.replace(/^\[|\]$/g, "")
  const address = await resolveSafeAddress(hostname)
  return await new Promise<HttpResult>((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>
    const request = httpsRequest(
      {
        protocol: "https:",
        // Connexion directe à l'adresse validée : Node ne relance aucun DNS
        // entre notre contrôle SSRF et l'ouverture de la socket.
        hostname: address.address,
        servername: isIP(hostname) ? undefined : hostname,
        port: 443,
        method: "POST",
        path: `${url.pathname}${url.search}`,
        headers: {
          Host: url.host,
          ...headers,
          "Content-Length": String(Buffer.byteLength(body)),
        },
        agent: false,
      },
      (response) => {
        const chunks: Buffer[] = []
        let size = 0
        response.on("data", (chunk: Buffer) => {
          size += chunk.length
          if (size <= 64 * 1024) chunks.push(chunk)
        })
        response.on("end", () => {
          clearTimeout(timeout)
          resolve({
            status: response.statusCode ?? 0,
            retryAfter:
              typeof response.headers["retry-after"] === "string"
                ? response.headers["retry-after"]
                : undefined,
            body: Buffer.concat(chunks).toString("utf8"),
          })
        })
        response.on("error", (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      },
    )
    timeout = setTimeout(() => request.destroy(new Error("TIMEOUT")), 10_000)
    request.on("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    request.end(body)
  })
}

export const attemptDelivery = internalAction({
  args: { deliveryId: v.id("webhookDeliveries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const delivery = await ctx.runMutation(
      internal.webhooks.deliveryState.claim,
      args,
    )
    if (!delivery) return null
    if (
      !(await isWebhookDeliveryAuthorized(
        ctx,
        delivery.event,
        delivery.endpoint,
      ))
    ) {
      await ctx.runMutation(internal.webhooks.deliveryState.finish, {
        deliveryId: delivery.deliveryId,
        outcome: "canceled",
        errorCode: "NOT_AUTHORIZED",
      })
      return null
    }
    try {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const secret = await decryptWebhookSecret(
        delivery.endpoint.secretCiphertext,
        delivery.endpoint.secretIv,
      )
      const signatures = [
        await signWebhookDelivery(
          secret,
          timestamp,
          delivery.event.payloadJson,
        ),
      ]
      if (
        delivery.endpoint.previousSecretCiphertext &&
        delivery.endpoint.previousSecretIv &&
        (delivery.endpoint.previousSecretValidUntil ?? 0) > Date.now()
      ) {
        const previous = await decryptWebhookSecret(
          delivery.endpoint.previousSecretCiphertext,
          delivery.endpoint.previousSecretIv,
        )
        signatures.push(
          await signWebhookDelivery(
            previous,
            timestamp,
            delivery.event.payloadJson,
          ),
        )
      }
      const response = await postPinned(
        delivery.endpoint.url,
        {
          "Content-Type": "application/json",
          "User-Agent": "IDN-Webhooks/1.0",
          "X-IDN-Event-Id": delivery.event.eventId,
          "X-IDN-Event-Type": delivery.event.type,
          "X-IDN-Timestamp": timestamp,
          "X-IDN-Signature": signatures.join(", "),
        },
        delivery.event.payloadJson,
      )
      await ctx.runMutation(internal.webhooks.deliveryState.finish, {
        deliveryId: delivery.deliveryId,
        outcome:
          response.status >= 200 && response.status < 300
            ? "success"
            : "failure",
        httpStatus: response.status,
        errorCode:
          response.status >= 200 && response.status < 300
            ? undefined
            : `HTTP_${response.status}`,
        retryAfterMs:
          response.status === 429
            ? parseRetryAfterMs(response.retryAfter, Date.now())
            : undefined,
      })
    } catch (error) {
      await ctx.runMutation(internal.webhooks.deliveryState.finish, {
        deliveryId: delivery.deliveryId,
        outcome: "failure",
        errorCode:
          error instanceof Error
            ? error.message.slice(0, 120)
            : "NETWORK_ERROR",
      })
    }
    return null
  },
})

export const verifyChallenge = internalAction({
  args: {
    endpointId: v.id("webhookEndpoints"),
    challengeId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const endpoint = await ctx.runQuery(
      internal.webhooks.deliveryState.challengeData,
      args,
    )
    if (!endpoint) return null
    const application = await loadAuthorizedWebhookApp(ctx, {
      appClientId: endpoint.clientId,
      environment: endpoint.environment,
      status: endpoint.status,
    })
    if (!application) {
      await ctx.runMutation(internal.webhooks.deliveryState.completeChallenge, {
        endpointId: endpoint.id,
        challengeId: args.challengeId,
        success: false,
        errorCode: "APP_INACTIVE",
      })
      return null
    }
    const challenge = randomBytes(32).toString("base64url")
    const createdAt = Date.now()
    const eventId = `evt_${randomUUID().replaceAll("-", "")}`
    const body = JSON.stringify({
      id: eventId,
      type: "webhook.endpoint.verification",
      apiVersion: "1",
      createdAt,
      subject: endpoint.clientId,
      data: { challenge },
    })
    try {
      const timestamp = Math.floor(createdAt / 1000).toString()
      const secret = await decryptWebhookSecret(
        endpoint.secretCiphertext,
        endpoint.secretIv,
      )
      const signatures = [await signWebhookDelivery(secret, timestamp, body)]
      if (
        endpoint.previousSecretCiphertext &&
        endpoint.previousSecretIv &&
        (endpoint.previousSecretValidUntil ?? 0) > Date.now()
      ) {
        const previous = await decryptWebhookSecret(
          endpoint.previousSecretCiphertext,
          endpoint.previousSecretIv,
        )
        signatures.push(await signWebhookDelivery(previous, timestamp, body))
      }
      const response = await postPinned(
        endpoint.url,
        {
          "Content-Type": "application/json",
          "User-Agent": "IDN-Webhooks/1.0",
          "X-IDN-Event-Id": eventId,
          "X-IDN-Event-Type": "webhook.endpoint.verification",
          "X-IDN-Timestamp": timestamp,
          "X-IDN-Signature": signatures.join(", "),
        },
        body,
      )
      let returned = response.body.trim()
      try {
        const parsed = JSON.parse(returned) as { challenge?: unknown }
        if (typeof parsed.challenge === "string") returned = parsed.challenge
      } catch {
        // Une réponse texte brute est aussi acceptée.
      }
      await ctx.runMutation(internal.webhooks.deliveryState.completeChallenge, {
        endpointId: endpoint.id,
        challengeId: args.challengeId,
        success:
          response.status >= 200 &&
          response.status < 300 &&
          returned === challenge,
        errorCode:
          response.status >= 200 && response.status < 300
            ? "CHALLENGE_MISMATCH"
            : `HTTP_${response.status}`,
      })
    } catch (error) {
      await ctx.runMutation(internal.webhooks.deliveryState.completeChallenge, {
        endpointId: endpoint.id,
        challengeId: args.challengeId,
        success: false,
        errorCode:
          error instanceof Error
            ? error.message.slice(0, 120)
            : "CHALLENGE_FAILED",
      })
    }
    return null
  },
})
