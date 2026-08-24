import type { Doc } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"
import { normalizeRecoveryPhone } from "./phone"

const MAX_IDENTITY_MATCHES = 50
const MAX_AUTOMATIC_RECOVERY_PROFILES = 500

export const PIN_RECOVERY_BLOCKERS = [
  "account_deleted",
  "email_not_verified",
  "missing_phone",
  "missing_identity_key",
  "shared_identity",
  "shared_nip",
  "shared_phone",
  "registry_scan_limit",
] as const

export type PinRecoveryBlocker = (typeof PIN_RECOVERY_BLOCKERS)[number]

type RecoveryCtx = Pick<QueryCtx, "db">

/**
 * Décide si le téléphone historique d'un profil peut recevoir un code de
 * récupération. Le téléphone n'était pas vérifié à l'inscription : on exige
 * donc un email vérifié, une identité unique et un numéro unique parmi les
 * profils actifs.
 *
 * Le scan des téléphones est borné et échoue fermé. Une future migration vers
 * un téléphone normalisé indexé supprimera ce scan ; jusque-là, dépasser la
 * borne bloque l'envoi automatique.
 */
export async function assessAutomaticSmsRecovery(
  ctx: RecoveryCtx,
  profile: Doc<"userProfile">,
  emailVerified: boolean,
): Promise<{
  eligible: boolean
  phone: string | null
  blockers: PinRecoveryBlocker[]
}> {
  const blockers: PinRecoveryBlocker[] = []
  const phone = normalizeRecoveryPhone(
    profile.pivot?.phone,
    profile.pivot?.nationality,
  )

  if (profile.deletedAt !== undefined) blockers.push("account_deleted")
  if (!emailVerified) blockers.push("email_not_verified")
  if (!phone) blockers.push("missing_phone")

  if (!profile.pivotKey) {
    blockers.push("missing_identity_key")
  } else if (
    !(await isOnlyActiveProfileWithKey(
      ctx,
      "by_pivotKey",
      "pivotKey",
      profile.pivotKey,
      profile._id,
    ))
  ) {
    blockers.push("shared_identity")
  }

  if (
    profile.nipKey &&
    !(await isOnlyActiveProfileWithKey(
      ctx,
      "by_nipKey",
      "nipKey",
      profile.nipKey,
      profile._id,
    ))
  ) {
    blockers.push("shared_nip")
  }

  if (phone) {
    const profiles = await ctx.db
      .query("userProfile")
      .take(MAX_AUTOMATIC_RECOVERY_PROFILES + 1)
    if (profiles.length > MAX_AUTOMATIC_RECOVERY_PROFILES) {
      blockers.push("registry_scan_limit")
    } else {
      let matchingPhones = 0
      for (const candidate of profiles) {
        if (candidate.deletedAt !== undefined) continue
        const candidatePhone = normalizeRecoveryPhone(
          candidate.pivot?.phone,
          candidate.pivot?.nationality,
        )
        if (candidatePhone !== phone) continue
        matchingPhones += 1
        if (matchingPhones > 1) {
          blockers.push("shared_phone")
          break
        }
      }
    }
  }

  return {
    eligible: blockers.length === 0,
    phone,
    blockers,
  }
}

async function isOnlyActiveProfileWithKey(
  ctx: RecoveryCtx,
  indexName: "by_pivotKey" | "by_nipKey",
  fieldName: "pivotKey" | "nipKey",
  key: string,
  expectedProfileId: Doc<"userProfile">["_id"],
): Promise<boolean> {
  const rows = await ctx.db
    .query("userProfile")
    .withIndex(indexName, (q) => q.eq(fieldName, key))
    .take(MAX_IDENTITY_MATCHES + 1)
  if (rows.length > MAX_IDENTITY_MATCHES) return false

  const active = rows.filter((row) => row.deletedAt === undefined)
  return active.length === 1 && active[0]?._id === expectedProfileId
}
