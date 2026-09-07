importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Parse search query parameters if passed, or use defaults
const urlParams = new URLSearchParams(self.location.search);
const apiKey = urlParams.get('apiKey') || "";
const messagingSenderId = urlParams.get('messagingSenderId') || "";
const appId = urlParams.get('appId') || "";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: urlParams.get('authDomain') || "lms-sma-al-furqon.firebaseapp.com",
  projectId: urlParams.get('projectId') || "lms-sma-al-furqon",
  storageBucket: urlParams.get('storageBucket') || "lms-sma-al-furqon.firebasestorage.app",
  messagingSenderId: messagingSenderId,
  appId: appId,
};

if (firebaseConfig.apiKey && typeof firebase !== 'undefined' && firebase.apps.length === 0) {
  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);

      const title = payload.notification?.title || payload.data?.title || 'LMS SMA Al-Furqon';
      const options = {
        body: payload.notification?.body || payload.data?.body || '',
        icon: '/logo.png',
        badge: '/icon.png',
        data: {
          url: payload.data?.url || payload.data?.click_action || '/parent/notifications',
        },
      };

      self.registration.showNotification(title, options);
    });
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] Skip initialization:', err);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
