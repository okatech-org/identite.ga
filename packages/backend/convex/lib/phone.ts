const E164_REGEX = /^\+[1-9]\d{7,14}$/
const SUPPORTED_PREFIXES = ["+241", "+33"] as const

/**
 * Normalise un numéro historique du pivot vers E.164.
 *
 * Les numéros gabonais conservent le 0 national après +241 (format utilisé
 * dans le tunnel IDN). Le 0 initial français est retiré après +33.
 */
export function normalizeRecoveryPhone(
  rawPhone: string | undefined,
  nationality: string | undefined,
): string | null {
  if (!rawPhone) return null

  const compact = rawPhone.trim().replace(/[\s().-]/g, "")
  if (!compact) return null

  let candidate: string
  if (compact.startsWith("00")) {
    candidate = `+${compact.slice(2)}`
  } else if (compact.startsWith("+")) {
    candidate = compact
  } else if (nationality?.trim().toUpperCase() === "GA") {
    candidate = `+241${compact}`
  } else if (nationality?.trim().toUpperCase() === "FR") {
    candidate = `+33${compact.startsWith("0") ? compact.slice(1) : compact}`
  } else {
    return null
  }

  if (!E164_REGEX.test(candidate)) return null
  if (!SUPPORTED_PREFIXES.some((prefix) => candidate.startsWith(prefix))) {
    return null
  }
  return candidate
}
