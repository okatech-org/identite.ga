import type { MutationCtx, QueryCtx } from "../_generated/server"

/**
 * Génération d'identifiants publics IDN (`GA-XXXX-XXXX`).
 *
 * Format : préfixe pays Gabon (`GA`), tiret, 4 caractères, tiret, 4 caractères.
 * Alphabet Crockford base32 sans I/O/L/U pour éviter les ambiguïtés visuelles
 * (32 chars). 32^8 = ~1.1 × 10^12 combinaisons → collisions improbables.
 *
 * Le retry max est conservateur (5 essais) au cas où — au-delà on jette une
 * erreur (très improbable, signal d'un problème grave dans la table).
 */

// Crockford base32 sans I, L, O, U — 32 caractères distincts
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const PREFIX = "GA"
const SEGMENT_LEN = 4
const NUM_SEGMENTS = 2
const MAX_RETRIES = 5

function randomSegment(): string {
  const buf = new Uint8Array(SEGMENT_LEN)
  crypto.getRandomValues(buf)
  let out = ""
  for (let i = 0; i < SEGMENT_LEN; i++) {
    // Modulo 32 → indice dans l'alphabet (256 % 32 = 0, distribution uniforme).
    out += ALPHABET[buf[i]! & 0x1f]
  }
  return out
}

function newIdnId(): string {
  const segments: string[] = []
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    segments.push(randomSegment())
  }
  return `${PREFIX}-${segments.join("-")}`
}

async function isAvailable(
  ctx: QueryCtx | MutationCtx,
  candidate: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query("userProfile")
    .withIndex("by_idnId", (q) => q.eq("idnId", candidate))
    .first()
  return existing === null
}

/**
 * Génère un nouvel identifiant IDN unique pour un utilisateur.
 * Vérifie l'unicité via l'index `by_idnId` ; retry max 5 fois en cas de
 * collision (extrêmement improbable). Jette si toujours pas d'unique.
 */
export async function generateIdnId(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const candidate = newIdnId()
    if (await isAvailable(ctx, candidate)) {
      return candidate
    }
  }
  throw new Error(
    `[idnId] Impossible de générer un identifiant unique après ${MAX_RETRIES} essais — vérifier la santé de userProfile/by_idnId.`,
  )
}
