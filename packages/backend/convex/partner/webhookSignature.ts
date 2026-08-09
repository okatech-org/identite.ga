/**
 * Signature HMAC-SHA256 des webhooks partenaires.
 *
 * Isolée pour être partagée entre l'émission (identite.ga) et toute
 * vérification côté réception, et pour être testable sans réseau. Utilise
 * WebCrypto — disponible dans le runtime Convex par défaut, donc pas besoin
 * d'un module Node (`"use node"`), qui imposerait un isolate séparé.
 */

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** `sha256=<hex>` — même forme que les webhooks GitHub/Stripe. */
export async function signWebhookPayload(
  secret: string,
  payload: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return `sha256=${toHex(signature)}`;
}

/**
 * Comparaison à temps CONSTANT.
 *
 * Une comparaison `===` sur des chaînes s'arrête au premier octet différent :
 * son temps d'exécution révèle combien de préfixe est correct, ce qui permet
 * de reconstruire une signature valide octet par octet. Le surcoût ici est
 * négligeable ; la fuite, elle, annule tout l'intérêt de signer.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Vérifie une signature reçue contre le corps brut. */
export async function verifyWebhookSignature(
  secret: string,
  payload: string,
  received: string | null,
): Promise<boolean> {
  if (!received) return false;
  const expected = await signWebhookPayload(secret, payload);
  return safeEqual(expected, received);
}
