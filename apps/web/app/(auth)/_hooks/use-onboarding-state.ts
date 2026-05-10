"use client"

/**
 * Helpers sessionStorage pour l'état du tunnel d'onboarding.
 *
 * Pourquoi sessionStorage : avant la création du compte (étapes 1 et 2),
 * aucun user n'existe en BD — on ne peut pas persister côté serveur.
 * sessionStorage isole le state à l'onglet, est nettoyé à la fermeture,
 * et n'est pas accessible cross-origin.
 *
 * Tous les accès passent par ces helpers — pas d'usage direct du
 * sessionStorage ailleurs.
 */

const KEY_PROFILE = "idn:onboarding:profile"
const KEY_EMAIL = "idn:onboarding:email"

export type OnboardingProfile =
  | "citizen"
  | "resident"
  | "visitor"
  | "developer"

export const PROFILE_TYPES: OnboardingProfile[] = [
  "citizen",
  "resident",
  "visitor",
  "developer",
]

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function getOnboardingProfile(): OnboardingProfile | null {
  const v = safeStorage()?.getItem(KEY_PROFILE)
  return PROFILE_TYPES.includes(v as OnboardingProfile)
    ? (v as OnboardingProfile)
    : null
}

export function setOnboardingProfile(value: OnboardingProfile) {
  safeStorage()?.setItem(KEY_PROFILE, value)
}

export function getOnboardingEmail(): string | null {
  return safeStorage()?.getItem(KEY_EMAIL) ?? null
}

export function setOnboardingEmail(email: string) {
  safeStorage()?.setItem(KEY_EMAIL, email)
}

export function clearOnboardingState() {
  const s = safeStorage()
  s?.removeItem(KEY_PROFILE)
  s?.removeItem(KEY_EMAIL)
}
