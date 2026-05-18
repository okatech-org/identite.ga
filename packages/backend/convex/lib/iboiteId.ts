import type { MutationCtx, QueryCtx } from "../_generated/server"

/**
 * Génération d'identifiants QR pour les adresses postales virtuelles iBoîte.
 *
 * Format : `IDNGA-{SEG}` pour les comptes personnels,
 *          `IDNGA-PRO-{SEG}` pour les pros,
 *          `IDNGA-ASSO-{SEG}` pour les associations.
 *
 * `SEG` est une chaîne de 6 caractères en alphabet Crockford base32 sans
 * I / O / L / U pour éviter les ambiguïtés visuelles (32 chars). 32^6 = ~1 Md
 * combinaisons → collisions très improbables. Retry max 5 fois.
 */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
const SEGMENT_LEN = 6
const MAX_RETRIES = 5

type AccountKind = "personal" | "professional" | "association"

const PREFIX: Record<AccountKind, string> = {
  personal: "IDNGA",
  professional: "IDNGA-PRO",
  association: "IDNGA-ASSO",
}

function randomSegment(): string {
  const buf = new Uint8Array(SEGMENT_LEN)
  crypto.getRandomValues(buf)
  let out = ""
  for (let i = 0; i < SEGMENT_LEN; i++) {
    out += ALPHABET[buf[i]! & 0x1f]
  }
  return out
}

function newQrCode(kind: AccountKind): string {
  return `${PREFIX[kind]}-${randomSegment()}`
}

async function isAvailable(
  ctx: QueryCtx | MutationCtx,
  candidate: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query("iboiteAccount")
    .withIndex("by_qrCode", (q) => q.eq("qrCode", candidate))
    .first()
  return existing === null
}

export async function generateIboiteQrCode(
  ctx: MutationCtx,
  kind: AccountKind,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const candidate = newQrCode(kind)
    if (await isAvailable(ctx, candidate)) {
      return candidate
    }
  }
  throw new Error(
    `[iboiteId] Impossible de générer un QR unique après ${MAX_RETRIES} essais — vérifier la santé de iboiteAccount/by_qrCode.`,
  )
}

/**
 * Génère un alias email interne déterministe à partir du prénom + nom + idnId.
 * Format : `prenom.nom@idn.ga` (ou variation suffixée si déjà pris).
 * L'alias n'a pas de SMTP entrant — c'est juste un libellé d'adresse interne
 * affiché dans l'UI (cf. maquettes iBoîte).
 */
function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30)
}

async function isAliasAvailable(
  ctx: QueryCtx | MutationCtx,
  candidate: string,
): Promise<boolean> {
  const existing = await ctx.db
    .query("iboiteAccount")
    .withIndex("by_emailAlias", (q) => q.eq("emailAlias", candidate))
    .first()
  return existing === null
}

export async function generateIboiteEmailAlias(
  ctx: MutationCtx,
  parts: { firstName?: string | null; lastName?: string | null; idnId?: string | null },
): Promise<string> {
  const first = slugify(parts.firstName ?? "")
  const last = slugify(parts.lastName ?? "")
  const root =
    first && last ? `${first}.${last}` : first || last || (parts.idnId ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "") || `user-${randomSegment().toLowerCase()}`

  const base = `${root}@idn.ga`
  if (await isAliasAvailable(ctx, base)) return base

  for (let i = 1; i < 100; i++) {
    const candidate = `${root}${i}@idn.ga`
    if (await isAliasAvailable(ctx, candidate)) return candidate
  }
  // Fallback aléatoire (très peu probable d'arriver ici)
  return `${root}-${randomSegment().toLowerCase()}@idn.ga`
}
