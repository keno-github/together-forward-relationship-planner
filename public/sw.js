/**
 * TwogetherForward Service Worker
 * Handles push notifications when the app is closed or in background
 */

const CACHE_NAME = 'twogetherforward-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'TwogetherForward',
    body: 'You have a new notification',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'default',
    data: {}
  };

  // Try to parse push data
  if (event.data) {
    try {
      const pushData = event.data.json();
      data = {
        ...data,
        ...pushData
      };
    } catch (e) {
      // If not JSON, use as body text
      data.body = event.data.text();
    }
  }

  // Notification options
  const options = {
    body: data.body,
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    tag: data.tag || 'twogetherforward-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: getActionsForType(data.type)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Get notification actions based on type
function getActionsForType(type) {
  switch (type) {
    case 'task_assigned':
      return [
        { action: 'view', title: 'View Task', icon: '/icons/check.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/x.png' }
      ];
    case 'nudge':
      return [
        { action: 'view', title: 'See What\'s Up', icon: '/icons/eye.png' },
        { action: 'dismiss', title: 'Later', icon: '/icons/clock.png' }
      ];
    case 'partner_joined':
      return [
        { action: 'view', title: 'View Dream', icon: '/icons/heart.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/x.png' }
      ];
    case 'task_completed':
      return [
        { action: 'celebrate', title: 'Celebrate!', icon: '/icons/party.png' },
        { action: 'view', title: 'View Progress', icon: '/icons/chart.png' }
      ];
    default:
      return [
        { action: 'view', title: 'View', icon: '/icons/eye.png' },
        { action: 'dismiss', title: 'Dismiss', icon: '/icons/x.png' }
      ];
  }
}

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  const data = event.notification.data || {};
  let url = '/dashboard';

  // Determine URL based on action and notification data
  if (event.action === 'dismiss') {
    return; // Just close the notification
  }

  if (event.action === 'view' || !event.action) {
    // Navigate to relevant page based on notification data
    if (data.roadmap_id) {
      url = `/roadmap/${data.roadmap_id}`;
    } else if (data.dream_id) {
      url = `/dream/${data.dream_id}`;
    } else if (data.url) {
      url = data.url;
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Navigate existing window
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: url,
              data: data
            });
            return client.focus();
          }
        }
        // Open new window if app not open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification dismissed');

  // Could send analytics event here
  const data = event.notification.data || {};
  if (data.notification_id) {
    // Mark as dismissed in database (via postMessage to client)
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'NOTIFICATION_DISMISSED',
          notification_id: data.notification_id
        });
      });
    });
  }
});

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync - for offline notifications (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // Sync any pending notifications when back online
  console.log('[SW] Syncing notifications...');
}
