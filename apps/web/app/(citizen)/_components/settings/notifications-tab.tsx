"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "@repo/backend/convex/_generated/api";
import { Switch } from "@repo/ui/components/switch";

import { settings } from "../../_content/fr";
import { SettingsSection } from "../settings-section";
import { PwaDeviceSettings } from "@/app/_components/pwa-bootstrap";

type Categories = "security" | "kyc" | "consent" | "comms";
type Channels = "email" | "inApp";

const CATS: Categories[] = ["security", "kyc", "consent", "comms"];

export function NotificationsTab() {
  const prefs = useQuery(api.preferences.getMyNotificationPreferences);
  const update = useMutation(api.preferences.updateMyNotificationPreferences);

  // Optimistic local state pour les toggles
  const [local, setLocal] = React.useState<{
    email: Record<Categories, boolean>;
    inApp: Record<Categories, boolean>;
  } | null>(null);

  React.useEffect(() => {
    if (prefs) {
      setLocal({
        email: { ...prefs.email },
        inApp: { ...prefs.inApp },
      });
    }
  }, [prefs]);

  const onToggle = async (
    channel: Channels,
    cat: Categories,
    value: boolean,
  ) => {
    if (!local) return;
    const next = {
      ...local,
      [channel]: { ...local[channel], [cat]: value },
    };
    setLocal(next);
    try {
      await update({ [channel]: next[channel] } as {
        email?: typeof next.email;
        inApp?: typeof next.inApp;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
      // Rollback
      setLocal(local);
    }
  };

  if (prefs === undefined || local === null) {
    return <div className="h-48 animate-pulse rounded-xl bg-secondary" />;
  }

  return (
    <SettingsSection
      title={settings.notifications.title}
      sub={settings.notifications.sub}
    >
      <PwaDeviceSettings />
      <div className="hidden border-b border-idn-border-soft pb-2 sm:grid sm:grid-cols-[1fr_80px_80px] sm:gap-4">
        <span className="text-xs font-medium text-muted-foreground">
          Catégorie
        </span>
        <span className="text-center text-xs font-medium text-muted-foreground">
          {settings.notifications.channels.email}
        </span>
        <span className="text-center text-xs font-medium text-muted-foreground">
          {settings.notifications.channels.inApp}
        </span>
      </div>
      {CATS.map((cat) => (
        <div
          key={cat}
          className="flex flex-col gap-2 border-b border-idn-border-soft py-4 last:border-b-0 sm:grid sm:grid-cols-[1fr_80px_80px] sm:items-center sm:gap-4"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {settings.notifications.categories[cat].label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {settings.notifications.categories[cat].help}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-center">
            <span className="text-xs text-muted-foreground sm:hidden">
              {settings.notifications.channels.email}
            </span>
            <Switch
              checked={local.email[cat]}
              onCheckedChange={(v) => void onToggle("email", cat, v)}
              aria-label={`${settings.notifications.channels.email} · ${settings.notifications.categories[cat].label}`}
            />
          </div>
          <div className="flex items-center gap-2 sm:justify-center">
            <span className="text-xs text-muted-foreground sm:hidden">
              {settings.notifications.channels.inApp}
            </span>
            <Switch
              checked={local.inApp[cat]}
              onCheckedChange={(v) => void onToggle("inApp", cat, v)}
              aria-label={`${settings.notifications.channels.inApp} · ${settings.notifications.categories[cat].label}`}
            />
          </div>
        </div>
      ))}
    </SettingsSection>
  );
}
