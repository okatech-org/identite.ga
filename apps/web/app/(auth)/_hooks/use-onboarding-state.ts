"use client"

/**
 * Helpers sessionStorage pour l'état du tunnel d'onboarding.
 *
 * Pourquoi sessionStorage : avant la création du compte (étapes 1 à 3),
 * aucun user n'existe en BD — on ne peut pas persister côté serveur.
 * sessionStorage isole le state à l'onglet, est nettoyé à la fermeture,
 * et n'est pas accessible cross-origin.
 *
 * Tous les accès passent par ces helpers — pas d'usage direct du
 * sessionStorage ailleurs.
 */

const KEY_PROFILE = "idn:onboarding:profile"
const KEY_PIVOT = "idn:onboarding:pivot"
const KEY_HANDLE = "idn:onboarding:handle"
// Conservé pour les flows forgot-password / reset-password (email externe
// pré-rempli entre les deux écrans). Pas utilisé par le tunnel d'inscription.
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

export type OnboardingPivot = {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: "F" | "M" | "O" | "N"
  birthPlace: string
  nationality: string
  phone?: string
  nip?: string
}

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

export function getOnboardingPivot(): OnboardingPivot | null {
  const raw = safeStorage()?.getItem(KEY_PIVOT)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as OnboardingPivot
    if (
      typeof parsed?.firstName === "string" &&
      typeof parsed?.lastName === "string" &&
      typeof parsed?.dateOfBirth === "string" &&
      (parsed.gender === "F" || parsed.gender === "M" || parsed.gender === "O" || parsed.gender === "N") &&
      typeof parsed?.birthPlace === "string" &&
      typeof parsed?.nationality === "string"
    ) {
      return parsed
    }
  } catch {
    /* ignore */
  }
  return null
}

export function setOnboardingPivot(pivot: OnboardingPivot) {
  safeStorage()?.setItem(KEY_PIVOT, JSON.stringify(pivot))
}

export function getOnboardingHandle(): string | null {
  return safeStorage()?.getItem(KEY_HANDLE) ?? null
}

export function setOnboardingHandle(handle: string) {
  safeStorage()?.setItem(KEY_HANDLE, handle)
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
  s?.removeItem(KEY_PIVOT)
  s?.removeItem(KEY_HANDLE)
  s?.removeItem(KEY_EMAIL)
}
