export interface DirectoryResolveRequest {
  sub?: string
  nip?: string
  emailAlias?: string
  name?: string
  limit?: number
}

export type DirectoryResolveRequestResult =
  | { ok: true; value: DirectoryResolveRequest }
  | {
      ok: false
      error: "invalid_body" | "missing_query" | "ambiguous_query" | "invalid_limit"
      message: string
    }

const MAX_RESULTS = 20

/**
 * Valide le contrat HTTP de l'annuaire partenaire sans dépendre de Convex.
 * Un appel doit porter exactement un critère : l'ordre des propriétés du
 * JSON ne doit jamais modifier l'identité recherchée.
 */
export function parseDirectoryResolveRequest(
  body: unknown,
): DirectoryResolveRequestResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      ok: false,
      error: "invalid_body",
      message: "Le corps JSON doit être un objet.",
    }
  }

  const raw = body as Record<string, unknown>
  const stringValue = (value: unknown) =>
    typeof value === "string" && value.trim() ? value.trim() : undefined
  const criteria = {
    sub: stringValue(raw.sub),
    nip: stringValue(raw.nip),
    emailAlias: stringValue(raw.emailAlias)?.toLowerCase(),
    name: stringValue(raw.name),
  }
  const count = Object.values(criteria).filter(Boolean).length

  if (count === 0) {
    return {
      ok: false,
      error: "missing_query",
      message: "Un critère parmi sub | nip | emailAlias | name est requis.",
    }
  }
  if (count !== 1) {
    return {
      ok: false,
      error: "ambiguous_query",
      message: "Un seul critère parmi sub | nip | emailAlias | name est autorisé.",
    }
  }

  if (
    raw.limit !== undefined &&
    (typeof raw.limit !== "number" ||
      !Number.isInteger(raw.limit) ||
      raw.limit < 1 ||
      raw.limit > MAX_RESULTS)
  ) {
    return {
      ok: false,
      error: "invalid_limit",
      message: `limit doit être un entier compris entre 1 et ${MAX_RESULTS}.`,
    }
  }

  return {
    ok: true,
    value: {
      ...criteria,
      ...(raw.limit !== undefined ? { limit: raw.limit as number } : {}),
    },
  }
}
