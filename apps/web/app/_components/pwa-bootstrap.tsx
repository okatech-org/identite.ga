"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import {
  BellRingIcon,
  DownloadIcon,
  SmartphoneIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@repo/backend/convex/_generated/api";
import { Button } from "@repo/ui/components/button";

import {
  captureInstallPrompt,
  currentPushSubscription,
  getOrCreatePushSubscription,
  isInstalledPwa,
  isIosDevice,
  promptInstall,
  registerServiceWorker,
  subscriptionPayload,
  supportsPushNotifications,
} from "../../lib/pwa";

export function PwaBootstrap() {
  const pushStatus = useQuery(api.pushSubscriptions.getMyStatus, {});
  const subscribe = useMutation(api.pushSubscriptions.subscribe);
  const [installAvailable, setInstallAvailable] = React.useState(false);
  const [installed, setInstalled] = React.useState(false);
  const [permission, setPermission] = React.useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [pending, setPending] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(true);
  const [ios, setIos] = React.useState(false);

  React.useEffect(() => {
    setInstalled(isInstalledPwa());
    setIos(isIosDevice());
    setPermission(
      supportsPushNotifications() ? Notification.permission : "unsupported",
    );
    setDismissed(
      window.sessionStorage.getItem("idn:pwa-prompt-dismissed") === "1",
    );
    void registerServiceWorker();
    return captureInstallPrompt(setInstallAvailable);
  }, []);

  React.useEffect(() => {
    if (!pushStatus?.configured || permission !== "granted") return;
    void (async () => {
      const existing = await currentPushSubscription();
      if (existing) await subscribe(subscriptionPayload(existing));
    })();
  }, [permission, pushStatus?.configured, subscribe]);

  const onInstall = async () => {
    setPending(true);
    try {
      if (await promptInstall()) {
        setInstalled(true);
        setInstallAvailable(false);
        toast.success("Identité Numérique est installée.");
      }
    } finally {
      setPending(false);
    }
  };

  const onEnablePush = async () => {
    if (!pushStatus?.publicKey) {
      toast.error(
        "Les notifications sur l'appareil ne sont pas encore configurées.",
      );
      return;
    }
    setPending(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        toast.error(
          "Autorisez les notifications dans les réglages du navigateur.",
        );
        return;
      }
      const deviceSubscription = await getOrCreatePushSubscription(
        pushStatus.publicKey,
      );
      await subscribe(subscriptionPayload(deviceSubscription));
      toast.success("Les notifications sont activées sur cet appareil.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Activation impossible.",
      );
    } finally {
      setPending(false);
    }
  };

  const shouldShow =
    !dismissed &&
    ((!installed && (installAvailable || ios)) ||
      (permission === "default" &&
        pushStatus?.configured &&
        !pushStatus.enabled));
  if (!shouldShow) return null;

  return (
    <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-card p-4 shadow-2xl sm:flex sm:items-center sm:gap-4">
      <button
        type="button"
        aria-label="Fermer"
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-secondary"
        onClick={() => {
          window.sessionStorage.setItem("idn:pwa-prompt-dismissed", "1");
          setDismissed(true);
        }}
      >
        <XIcon className="size-4" />
      </button>
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-idn-green-soft text-idn-green">
        <SmartphoneIcon className="size-5" />
      </div>
      <div className="mt-3 min-w-0 flex-1 sm:mt-0">
        <p className="text-sm font-semibold text-foreground">
          Gardez vos rendez-vous avec vous
        </p>
        <p className="mt-0.5 pr-5 text-xs leading-relaxed text-muted-foreground">
          {ios && !installed
            ? "Dans Safari, touchez Partager puis « Sur l’écran d’accueil » pour installer l’application."
            : "Installez l’application et recevez les confirmations et rappels Niveau 3."}
        </p>
      </div>
      <div className="mt-3 flex shrink-0 flex-wrap gap-2 sm:mt-0 sm:flex-col">
        {!installed && installAvailable && (
          <Button size="sm" disabled={pending} onClick={onInstall}>
            <DownloadIcon /> Installer
          </Button>
        )}
        {permission === "default" && pushStatus?.configured && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={onEnablePush}
          >
            <BellRingIcon /> Activer les alertes
          </Button>
        )}
      </div>
    </aside>
  );
}

export function PwaDeviceSettings() {
  const pushStatus = useQuery(api.pushSubscriptions.getMyStatus, {});
  const subscribe = useMutation(api.pushSubscriptions.subscribe);
  const unsubscribe = useMutation(api.pushSubscriptions.unsubscribe);
  const [permission, setPermission] = React.useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [pending, setPending] = React.useState(false);
  const [installAvailable, setInstallAvailable] = React.useState(false);
  const [installed, setInstalled] = React.useState(false);
  const [ios, setIos] = React.useState(false);

  React.useEffect(() => {
    setInstalled(isInstalledPwa());
    setIos(isIosDevice());
    setPermission(
      supportsPushNotifications() ? Notification.permission : "unsupported",
    );
    void registerServiceWorker();
    return captureInstallPrompt(setInstallAvailable);
  }, []);

  const onEnable = async () => {
    if (!pushStatus?.publicKey) return;
    setPending(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") return;
      const deviceSubscription = await getOrCreatePushSubscription(
        pushStatus.publicKey,
      );
      await subscribe(subscriptionPayload(deviceSubscription));
      toast.success("Notifications activées sur cet appareil.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Activation impossible.",
      );
    } finally {
      setPending(false);
    }
  };

  const onDisable = async () => {
    setPending(true);
    try {
      const deviceSubscription = await currentPushSubscription();
      if (deviceSubscription) {
        await unsubscribe({ endpoint: deviceSubscription.endpoint });
        await deviceSubscription.unsubscribe();
      }
      toast.success("Notifications désactivées sur cet appareil.");
    } finally {
      setPending(false);
    }
  };

  if (pushStatus === undefined) {
    return <div className="h-28 animate-pulse rounded-xl bg-secondary" />;
  }

  return (
    <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
      <div>
        <div className="flex items-center gap-2">
          <BellRingIcon className="size-4 text-idn-green" />
          <p className="text-sm font-semibold text-foreground">
            Application et notifications
          </p>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {ios && !installed
            ? "Sur iPhone ou iPad : Safari → Partager → Sur l’écran d’accueil. Les notifications pourront ensuite être activées dans l’application installée."
            : permission === "denied"
              ? "Les notifications sont bloquées dans les réglages de votre navigateur."
              : pushStatus.enabled
                ? `${pushStatus.subscriptionCount} appareil${pushStatus.subscriptionCount > 1 ? "s" : ""} abonné${pushStatus.subscriptionCount > 1 ? "s" : ""}.`
                : "Recevez les confirmations et rappels de rendez-vous, même lorsque le site est fermé."}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
        {!installed && installAvailable && (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              const accepted = await promptInstall();
              setInstalled(accepted || isInstalledPwa());
              setPending(false);
            }}
          >
            <DownloadIcon /> Installer l&apos;application
          </Button>
        )}
        {permission === "granted" && pushStatus.enabled ? (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={onDisable}
          >
            Désactiver sur cet appareil
          </Button>
        ) : permission !== "unsupported" &&
          permission !== "denied" &&
          pushStatus.configured ? (
          <Button size="sm" disabled={pending} onClick={onEnable}>
            <BellRingIcon /> Activer les notifications
          </Button>
        ) : null}
      </div>
    </div>
  );
}
