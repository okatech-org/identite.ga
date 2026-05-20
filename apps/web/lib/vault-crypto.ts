/**
 * iDocument — Primitives crypto côté client (web).
 *
 * Modèle envelope encryption (cf. SPECS_FEATURES_CITIZEN.md §3) :
 *   • Master Vault Key (MVK) : 32 octets aléatoires, AES-256-GCM.
 *   • MVK wrappée par une KEK dérivée du mot de passe vault (PBKDF2-SHA256).
 *   • Chaque fichier : DEK aléatoire AES-256-GCM, wrappée par MVK.
 *   • Métadonnées : chiffrées par la même DEK, base64.
 *
 * Format wire **identique** à `apps/mobile/src/lib/vault-crypto.ts` pour
 * interopérabilité : pack `iv ‖ ciphertext`, base64 standard, PBKDF2 250 000
 * itérations.
 *
 * Implémenté avec l'API WebCrypto native (`crypto.subtle`) — pas de
 * dépendance externe.
 */

const PBKDF2_ITERATIONS = 250_000
const SALT_LEN = 16
const IV_LEN = 12
const MVK_LEN = 32
const DEK_LEN = 32

function getSubtle(): SubtleCrypto {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error(
      "WebCrypto indisponible — ouvrez l'application via HTTPS ou localhost.",
    )
  }
  return crypto.subtle
}

function randomBytes(len: number): Uint8Array {
  const out = new Uint8Array(len)
  crypto.getRandomValues(out)
  return out
}

export function bytesToBase64(bytes: Uint8Array): string {
  let s = ""
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s)
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function deriveKek(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const subtle = getSubtle()
  const baseKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  )
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt as BufferSource,
      iterations,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return getSubtle().importKey(
    "raw",
    raw as BufferSource,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  )
}

async function aesGcmEncrypt(
  key: CryptoKey,
  iv: Uint8Array,
  plaintext: Uint8Array,
): Promise<Uint8Array> {
  const ct = await getSubtle().encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  )
  return new Uint8Array(ct)
}

async function aesGcmDecrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: Uint8Array,
): Promise<Uint8Array> {
  const pt = await getSubtle().decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  )
  return new Uint8Array(pt)
}

export type ActivationOutput = {
  algorithm: "AES-256-GCM"
  kdf: "PBKDF2-SHA256"
  kdfIterations: number
  passwordSalt: string
  wrappedMvk: string
  /** À conserver en mémoire, ne JAMAIS transmettre au serveur. */
  mvkRaw: Uint8Array
}

/**
 * Active le coffre-fort : génère une MVK aléatoire, dérive la KEK, wrappe
 * la MVK. Retourne le payload à envoyer à `vault.keys.activate`.
 */
export async function activateVault(password: string): Promise<ActivationOutput> {
  const mvk = randomBytes(MVK_LEN)
  const salt = randomBytes(SALT_LEN)
  const kek = await deriveKek(password, salt, PBKDF2_ITERATIONS)
  const iv = randomBytes(IV_LEN)
  const wrapped = await aesGcmEncrypt(kek, iv, mvk)

  // Pack iv ‖ ciphertext (format identique au mobile).
  const packed = new Uint8Array(iv.length + wrapped.length)
  packed.set(iv, 0)
  packed.set(wrapped, iv.length)

  return {
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    kdfIterations: PBKDF2_ITERATIONS,
    passwordSalt: bytesToBase64(salt),
    wrappedMvk: bytesToBase64(packed),
    mvkRaw: mvk,
  }
}

/**
 * Déverrouille la MVK depuis l'envelope serveur.
 * @throws Error('Mot de passe vault incorrect.') si la KEK ne permet pas le déchiffrement.
 */
