"use client"

import { useState } from "react"

import { authClient } from "@/lib/auth-client"

export function SignInButton() {
  const [submitting, setSubmitting] = useState(false)

  const onClick = async () => {
    setSubmitting(true)
    try {
      // Le providerId "idn" est celui défini par notre helper @idn-ga/better-auth.
      const res = await authClient.signIn.oauth2({
        providerId: "idn",
        callbackURL: "/dashboard",
      })
      // En cas de succès, Better Auth redirige déjà. Si on arrive ici c'est
      // qu'il y a un souci.
      if (res?.error) {
        // eslint-disable-next-line no-console
        console.error("[idn] signIn error", res.error)
        alert(`Erreur : ${res.error.message ?? res.error.code ?? "inconnue"}`)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[idn] signIn threw", err)
      alert(`Erreur : ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={submitting}
      className="inline-flex items-center gap-2 rounded-lg bg-idn-green px-5 py-3 text-sm font-semibold text-white outline-none transition-colors hover:bg-idn-green/90 focus-visible:ring-2 focus-visible:ring-idn-green focus-visible:ring-offset-2 disabled:opacity-60"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
      >
        <rect x="2" y="2" width="28" height="28" rx="7" fill="white" />
        <g
          transform="translate(4 4)"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
          <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
          <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
          <path d="M2 12a10 10 0 0 1 18-6" />
          <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
        </g>
      </svg>
      {submitting ? "Redirection…" : "Se connecter avec Identité Numérique"}
    </button>
  )
}
