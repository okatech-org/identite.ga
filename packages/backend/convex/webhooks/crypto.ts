const encoder = new TextEncoder()
const SECRET_AAD = encoder.encode("idn:webhook-secret:v1")

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function fromHex(value: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/i.test(value)) return null
  return Uint8Array.from(
    value.match(/.{2}/g)!.map((pair) => Number.parseInt(pair, 16)),
  )
}

function masterKeyBytes(raw = process.env.WEBHOOK_SECRETS_KEY): Uint8Array {
  if (!raw?.trim()) {
    throw new Error("WEBHOOK_SECRETS_KEY_MISSING")
  }
  const value = raw.trim()
  const decoded = fromHex(value) ?? fromBase64Url(value)
  if (decoded.byteLength !== 32) {
    throw new Error("WEBHOOK_SECRETS_KEY_INVALID")
  }
  return decoded
}

async function importMasterKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    masterKeyBytes() as BufferSource,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  )
}

export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `whsec_${toBase64Url(bytes)}`
}

export async function encryptWebhookSecret(secret: string): Promise<{
  ciphertext: string
  iv: string
}> {
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: SECRET_AAD },
    await importMasterKey(),
    encoder.encode(secret),
  )
  return {
    ciphertext: toBase64Url(new Uint8Array(ciphertext)),
    iv: toBase64Url(iv),
  }
}

export async function decryptWebhookSecret(
  ciphertext: string,
  iv: string,
): Promise<string> {
  const clear = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64Url(iv) as BufferSource,
      additionalData: SECRET_AAD,
    },
    await importMasterKey(),
    fromBase64Url(ciphertext) as BufferSource,
  )
  return new TextDecoder().decode(clear)
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export async function signWebhookDelivery(
  secret: string,
  timestamp: string,
  rawBody: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${rawBody}`),
  )
  return `v1=${toHex(signature)}`
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}

export async function verifyWebhookDelivery(
  secret: string,
  timestamp: string,
  rawBody: string,
  received: string | null,
): Promise<boolean> {
  if (!received) return false
  const signatures = received.split(",").map((part) => part.trim())
  const expected = await signWebhookDelivery(secret, timestamp, rawBody)
  return signatures.some((signature) => safeEqual(expected, signature))
}
