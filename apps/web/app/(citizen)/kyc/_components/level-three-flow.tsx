"use client"

import * as React from "react"
import Link from "next/link"
import { useAction, useMutation, useQuery } from "convex/react"
import { ConvexError } from "convex/values"
import {
  CheckCircle2Icon,
  Clock3Icon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
  VideoIcon,
  XCircleIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@repo/backend/convex/_generated/api"
import { Button } from "@repo/ui/components/button"
import { LiveVideoRoom } from "@repo/ui/components/live-video-room"

type Credentials = {
  serverUrl: string
  token: string
  roomName: string
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  return error instanceof Error ? error.message : fallback
}

export function LevelThreeFlow() {
  const verification = useQuery(api.level3.getMine, {})
  const start = useMutation(api.level3.start)
  const cancel = useMutation(api.level3.cancel)
  const issueJoinToken = useAction(api.level3.livekit.issueJoinToken)
  const [pending, setPending] = React.useState<"start" | "cancel" | "join" | null>(null)
  const [credentials, setCredentials] = React.useState<Credentials | null>(null)

  const onStart = async () => {
    setPending("start")
    try {
      await start({})
      toast.success("Demande d'entretien envoyée.")
    } catch (error) {
      toast.error(errorMessage(error, "Impossible de démarrer le parcours."))
    } finally {
      setPending(null)
    }
  }

  const onCancel = async () => {
    if (!verification) return
    setPending("cancel")
    try {
      await cancel({ verificationId: verification._id })
      toast.success("Demande annulée.")
    } catch (error) {
      toast.error(errorMessage(error, "Impossible d'annuler la demande."))
    } finally {
      setPending(null)
    }
  }

  const onJoin = async () => {
    if (!verification) return
    setPending("join")
    try {
      setCredentials(await issueJoinToken({ verificationId: verification._id }))
    } catch (error) {
      toast.error(errorMessage(error, "Impossible de rejoindre l'entretien."))
    } finally {
      setPending(null)
    }
  }

  if (verification === undefined) {
    return (
      <section className="mx-auto w-full max-w-[760px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-52 animate-pulse rounded-2xl bg-secondary" />
      </section>
    )
  }

  if (credentials && verification && ["claimed", "in_interview"].includes(verification.status)) {
    return (
      <section className="mx-auto w-full max-w-[1120px] px-5 py-6 md:px-7 md:py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Entretien sécurisé · Niveau 3
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              Entretien avec le contrôleur
            </h1>
          </div>
          <Button variant="outline" onClick={() => setCredentials(null)}>
            Quitter la salle
          </Button>
        </div>
        <LiveVideoRoom
          {...credentials}
          onDisconnected={() => setCredentials(null)}
          onError={(error) => toast.error(error.message)}
        />
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Présentez votre pièce d&apos;identité à la caméra et répondez aux questions du contrôleur.
          Aucune vidéo n&apos;est enregistrée dans ce MVP.
        </p>
      </section>
    )
  }

  const status = verification?.status
  const canStart = !verification || status === "cancelled" || status === "rejected"

  return (
    <section className="mx-auto w-full max-w-[760px] px-5 py-6 md:px-7 md:py-8">
      <div className="rounded-2xl border border-border bg-card p-7 sm:p-10">
        <div className="flex size-14 items-center justify-center rounded-full bg-idn-green-soft text-idn-green dark:text-idn-green-on-dark">
          <ShieldCheckIcon className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Vérification d&apos;identité · Niveau 3
        </p>
        <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.01em] text-foreground">
          Entretien vidéo avec un contrôleur
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Un contrôleur d&apos;identité vérifiera votre visage et votre pièce en direct, puis
          prendra lui-même la décision. Votre Niveau 2 reste actif pendant toute la procédure.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Step icon={VideoIcon} title="Entretien en direct" body="Caméra et micro requis" />
          <Step
            icon={UserRoundCheckIcon}
            title="Contrôle humain"
            body="Pièce et identité vérifiées"
          />
          <Step icon={CheckCircle2Icon} title="Décision" body="Validation par le contrôleur" />
        </div>

        {status === "waiting_controller" && verification && (
          <StatusPanel
            icon={Clock3Icon}
            title="En attente d'un contrôleur"
            body="Gardez cette page ouverte ou revenez depuis votre profil. Vous serez notifié dès qu'un contrôleur prendra votre demande."
          >
            <Button variant="outline" disabled={pending !== null} onClick={onCancel}>
              {pending === "cancel" ? "…" : "Annuler la demande"}
            </Button>
          </StatusPanel>
        )}

        {(status === "claimed" || status === "in_interview") && verification && (
          <StatusPanel
            icon={VideoIcon}
            title="Le contrôleur vous attend"
            body="Installez-vous dans un endroit calme, avec votre pièce d'identité à portée de main."
          >
            <Button disabled={pending !== null} onClick={onJoin}>
              <VideoIcon aria-hidden="true" />
              {pending === "join" ? "Connexion…" : "Rejoindre l'entretien"}
            </Button>
          </StatusPanel>
        )}

        {status === "approved" && (
          <StatusPanel
            icon={CheckCircle2Icon}
            title="Niveau 3 accordé"
            body="Votre entretien a été validé. Votre profil va afficher le nouveau niveau automatiquement."
          />
        )}

        {status === "rejected" && (
          <StatusPanel
            icon={XCircleIcon}
            title="Demande non validée"
            body={verification?.rejectionReason ?? "Le contrôleur n'a pas pu valider l'entretien."}
          />
        )}

        {canStart && (
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" disabled={pending !== null} onClick={onStart}>
              <VideoIcon aria-hidden="true" />
              {pending === "start"
                ? "Création…"
                : status === "rejected"
                  ? "Nouvelle demande"
                  : "Demander un entretien"}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/profile">Retour au profil</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <Icon className="size-5 text-idn-green" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  )
}

function StatusPanel({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <div className="mt-7 rounded-xl border border-idn-blue/30 bg-idn-blue-soft p-5 dark:border-[#1F3454] dark:bg-[#10243A]">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-idn-blue dark:text-idn-blue-on-dark" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  )
}
