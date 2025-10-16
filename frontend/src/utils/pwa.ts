// PWA utilities for service worker registration and push notifications

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Convert VAPID public key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('Service worker registered:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');
            // Optionally notify user to refresh
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications are not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('Already subscribed to push notifications');
      return subscription;
    }

    // Request notification permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Subscribe to push notifications
    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID public key not configured');
      return null;
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    console.log('Subscribed to push notifications:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Send subscription to backend
 */
export async function sendSubscriptionToBackend(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const token = localStorage.getItem('smartq_token') || localStorage.getItem('token');
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription,
        userId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to backend');
    }

    console.log('Subscription sent to backend');
    return true;
  } catch (error) {
    console.error('Failed to send subscription to backend:', error);
    return false;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true;
    }

    const success = await subscription.unsubscribe();
    console.log('Unsubscribed from push notifications');
    return success;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Check if PWA is installed
 */
export function isPWAInstalled(): boolean {
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  
  // Check if running as PWA on iOS
  const isIOSPWA = (window.navigator as any).standalone === true;
  
  return isStandalone || isIOSPWA;
}

/**
 * Track visit count for install prompt
 */
export function trackVisit(): number {
  const visitKey = 'pwa_visit_count';
  const count = parseInt(localStorage.getItem(visitKey) || '0', 10);
  const newCount = count + 1;
  localStorage.setItem(visitKey, newCount.toString());
  return newCount;
}

/**
 * Check if should show install prompt
 */
export function shouldShowInstallPrompt(): boolean {
  if (isPWAInstalled()) {
    return false;
  }

  const visitCount = parseInt(localStorage.getItem('pwa_visit_count') || '0', 10);
  const hasPrompted = localStorage.getItem('pwa_install_prompted') === 'true';
  
  // Show after 3 visits and if not already prompted
  return visitCount >= 3 && !hasPrompted;
}

/**
 * Mark install prompt as shown
 */
export function markInstallPromptShown(): void {
  localStorage.setItem('pwa_install_prompted', 'true');
}

/**
 * Initialize PWA features
 */
export async function initializePWA(userId?: string): Promise<void> {
  try {
    // Track visit
    trackVisit();

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return;
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Subscribe to push notifications if user is logged in
    if (userId) {
      const subscription = await subscribeToPushNotifications(registration);
      if (subscription) {
        await sendSubscriptionToBackend(subscription, userId);
      }
    }
  } catch (error) {
    console.error('Failed to initialize PWA:', error);
  }
}
