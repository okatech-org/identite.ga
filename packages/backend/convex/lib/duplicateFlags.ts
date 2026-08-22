import type { Id } from "../_generated/dataModel"
import type { MutationCtx } from "../_generated/server"
import { internal } from "../_generated/api"

/**
 * Ouverture d'un dossier de rapprochement entre deux comptes.
 *
 * Helper TypeScript et non `internalMutation` : les appelants (signup, mise à
 * jour du pivot) sont déjà dans une mutation, et le signal doit être écrit
 * dans LA MÊME transaction que le profil qu'il concerne. Passer par un
 * `runMutation` n'apporterait rien et brouillerait cette garantie. Un wrapper
 * `internalMutation` existe dans `duplicates/mutations.ts` pour les appelants
 * qui sont des actions (pipeline KYC).
 */

export type RaiseFlagArgs = {
  userId: string
  matchedUserId?: string
  signal: "pivot" | "nip" | "face" | "document"
  groupKey: string
  score?: number
  sourceKycRequestId?: Id<"kycRequest">
}

/**
 * Idempotent : si un signal `open` existe déjà pour ce triplet
 * (compte, compte en regard, source), on ne fait rien et on renvoie `null`.
 *
 * Sans cette garde, chaque re-soumission de KYC et chaque correction de profil
 * re-signalerait la même paire ; la file d'arbitrage se remplirait de
 * duplicatas et deviendrait inexploitable — c'est-à-dire inutilisée.
 */
export async function raiseDuplicateFlag(
  ctx: MutationCtx,
  args: RaiseFlagArgs,
): Promise<Id<"duplicateSignal"> | null> {
  // Un compte ne se double pas lui-même.
  if (args.matchedUserId && args.matchedUserId === args.userId) return null

  const existing = await ctx.db
    .query("duplicateSignal")
    .withIndex("by_pair", (q) =>
      q
        .eq("userId", args.userId)
        .eq("matchedUserId", args.matchedUserId)
        .eq("signal", args.signal)
        .eq("status", "open"),
    )
    .first()
  if (existing) return null

  const id = await ctx.db.insert("duplicateSignal", {
    userId: args.userId,
    matchedUserId: args.matchedUserId,
    signal: args.signal,
    groupKey: args.groupKey,
    score: args.score,
    sourceKycRequestId: args.sourceKycRequestId,
    status: "open",
    detectedAt: Date.now(),
  })

  await ctx.runMutation(internal.audit.recordAudit, {
    actorId: undefined, // détection système, pas d'acteur humain
    action: "duplicate_flagged",
    targetType: "user",
    targetId: args.userId,
    metadata: {
      signal: args.signal,
      matchedUserId: args.matchedUserId,
      ...(args.score !== undefined ? { score: args.score } : {}),
    },
  })

  return id
}

/** Ouvre un signal par compte rapproché. Renvoie le nombre de dossiers créés. */
export async function raiseDuplicateFlags(
  ctx: MutationCtx,
  userId: string,
  matches: ReadonlyArray<{
    userId: string
    signal: "pivot" | "nip"
    groupKey: string
  }>,
): Promise<number> {
  let created = 0
  for (const m of matches) {
    const id = await raiseDuplicateFlag(ctx, {
      userId,
      matchedUserId: m.userId,
      signal: m.signal,
      groupKey: m.groupKey,
    })
    if (id) created++
  }
  return created
}
