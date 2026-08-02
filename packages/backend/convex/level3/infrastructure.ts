"use node"

import { GoogleAuth } from "google-auth-library"
import { RoomServiceClient } from "livekit-server-sdk"

import { internal } from "../_generated/api"
import { internalAction, type ActionCtx } from "../_generated/server"
import {
  LIVEKIT_ACTIVE_ROOM_RECHECK_MS,
  LIVEKIT_IDLE_GRACE_MS,
  remainingIdleGraceMs,
  vmLifecycleAction,
} from "./infrastructurePolicy"

const PROJECT_ID = "identite-ga-496013"
const ZONE = "europe-west1-b"
const INSTANCE_NAME = "livekit-prod"
const START_TIMEOUT_MS = 3 * 60 * 1000
const POLL_INTERVAL_MS = 2_000

type VmStatus = string

function isAutosuspendEnabled(): boolean {
  return process.env.LIVEKIT_AUTOSUSPEND_ENABLED === "true"
}

function getAuthClient(): GoogleAuth {
  const keyJson = process.env.GCP_LIVEKIT_CONTROLLER_SA_KEY
  if (!keyJson) {
    throw new Error("GCP_LIVEKIT_CONTROLLER_SA_KEY non configuré")
  }
  return new GoogleAuth({
    credentials: JSON.parse(keyJson),
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  })
}

async function getAccessToken(): Promise<string> {
  const client = await getAuthClient().getClient()
  const response = await client.getAccessToken()
  if (!response.token) throw new Error("Jeton GCP indisponible")
  return response.token
}

function instanceUrl(suffix = ""): string {
  return `https://compute.googleapis.com/compute/v1/projects/${PROJECT_ID}/zones/${ZONE}/instances/${INSTANCE_NAME}${suffix}`
}

async function computeRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Erreur API Compute (${response.status}): ${body}`)
  }
  return (await response.json()) as T
}

async function getVmStatus(): Promise<VmStatus> {
  return (await computeRequest<{ status: VmStatus }>(instanceUrl())).status
}

async function startVm(): Promise<void> {
  await computeRequest(instanceUrl("/start"), { method: "POST" })
}

async function stopVm(): Promise<void> {
  await computeRequest(instanceUrl("/stop"), { method: "POST" })
}

function getLiveKitClient(): RoomServiceClient {
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.LIVEKIT_URL
  if (!apiKey || !apiSecret || !wsUrl) {
    throw new Error("LIVEKIT_URL, LIVEKIT_API_KEY et LIVEKIT_API_SECRET sont requis")
  }
  const apiUrl = wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:")
  return new RoomServiceClient(apiUrl, apiKey, apiSecret, {
    requestTimeout: 5_000,
  })
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForVmToStop(deadline: number): Promise<void> {
  while (Date.now() < deadline) {
    const status = await getVmStatus()
    if (status === "TERMINATED" || status === "SUSPENDED") return
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error("Délai dépassé pendant l'arrêt de la VM LiveKit")
}

async function waitForLiveKit(deadline: number): Promise<void> {
  const client = getLiveKitClient()
  while (Date.now() < deadline) {
    if ((await getVmStatus()) === "RUNNING") {
      try {
        await client.listRooms()
        return
      } catch {
        // Le système et les conteneurs terminent leur démarrage.
      }
    }
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error("Le serveur vidéo n'a pas démarré dans le délai prévu")
}

/** Démarre LiveKit à la demande avant d'émettre un jeton de salle. */
export async function ensureLiveKitReadyForToken(
  ctx: ActionCtx,
): Promise<{ enabled: boolean; started: boolean }> {
  if (!isAutosuspendEnabled()) return { enabled: false, started: false }

  await ctx.runMutation(internal.level3.infrastructureState.recordActivity, {
    source: "token_request",
  })

  const deadline = Date.now() + START_TIMEOUT_MS
  let status = await getVmStatus()
  let action = vmLifecycleAction(status)
  let started = false

  if (action === "wait-for-stop") {
    await waitForVmToStop(deadline)
    status = await getVmStatus()
    action = vmLifecycleAction(status)
  }
  if (action === "start") {
    try {
      await startVm()
      started = true
    } catch (error) {
      // Deux participants peuvent demander leur jeton au même instant. Le
      // second démarrage est sans danger si la première requête a déjà fait
      // passer la VM en cours de démarrage.
      const concurrentStatus = await getVmStatus()
      if (vmLifecycleAction(concurrentStatus) !== "wait-for-ready") throw error
    }
  } else if (action === "reject") {
    throw new Error(`La VM LiveKit ne peut pas démarrer depuis l'état ${status}`)
  }

  await waitForLiveKit(deadline)
  await ctx.scheduler.runAfter(
    LIVEKIT_IDLE_GRACE_MS,
    internal.level3.infrastructure.stopLiveKitVmIfIdle,
    {},
  )
  return { enabled: true, started }
}

/**
 * Éteint la VM uniquement après quinze minutes sans demande et sans salle.
 * Toute incertitude garde la VM allumée et reprogramme un contrôle.
 */
export const stopLiveKitVmIfIdle = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    | { outcome: "disabled" | "already-stopped" | "stopped" }
    | {
        outcome: "deferred"
        reason: "recent-activity" | "active-rooms" | "api-error"
      }
  > => {
    if (!isAutosuspendEnabled()) return { outcome: "disabled" }

    const activity = await ctx.runQuery(internal.level3.infrastructureState.getActivity, {})
    const remaining = remainingIdleGraceMs(activity?.lastActivityAt ?? 0, Date.now())
    if (remaining !== null) {
      await ctx.scheduler.runAfter(
        remaining + 1_000,
        internal.level3.infrastructure.stopLiveKitVmIfIdle,
        {},
      )
      return { outcome: "deferred", reason: "recent-activity" }
    }

    if ((await getVmStatus()) !== "RUNNING") return { outcome: "already-stopped" }

    try {
      const rooms = await getLiveKitClient().listRooms()
      if (rooms.length > 0) {
        await ctx.runMutation(internal.level3.infrastructureState.recordActivity, {
          source: "active_rooms",
        })
        await ctx.scheduler.runAfter(
          LIVEKIT_ACTIVE_ROOM_RECHECK_MS,
          internal.level3.infrastructure.stopLiveKitVmIfIdle,
          {},
        )
        return { outcome: "deferred", reason: "active-rooms" }
      }
    } catch (error) {
      console.warn("[LiveKit autosuspend] contrôle des salles impossible", error)
      await ctx.scheduler.runAfter(
        LIVEKIT_ACTIVE_ROOM_RECHECK_MS,
        internal.level3.infrastructure.stopLiveKitVmIfIdle,
        {},
      )
      return { outcome: "deferred", reason: "api-error" }
    }

    const activityAfterRoomCheck = await ctx.runQuery(
      internal.level3.infrastructureState.getActivity,
      {},
    )
    if (remainingIdleGraceMs(activityAfterRoomCheck?.lastActivityAt ?? 0, Date.now()) !== null) {
      await ctx.scheduler.runAfter(
        LIVEKIT_IDLE_GRACE_MS,
        internal.level3.infrastructure.stopLiveKitVmIfIdle,
        {},
      )
      return { outcome: "deferred", reason: "recent-activity" }
    }

    await stopVm()
    return { outcome: "stopped" }
  },
})