export async function unlockVault(
  password: string,
  envelope: {
    kdfIterations: number
    passwordSalt: string
    wrappedMvk: string
  },
): Promise<Uint8Array> {
  const salt = base64ToBytes(envelope.passwordSalt)
  const kek = await deriveKek(password, salt, envelope.kdfIterations)
  const packed = base64ToBytes(envelope.wrappedMvk)
  const iv = packed.slice(0, IV_LEN)
  const ct = packed.slice(IV_LEN)
  try {
    const mvk = await aesGcmDecrypt(kek, iv, ct)
    if (mvk.length !== MVK_LEN) throw new Error("MVK length mismatch")
    return mvk
  } catch {
    throw new Error("Mot de passe vault incorrect.")
  }
}

export type EncryptedFile = {
  ciphertext: Uint8Array
  wrappedDek: string
  iv: string
  metaIv: string
  encryptedMetadata: string
}

/**
 * Chiffre un fichier + ses métadonnées.
 * - Nouvelle DEK aléatoire AES-256-GCM.
 * - DEK wrappée par la MVK (pack iv ‖ ct).
 */
export async function encryptFile(
  mvk: Uint8Array,
  plaintext: Uint8Array,
  metadata: Record<string, unknown>,
): Promise<EncryptedFile> {
  const dek = randomBytes(DEK_LEN)
  const dekKey = await importAesKey(dek)
  const mvkKey = await importAesKey(mvk)

  // Chiffre le payload avec la DEK.
  const iv = randomBytes(IV_LEN)
  const ciphertext = await aesGcmEncrypt(dekKey, iv, plaintext)

  // Chiffre les métadonnées avec la même DEK.
  const metaIv = randomBytes(IV_LEN)
  const metaPlain = new TextEncoder().encode(JSON.stringify(metadata))
  const metaCt = await aesGcmEncrypt(dekKey, metaIv, metaPlain)

  // Wrap la DEK avec la MVK (pack iv ‖ ct).
  const dekIv = randomBytes(IV_LEN)
  const wrappedDekCt = await aesGcmEncrypt(mvkKey, dekIv, dek)
  const wrappedDekPacked = new Uint8Array(dekIv.length + wrappedDekCt.length)
  wrappedDekPacked.set(dekIv, 0)
  wrappedDekPacked.set(wrappedDekCt, dekIv.length)

  return {
    ciphertext,
    wrappedDek: bytesToBase64(wrappedDekPacked),
    iv: bytesToBase64(iv),
    metaIv: bytesToBase64(metaIv),
    encryptedMetadata: bytesToBase64(metaCt),
  }
}

/**
 * Déballe la DEK chiffrée avec la MVK.
 * Format attendu : pack iv ‖ ciphertext.
 */
async function unwrapDek(mvk: Uint8Array, wrappedDekB64: string): Promise<Uint8Array> {
  const mvkKey = await importAesKey(mvk)
  const packed = base64ToBytes(wrappedDekB64)
  const iv = packed.slice(0, IV_LEN)
  const ct = packed.slice(IV_LEN)
  return aesGcmDecrypt(mvkKey, iv, ct)
}

/**
 * Déchiffre les métadonnées JSON d'un item vault.
 */
export async function decryptMetadata(
  mvk: Uint8Array,
  wrappedDek: string,
  metaIv: string,
  encryptedMetadata: string,
): Promise<Record<string, unknown>> {
  const dek = await unwrapDek(mvk, wrappedDek)
  const dekKey = await importAesKey(dek)
  const ivBytes = base64ToBytes(metaIv)
  const ct = base64ToBytes(encryptedMetadata)
  const plain = await aesGcmDecrypt(dekKey, ivBytes, ct)
  return JSON.parse(new TextDecoder().decode(plain)) as Record<string, unknown>
}

/**
 * Déchiffre le payload d'un item vault (PDF/image/bytes bruts).
 */
export async function decryptFile(
  mvk: Uint8Array,
  ciphertext: Uint8Array,
  wrappedDek: string,
  iv: string,
): Promise<Uint8Array> {
  const dek = await unwrapDek(mvk, wrappedDek)
  const dekKey = await importAesKey(dek)
  const ivBytes = base64ToBytes(iv)
  return aesGcmDecrypt(dekKey, ivBytes, ciphertext)
}
