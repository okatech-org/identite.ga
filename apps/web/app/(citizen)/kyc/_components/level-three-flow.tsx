"use client";

import * as React from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import {
  BellRingIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
  VideoIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/button";
import { LiveVideoRoom } from "@repo/ui/components/live-video-room";

type Credentials = {
  serverUrl: string;
  token: string;
  roomName: string;
};

const JOIN_EARLY_MS = 15 * 60 * 1000;
const JOIN_LATE_MS = 30 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Libreville",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Libreville",
  hour: "2-digit",
  minute: "2-digit",
});

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function formatAppointment(startsAt: number, endsAt?: number): string {
  const end = endsAt ? ` – ${timeFormatter.format(endsAt)}` : "";
  return `${dateFormatter.format(startsAt)} · ${timeFormatter.format(startsAt)}${end}`;
}

function groupSlots<T extends { startsAt: number }>(
  slots: T[],
): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const slot of slots) {
    const key = dateFormatter.format(slot.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), slot]);
  }
  return [...groups.entries()];
}

export function LevelThreeFlow({ currentLoa }: { currentLoa: number }) {
  const verification = useQuery(api.level3.getMine, {});
  // Entrée unifiée : `level3.start` n'est plus qu'un alias de compatibilité.
  const requestVerification = useMutation(api.verification.request);
  const cancel = useMutation(api.level3.cancel);
  const book = useMutation(api.level3.scheduling.book);
  const issueJoinToken = useAction(api.level3.livekit.issueJoinToken);
  const shouldLoadSlots =
    verification !== undefined &&
    verification !== null &&
    (verification.status === "waiting_controller" ||
      verification.status === "claimed");
  const slots = useQuery(
    api.level3.scheduling.listAvailable,
    shouldLoadSlots ? {} : "skip",
  );
  const [pending, setPending] = React.useState<string | null>(null);
  const [credentials, setCredentials] = React.useState<Credentials | null>(
    null,
  );
  const [showSlots, setShowSlots] = React.useState(false);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const onStart = async () => {
    setPending("start");
    try {
      await requestVerification({ targetLoa: 3 });
      toast.success("Choisissez maintenant votre créneau d'entretien.");
    } catch (error) {
      toast.error(errorMessage(error, "Impossible de démarrer le parcours."));
    } finally {
      setPending(null);
    }
  };

  const onCancel = async () => {
    if (!verification) return;
    setPending("cancel");
    try {
      await cancel({ verificationId: verification._id });
      setShowSlots(false);
      toast.success("Demande d'entretien annulée.");
    } catch (error) {
      toast.error(errorMessage(error, "Impossible d'annuler la demande."));
    } finally {
      setPending(null);
    }
  };

  const onBook = async (slotId: Id<"level3AppointmentSlot">) => {
    if (!verification) return;
    setPending(slotId);
    try {
      await book({ verificationId: verification._id, slotId });
      setShowSlots(false);
      toast.success("Votre rendez-vous Niveau 3 est confirmé.");
    } catch (error) {
      toast.error(errorMessage(error, "Ce créneau n'est plus disponible."));
    } finally {
      setPending(null);
    }
  };

  const onJoin = async () => {
    if (!verification) return;
    setPending("join");
    try {
      setCredentials(
        await issueJoinToken({ verificationId: verification._id }),
      );
    } catch (error) {
      toast.error(errorMessage(error, "Impossible de rejoindre l'entretien."));
    } finally {
      setPending(null);
    }
  };

  if (verification === undefined) {
    return (
      <section className="mx-auto w-full max-w-[760px] px-5 py-6 md:px-7 md:py-8">
        <div className="h-52 animate-pulse rounded-2xl bg-secondary" />
      </section>
    );
  }

  if (
    credentials &&
    verification &&
    (verification.status === "claimed" ||
      verification.status === "in_interview")
  ) {
    return (
      <section className="mx-auto w-full max-w-[1120px] px-5 py-6 md:px-7 md:py-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Entretien sécurisé · Niveau 3
            </p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              Entretien avec {verification.controllerName ?? "le contrôleur"}
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
          Présentez votre pièce d&apos;identité à la caméra et répondez aux
          questions du contrôleur. Aucune vidéo n&apos;est enregistrée pour le
          moment.
        </p>
      </section>
    );
  }

  const status = verification?.status;
  const alreadyLevel3 = currentLoa >= 3 || status === "approved";
  const canStart =
    !alreadyLevel3 &&
    (!verification || status === "cancelled" || status === "rejected");
  const hasAppointment =
    verification &&
    (status === "claimed" || status === "in_interview") &&
    verification.scheduledAt !== undefined;
  const canJoinNow = Boolean(
    hasAppointment &&
    verification.scheduledAt !== undefined &&
    verification.scheduledEndAt !== undefined &&
    now >= verification.scheduledAt - JOIN_EARLY_MS &&
    now <= verification.scheduledEndAt + JOIN_LATE_MS,
  );

  return (
    <section className="mx-auto w-full max-w-[860px] px-5 py-6 md:px-7 md:py-8">
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
          Choisissez un rendez-vous avec un contrôleur habilité. Votre Niveau 2
          reste actif pendant toute la procédure.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Step
            icon={CalendarDaysIcon}
            title="Créneau au choix"
            body="Date et agent disponibles"
          />
          <Step
            icon={UserRoundCheckIcon}
            title="Contrôle humain"
            body="Pièce et identité vérifiées"
          />
          <Step
            icon={BellRingIcon}
            title="Rappel automatique"
            body="Notification la veille"
          />
        </div>

        {alreadyLevel3 && (
          <StatusPanel
            icon={CheckCircle2Icon}
            title="Niveau 3 accordé"
            body="Votre entretien a été validé. Votre profil bénéficie maintenant du niveau de garantie élevé."
          />
        )}

        {status === "waiting_controller" && verification && (
          <div className="mt-7 rounded-xl border border-idn-blue/30 bg-idn-blue-soft p-5 dark:border-[#1F3454] dark:bg-[#10243A]">
            <div className="flex items-start gap-3">
              <CalendarDaysIcon className="mt-0.5 size-5 shrink-0 text-idn-blue dark:text-idn-blue-on-dark" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Choisissez votre rendez-vous
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Tous les horaires sont affichés à l&apos;heure de Libreville.
                  Vous recevrez une confirmation puis un rappel la veille.
                </p>
              </div>
            </div>
            <SlotPicker slots={slots} pending={pending} onBook={onBook} />
            <Button
              className="mt-4"
              variant="ghost"
              disabled={pending !== null}
              onClick={onCancel}
            >
              {pending === "cancel" ? "Annulation…" : "Annuler la demande"}
            </Button>
          </div>
        )}

        {hasAppointment && verification.scheduledAt !== undefined && (
          <div className="mt-7 overflow-hidden rounded-xl border border-idn-green/30 bg-idn-green-soft/60">
            <div className="border-b border-idn-green/20 p-5 sm:flex sm:items-start sm:justify-between sm:gap-5">
              <div className="flex items-start gap-3">
                <CalendarDaysIcon className="mt-0.5 size-5 shrink-0 text-idn-green" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Votre entretien est planifié
                  </p>
                  <p className="mt-1 text-base font-semibold capitalize text-foreground">
                    {formatAppointment(
                      verification.scheduledAt,
                      verification.scheduledEndAt,
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Avec {verification.controllerName ?? "un contrôleur IDN"} ·
                    heure de Libreville
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0">
                <Button
                  disabled={pending !== null || !canJoinNow}
                  onClick={onJoin}
                >
                  <VideoIcon aria-hidden="true" />
                  {pending === "join" ? "Connexion…" : "Rejoindre l'entretien"}
                </Button>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted-foreground">
                {canJoinNow
                  ? "La salle est ouverte. Préparez votre pièce d'identité, votre caméra et votre micro."
                  : `La salle ouvrira 15 minutes avant le rendez-vous, à ${timeFormatter.format(
                      verification.scheduledAt - JOIN_EARLY_MS,
                    )}.`}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSlots((value) => !value)}
                >
                  {showSlots ? "Conserver ce créneau" : "Changer de créneau"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={pending !== null}
                  onClick={onCancel}
                >
                  {pending === "cancel"
                    ? "Annulation…"
                    : "Annuler le rendez-vous"}
                </Button>
              </div>
              {showSlots && (
                <SlotPicker slots={slots} pending={pending} onBook={onBook} />
              )}
            </div>
          </div>
        )}

        {status === "claimed" &&
          verification &&
          verification.scheduledAt === undefined && (
            <StatusPanel
              icon={VideoIcon}
              title="Le contrôleur vous attend"
              body="Cet entretien a été ouvert avant la mise en place des rendez-vous. Vous pouvez le rejoindre maintenant."
            >
              <Button disabled={pending !== null} onClick={onJoin}>
                <VideoIcon aria-hidden="true" />
                {pending === "join" ? "Connexion…" : "Rejoindre l'entretien"}
              </Button>
            </StatusPanel>
          )}

        {status === "rejected" && !alreadyLevel3 && (
          <StatusPanel
            icon={XCircleIcon}
            title="Demande non validée"
            body={
              verification?.rejectionReason ??
              "Le contrôleur n'a pas pu valider l'entretien."
            }
          />
        )}

        {canStart && (
          <div className="mt-7 flex flex-wrap gap-3">
            <Button size="lg" disabled={pending !== null} onClick={onStart}>
              <CalendarDaysIcon aria-hidden="true" />
              {pending === "start"
                ? "Création…"
                : status === "rejected"
                  ? "Choisir un nouveau rendez-vous"
                  : "Planifier mon entretien"}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/profile">Retour au profil</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function SlotPicker({
  slots,
  pending,
  onBook,
}: {
  slots:
    | Array<{
        _id: Id<"level3AppointmentSlot">;
        startsAt: number;
        endsAt: number;
        controllerName: string;
      }>
    | undefined;
  pending: string | null;
  onBook: (slotId: Id<"level3AppointmentSlot">) => Promise<void>;
}) {
  if (slots === undefined) {
    return (
      <div className="mt-5 h-24 animate-pulse rounded-xl bg-background/60" />
    );
  }
  if (slots.length === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-border bg-background/50 p-4">
        <p className="text-sm font-medium text-foreground">
          Aucun créneau disponible actuellement
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          De nouvelles disponibilités seront ajoutées par les contrôleurs.
          Revenez bientôt depuis votre profil.
        </p>
      </div>
    );
  }
  return (
    <div className="mt-5 space-y-5">
      {groupSlots(slots).map(([day, daySlots]) => (
        <div key={day}>
          <p className="text-xs font-semibold capitalize text-foreground">
            {day}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {daySlots.map((slot) => (
              <button
                key={slot._id}
                type="button"
                disabled={pending !== null}
                onClick={() => void onBook(slot._id)}
                className="rounded-xl border border-border bg-background p-3 text-left transition hover:border-idn-green hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock3Icon className="size-4 text-idn-green" />
                  {timeFormatter.format(slot.startsAt)} –{" "}
                  {timeFormatter.format(slot.endsAt)}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {slot.controllerName}
                </span>
                {pending === slot._id && (
                  <span className="mt-1 block text-xs font-medium text-idn-green">
                    Réservation…
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-4">
      <Icon className="size-5 text-idn-green" />
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}

function StatusPanel({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mt-7 rounded-xl border border-idn-blue/30 bg-idn-blue-soft p-5 dark:border-[#1F3454] dark:bg-[#10243A]">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-idn-blue dark:text-idn-blue-on-dark" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );
}
