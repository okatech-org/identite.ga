import { zxcvbnOptions, zxcvbnAsync } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import * as zxcvbnFrPackage from "@zxcvbn-ts/language-fr";

/**
 * Validation force du mot de passe selon §6.2 du cahier :
 *   • ≥ 12 caractères
 *   • zxcvbn score ≥ 3 ("strong")
 *   • non listé dans HIBP (k-anonymity)
 *
 * À appeler côté serveur (mutation Convex wrapper) AVANT signup, ou via
 * un before-hook Better Auth. Ce module est utilisable côté front aussi
 * (mêmes règles, validation locale + serveur pour défense en profondeur).
 */

zxcvbnOptions.setOptions({
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
    ...zxcvbnFrPackage.dictionary,
  },
});

export const MIN_PASSWORD_LENGTH = 12;
export const MIN_ZXCVBN_SCORE = 3;

export type PasswordValidationResult =
  | { ok: true; score: 3 | 4 }
  | {
      ok: false;
      code: "too_short" | "weak" | "breached";
      message: string;
      score?: number;
    };

/**
 * Vérifie qu'un mot de passe respecte la politique IDN.
 * Combine zxcvbn-ts + check HIBP k-anonymity (Have I Been Pwned).
 */
export async function validatePasswordStrength(
  password: string,
  userInputs: string[] = [],
): Promise<PasswordValidationResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      code: "too_short",
      message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    };
  }

  const result = await zxcvbnAsync(password, userInputs);
  if (result.score < MIN_ZXCVBN_SCORE) {
    return {
      ok: false,
      code: "weak",
      message:
        result.feedback.warning ||
        "Mot de passe trop prévisible. Combinez plusieurs mots, chiffres et symboles.",
      score: result.score,
    };
  }

  // HIBP k-anonymity — envoie seulement les 5 premiers caractères du SHA-1.
  const breached = await isPasswordBreached(password);
  if (breached) {
    return {
      ok: false,
      code: "breached",
      message:
        "Ce mot de passe figure dans une fuite de données publique. Choisissez-en un autre.",
    };
  }

  return { ok: true, score: result.score as 3 | 4 };
}

/**
 * Have I Been Pwned — k-anonymity range API.
 * On envoie les 5 premiers caractères du SHA-1 (hex), HIBP renvoie
 * tous les hashes commençant par ce préfixe + le nombre d'occurrences.
 * On ne révèle JAMAIS le mot de passe lui-même.
 *
 * Doc : https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  const sha1 = await sha1Hex(password);
  const prefix = sha1.slice(0, 5).toUpperCase();
  const suffix = sha1.slice(5).toUpperCase();

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" }, // padding contre attaques par taille
    });
    if (!res.ok) return false; // fail-open : ne bloque pas si HIBP est down
    const text = await res.text();
    return text
      .split("\n")
      .some((line) => line.split(":")[0]?.trim() === suffix);
  } catch {
    return false; // fail-open
  }
}

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
