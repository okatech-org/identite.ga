"use client";

import * as React from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import {
  CalendarDaysIcon,
  Clock3Icon,
  PlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserRoundIcon,
  VideoIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@repo/backend/convex/_generated/api";
import type { Id } from "@repo/backend/convex/_generated/dataModel";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { LiveVideoRoom } from "@repo/ui/components/live-video-room";
import { LoABadge } from "@repo/ui/components/loa-badge";
import { Textarea } from "@repo/ui/components/textarea";

import { IdnCard } from "../../../_components/idn-card";

type Credentials = {
  serverUrl: string;
  token: string;
  roomName: string;
};

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Libreville",
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Libreville",
  hour: "2-digit",
  minute: "2-digit",
});

function describeError(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return error instanceof Error ? error.message : fallback;
}

function librevilleTimestamp(date: string, time: string): number {
  return Date.parse(`${date}T${time}:00+01:00`);
}

function tomorrowInLibreville(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Libreville",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

export function LevelThreeQueue() {
  const appointments = useQuery(api.level3.scheduling.myAppointments, {});
  const availability = useQuery(api.level3.scheduling.myAvailability, {});
  const createAvailability = useMutation(
    api.level3.scheduling.createAvailability,
  );
  const cancelAvailability = useMutation(
    api.level3.scheduling.cancelAvailability,
  );
  const beginInterview = useMutation(api.level3.beginInterview);
  const approve = useMutation(api.level3.approve);
  const reject = useMutation(api.level3.reject);
  const issueJoinToken = useAction(api.level3.livekit.issueJoinToken);

  const [date, setDate] = React.useState(tomorrowInLibreville);
  const [startsAt, setStartsAt] = React.useState("08:00");
  const [endsAt, setEndsAt] = React.useState("12:00");
  const [duration, setDuration] = React.useState<30 | 45 | 60>(30);
  const [pending, setPending] = React.useState<string | null>(null);
  const [credentials, setCredentials] = React.useState<Credentials | null>(
    null,
  );
  const [activeVerificationId, setActiveVerificationId] =
    React.useState<Id<"level3Verification"> | null>(null);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const activeAppointment = appointments?.find(
    (appointment) => appointment._id === activeVerificationId,
  );

  const onCreateAvailability = async (event: React.FormEvent) => {
    event.preventDefault();
    const start = librevilleTimestamp(date, startsAt);
    const end = librevilleTimestamp(date, endsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      toast.error("Date ou horaire invalide.");
      return;
    }
    setPending("create");
    try {
      const result = await createAvailability({
        startsAt: start,
        endsAt: end,
        durationMinutes: duration,
      });
      toast.success(
        `${result.created} créneau${result.created > 1 ? "x" : ""} publié${result.created > 1 ? "s" : ""}.`,
      );
    } catch (error) {
      toast.error(
        describeError(error, "Impossible de publier cette disponibilité."),
      );
    } finally {
      setPending(null);
    }
  };

  const onCancelSlot = async (slotId: Id<"level3AppointmentSlot">) => {
    setPending(slotId);
    try {
      await cancelAvailability({ slotId });
      toast.success("Créneau retiré.");
    } catch (error) {
      toast.error(describeError(error, "Impossible de retirer ce créneau."));
    } finally {
      setPending(null);
    }
  };

  const onJoin = async (verificationId: Id<"level3Verification">) => {
    setPending(verificationId);
    try {
      const token = await issueJoinToken({ verificationId });
      await beginInterview({ verificationId });
      setActiveVerificationId(verificationId);
      setCredentials(token);
    } catch (error) {
      toast.error(describeError(error, "Impossible de rejoindre la salle."));
    } finally {
      setPending(null);
    }
  };

  const onApprove = async () => {
    if (!activeVerificationId) return;
    setPending("approve");
    try {
      await approve({ verificationId: activeVerificationId });
      setCredentials(null);
      setActiveVerificationId(null);
      toast.success("Niveau 3 accordé.");
    } catch (error) {
      toast.error(describeError(error, "Impossible de valider l'entretien."));
    } finally {
      setPending(null);
    }
  };

  const onReject = async () => {
    if (!activeVerificationId || reason.trim().length < 5) {
      toast.error("Précisez le motif du refus (min. 5 caractères).");
      return;
    }
    setPending("reject");
    try {
      await reject({
        verificationId: activeVerificationId,
        reason: reason.trim(),
      });
      setCredentials(null);
      setActiveVerificationId(null);
      setRejectOpen(false);
      setReason("");
      toast.success("Demande Niveau 3 refusée.");
    } catch (error) {
      toast.error(describeError(error, "Impossible de refuser l'entretien."));
    } finally {
      setPending(null);
    }
  };

  return (
    <section className="mb-7 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-idn-green-soft text-idn-green">
          <CalendarDaysIcon className="size-4.5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-idn-ink">
            Agenda des entretiens Niveau 3
          </h2>
          <p className="text-xs text-idn-muted">
            Disponibilités, rendez-vous et entretiens vidéo · heure de
            Libreville
          </p>
        </div>
      </div>

      {credentials && activeAppointment && (
        <IdnCard className="border-idn-green/30">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-idn-muted">
                Entretien en cours · {activeAppointment.ref}
              </p>
              <p className="mt-1 text-base font-semibold text-idn-ink">
                {[
                  activeAppointment.citizen.firstName,
                  activeAppointment.citizen.lastName,
                ]
                  .filter(Boolean)
                  .join(" ") || "Citoyen IDN"}
              </p>
            </div>
            <LoABadge level={3} compact />
          </div>
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
        </IdnCard>
      )}

      <IdnCard>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-idn-blue-soft text-idn-blue">
            <PlusIcon className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-idn-ink">
              Publier une disponibilité
            </h3>
            <p className="mt-0.5 text-xs text-idn-muted">
              La plage sera automatiquement découpée en rendez-vous réservables.
            </p>
          </div>
        </div>
        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-end"
          onSubmit={onCreateAvailability}
        >
          <label className="space-y-1.5 text-xs font-medium text-idn-muted">
            Date
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-idn-muted">
            Début
            <Input
              type="time"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-idn-muted">
            Fin
            <Input
              type="time"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium text-idn-muted">
            Durée
            <select
              value={duration}
              onChange={(event) =>
                setDuration(Number(event.target.value) as 30 | 45 | 60)
              }
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </label>
          <Button type="submit" disabled={pending !== null}>
            {pending === "create" ? "Publication…" : "Publier"}
          </Button>
        </form>
      </IdnCard>

      <IdnCard className="overflow-hidden p-0">
        <div className="border-b border-idn-border-soft px-5 py-4">
          <h3 className="text-sm font-semibold text-idn-ink">
            Mes prochains rendez-vous
          </h3>
          <p className="mt-0.5 text-xs text-idn-muted">
            La salle ouvre automatiquement 15 minutes avant chaque entretien.
          </p>
        </div>
        {appointments === undefined ? (
          <div className="m-5 h-12 animate-pulse rounded bg-idn-surface-2" />
        ) : appointments.length === 0 ? (
          <p className="px-5 py-6 text-sm text-idn-muted">
            Aucun rendez-vous réservé.
          </p>
        ) : (
          appointments.map((appointment) => {
            const fullName =
              [appointment.citizen.firstName, appointment.citizen.lastName]
                .filter(Boolean)
                .join(" ") || "Citoyen IDN";
            const canJoin =
              appointment.status === "in_interview" ||
              (now >= appointment.scheduledAt - 15 * 60 * 1000 &&
                now <= appointment.scheduledEndAt + 30 * 60 * 1000);
            return (
              <div
                key={appointment._id}
                className="flex flex-col gap-3 border-b border-idn-border-soft px-5 py-4 last:border-b-0 sm:flex-row sm:items-center"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-idn-green-soft text-idn-green">
                  <UserRoundIcon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-idn-ink">
                    {fullName}
                  </p>
                  <p className="mt-0.5 text-xs capitalize text-idn-muted">
                    {dateTimeFormatter.format(appointment.scheduledAt)} –{" "}
                    {timeFormatter.format(appointment.scheduledEndAt)}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-idn-muted">
                    {appointment.ref} · {appointment.citizen.idnId ?? "IDN"}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={
                    pending !== null || !canJoin || credentials !== null
                  }
                  onClick={() => void onJoin(appointment._id)}
                >
                  <VideoIcon aria-hidden="true" />
                  {pending === appointment._id
                    ? "Connexion…"
                    : canJoin
                      ? "Rejoindre"
                      : `À ${timeFormatter.format(appointment.joinOpensAt)}`}
                </Button>
              </div>
            );
          })
        )}
      </IdnCard>

      <IdnCard className="overflow-hidden p-0">
        <div className="border-b border-idn-border-soft px-5 py-4">
          <h3 className="text-sm font-semibold text-idn-ink">
            Mes créneaux publiés
          </h3>
          <p className="mt-0.5 text-xs text-idn-muted">
            Les créneaux réservés restent dans l&apos;agenda.
          </p>
        </div>
        {availability === undefined ? (
          <div className="m-5 h-12 animate-pulse rounded bg-idn-surface-2" />
        ) : availability.filter((slot) => slot.status !== "cancelled")
            .length === 0 ? (
          <p className="px-5 py-6 text-sm text-idn-muted">
            Aucune disponibilité publiée.
          </p>
        ) : (
          availability
            .filter((slot) => slot.status !== "cancelled")
            .map((slot) => (
              <div
                key={slot._id}
                className="flex items-center gap-3 border-b border-idn-border-soft px-5 py-3 last:border-b-0"
              >
                <Clock3Icon className="size-4 shrink-0 text-idn-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize text-idn-ink">
                    {dateTimeFormatter.format(slot.startsAt)} –{" "}
                    {timeFormatter.format(slot.endsAt)}
                  </p>
                  <p className="mt-0.5 text-xs text-idn-muted">
                    {slot.status === "booked"
                      ? `Réservé · ${slot.citizenName ?? "Citoyen IDN"}`
                      : "Disponible"}
                  </p>
                </div>
                {slot.status === "available" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pending !== null}
                    aria-label="Retirer ce créneau"
                    onClick={() => void onCancelSlot(slot._id)}
                  >
                    <Trash2Icon aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))
        )}
      </IdnCard>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la demande Niveau 3</DialogTitle>
            <DialogDescription>
              Le citoyen recevra ce motif. La décision est enregistrée dans le
              journal d&apos;audit.
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
  );
}
