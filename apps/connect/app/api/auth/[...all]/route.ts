import { NextRequest, NextResponse } from "next/server"

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL

if (!CONVEX_SITE_URL) {
  console.error("missing envar CONVEX_SITE_URL")
}

const isDev = process.env.NODE_ENV !== "production"

const HOP_BY_HOP = new Set([
  "transfer-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  // Node's fetch décompresse automatiquement la réponse upstream. Si on
  // forward `content-encoding: gzip|br|...` au browser alors que le body
  // est déjà en clair, le browser plante avec ERR_CONTENT_DECODING_FAILED.
  // Idem `content-length` qui ne correspond plus à la taille décompressée.
  "content-encoding",
  "content-length",
])

async function proxyToConvex(req: NextRequest): Promise<NextResponse> {
  if (!CONVEX_SITE_URL) {
    return NextResponse.json(
      { error: "CONVEX_SITE_URL not configured" },
      { status: 500 },
    )
  }

  const url = new URL(req.url)
  const targetUrl = `${CONVEX_SITE_URL}${url.pathname}${url.search}`

  const proxyHeaders: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key)) {
      proxyHeaders[key] = value
    }
  })
  // NB : ne PAS forcer `accept-encoding: application/json` (faute initiale —
  // c'est une valeur Accept, pas Accept-Encoding). Ça confondait Better Auth
  // qui retournait `{ redirect: true, url }` JSON au lieu d'un 302 sur les
  // redirects du flow OAuth (/oauth2/authorize, /oauth2/consent). On laisse
  // l'`Accept` du browser passer tel quel — Better Auth voit alors
  // `text/html` et renvoie un vrai 302.
  proxyHeaders["host"] = new URL(CONVEX_SITE_URL).host

  // En dev, le plugin crossDomainClient stocke la session dans localStorage
  // (pas dans des cookies HTTP). Le client la copie ensuite vers document.
  // cookie pour qu'elle voyage avec la requête vers le proxy. Comme le
  // browser refuse les cookies `__Secure-` sur http://localhost, le client
  // strip ce préfixe à l'écriture. Ici (à l'aller vers Convex) on remet le
  // préfixe, sinon le middleware session côté Convex (baseURL https) ne
  // trouve pas le cookie qu'il a posé.
  if (isDev && proxyHeaders["cookie"]) {
    proxyHeaders["cookie"] = proxyHeaders["cookie"]
      .split(/;\s*/)
      .map((kv) => {
        const eq = kv.indexOf("=")
        if (eq < 0) return kv
        const name = kv.slice(0, eq)
        if (/^better-auth\./.test(name)) {
          return `__Secure-${kv}`
        }
        return kv
      })
      .join("; ")
  }

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log("[auth-proxy]", req.method, url.pathname, {
      cookie: proxyHeaders["cookie"] ?? "(none)",
    })
  }
  // NB : on n'ajoute PLUS de préfixe `__Secure-` aux cookies sortants.
  // Test direct via curl montre que Convex accepte `better-auth.session_token`
  // tel quel (le strip à l'aller-retour est symétrique). Garder une version
  // commentée au cas où le besoin réapparaît.
  // if (isDev && proxyHeaders["cookie"]) { ... }

  try {
    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.arrayBuffer()
        : undefined

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: proxyHeaders,
      redirect: "manual",
      body,
      // @ts-expect-error duplex required for streaming body
      duplex: "half",
    })

    const responseBody = await upstream.arrayBuffer()
    const headers = new Headers()

    upstream.headers.forEach((value, key) => {
      const lk = key.toLowerCase()
      if (lk === "set-cookie" || HOP_BY_HOP.has(lk)) return
      headers.set(key, value)
    })

    // Re-écriture des Set-Cookie : en dev, le navigateur refuse les
    // cookies `__Secure-` / `Secure` posés sur http://localhost. On strip.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setCookies = (upstream.headers as any).getSetCookie?.() as
      | string[]
      | undefined
    if (setCookies && setCookies.length > 0) {
      const rewritten = isDev
        ? setCookies.map((cookie: string) =>
            cookie.replaceAll("__Secure-", "").replace(/;\s*Secure/gi, ""),
          )
        : setCookies
      for (const cookie of rewritten) {
        headers.append("set-cookie", cookie)
      }
    }

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers,
    })
  } catch (error) {
    console.error("[auth] proxy error:", error)
    return NextResponse.json({ error: "Internal auth error" }, { status: 502 })
  }
}

export async function GET(req: NextRequest) {
  return proxyToConvex(req)
}
export async function POST(req: NextRequest) {
  return proxyToConvex(req)
}
export async function PUT(req: NextRequest) {
  return proxyToConvex(req)
}
export async function PATCH(req: NextRequest) {
  return proxyToConvex(req)
}
export async function DELETE(req: NextRequest) {
  return proxyToConvex(req)
}
export async function OPTIONS(req: NextRequest) {
  return proxyToConvex(req)
}
