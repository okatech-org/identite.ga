type CrossDomainAuthClient = {
  getCookie?: () => string
}

/**
 * Le plugin crossDomain conserve les cookies Better Auth dans localStorage.
 * Le proxy Next.js a toutefois besoin d'une copie en document.cookie pour
 * authentifier une navigation browser classique vers /api/auth/*.
 */
export function syncCrossDomainCookiesForProxy(
  client: CrossDomainAuthClient,
): void {
  const cookieStr = client.getCookie?.()
  if (!cookieStr) return

  for (const kv of cookieStr.split(/;\s*/)) {
    if (!kv) continue
    // Le proxy remet ce préfixe avant l'envoi vers Convex. Le retirer ici
    // permet aussi au bridge de fonctionner sur http://localhost.
    const stripped = kv.replace(/^__Secure-/, "")
    document.cookie = `${stripped}; path=/; SameSite=Lax`
  }
}
