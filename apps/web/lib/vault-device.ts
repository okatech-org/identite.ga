"use client"

/**
 * iDocument — Persistance opt-in de la MVK sur l'appareil.
 *
 * Modèle :
 *  - Device-Key (DK) : AES-GCM 256, non-extractable, stockée en IndexedDB.
 *    Persiste tant que l'origine garde son storage navigateur.
 *  - MVK wrappée par DK avec AAD scopée sur l'envelope serveur :
 *      AAD = JSON({ v, scope, expiresAt })
 *      scope = SHA-256(passwordSalt | wrappedMvk)
 *    → toute rotation du mot de passe vault ou changement d'utilisateur
 *      change le scope et invalide silencieusement la persistance.
 *    → `expiresAt` étant dans l'AAD, le client ne peut pas l'étendre.
 *  - Blob persisté dans localStorage (survie aux fermetures de navigateur,
 *    contrairement à sessionStorage).
 */

const DB_NAME = "idoc-vault"
const STORE = "device-key"
const KEY_ID = "mvk-dk-v1"
const LS_KEY = "idoc:vault:remembered:v1"
const IV_LEN = 12

type RememberedBlob = {
  v: 1
  iv: string
  ct: string
  expiresAt: number
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined"
}

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly")
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite")
    tx.objectStore(STORE).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  const existing = await idbGet<CryptoKey>(KEY_ID)
  if (existing) return existing
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    /* extractable */ false,
    ["encrypt", "decrypt"],
  )
  await idbPut(KEY_ID, key)
  return key
}

function bytesToBase64(bytes: Uint8Array): string {
  let s = ""
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!)
  return btoa(s)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function envelopeScope(envelope: {
  passwordSalt: string
  wrappedMvk: string
}): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${envelope.passwordSalt}|${envelope.wrappedMvk}`),
  )
  return bytesToBase64(new Uint8Array(hash))
}

function buildAad(scope: string, expiresAt: number): Uint8Array {
  return new TextEncoder().encode(JSON.stringify({ v: 1, scope, expiresAt }))
}

/** TTL par défaut — 7 jours. */
export const REMEMBER_TTL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Wrap la MVK par la DK et persiste le blob en localStorage.
 * Si la DK n'existe pas encore, elle est générée à la volée.
 */
export async function rememberMvk(
  mvk: Uint8Array,
  envelope: { passwordSalt: string; wrappedMvk: string },
  ttlMs: number = REMEMBER_TTL_MS,
): Promise<void> {
  if (!isBrowser()) return
  const dk = await getOrCreateDeviceKey()
  const iv = new Uint8Array(IV_LEN)
  crypto.getRandomValues(iv)
  const expiresAt = Date.now() + ttlMs
  const scope = await envelopeScope(envelope)
  const aad = buildAad(scope, expiresAt)
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource, additionalData: aad as BufferSource },
      dk,
      mvk as BufferSource,
    ),
  )
  const blob: RememberedBlob = {
    v: 1,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(ct),
    expiresAt,
  }
  localStorage.setItem(LS_KEY, JSON.stringify(blob))
}

/**
 * Tente de restaurer la MVK depuis le blob persisté.
 * Retourne `null` si :
 *  - pas de blob,
 *  - blob corrompu,
 *  - TTL expiré,
 *  - DK absente (autre device / storage vidé),
 *  - envelope serveur a changé (rotation mdp / autre user).
 * Dans tous les cas de défaut, le blob est purgé.
 */
export async function tryRestoreMvk(envelope: {
  passwordSalt: string
  wrappedMvk: string
}): Promise<Uint8Array | null> {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return null
  let blob: RememberedBlob
  try {
    blob = JSON.parse(raw) as RememberedBlob
  } catch {
    localStorage.removeItem(LS_KEY)
    return null
  }
  if (blob.v !== 1 || typeof blob.expiresAt !== "number" || blob.expiresAt < Date.now()) {
    localStorage.removeItem(LS_KEY)
    return null
  }
  try {
    const dk = await getOrCreateDeviceKey()
    const scope = await envelopeScope(envelope)
    const aad = buildAad(scope, blob.expiresAt)
    const iv = base64ToBytes(blob.iv)
    const ct = base64ToBytes(blob.ct)
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource, additionalData: aad as BufferSource },
      dk,
      ct as BufferSource,
    )
    return new Uint8Array(pt)
  } catch {
    // Mauvaise DK / mauvaise envelope / TTL trafiqué / corrompu.
    localStorage.removeItem(LS_KEY)
    return null
  }
}

/** Purge le blob persisté. La DK reste en IndexedDB (sans effet sans blob). */
export function forgetMvk(): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    // silencieux
  }
}
