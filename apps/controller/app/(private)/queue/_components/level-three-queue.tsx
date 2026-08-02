"use client"

import * as React from "react"
import { useAction, useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import { ShieldCheckIcon, VideoIcon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import type { Id } from "@repo/backend/convex/_generated/dataModel"
import { Button } from "@repo/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog"
import { LiveVideoRoom } from "@repo/ui/components/live-video-room"
import { LoABadge } from "@repo/ui/components/loa-badge"
import { Textarea } from "@repo/ui/components/textarea"

import { IdnCard } from "../../../_components/idn-card"

type Credentials = {
  serverUrl: string
  token: string
  roomName: string
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  return error instanceof Error ? error.message : fallback
}

function formatAge(timestamp: number): string {
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h`
}

export function LevelThreeQueue() {
  const waiting = useQuery(api.level3.listWaiting, {})
  const current = useQuery(api.level3.myCurrent, {})
  const claim = useMutation(api.level3.claim)
  const beginInterview = useMutation(api.level3.beginInterview)
  const approve = useMutation(api.level3.approve)
  const reject = useMutation(api.level3.reject)
  const issueJoinToken = useAction(api.level3.livekit.issueJoinToken)
  const [pending, setPending] = React.useState<string | null>(null)
  const [credentials, setCredentials] = React.useState<Credentials | null>(null)
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [reason, setReason] = React.useState("")

  const onClaim = async (verificationId: Id<"level3Verification">) => {
    setPending(verificationId)
    try {
      await claim({ verificationId })
      toast.success("Entretien Niveau 3 pris en charge.")
    } catch (error) {
      toast.error(describeError(error, "Impossible de prendre cet entretien."))
    } finally {
      setPending(null)
    }
  }

  const onJoin = async () => {
    if (!current) return
    setPending("join")
    try {
      const token = await issueJoinToken({ verificationId: current._id })
      await beginInterview({ verificationId: current._id })
      setCredentials(token)
    } catch (error) {
      toast.error(describeError(error, "Impossible de rejoindre la salle."))
    } finally {
      setPending(null)
    }
  }

  const onApprove = async () => {
    if (!current) return
    setPending("approve")
    try {
      await approve({ verificationId: current._id })
      setCredentials(null)
      toast.success("Niveau 3 accordé.")
    } catch (error) {
      toast.error(describeError(error, "Impossible de valider l'entretien."))
    } finally {
      setPending(null)
    }
  }

  const onReject = async () => {
    if (!current || reason.trim().length < 5) {
      toast.error("Précisez le motif du refus (min. 5 caractères).")
      return
    }
    setPending("reject")
    try {
      await reject({ verificationId: current._id, reason: reason.trim() })
      setCredentials(null)
      setRejectOpen(false)
      setReason("")
      toast.success("Demande Niveau 3 refusée.")
    } catch (error) {
      toast.error(describeError(error, "Impossible de refuser l'entretien."))
    } finally {
      setPending(null)
    }
  }

  const fullName = current
    ? [current.citizen.firstName, current.citizen.lastName].filter(Boolean).join(" ") || "—"
    : ""

  return (
    <section className="mb-7">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-idn-green-soft text-idn-green">
          <VideoIcon className="size-4.5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-idn-ink">Entretiens vidéo Niveau 3</h2>
          <p className="text-xs text-idn-muted">
            Vérification en direct et décision manuelle du contrôleur
          </p>
        </div>
      </div>

      {current && (
        <IdnCard className="mb-4 border-idn-green/30">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
                Entretien en cours · {current.ref}
              </div>
              <div className="mt-1 text-base font-semibold text-idn-ink">{fullName}</div>
              <div className="mt-0.5 text-xs text-idn-muted">
                {current.citizen.idnId ?? "Identifiant IDN non renseigné"}
              </div>
            </div>
            <LoABadge level={3} compact />
            {!credentials && (
              <Button disabled={pending !== null} onClick={onJoin}>
                <VideoIcon aria-hidden="true" />
                {pending === "join" ? "Connexion…" : "Démarrer l'entretien"}
              </Button>
            )}
          </div>

          {credentials && (
            <div className="mt-5">
              <LiveVideoRoom
                {...credentials}
                className="h-[min(62vh,660px)]"
                onDisconnected={() => setCredentials(null)}
                onError={(error) => toast.error(error.message)}
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button disabled={pending !== null} onClick={onApprove}>
                  <ShieldCheckIcon aria-hidden="true" />
                  {pending === "approve" ? "Validation…" : "Valider le Niveau 3"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={pending !== null}
                  onClick={() => setRejectOpen(true)}
                  className="text-[#B83A3A] hover:bg-[#FBE5E5] hover:text-[#B83A3A]"
                >
                  Refuser
                </Button>
                <Button variant="outline" onClick={() => setCredentials(null)}>
                  Quitter la salle
                </Button>
              </div>
            </div>
          )}
        </IdnCard>
      )}

      {waiting === undefined ? (
        <IdnCard>
          <div className="h-10 animate-pulse rounded bg-idn-surface-2" />
        </IdnCard>
      ) : waiting.length === 0 ? (
        !current && (
          <IdnCard>
            <p className="text-sm text-idn-muted">Aucun entretien Niveau 3 en attente.</p>
          </IdnCard>
        )
      ) : (
        <IdnCard className="overflow-hidden p-0">
          {waiting.map((item, index) => (
            <div
              key={item._id}
              className={
                index === waiting.length - 1
                  ? "flex items-center gap-4 px-5 py-4"
                  : "flex items-center gap-4 border-b border-idn-border-soft px-5 py-4"
              }
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-idn-ink">{item.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-idn-muted">
                  {item.ref} · attente {formatAge(item.requestedAt)}
                </p>
              </div>
              <LoABadge level={3} compact />
              <Button
                size="sm"
                disabled={pending !== null || current !== null}
                onClick={() => onClaim(item._id)}
              >
                {pending === item._id ? "…" : "Prendre l'entretien"}
              </Button>
            </div>
          ))}
        </IdnCard>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande Niveau 3</DialogTitle>
            <DialogDescription>
              Le citoyen recevra ce motif. La décision est enregistrée dans le journal d&apos;audit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Identité non concordante, document non présenté…"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button
              variant="ghost"
              disabled={pending === "reject"}
              onClick={onReject}
              className="text-[#B83A3A] hover:bg-[#FBE5E5] hover:text-[#B83A3A]"
            >
              {pending === "reject" ? "…" : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
