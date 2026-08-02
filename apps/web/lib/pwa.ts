export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function captureInstallPrompt(
  onChange: (available: boolean) => void,
): () => void {
  const handler = (event: Event) => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    onChange(true);
  };
  const installed = () => {
    deferredInstallPrompt = null;
    onChange(false);
  };
  window.addEventListener("beforeinstallprompt", handler);
  window.addEventListener("appinstalled", installed);
  onChange(deferredInstallPrompt !== null);
  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
    window.removeEventListener("appinstalled", installed);
  };
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  await deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice.outcome === "accepted") deferredInstallPrompt = null;
  return choice.outcome === "accepted";
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(normalized);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let index = 0; index < raw.length; index += 1)
    bytes[index] = raw.charCodeAt(index);
  return bytes;
}

export function supportsPushNotifications(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function getOrCreatePushSubscription(
  publicKey: string,
): Promise<PushSubscription> {
  const registration = await registerServiceWorker();
  if (!registration) throw new Error("Service worker indisponible");
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;
  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
}

export function subscriptionPayload(subscription: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
} {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Abonnement push incomplet");
  }
  return {
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
    userAgent: navigator.userAgent,
  };
}

export async function currentPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

export function isInstalledPwa(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function isIosDevice(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
