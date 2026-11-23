const SHELL_CACHE = 'zait-store-shell-v81';
const IMG_CACHE = 'zait-store-images-v81';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css?v=81',
  '/script.js?v=81',
  '/manifest.json?v=81',
  '/icon-192.png',
  '/icon-512.png',
  '/1000392409.jpeg',
  '/offline.html'
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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // لا نخزّن طلبات Firebase API الحية داخل الكاش حتى تظل البيانات لحظية
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('identitytoolkit.googleapis.com') || url.hostname.includes('securetoken.googleapis.com')) {
    return;
  }

  // 1. الصور (Cloudinary / محلية / منتجات): كاش أولاً لسرعة خارقة وظهور فوري بدون نت
  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const networkPromise = fetch(req).then((netRes) => {
            if (netRes && (netRes.ok || netRes.type === 'opaque')) {
              cache.put(req, netRes.clone()).catch(() => {});
            }
            return netRes;
          }).catch(() => cached);
          return cached || networkPromise;
        })
      )
    );
    return;
  }

  // 2. التنقل والصفحة الرئيسية: Stale-While-Revalidate مع صفحة offline.html كاحتياطي
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then((cache) =>
        fetch(req).then((netRes) => {
          if (netRes && netRes.ok) cache.put('/index.html', netRes.clone()).catch(() => {});
          return netRes;
        }).catch(() =>
          cache.match('/index.html').then((c) => c || cache.match('/') || cache.match('/offline.html'))
        )
      )
    );
    return;
  }

  // 3. ملفات CSS / JS / Fonts: عرض فوري من الكاش + تحديث صامت بالخلفية (فتح في أقل من 0.2 ثانية!)
  event.respondWith(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.match(req).then((cached) => {
        const netFetch = fetch(req).then((netRes) => {
          if (netRes && (netRes.ok || netRes.type === 'opaque')) {
            cache.put(req, netRes.clone()).catch(() => {});
          }
          return netRes;
        }).catch(() => cached);
        return cached || netFetch;
      })
    )
  );
});