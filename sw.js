const SHELL_CACHE = 'zait-store-shell-v92';
const IMG_CACHE = 'zait-store-images-v92';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/style.css?v=92',
  '/v92-pro.css?v=92',
  '/v92-pro.js?v=92',
  '/script.js?v=92',
  '/manifest.json?v=92',
  '/icon-192.png',
  '/icon-512.png',
  '/1000392409.jpeg',
  '/offline.html',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((u) => {
          const isExt = u.startsWith('http');
          const req = isExt ? new Request(u, { mode: 'cors' }) : new Request(u, { cache: 'reload' });
          return fetch(req).then((res) => {
            if (res && (res.ok || res.type === 'opaque')) {
              return cache.put(u, res);
            }
          }).catch(() => {});
        })
      )
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_PRODUCT_IMAGES' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(IMG_CACHE).then((cache) =>
        Promise.allSettled(
          event.data.urls.filter(Boolean).map((u) =>
            cache.match(u).then((exists) => {
              if (exists) return;
              return fetch(new Request(u, { mode: 'no-cors' }))
                .then((res) => { if (res) return cache.put(u, res); })
                .catch(() => {});
            })
          )
        )
      )
    );
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // لا نخزّن مكالمات API الحية لقاعدة البيانات والمصادقة
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  // 1. الصور + مكتبات Firebase الثابتة (gstatic): كاش أولاً للسرعة القصوى والأوفلاين مع تحديث صامت
  if (
    req.destination === 'image' ||
    url.hostname.includes('gstatic.com') ||
    /\.(png|jpg|jpeg|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)
  ) {
    const cacheName = url.hostname.includes('gstatic.com') ? SHELL_CACHE : IMG_CACHE;
    event.respondWith(
      caches.open(cacheName).then((cache) =>
        cache.match(req, { ignoreSearch: false }).then((cached) => {
          const netPromise = fetch(req).then((res) => {
            if (res && (res.ok || res.type === 'opaque')) {
              cache.put(req, res.clone()).catch(() => {});
            }
            return res;
          }).catch(() => cached);
          return cached || netPromise;
        })
      )
    );
    return;
  }

  // 2. التنقل والصفحة الرئيسية (يدعم /?source=pwa و /index.html بدون أي ERR_FAILED)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(SHELL_CACHE).then((cache) =>
        fetch(req).then((res) => {
          if (res && res.ok && !res.redirected) {
            cache.put('/', res.clone()).catch(() => {});
            cache.put('/index.html', res.clone()).catch(() => {});
          }
          return res;
        }).catch(() =>
          cache.match('/index.html', { ignoreSearch: true })
            .then((c) => c || cache.match('/', { ignoreSearch: true }))
            .then((c) => c || cache.match('/offline.html'))
        )
      )
    );
    return;
  }

  // 3. ملفات الكود (JS / CSS / JSON): شبكة أولاً لظهور أي تحديث جديد فوراً، مع الكاش الفوري عند فصل النت
  event.respondWith(
    caches.open(SHELL_CACHE).then((cache) =>
      fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      }).catch(() => cache.match(req, { ignoreSearch: true }))
    )
  );
});
