/** Règles et primitives cryptographiques communes aux parcours PIN. */

export const PIN_REGEX = /^\d{6}$/

/**
 * PBKDF2-SHA256, 600 000 itérations.
 *
 * Le sel est stable par utilisateur afin de préserver le format historique
 * des pinHash déjà en production.
 */
export async function derivePinHash(
  pin: string,
  userId: string,
): Promise<string> {
  const salt = new TextEncoder().encode(`idn:pin:${userId}`)
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600_000, hash: "SHA-256" },
    keyMaterial,
    256,
  )
  return bytesToHex(new Uint8Array(bits))
}

/** Empreinte d'un secret éphémère avant stockage en base. */
export async function hashOpaqueSecret(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  )
  return bytesToHex(new Uint8Array(digest))
}

/** Comparaison de deux empreintes sans sortie anticipée. */
export function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length)
  let difference = left.length ^ right.length
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }
  return difference === 0
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}
