import Link from "next/link";
import {
  BellRingIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  VideoIcon,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

const formatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Africa/Libreville",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function LevelThreeAppointmentCard({
  status,
  scheduledAt,
  controllerName,
  variant,
}: {
  status: string;
  scheduledAt?: number;
  controllerName?: string;
  variant: "desktop" | "mobile";
}) {
  const scheduled = status === "claimed" || status === "in_interview";
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-idn-green/25 bg-idn-green-soft/60",
        variant === "desktop" ? "min-h-[210px] p-6" : "p-5",
      )}
    >
      <div className="absolute -right-8 -top-10 size-32 rounded-full bg-idn-green/10" />
      <div className="relative">
        <div className="flex size-10 items-center justify-center rounded-xl bg-idn-green text-white">
          {scheduled ? (
            <CalendarDaysIcon className="size-5" />
          ) : (
            <VideoIcon className="size-5" />
          )}
        </div>
        <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-idn-green">
          Entretien Niveau 3
        </p>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          {scheduledAt
            ? "Votre rendez-vous est confirmé"
            : "Choisissez votre créneau"}
        </h2>
        {scheduledAt ? (
          <>
            <p className="mt-2 text-sm font-semibold capitalize text-foreground">
              {formatter.format(scheduledAt)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {controllerName ?? "Contrôleur IDN"} · heure de Libreville
            </p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <BellRingIcon className="size-3.5" /> Rappel automatique la veille
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Des contrôleurs ont publié leurs disponibilités. Réservez
            l&apos;horaire qui vous convient.
          </p>
        )}
        <Button asChild size="sm" className="mt-4">
          <Link href="/kyc?target=3">
            {scheduledAt ? "Voir le rendez-vous" : "Voir les créneaux"}
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
