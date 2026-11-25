const SHELL_CACHE = 'zait-turbo-shell-v84';
const IMG_CACHE = 'zait-turbo-imgs-v84';
const CORE_FILES = [
  '/',
  '/index.html',
  '/products-snapshot.json?v=84',
  '/style.css?v=84',
  '/manifest.json?v=84',
  '/offline.html',
  '/icon-192.png',
  '/1000392409.jpeg'
];

async function cleanRes(res) {
  if (!res) return null;
  if (!res.redirected) return res;
  const buf = await res.arrayBuffer();
  const h = new Headers(res.headers);
  h.delete('location');
  return new Response(buf, { status: (res.status >= 300 && res.status < 400) ? 200 : res.status, headers: h });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(CORE_FILES.map(async (u) => {
        try {
          const r = await fetch(u);
          if (r && r.ok) {
            const c = await cleanRes(r);
            if (c) await cache.put(u, c);
          }
        } catch (e) {}
      }))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.map((k) => (k !== SHELL_CACHE && k !== IMG_CACHE ? caches.delete(k) : null))))
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) {}
  const n = d.notification || {};
  event.waitUntil(self.registration.showNotification(n.title || '🌿 متجر زيت الشجرة المباركة', {
    body: n.body || 'لديك إشعار جديد',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  }));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // عدم حجز اتصالات قاعدة البيانات الحية والمصادقة
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com')
  ) {
    return;
  }

  // 1. التنقل: كاش فوري + تحديث بالخلفية بدون ERR_FAILED
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = (await cache.match('/')) || (await cache.match('/index.html'));
      const netPromise = fetch(req).then(async (r) => {
        if (r && r.ok) {
          const c = await cleanRes(r.clone());
          if (c) {
            await cache.put('/', c.clone());
            await cache.put('/index.html', c.clone());
          }
        }
        return r;
      }).catch(() => null);
      if (cached) return await cleanRes(cached);
      const net = await netPromise;
      return net || (await cache.match('/offline.html')) || new Response('Offline', { status: 200 });
    })());
    return;
  }

  // 2. الصور: كاش فوري
  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
      if (hit) {
        fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()).catch(() => {}); }).catch(() => {});
        return hit;
      }
      try {
        const net = await fetch(req);
        if (net && (net.ok || net.type === 'opaque')) cache.put(req, net.clone()).catch(() => {});
        return net;
      } catch (e) {
        return (await caches.match('/1000392409.jpeg')) || new Response('', { status: 204 });
      }
    })());
    return;
  }

  // 3. الملفات الثابتة و snapshot ومكتبات Firebase: عرض فوري من الكاش + تحديث صامت
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    if (hit) {
      fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()).catch(() => {}); }).catch(() => {});
      return hit;
    }
    try {
      const net = await fetch(req);
      if (net && (net.ok || net.type === 'opaque')) cache.put(req, net.clone()).catch(() => {});
      return net;
    } catch (e) {
      return new Response('', { status: 504 });
    }
  })());
});