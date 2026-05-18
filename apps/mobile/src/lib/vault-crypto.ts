/**
 * iDocument — primitives crypto côté client.
 *
 * Modèle (cf. SPECS_FEATURES_CITIZEN.md §3) :
 *   • Master Vault Key (MVK) : 32 octets aléatoires, chiffrée par une KEK
 *     dérivée du mot de passe vault via PBKDF2-SHA256.
 *   • Chaque fichier est chiffré par une DEK générée aléatoirement
 *     (AES-256-GCM). La DEK est wrappée par la MVK et stockée à côté du
 *     ciphertext.
 *   • Les métadonnées du fichier (nom original, type, etc.) sont chiffrées
 *     par la même DEK et stockées dans `encryptedMetadata`.
 *
 * Utilise WebCrypto (`crypto.subtle`). Sur Expo natif, prévoir un
 * polyfill — `crypto.subtle` est présent en mobile-web et sur navigateur,
 * et expérimentalement sur Hermes récent.
 */

const PBKDF2_ITERATIONS = 250_000;
const SALT_LEN = 16;
const IV_LEN = 12;
const MVK_LEN = 32;

function getSubtle(): SubtleCrypto {
  const subtle = (globalThis.crypto as unknown as { subtle?: SubtleCrypto } | undefined)?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto indisponible : ajoutez un polyfill (ex: react-native-quick-crypto).");
  }
  return subtle;
}

function randomBytes(len: number): Uint8Array {
  const out = new Uint8Array(len);
  (globalThis.crypto as unknown as { getRandomValues: (a: Uint8Array) => Uint8Array }).getRandomValues(out);
  return out;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  if (typeof btoa === "function") return btoa(s);
  throw new Error("btoa indisponible — installez un polyfill base64 pour cette plateforme.");
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob !== "function") {
    throw new Error("atob indisponible — installez un polyfill base64 pour cette plateforme.");
  }
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKek(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const subtle = getSubtle();
  const baseKey = await subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return await subtle.deriveKey(
    { name: "PBKDF2", salt: salt as unknown as ArrayBuffer, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey", "encrypt", "decrypt"],
  );
}

export type ActivationOutput = {
  algorithm: "AES-256-GCM";
  kdf: "PBKDF2-SHA256";
  kdfIterations: number;
  passwordSalt: string;
  wrappedMvk: string;
  mvkRaw: Uint8Array; // À garder en mémoire, jamais transmise.
};

/**
 * Active le vault : génère MVK, dérive KEK, wrappe MVK et retourne le payload
 * à envoyer à `vault.keys.activate`.
 */
export async function activateVault(password: string): Promise<ActivationOutput> {
  const subtle = getSubtle();
  const mvk = randomBytes(MVK_LEN);
  const salt = randomBytes(SALT_LEN);
  const kek = await deriveKek(password, salt, PBKDF2_ITERATIONS);

  const iv = randomBytes(IV_LEN);
  const wrapped = new Uint8Array(
    await subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as ArrayBuffer }, kek, mvk as unknown as ArrayBuffer),
  );

  // Pack iv ‖ ciphertext pour pouvoir tout retrouver côté unwrap.
  const packed = new Uint8Array(iv.length + wrapped.length);
  packed.set(iv, 0);
  packed.set(wrapped, iv.length);

  return {
    algorithm: "AES-256-GCM",
    kdf: "PBKDF2-SHA256",
    kdfIterations: PBKDF2_ITERATIONS,
    passwordSalt: bytesToBase64(salt),
    wrappedMvk: bytesToBase64(packed),
    mvkRaw: mvk,
  };
}

/**
 * Déverrouille la MVK depuis l'envelope serveur.
 */
