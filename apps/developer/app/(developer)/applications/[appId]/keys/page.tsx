"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useConvex, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"

import { fr } from "../../../../_content/fr"
import { ApplicationWorkspaceNav } from "../../../../_components/application-workspace-nav"
import { CredRow } from "../../../../_components/cred-row"
import { OpHeader } from "../../../../_components/op-header"

// Source unique : le custom domain HTTP Actions du déploiement Convex
// (cf. Dashboard Convex → Settings → Custom Domains). En prod = site.identite.ga,
// en dev = *.convex.site.
//
// @convex-dev/better-auth namespace ses routes sous /api/auth/convex/*
// → discovery et jwks sont exposés sur ce préfixe, pas sur /api/auth/ direct.
// L'issuer dans le JSON OIDC reste lui à la racine (site.identite.ga).
const SITE_URL = (
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "https://site.identite.ga"
).replace(/\/+$/, "")
const ISSUER = SITE_URL
const DISCOVERY = `${SITE_URL}/api/auth/convex/.well-known/openid-configuration`
const JWKS = `${SITE_URL}/api/auth/convex/jwks`

type ConvexErrorLike = { data?: { code?: string; message?: string } }

const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "data" in err) {
    return (err as ConvexErrorLike).data?.message ?? fallback
  }
  return fallback
}

