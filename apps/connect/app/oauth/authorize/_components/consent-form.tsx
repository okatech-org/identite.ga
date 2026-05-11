"use client"

import { useState } from "react"

import { Button } from "@repo/ui/components/button"
import { IdnFlagBars } from "@repo/ui/components/idn-flag-bars"
import { IdnMark } from "@repo/ui/components/idn-mark"

interface ConsentFormProps {
  app: {
    clientId: string
    name: string
    icon: string | null
    requiredLoA: 1 | 2 | 3
  }
  user: {
    fullName: string
    email: string
    loa: 1 | 2 | 3
  }
  requestedScopes: string[]
  acrValues: string
  oauthParams: Record<string, string>
}

const CheckIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 12l5 5 9-11" />
  </svg>
)

const userInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("") || "?"

const claimsForScopes = (
  scopes: string[],
  user: ConsentFormProps["user"],
  requiredLoA: 1 | 2 | 3,
): { label: string; sub: string }[] => {
  const rows: { label: string; sub: string }[] = []
  const has = (s: string) => scopes.includes(s)

  if (has("profile") || has("openid")) {
    rows.push({
      label: "Identité pivot",
      sub: "nom, prénom, date de naissance, lieu de naissance",
    })
  }
  if (has("email")) {
    rows.push({
      label: "Email vérifié",
      sub: user.email,
    })
  }
  if (requiredLoA > 1 || scopes.some((s) => s.startsWith("loa:"))) {
    const exigence = requiredLoA > 1 ? ` (l'app exige ≥ ${requiredLoA})` : ""
    rows.push({
      label: "Niveau de garantie",
      sub: `Niveau ${user.loa}${exigence}`,
    })
  }
  if (has("idn:civil_status")) {
    rows.push({
      label: "État civil",
      sub: "situation matrimoniale, nationalité",
    })
  }
  return rows
}

export function ConsentForm({
  app,
  user,
  requestedScopes,
  acrValues,
  oauthParams,
}: ConsentFormProps) {
  const [submitting, setSubmitting] = useState<"deny" | "allow" | null>(null)
  const claims = claimsForScopes(requestedScopes, user, app.requiredLoA)
  void acrValues

  const submitDecision = async (decision: "allow" | "deny") => {
    setSubmitting(decision)
    const formData = new URLSearchParams()
    for (const [k, v] of Object.entries(oauthParams)) formData.set(k, v)
    formData.set("consent", decision === "allow" ? "true" : "false")
    try {
      const res = await fetch("/api/auth/oauth2/consent", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        redirect: "follow",
      })
      if (res.redirected) {
        window.location.assign(res.url)
        return
      }
      const fallback = await fetch("/api/auth/oauth/consent", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        redirect: "follow",
      })
      if (fallback.redirected) {
        window.location.assign(fallback.url)
        return
      }
      if (decision === "deny" && oauthParams.redirect_uri) {
        const url = new URL(oauthParams.redirect_uri)
        url.searchParams.set("error", "access_denied")
        if (oauthParams.state) url.searchParams.set("state", oauthParams.state)
        window.location.assign(url.toString())
      }
    } catch {
      setSubmitting(null)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-idn-bg p-10">
      <div className="w-[480px] rounded-2xl border border-idn-border bg-idn-surface p-9">
        <div className="mb-7 flex items-center gap-2">
          <IdnMark size={26} />
          <div className="text-[13px] font-semibold text-idn-ink">
            Identité Numérique
          </div>
          <div className="flex-1" />
          <IdnFlagBars width={24} height={2} />
        </div>

        <div className="mb-6 flex items-center justify-center gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0E7C3A] to-[#0A5C2C] text-lg font-semibold text-white">
            {userInitials(user.fullName)}
          </div>
          <div className="flex items-center gap-1 text-idn-muted">
            <span className="block h-1.5 w-1.5 rounded-full bg-current" />
            <span className="block h-1.5 w-1.5 rounded-full bg-current" />
            <span className="block h-1.5 w-1.5 rounded-full bg-current" />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-idn-border bg-idn-surface-2 text-[22px] font-semibold text-idn-ink">
            {app.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={app.icon}
                alt=""
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              app.name.trim().charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <h1 className="text-center text-[20px] font-semibold leading-[1.35] text-idn-ink">
          Connexion à <span className="text-idn-green">{app.name}</span>
        </h1>
        <p className="mt-2 text-center text-[13px] text-idn-muted">
          connecté en tant qu&apos;{" "}
          <b className="font-medium text-idn-ink">{user.fullName}</b>
        </p>

        <div className="mt-6 text-[11px] font-semibold uppercase tracking-[0.08em] text-idn-muted">
          VOUS PARTAGEREZ
        </div>
        <ul className="mt-2 overflow-hidden rounded-[10px] border border-idn-border">
          {claims.map((c, i) => (
            <li
              key={c.label}
              className={`flex items-center gap-2.5 bg-idn-surface px-3.5 py-3 ${
                i < claims.length - 1 ? "border-b border-idn-border-soft" : ""
              }`}
            >
              <span className="flex text-idn-green">
                <CheckIcon />
              </span>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-idn-ink">
                  {c.label}
                </div>
                <div className="mt-px text-xs text-idn-muted">{c.sub}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={submitting !== null}
            onClick={() => submitDecision("deny")}
          >
            {submitting === "deny" ? "…" : "Refuser"}
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            disabled={submitting !== null}
            onClick={() => submitDecision("allow")}
          >
            {submitting === "allow" ? "…" : "Autoriser"}
          </Button>
        </div>

        <p className="mt-3.5 text-center text-[11px] text-idn-muted">
          Révocable à tout moment dans{" "}
          <a
            href="https://identite.ga/consents"
            className="underline underline-offset-2 hover:text-idn-ink"
          >
            Mes consentements
          </a>
          .
        </p>
      </div>
    </main>
  )
}