export async function unlockVault(
  password: string,
  envelope: {
    kdfIterations: number;
    passwordSalt: string;
    wrappedMvk: string;
  },
): Promise<Uint8Array> {
  const subtle = getSubtle();
  const salt = base64ToBytes(envelope.passwordSalt);
  const kek = await deriveKek(password, salt, envelope.kdfIterations);
  const packed = base64ToBytes(envelope.wrappedMvk);
  const iv = packed.slice(0, IV_LEN);
  const ct = packed.slice(IV_LEN);
  try {
    const mvk = new Uint8Array(
      await subtle.decrypt({ name: "AES-GCM", iv: iv as unknown as ArrayBuffer }, kek, ct as unknown as ArrayBuffer),
    );
    if (mvk.length !== MVK_LEN) throw new Error("MVK length mismatch");
    return mvk;
  } catch {
    throw new Error("Mot de passe vault incorrect.");
  }
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return await getSubtle().importKey(
    "raw",
    raw as unknown as ArrayBuffer,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export type EncryptedFile = {
  ciphertext: Uint8Array;
  wrappedDek: string;
  iv: string;
  metaIv: string;
  encryptedMetadata: string;
};

export async function encryptFile(
  mvk: Uint8Array,
  plaintext: Uint8Array,
  metadata: Record<string, unknown>,
): Promise<EncryptedFile> {
  const subtle = getSubtle();
  const mvkKey = await importAesKey(mvk);

  const dek = randomBytes(32);
  const dekKey = await importAesKey(dek);

  // Chiffre le payload
  const iv = randomBytes(IV_LEN);
  const ciphertext = new Uint8Array(
    await subtle.encrypt({ name: "AES-GCM", iv: iv as unknown as ArrayBuffer }, dekKey, plaintext as unknown as ArrayBuffer),
  );

  // Chiffre les métadonnées
  const metaIv = randomBytes(IV_LEN);
  const metaPlain = new TextEncoder().encode(JSON.stringify(metadata));
  const metaCt = new Uint8Array(
    await subtle.encrypt({ name: "AES-GCM", iv: metaIv as unknown as ArrayBuffer }, dekKey, metaPlain as unknown as ArrayBuffer),
  );

  // Wrap la DEK avec la MVK
  const dekIv = randomBytes(IV_LEN);
  const wrappedDekCt = new Uint8Array(
    await subtle.encrypt({ name: "AES-GCM", iv: dekIv as unknown as ArrayBuffer }, mvkKey, dek as unknown as ArrayBuffer),
  );
  const wrappedDekPacked = new Uint8Array(dekIv.length + wrappedDekCt.length);
  wrappedDekPacked.set(dekIv, 0);
  wrappedDekPacked.set(wrappedDekCt, dekIv.length);

  return {
    ciphertext,
    wrappedDek: bytesToBase64(wrappedDekPacked),
    iv: bytesToBase64(iv),
    metaIv: bytesToBase64(metaIv),
    encryptedMetadata: bytesToBase64(metaCt),
  };
}

export async function decryptMetadata(
  mvk: Uint8Array,
  wrappedDek: string,
  metaIv: string,
  encryptedMetadata: string,
): Promise<Record<string, unknown>> {
  const dek = await unwrapDek(mvk, wrappedDek);
  const subtle = getSubtle();
  const dekKey = await importAesKey(dek);
  const ivBytes = base64ToBytes(metaIv);
  const ct = base64ToBytes(encryptedMetadata);
  const plain = new Uint8Array(
    await subtle.decrypt({ name: "AES-GCM", iv: ivBytes as unknown as ArrayBuffer }, dekKey, ct as unknown as ArrayBuffer),
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

export async function decryptFile(
  mvk: Uint8Array,
  ciphertext: Uint8Array,
  wrappedDek: string,
  iv: string,
): Promise<Uint8Array> {
  const dek = await unwrapDek(mvk, wrappedDek);
  const subtle = getSubtle();
  const dekKey = await importAesKey(dek);
  const ivBytes = base64ToBytes(iv);
  return new Uint8Array(
    await subtle.decrypt({ name: "AES-GCM", iv: ivBytes as unknown as ArrayBuffer }, dekKey, ciphertext as unknown as ArrayBuffer),
  );
}

async function unwrapDek(mvk: Uint8Array, wrappedDekB64: string): Promise<Uint8Array> {
  const subtle = getSubtle();
  const mvkKey = await importAesKey(mvk);
  const packed = base64ToBytes(wrappedDekB64);
  const iv = packed.slice(0, IV_LEN);
  const ct = packed.slice(IV_LEN);
  return new Uint8Array(
    await subtle.decrypt({ name: "AES-GCM", iv: iv as unknown as ArrayBuffer }, mvkKey, ct as unknown as ArrayBuffer),
  );
}