export default function AppKeysPage() {
  const params = useParams<{ appId: string }>()
  const clientId = String(params?.appId ?? "")
  const convex = useConvex()
  const app = useQuery(api.developer.apps.get, { clientId })
  const [rotating, setRotating] = useState(false)
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null)
  const [newTestEmail, setNewTestEmail] = useState("")
  const [addingTestUser, setAddingTestUser] = useState(false)
  const [requestingProd, setRequestingProd] = useState(false)
  const [prodCreds, setProdCreds] = useState<null | {
    clientId: string
    clientSecret: string
  }>(null)

  useEffect(() => {
    setRotatedSecret(null)
    setProdCreds(null)
    setNewTestEmail("")
  }, [clientId])

  const handleAddTestUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = newTestEmail.trim().toLowerCase()
    if (!email) return
    setAddingTestUser(true)
    try {
      await convex.mutation(api.developer.apps.addTestUser, {
        clientId,
        email,
      })
      setNewTestEmail("")
      toast.success(`${email} ajouté.`)
    } catch (err) {
      toast.error(extractErrorMessage(err, fr.sandbox.errors.generic))
    } finally {
      setAddingTestUser(false)
    }
  }

  const handleRemoveTestUser = async (email: string) => {
    try {
      await convex.mutation(api.developer.apps.removeTestUser, {
        clientId,
        email,
      })
      toast.success(`${email} retiré.`)
    } catch (err) {
      toast.error(extractErrorMessage(err, fr.sandbox.errors.generic))
    }
  }

  const handleRequestProduction = async () => {
    if (!window.confirm(fr.sandbox.productionRequest.confirm)) return
    setRequestingProd(true)
    try {
      const res = (await convex.mutation(api.developer.apps.requestProduction, {
        clientId,
      })) as { clientId: string; clientSecret: string }
      setProdCreds({ clientId: res.clientId, clientSecret: res.clientSecret })
      toast.success("Demande envoyée.")
    } catch (err) {
      toast.error(extractErrorMessage(err, fr.sandbox.errors.generic))
    } finally {
      setRequestingProd(false)
    }
  }

  const handleSaveRedirectUris = async (uris: string[]) => {
    try {
      await convex.mutation(api.developer.apps.setRedirectUris, {
        clientId,
        redirectUris: uris,
      })
      toast.success(fr.keys.redirectUrisEditor.saved)
    } catch (err) {
      toast.error(extractErrorMessage(err, fr.sandbox.errors.generic))
    }
  }

  const handleRotate = async () => {
    if (!window.confirm("Régénérer le secret invalide l'ancien. Continuer ?")) {
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
        <OpHeader
          sub={fr.keys.subTemplate.replace("{appName}", "…")}
          title={fr.keys.title}
        />
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
          <ApplicationWorkspaceNav app={app} section="keys" />
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
            <CredRow label={fr.keys.rows.jwks} value={JWKS} />
          </div>

          <RedirectUrisSection
            key={app.redirectUris.join("|")}
            env={app.env}
            initialUris={app.redirectUris}
            onSave={handleSaveRedirectUris}
          />

          {app.env === "sandbox" ? (
            <>
              <SandboxTestUsersSection
                testUsers={app.testUsers}
                newTestEmail={newTestEmail}
                onChangeNewTestEmail={setNewTestEmail}
                onAdd={handleAddTestUser}
                onRemove={handleRemoveTestUser}
                adding={addingTestUser}
              />
              <ProductionRequestSection
                productionStatus={app.productionStatus}
                linkedClientId={app.linkedClientId}
                requestingProd={requestingProd}
                prodCreds={prodCreds}
                onRequestProduction={handleRequestProduction}
              />
            </>
          ) : null}

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

function RedirectUrisSection({
  env,
  initialUris,
  onSave,
}: {
  env: "production" | "sandbox"
  initialUris: string[]
  onSave: (uris: string[]) => Promise<void>
}) {
  const [uris, setUris] = useState<string[]>(
    initialUris.length > 0 ? initialUris : [""],
  )
  const [saving, setSaving] = useState(false)

  const update = (i: number, val: string) =>
    setUris((prev) => prev.map((u, idx) => (idx === i ? val : u)))
  const add = () => setUris((prev) => [...prev, ""])
  const remove = (i: number) =>
    setUris((prev) => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    const cleaned = uris.map((u) => u.trim()).filter(Boolean)
    if (cleaned.length === 0) {
      toast.error(fr.keys.redirectUrisEditor.atLeastOne)
      return
    }
    setSaving(true)
    try {
      await onSave(cleaned)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-idn-border bg-idn-surface p-6">
      <div className="text-[13px] font-semibold text-idn-ink">
        {fr.keys.redirectUrisEditor.title}
      </div>
      <p className="mt-1.5 text-xs text-idn-muted">
        {env === "production"
          ? fr.keys.redirectUrisEditor.descProd
          : fr.keys.redirectUrisEditor.desc}
      </p>
      <div className="mt-4 space-y-2">
        {uris.map((uri, i) => (
          <div key={i} className="flex gap-2">
            <Input
              type="url"
              inputMode="url"
              autoCapitalize="off"
              spellCheck={false}
              value={uri}
              onChange={(e) => update(i, e.target.value)}
              placeholder={fr.keys.redirectUrisEditor.placeholder}
              aria-label={`Redirect URI ${i + 1}`}
              className="flex-1 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={uris.length === 1}
              className="rounded px-2 text-idn-muted hover:bg-idn-surface-2 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={fr.keys.redirectUrisEditor.removeAria}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={add}>
          {fr.keys.redirectUrisEditor.addBtn}
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving
            ? fr.keys.redirectUrisEditor.saving
            : fr.keys.redirectUrisEditor.save}
        </Button>
      </div>
    </div>
  )
}

function SandboxTestUsersSection({
  testUsers,
  newTestEmail,
  onChangeNewTestEmail,
  onAdd,
  onRemove,
  adding,
}: {
  testUsers: string[]
  newTestEmail: string
  onChangeNewTestEmail: (v: string) => void
  onAdd: (e: React.FormEvent) => void
  onRemove: (email: string) => void
  adding: boolean
}) {
  return (
    <div className="rounded-xl border border-idn-border bg-idn-surface p-6">
      <div className="text-[13px] font-semibold text-idn-ink">
        {fr.sandbox.testUsersTitle}
      </div>
      <p className="mt-1.5 text-xs text-idn-muted">
        {fr.sandbox.testUsersDesc}
      </p>
      <form onSubmit={onAdd} className="mt-4 flex gap-2">
        <Input
          type="email"
          value={newTestEmail}
          onChange={(e) => onChangeNewTestEmail(e.target.value)}
          placeholder={fr.sandbox.addEmailPlaceholder}
          aria-label={fr.sandbox.addEmailPlaceholder}
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !newTestEmail.trim()}>
          {adding ? "…" : fr.sandbox.addBtn}
        </Button>
      </form>
      <div className="mt-4">
        {testUsers.length === 0 ? (
          <p className="rounded-md border border-dashed border-idn-border bg-idn-surface-2 px-3 py-3 text-center text-xs text-idn-muted">
            {fr.sandbox.testUsersEmpty}
          </p>
        ) : (
          <ul className="divide-y divide-idn-border-soft overflow-hidden rounded-md border border-idn-border">
            {testUsers.map((email) => (
              <li
                key={email}
                className="flex items-center gap-2 bg-idn-surface px-3 py-2"
              >
                <span className="flex-1 truncate font-mono text-xs text-idn-ink">
                  {email}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(email)}
                  className="rounded px-2 py-1 text-[11px] text-idn-muted hover:bg-idn-surface-2 hover:text-destructive"
                  aria-label={fr.sandbox.removeAriaTemplate.replace(
                    "{email}",
                    email,
                  )}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ProductionRequestSection({
  productionStatus,
  linkedClientId,
  requestingProd,
  prodCreds,
  onRequestProduction,
}: {
  productionStatus: "none" | "pending" | "approved" | "rejected"
  linkedClientId: string | null
  requestingProd: boolean
  prodCreds: { clientId: string; clientSecret: string } | null
  onRequestProduction: () => void
}) {
  return (
    <div className="rounded-xl border border-idn-border bg-idn-surface p-6">
      <div className="text-[13px] font-semibold text-idn-ink">
        {fr.sandbox.productionRequest.title}
      </div>
      {productionStatus === "none" ? (
        <>
          <p className="mt-1.5 text-sm text-idn-muted">
            {fr.sandbox.productionRequest.none}
          </p>
          <Button
            className="mt-4"
            onClick={onRequestProduction}
            disabled={requestingProd}
          >
            {requestingProd
              ? fr.sandbox.productionRequest.requestSubmitting
              : fr.sandbox.productionRequest.requestBtn}
          </Button>
        </>
      ) : null}
      {productionStatus === "pending" ? (
        <div className="mt-3 rounded-md border border-idn-border bg-idn-surface-2 p-3 text-sm">
          <div className="font-medium text-idn-ink">
            {fr.sandbox.productionRequest.pendingTitle}
          </div>
          <div className="mt-1 text-xs text-idn-muted">
            {fr.sandbox.productionRequest.pendingDesc}
          </div>
        </div>
      ) : null}
      {productionStatus === "approved" ? (
        <div className="mt-3 rounded-md border border-idn-green/40 bg-idn-green-soft p-3 text-sm dark:bg-[#0F2A18]">
          <div className="font-medium text-idn-green">
            {fr.sandbox.productionRequest.approvedTitle}
          </div>
          <div className="mt-1 text-xs text-idn-ink">
            {fr.sandbox.productionRequest.approvedDesc}
            {linkedClientId ? (
              <Link
                href={`/applications/${linkedClientId}/keys`}
                className="font-mono underline-offset-2 hover:underline"
              >
                {linkedClientId}
              </Link>
            ) : (
              "—"
            )}
          </div>
        </div>
      ) : null}
      {productionStatus === "rejected" ? (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <div className="font-medium text-destructive">
            {fr.sandbox.productionRequest.rejectedTitle}
          </div>
          <div className="mt-1 text-xs text-idn-ink">
            {fr.sandbox.productionRequest.rejectedDesc}
          </div>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={onRequestProduction}
            disabled={requestingProd}
          >
            {requestingProd
              ? fr.sandbox.productionRequest.requestSubmitting
              : fr.sandbox.productionRequest.requestBtn}
          </Button>
        </div>
      ) : null}
      {prodCreds ? (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
            {fr.sandbox.productionRequest.newCredentialsTitle}
          </div>
          <div className="mt-1.5 text-xs text-idn-ink">
            {fr.sandbox.productionRequest.newCredentialsWarning}
          </div>
          <dl className="mt-3 space-y-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                CLIENT_ID
              </dt>
              <dd className="mt-1 rounded-md border border-idn-border bg-idn-surface-2 px-2 py-1.5 font-mono text-[11px] text-idn-ink">
                {prodCreds.clientId}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-idn-muted">
                CLIENT_SECRET
              </dt>
              <dd className="mt-1 break-all rounded-md border border-idn-border bg-idn-surface-2 px-2 py-1.5 font-mono text-[11px] text-idn-ink">
                {prodCreds.clientSecret}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  )
}
