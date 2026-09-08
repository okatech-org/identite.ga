type RedirectPayload = {
  redirect?: unknown
  url?: unknown
}

/**
 * Better Auth renvoie `{ redirect: true, url }` quand le fetch serveur du
 * proxy porte `sec-fetch-mode: cors`. Pour une navigation HTML initiée par le
 * navigateur, le proxy doit restaurer le 302 attendu par le protocole OAuth.
 */
export function getBrowserRedirectUrl({
  requestMode,
  requestAccept,
  responseStatus,
  responseContentType,
  responseBody,
}: {
  requestMode: string | null
  requestAccept: string | null
  responseStatus: number
  responseContentType: string | null
  responseBody: ArrayBuffer
}): string | null {
  const isDocumentNavigation =
    requestMode === "navigate" || requestAccept?.includes("text/html") === true

  if (
    !isDocumentNavigation ||
    responseStatus < 200 ||
    responseStatus >= 300 ||
    !responseContentType?.toLowerCase().includes("application/json")
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      new TextDecoder().decode(responseBody),
    ) as RedirectPayload
    if (payload.redirect !== true || typeof payload.url !== "string") {
      return null
    }

    const url = new URL(payload.url)
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}
