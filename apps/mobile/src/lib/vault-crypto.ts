import { gcm } from '@noble/ciphers/aes.js';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { getRandomBytes } from 'expo-crypto';

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
 * Implémenté avec les libs noble (pur JS) pour fonctionner sur tous les
 * runtimes (web, Hermes, Expo Go, dev client) sans polyfill WebCrypto.
 * Random bytes via expo-crypto pour avoir une vraie entropie OS.
 */

const PBKDF2_ITERATIONS = 250_000;
const SALT_LEN = 16;
const IV_LEN = 12;
const MVK_LEN = 32;
const DEK_LEN = 32;

function randomBytes(len: number): Uint8Array {
  return getRandomBytes(len);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  if (typeof btoa === 'function') return btoa(s);
  // Fallback Hermes ne fournit pas btoa avant SDK 51 — utilisé seulement
  // si btoa est absent. Le fallback charge à la volée sans imposer de dep.
  throw new Error('btoa indisponible — installez un polyfill base64 (text-encoding-polyfill).');
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob !== 'function') {
    throw new Error('atob indisponible — installez un polyfill base64.');
  }
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Dérive la KEK par PBKDF2-HMAC-SHA256, sortie 32 octets (= un bloc).
 *
 * Implémentation custom chunkée : on fait 1 000 itérations sync, puis
 * on yield via `setTimeout(0)` (vrai macrotask) avant de continuer.
 * Sur Hermes (et V8), `await Promise.resolve()` ne suffit PAS — c'est
 * un microtask, le scheduler n'en profite pas pour rendre l'UI. Sans
 * `setTimeout`, l'app paraît figée plusieurs secondes pendant les
 * 250 000 itérations (cf. nextTick vide dans @noble/hashes 1.8).
 */
async function deriveKek(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const pwd = new TextEncoder().encode(password);
  const DK_LEN = 32; // = sha256.outputLen — un seul bloc T

  // U1 = HMAC(password, salt || INT_32_BE(1))
  const block1Salt = new Uint8Array(salt.length + 4);
  block1Salt.set(salt, 0);
  block1Salt[salt.length + 3] = 1;

  let u = hmac(sha256, pwd, block1Salt);
  const T = new Uint8Array(DK_LEN);
  T.set(u);

  // Boucle U2..Uc, en chunks pour libérer l'event loop régulièrement.
  const CHUNK = 1000;
  for (let i = 1; i < iterations; ) {
    const end = Math.min(i + CHUNK, iterations);
    for (let j = i; j < end; j++) {
      u = hmac(sha256, pwd, u);
      for (let k = 0; k < DK_LEN; k++) T[k] ^= u[k];
    }
    i = end;
    if (i < iterations) {
      // Vrai macrotask — laisse Hermes rendre l'UI / traiter les
      // touches. `Promise.resolve()` ne marcherait pas ici.

      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  return T;
}

function aesGcmEncrypt(key: Uint8Array, iv: Uint8Array, plaintext: Uint8Array): Uint8Array {
  return gcm(key, iv).encrypt(plaintext);
}

function aesGcmDecrypt(key: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  return gcm(key, iv).decrypt(ciphertext);
}

export type ActivationOutput = {
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
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
  const mvk = randomBytes(MVK_LEN);
  const salt = randomBytes(SALT_LEN);
  const kek = await deriveKek(password, salt, PBKDF2_ITERATIONS);
  const iv = randomBytes(IV_LEN);
  const wrapped = aesGcmEncrypt(kek, iv, mvk);

  // Pack iv ‖ ciphertext pour pouvoir tout retrouver côté unwrap.
  const packed = new Uint8Array(iv.length + wrapped.length);
  packed.set(iv, 0);
  packed.set(wrapped, iv.length);

  return {
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
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
  const salt = base64ToBytes(envelope.passwordSalt);
  const kek = await deriveKek(password, salt, envelope.kdfIterations);
  const packed = base64ToBytes(envelope.wrappedMvk);
  const iv = packed.slice(0, IV_LEN);
  const ct = packed.slice(IV_LEN);
  try {
    const mvk = aesGcmDecrypt(kek, iv, ct);
    if (mvk.length !== MVK_LEN) throw new Error('MVK length mismatch');
    return mvk;
  } catch {
    throw new Error('Mot de passe vault incorrect.');
  }
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
  const dek = randomBytes(DEK_LEN);

  // Chiffre le payload avec la DEK
  const iv = randomBytes(IV_LEN);
  const ciphertext = aesGcmEncrypt(dek, iv, plaintext);

  // Chiffre les métadonnées avec la même DEK
  const metaIv = randomBytes(IV_LEN);
  const metaPlain = new TextEncoder().encode(JSON.stringify(metadata));
  const metaCt = aesGcmEncrypt(dek, metaIv, metaPlain);

  // Wrap la DEK avec la MVK
  const dekIv = randomBytes(IV_LEN);
  const wrappedDekCt = aesGcmEncrypt(mvk, dekIv, dek);
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
  const dek = unwrapDek(mvk, wrappedDek);
  const ivBytes = base64ToBytes(metaIv);
  const ct = base64ToBytes(encryptedMetadata);
  const plain = aesGcmDecrypt(dek, ivBytes, ct);
  return JSON.parse(new TextDecoder().decode(plain));
}

export async function decryptFile(
  mvk: Uint8Array,
  ciphertext: Uint8Array,
  wrappedDek: string,
  iv: string,
): Promise<Uint8Array> {
  const dek = unwrapDek(mvk, wrappedDek);
  const ivBytes = base64ToBytes(iv);
  return aesGcmDecrypt(dek, ivBytes, ciphertext);
}

function unwrapDek(mvk: Uint8Array, wrappedDekB64: string): Uint8Array {
  const packed = base64ToBytes(wrappedDekB64);
  const iv = packed.slice(0, IV_LEN);
  const ct = packed.slice(IV_LEN);
  return aesGcmDecrypt(mvk, iv, ct);
}
