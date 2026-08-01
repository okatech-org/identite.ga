export type KycTargetLoa = 2 | 3

export function isAllowedReturnTo(raw: string): boolean {
  try {
    const url = new URL(raw)
    if (url.protocol !== "https:" && url.protocol !== "http:") return false
    const host = url.hostname
    return (
      host === "identite.ga" ||
      host.endsWith(".identite.ga") ||
      host === "localhost" ||
      host === "127.0.0.1"
    )
  } catch {
    return false
  }
}

export function parseKycFlow(
  search: string,
  currentLoa: number,
): { returnTo: string | null; targetLoa: KycTargetLoa } {
  const params = new URLSearchParams(search)
  const rawReturnTo = params.get("return_to")
  const returnTo =
    rawReturnTo && isAllowedReturnTo(rawReturnTo) ? rawReturnTo : null
  const explicitTarget = params.get("target")
  const targetLoa: KycTargetLoa =
    explicitTarget === "3"
      ? 3
      : explicitTarget === "2"
        ? 2
        : returnTo || currentLoa < 2
          ? 2
          : currentLoa >= 3
            ? 3
            : 2

  return { returnTo, targetLoa }
}

export function buildKycPath({
  returnTo,
  targetLoa,
}: {
  returnTo: string
  targetLoa: KycTargetLoa
}): string {
  const params = new URLSearchParams({
    return_to: returnTo,
    target: String(targetLoa),
  })
  return `/kyc?${params.toString()}`
}
