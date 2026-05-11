"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useConvex, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"

import { fr } from "../../../../_content/fr"
import { CredRow } from "../../../../_components/cred-row"
import { OpHeader } from "../../../../_components/op-header"

const ISSUER = "https://identite.ga"
const DISCOVERY = `${ISSUER}/.well-known/openid-configuration`
const JWKS = `${ISSUER}/.well-known/jwks.json`

export default function AppKeysPage() {
  const params = useParams<{ appId: string }>()
  const clientId = String(params?.appId ?? "")
  const convex = useConvex()
  const app = useQuery(api.developer.apps.get, { clientId })
  const [rotating, setRotating] = useState(false)
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null)

  const handleRotate = async () => {
    if (
      !window.confirm(
        "Régénérer le secret invalide l'ancien. Continuer ?",
      )
    ) {
      return
    }
    setRotating(true)
    try {
      const res = (await convex.mutation(api.developer.apps.rotateSecret, {
        clientId,
      })) as { clientSecret: string }
      setRotatedSecret(res.clientSecret)
      toast.success("Nouveau secret généré.")
    } catch (err) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? ((err as { data?: { message?: string } }).data?.message ??
            "Erreur lors de la régénération.")
          : "Erreur lors de la régénération."
      toast.error(msg)
    } finally {
      setRotating(false)
    }
  }

  if (app === undefined) {
    return (
      <>
        <OpHeader sub={fr.keys.subTemplate.replace("{appName}", "…")} title={fr.keys.title} />
        <div className="flex-1 overflow-auto px-7 py-6 text-sm text-idn-muted">
          Chargement…
        </div>
      </>
    )
  }

  if (app === null) {
    return (
      <>
        <OpHeader
          sub={fr.keys.subTemplate.replace("{appName}", "—")}
          title={fr.keys.title}
        />
        <div className="flex-1 overflow-auto px-7 py-6">
          <div className="rounded-xl border border-idn-border bg-idn-surface p-6 text-sm text-idn-muted">
            Application introuvable.
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <OpHeader
        sub={fr.keys.subTemplate.replace("{appName}", app.name.toUpperCase())}
        title={fr.keys.title}
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            disabled={rotating}
          >
            {rotating ? "Génération…" : fr.keys.regenerate}
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-7 py-6">
        <div className="mx-auto max-w-[820px] space-y-5">
          {rotatedSecret ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                NOUVEAU CLIENT_SECRET — affiché une seule fois
              </div>
              <div className="mt-2 break-all rounded-md border border-idn-border bg-idn-surface-2 px-3 py-2 font-mono text-xs text-idn-ink">
                {rotatedSecret}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-idn-border bg-idn-surface p-6">
            <CredRow label={fr.keys.rows.issuer} value={ISSUER} />
            <CredRow label={fr.keys.rows.discovery} value={DISCOVERY} />
            <CredRow label={fr.keys.rows.clientId} value={app.clientId} />
            <CredRow
              label={fr.keys.rows.clientSecret}
              value="••••••••••••••••••••••••••••"
              secret
            />
            <CredRow
              label={fr.keys.rows.redirectUris}
              value={app.redirectUris.join(", ")}
            />
            <CredRow label={fr.keys.rows.jwks} value={JWKS} />
          </div>

          <div className="rounded-xl border border-idn-border bg-idn-surface p-6">
            <div className="text-[13px] font-semibold text-idn-ink">
              {fr.keys.integrationTitle}
            </div>
            <pre className="mt-2.5 overflow-x-auto rounded-md bg-[#0E110D] p-4 font-mono text-[12px] leading-[1.7] text-[#E6F2EA]">
{`import { genericOAuth } from "better-auth/plugins";
import { idn } from "@idn-ga/better-auth";

export const auth = betterAuth({
  plugins: [
    genericOAuth({ config: [idn({
      clientId: process.env.IDN_CLIENT_ID!,
      clientSecret: process.env.IDN_CLIENT_SECRET!,
    })]}),
  ],
});`}
            </pre>
          </div>
        </div>
      </div>
    </>
  )
}
