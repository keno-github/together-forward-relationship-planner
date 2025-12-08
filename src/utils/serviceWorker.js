/**
 * Service Worker Registration Utilities
 * Handles SW registration and push notification setup
 */

// Check if service workers are supported
export const isServiceWorkerSupported = () => {
  return 'serviceWorker' in navigator;
};

// Check if push notifications are supported
export const isPushSupported = () => {
  return 'PushManager' in window;
};

// Check current notification permission
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'granted', 'denied', or 'default'
};

/**
 * Register the service worker
 */
export const registerServiceWorker = async () => {
  if (!isServiceWorkerSupported()) {
    console.log('[SW] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always check server for SW updates
    });

    console.log('[SW] Service Worker registered:', registration.scope);

    // Force check for updates immediately
    registration.update().catch(err => console.log('[SW] Update check failed:', err));

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] New service worker installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New version available - tell it to take over immediately
            console.log('[SW] New version available, activating...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          } else {
            // First install
            console.log('[SW] Service worker installed for first time');
          }
        }
      });
    });

    // Listen for controller change (new SW took over)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] New service worker activated, reloading...');
      // Optionally reload the page to use new SW
      // window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
};

/**
 * Unregister all service workers
 */
export const unregisterServiceWorker = async () => {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('[SW] Service workers unregistered');
    return true;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('[Push] Notifications not supported');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Permission request failed:', error);
    return 'error';
  }
};

/**
 * Get current push subscription
 */
export const getPushSubscription = async () => {
  if (!isServiceWorkerSupported() || !isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to get subscription:', error);
    return null;
  }
};

/**
 * Subscribe to push notifications
 * @param {string} vapidPublicKey - VAPID public key from server
 */
export const subscribeToPush = async (vapidPublicKey) => {
  if (!isServiceWorkerSupported() || !isPushSupported()) {
    throw new Error('Push notifications not supported');
  }

  // Request permission first
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error(`Notification permission ${permission}`);
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('[Push] Using existing subscription');
      return subscription;
    }

    // Convert VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    console.log('[Push] New subscription created');
    return subscription;
  } catch (error) {
    console.error('[Push] Subscription failed:', error);
    throw error;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPush = async () => {
  try {
    const subscription = await getPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[Push] Unsubscribed successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[Push] Unsubscribe failed:', error);
    return false;
  }
};

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Send a test notification (for debugging)
 */
export const sendTestNotification = async () => {
  if (Notification.permission !== 'granted') {
    console.log('[Push] Permission not granted');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Test Notification', {
      body: 'This is a test notification from TwogetherForward',
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'test',
      vibrate: [200, 100, 200]
    });
    return true;
  } catch (error) {
    console.error('[Push] Test notification failed:', error);
    return false;
  }
};

/**
 * Listen for messages from service worker
 */
export const addServiceWorkerMessageListener = (callback) => {
  if (!isServiceWorkerSupported()) return () => {};

  const handler = (event) => {
    callback(event.data);
  };

  navigator.serviceWorker.addEventListener('message', handler);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
};

export default {
  isServiceWorkerSupported,
  isPushSupported,
  getNotificationPermission,
  registerServiceWorker,
  unregisterServiceWorker,
  requestNotificationPermission,
  getPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestNotification,
  addServiceWorkerMessageListener
};
