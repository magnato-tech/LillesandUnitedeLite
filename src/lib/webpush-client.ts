// Web Push subscription client utility for Lillesand United
// Supports iOS PWA and Android web push with VAPID authentication

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushSupportStatus {
  supported: boolean;
  permission: NotificationPermission;
  isIos: boolean;
  isStandalone: boolean; // iOS PWA requires standalone (added to Home Screen)
  needsHomeScreenInstall: boolean;
}

export function checkPushSupport(): PushSupportStatus {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      permission: 'default',
      isIos: false,
      isStandalone: false,
      needsHomeScreenInstall: false,
    };
  }

  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  const hasPush =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const permission =
    typeof Notification !== 'undefined' ? Notification.permission : 'default';

  const needsHomeScreenInstall = isIos && !isStandalone;

  return {
    supported: hasPush && (!isIos || isStandalone),
    permission,
    isIos,
    isStandalone,
    needsHomeScreenInstall,
  };
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('[WebPush Client] Failed to register service worker:', err);
    return null;
  }
}

export async function subscribeToWebPush(
  personId: string,
  topic: 'tournament' | 'alphaCourse' = 'tournament',
  courseId?: string
): Promise<{ success: boolean; error?: string; permissionState?: NotificationPermission }> {
  const status = checkPushSupport();

  if (status.needsHomeScreenInstall) {
    return {
      success: false,
      error: 'På iPhone/iPad må du legge appen til på Hjem-skjermen først for å motta pushvarsler.',
    };
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return {
      success: false,
      error: 'Pushvarsler støttes ikke i denne nettleseren.',
    };
  }

  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      return {
        success: false,
        permissionState: perm,
        error: perm === 'denied' ? 'Varsling ble blokkert i nettleseren.' : 'Varsling ble ikke godkjent.',
      };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: 'Kunne ikke initialisere Service Worker.' };
    }

    // Fetch public VAPID key
    const vapidRes = await fetch('/api/push/vapid-public-key');
    if (!vapidRes.ok) {
      throw new Error('Kunne ikke hente VAPID-nøkkel fra server.');
    }
    const { publicKey } = await vapidRes.json();
    if (!publicKey) {
      throw new Error('Ingen offentlig VAPID-nøkkel konfigurert.');
    }

    // Subscribe or get existing subscription
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const subJson = subscription.toJSON();

    // Send subscription to server
    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subJson,
        personId,
        topic,
        courseId,
      }),
    });

    if (!saveRes.ok) {
      const errData = await saveRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Serverfeil ved lagring av push-abonnement.');
    }

    return { success: true, permissionState: perm };
  } catch (err: any) {
    console.error('[WebPush Client] Error subscribing:', err);
    return { success: false, error: err?.message || 'Ukjent feil ved aktivering av pushvarsler.' };
  }
}

export async function sendTestPush(personId: string, topic: 'tournament' | 'alphaCourse' = 'tournament') {
  const res = await fetch('/api/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, topic }),
  });
  return res.json();
}
