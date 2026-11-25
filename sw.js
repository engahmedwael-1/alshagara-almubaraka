const SHELL_CACHE = 'zait-v90-ssr-shell';
const IMG_CACHE = 'zait-v90-ssr-imgs';
const PRECACHE = ['/', '/index.html', '/style.css?v=90', '/script.js?v=90', '/manifest.json?v=90', '/offline.html', '/icon-192.png', '/1000392409.jpeg'];

async function cleanRes(res) {
  if (!res) return null;
  if (!res.redirected) return res;
  const buf = await res.arrayBuffer();
  const h = new Headers(res.headers);
  h.delete('location');
  return new Response(buf, { status: (res.status >= 300 && res.status < 400) ? 200 : res.status, headers: h });
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE).then((c) =>
      Promise.allSettled(PRECACHE.map(async (u) => {
        try {
          const r = await fetch(u, { cache: 'reload' });
          if (r && r.ok) { const cl = await cleanRes(r); if (cl) await c.put(u, cl); }
        } catch (err) {}
      }))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.map((k) => (k !== SHELL_CACHE && k !== IMG_CACHE ? caches.delete(k) : null))))
  );
  self.clients.claim();
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  const n = d.notification || {};
  e.waitUntil(self.registration.showNotification(n.title || '🌿 متجر زيت الشجرة المباركة', {
    body: n.body || 'لديك إشعار جديد',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  }));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com')
  ) {
    return;
  }

  // 1. التنقل: فتح فوري من الكاش (Stale-While-Revalidate -> 0.02 ثانية في الزيارة الثانية + أوفلاين 100%)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const cached = (await cache.match('/')) || (await cache.match('/index.html'));
      const netUpdate = fetch(req).then(async (r) => {
        if (r && r.ok) {
          const cl = await cleanRes(r.clone());
          if (cl) {
            await cache.put('/', cl.clone());
            await cache.put('/index.html', cl.clone());
          }
        }
        return r;
      }).catch(() => null);
      if (cached) return await cleanRes(cached);
      const net = await netUpdate;
      return net || (await cache.match('/offline.html')) || new Response('Offline', { status: 200 });
    })());
    return;
  }

  // 2. الصور: كاش فوري
  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)) {
    e.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
      if (hit) return hit;
      try {
        const net = await fetch(req);
        if (net && (net.ok || net.type === 'opaque')) cache.put(req, net.clone()).catch(() => {});
        return net;
      } catch (err) {
        return (await caches.match('/1000392409.jpeg')) || new Response('', { status: 204 });
      }
    })());
    return;
  }

  // 3. CSS / JS / مكتبات Firebase: كاش فوري + تحديث صامت بالخلفية
  e.respondWith((async () => {
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
    } catch (err) {
      return new Response('', { status: 504 });
    }
  })());
});