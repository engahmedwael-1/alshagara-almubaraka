const SHELL_CACHE = 'zait-customer-shell-v82';
const IMG_CACHE = 'zait-customer-imgs-v82';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css?v=82',
  '/script.js?v=82',
  '/manifest.json?v=82',
  '/offline.html',
  '/privacy.html',
  '/terms.html',
  '/returns.html',
  '/icon-192.png',
  '/1000392409.jpeg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => (k !== SHELL_CACHE && k !== IMG_CACHE ? caches.delete(k) : null))
      )
    )
  );
  self.clients.claim();
});

// Unified Push Notification Handler (Replaces separate firebase-messaging-sw.js so zero SW conflict!)
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {}
  const notif = data.notification || {};
  event.waitUntil(
    self.registration.showNotification(notif.title || '🌿 متجر زيت الشجرة المباركة', {
      body: notif.body || 'لديك إشعار جديد من متجر زيت الشجرة المباركة',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: notif.click_action || '/'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification && event.notification.data) || '/';
  event.waitUntil(clients.openWindow(targetUrl));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache live Firebase Auth / Firestore API calls
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  // 1. Images (Cloudinary WebP + local): Cache-first with background refresh
  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const net = fetch(req).then((res) => {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
            return res;
          }).catch(() => cached);
          return cached || net;
        })
      )
    );
    return;
  }

  // 2. HTML navigation: Network-first with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then((cache) =>
        fetch(req).then((res) => {
          if (res && res.ok) cache.put('/index.html', res.clone()).catch(() => {});
          return res;
        }).catch(() => cache.match('/index.html').then((h) => h || cache.match('/offline.html')))
      )
    );
    return;
  }

  // 3. Static CSS/JS/Fonts: Instant Stale-While-Revalidate
  event.respondWith(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const net = fetch(req).then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    )
  );
});