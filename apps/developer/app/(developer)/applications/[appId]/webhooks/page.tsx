"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import { Input } from "@repo/ui/components/input"
import { Label } from "@repo/ui/components/label"

import { OpHeader } from "../../../../_components/op-header"

type EventType =
  | "iboite.account.updated"
  | "identity.verification.created"
  | "identity.verification.updated"
  | "identity.verification.deleted"

const date = (value: number | null): string =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(value)
    : "—"

const errorMessage = (error: unknown): string =>
  error && typeof error === "object" && "data" in error
    ? ((error as { data?: { message?: string } }).data?.message ??
      "Opération impossible.")
    : "Opération impossible."

function EndpointCard({
  value,
  catalog,
}: {
  value: {
    endpoint: {
      id: Id<"webhookEndpoints">
      name: string
      url: string
      status: "pending" | "active" | "paused" | "disabled"
      verifiedAt: number | null
      consecutiveFailures: number
      pausedReason: string | null
    }
    subscriptions: EventType[]
  }
  catalog: EventType[]
}) {
  const deliveries = useQuery(api.webhooks.endpoints.listDeliveries, {
    endpointId: value.endpoint.id,
  })
  const challenge = useMutation(api.webhooks.endpoints.requestChallenge)
  const update = useMutation(api.webhooks.endpoints.update)
  const rotate = useMutation(api.webhooks.endpoints.rotateSecret)
  const resume = useMutation(api.webhooks.endpoints.resume)
  const disableEndpoint = useMutation(api.webhooks.endpoints.disable)
  const remove = useMutation(api.webhooks.endpoints.remove)
  const replay = useMutation(api.webhooks.endpoints.replay)
  const [revealedSecret, setRevealedSecret] = useState<{
    secret: string
    previousValidUntil: number
  } | null>(null)

  const edit = async () => {
    const name = window.prompt("Nom de l'endpoint", value.endpoint.name)
    if (name === null) return
    const url = window.prompt("URL HTTPS", value.endpoint.url)
    if (url === null) return
    const rawTypes = window.prompt(
      "Événements exacts, séparés par des virgules",
      value.subscriptions.join(", "),
    )
    if (rawTypes === null) return
    const eventTypes = [
      ...new Set(rawTypes.split(",").map((item) => item.trim())),
    ].filter((item): item is EventType => catalog.includes(item as EventType))
    try {
      await update({ endpointId: value.endpoint.id, name, url, eventTypes })
      toast.success("Endpoint mis à jour.")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <article className="rounded-xl border border-idn-border bg-idn-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-idn-ink">
              {value.endpoint.name}
            </h3>
            <span className="rounded-full bg-idn-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase text-idn-muted">
              {value.endpoint.status}
            </span>
          </div>
          <p className="mt-1 break-all font-mono text-xs text-idn-muted">
            {value.endpoint.url}
          </p>
          <p className="mt-2 text-xs text-idn-muted">
            Vérifié : {date(value.endpoint.verifiedAt)} · échecs consécutifs :{" "}
            {value.endpoint.consecutiveFailures}
            {value.endpoint.pausedReason
              ? ` · ${value.endpoint.pausedReason}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={edit}>
            Modifier
          </Button>
          {value.endpoint.status === "pending" ? (
            <Button
              size="sm"
              onClick={() =>
                void challenge({ endpointId: value.endpoint.id })
                  .then(() => toast.success("Challenge envoyé."))
                  .catch((error) => toast.error(errorMessage(error)))
              }
            >
              Activer
            </Button>
          ) : null}
          {value.endpoint.status === "active" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void challenge({ endpointId: value.endpoint.id })
                  .then(() => toast.success("Événement de test envoyé."))
                  .catch((error) => toast.error(errorMessage(error)))
              }
            >
              Tester
            </Button>
          ) : null}
          {value.endpoint.status === "paused" ||
          (value.endpoint.status === "disabled" &&
            value.endpoint.pausedReason !== "HTTP_410") ? (
            <Button
              size="sm"
              onClick={() =>
                void resume({ endpointId: value.endpoint.id })
                  .then(() => toast.success("Endpoint réactivé."))
                  .catch((error) => toast.error(errorMessage(error)))
              }
            >
              Réactiver
            </Button>
          ) : null}
          {value.endpoint.status !== "disabled" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                void disableEndpoint({ endpointId: value.endpoint.id })
                  .then(() => toast.success("Endpoint désactivé."))
                  .catch((error) => toast.error(errorMessage(error)))
              }
            >
              Désactiver
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void rotate({ endpointId: value.endpoint.id })
                .then((result) => {
                  setRevealedSecret(result)
                  toast.success("Secret tourné. L'ancien reste valable 24 h.")
                })
                .catch((error) => toast.error(errorMessage(error)))
            }
          >
            Tourner le secret
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!window.confirm("Supprimer cet endpoint ?")) return
              void remove({ endpointId: value.endpoint.id })
            }}
          >
            Supprimer
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {value.subscriptions.map((type) => (
          <span
            key={type}
            className="rounded-md bg-idn-green-soft px-2 py-1 font-mono text-[10px] text-idn-green"
          >
            {type}
          </span>
        ))}
      </div>

      {revealedSecret ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="text-xs font-semibold text-idn-ink">
            Nouveau secret — affiché une seule fois
          </div>
          <code className="mt-2 block break-all text-xs">
            {revealedSecret.secret}
          </code>
          <p className="mt-2 text-xs text-idn-muted">
            Ancien secret valable jusqu'au{" "}
            {date(revealedSecret.previousValidUntil)} · valeur Unix ms{" "}
            <code>{revealedSecret.previousValidUntil}</code>
          </p>
        </div>
      ) : null}

      <div className="mt-5 border-t border-idn-border pt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-idn-muted">
          Dernières livraisons
        </h4>
        {deliveries === undefined ? (
          <p className="mt-2 text-sm text-idn-muted">Chargement…</p>
        ) : deliveries.length === 0 ? (
          <p className="mt-2 text-sm text-idn-muted">Aucune livraison.</p>
        ) : (
          <ul className="mt-2 divide-y divide-idn-border">
            {deliveries.slice(0, 12).map((delivery) => (
              <li
                key={delivery.id}
                className="flex flex-wrap items-center gap-2 py-2 text-xs"
              >
                <code className="text-idn-ink">{delivery.eventId}</code>
                <span className="text-idn-muted">{delivery.eventType}</span>
                <span className="rounded bg-idn-surface-2 px-1.5 py-0.5 uppercase text-idn-muted">
                  {delivery.status}
                </span>
                <span className="text-idn-muted">
                  {delivery.attempts} tentative(s) · HTTP{" "}
                  {delivery.lastHttpStatus ?? "—"}
                </span>
                {delivery.status === "failed" ||
                delivery.status === "canceled" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto h-7"
                    onClick={() =>
                      void replay({ deliveryId: delivery.id }).catch((error) =>
                        toast.error(errorMessage(error)),
                      )
                    }
                  >
                    Rejouer
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}

export default function WebhooksPage() {
  const params = useParams<{ appId: string }>()
  const clientId = String(params.appId ?? "")
  const app = useQuery(api.developer.apps.get, { clientId })
  const endpoints = useQuery(api.webhooks.endpoints.list, { clientId })
  const catalog = useQuery(api.webhooks.endpoints.catalog, {})
  const apiKeys = useQuery(api.developer.apiKeys.listKeys, {})
  const createEndpoint = useMutation(api.webhooks.endpoints.create)
  const setScopes = useMutation(api.developer.apps.setScopes)
  const createKey = useMutation(api.developer.apiKeys.createKey)
  const attachKey = useMutation(api.developer.apiKeys.attachKeyToApp)
  const [name, setName] = useState("Webhook principal")
  const [url, setUrl] = useState("")
  const [selected, setSelected] = useState<EventType[]>([
    "iboite.account.updated",
  ])
  const [secret, setSecret] = useState<string | null>(null)
  const [m2mSecret, setM2mSecret] = useState<string | null>(null)

  if (
    app === undefined ||
    endpoints === undefined ||
    catalog === undefined ||
    apiKeys === undefined
  ) {
    return (
      <>
        <OpHeader title="Webhooks" sub="Chargement…" />
        <div className="p-7 text-sm text-idn-muted">Chargement…</div>
      </>
    )
  }
  if (!app) {
    return (
      <>
        <OpHeader title="Webhooks" sub="Application introuvable" />
        <div className="p-7">
          <Link href="/applications">Retour aux applications</Link>
        </div>
      </>
    )
  }
  const missingIboiteScopes = [
    "idn:iboite.read",
    "idn:iboite.manage",
    "idn:iboite.send",
    "offline_access",
  ].filter((scope) => !app.scopes.includes(scope))

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const result = await createEndpoint({
        clientId,
        name,
        url,
        eventTypes: selected,
      })
      setSecret(result.secret)
      setUrl("")
      toast.success(
        "Endpoint créé. Enregistrez le secret puis lancez le challenge.",
      )
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const enableIboiteScope = async () => {
    try {
      await setScopes({
        clientId,
        scopes: [
          ...new Set([
            ...app.scopes,
            "idn:iboite.read",
            "idn:iboite.manage",
            "idn:iboite.send",
            "offline_access",
          ]),
        ],
      })
      toast.success("Scopes iBoîte déclarés.")
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <OpHeader
        title="Webhooks"
        sub={`${app.name.toUpperCase()} · ${app.env}`}
      />
      <div className="flex-1 overflow-auto px-7 py-6">
        <div className="mx-auto max-w-[980px] space-y-5">
          <nav className="flex gap-3 text-sm">
            <Link
              className="text-idn-green hover:underline"
              href={`/applications/${clientId}/keys`}
            >
              Identifiants OAuth
            </Link>
            <Link
              className="text-idn-green hover:underline"
              href={`/applications/${clientId}/services`}
            >
              Services
            </Link>
          </nav>

          {missingIboiteScopes.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm text-idn-ink">
                Déclarez les scopes{" "}
                <code>{missingIboiteScopes.join(", ")}</code>
                pour l'intégration iBoîte complète.
              </p>
              <Button size="sm" onClick={enableIboiteScope}>
                Déclarer les scopes iBoîte
              </Button>
            </div>
          ) : null}

          <form
            onSubmit={create}
            className="rounded-xl border border-idn-border bg-idn-surface p-5"
          >
            <h2 className="font-semibold text-idn-ink">Nouvel endpoint</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="webhook-name">Nom</Label>
                <Input
                  id="webhook-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="webhook-url">URL HTTPS, port 443</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://app.ga/api/integrations/idn/webhooks"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  required
                />
              </div>
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-idn-ink">
                Événements exacts
              </legend>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {catalog.map((item) => (
                  <label
                    key={item.type}
                    className="flex items-start gap-2 rounded-lg border border-idn-border p-3 text-sm"
                  >
                    <input
                      className="mt-1"
                      type="checkbox"
                      checked={selected.includes(item.type)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, item.type]
                            : current.filter((type) => type !== item.type),
                        )
                      }
                    />
                    <span>
                      <span className="block font-mono text-xs text-idn-ink">
                        {item.type}
                      </span>
                      <span className="text-xs text-idn-muted">
                        {item.label} · {item.authorization} ·{" "}
                        {item.requiredScope}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Button
              className="mt-4"
              size="sm"
              type="submit"
              disabled={!url || selected.length === 0}
            >
              Créer l'endpoint
            </Button>
            {secret ? (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
                <strong>Secret affiché une seule fois :</strong>
                <code className="mt-2 block break-all">{secret}</code>
              </div>
            ) : null}
          </form>

          <section className="space-y-3">
            <h2 className="font-semibold text-idn-ink">
              Endpoints ({endpoints.length})
            </h2>
            {endpoints.length === 0 ? (
              <p className="rounded-xl border border-idn-border bg-idn-surface p-5 text-sm text-idn-muted">
                Aucun endpoint enregistré.
              </p>
            ) : (
              endpoints.map((endpoint) => (
                <EndpointCard
                  key={endpoint.endpoint.id}
                  value={endpoint}
                  catalog={catalog.map((item) => item.type)}
                />
              ))
            )}
          </section>

          <section className="rounded-xl border border-idn-border bg-idn-surface p-5">
            <h2 className="font-semibold text-idn-ink">
              Clé M2M liée à cette application
            </h2>
            <p className="mt-1 text-sm text-idn-muted">
              Requise pour les événements de vérification et le dépôt de
              courriers officiels.
            </p>
            {apiKeys.some((key) => key.appClientId === clientId) ? (
              <ul className="mt-3 space-y-2 text-sm">
                {apiKeys
                  .filter((key) => key.appClientId === clientId)
                  .map((key) => (
                    <li key={key.id} className="font-mono text-idn-muted">
                      {key.name} · {key.tokenPrefix} · {key.status}
                    </li>
                  ))}
              </ul>
            ) : null}
            {apiKeys.some(
              (key) => key.appClientId === null && key.status === "active",
            ) ? (
              <div className="mt-4 rounded-lg border border-idn-border p-3">
                <p className="text-xs font-semibold text-idn-ink">
                  Rattacher une clé historique sans changer ses scopes
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {apiKeys
                    .filter(
                      (key) =>
                        key.appClientId === null && key.status === "active",
                    )
                    .map((key) => (
                      <Button
                        key={key.id}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void attachKey({
                            keyId: key.id,
                            appClientId: clientId,
                          })
                            .then(() => toast.success(`${key.name} rattachée.`))
                            .catch((error) => toast.error(errorMessage(error)))
                        }
                      >
                        {key.name} · {key.tokenPrefix}
                      </Button>
                    ))}
                </div>
              </div>
            ) : null}
            <Button
              className="mt-4"
              size="sm"
              variant="outline"
              onClick={() =>
                void createKey({
                  appClientId: clientId,
                  name: `${app.name} — intégration M2M`,
                  scopes: [
                    "idn:verification:list",
                    "idn:iboite:letters:create",
                  ],
                  expiresInDays: 365,
                })
                  .then((result) => setM2mSecret(result.token))
                  .catch((error) => toast.error(errorMessage(error)))
              }
            >
              Créer la clé M2M
            </Button>
            {m2mSecret ? (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
                <strong>Clé affichée une seule fois :</strong>
                <code className="mt-2 block break-all">{m2mSecret}</code>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  )
}
