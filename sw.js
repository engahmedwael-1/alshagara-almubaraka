const STATIC_CACHE = 'zait-static-v91';
const IMAGES_CACHE = 'zait-images-v91';
const RUNTIME_CACHE = 'zait-runtime-v91';

const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './v91-engine.js',
  './v91-styles.css',
  './products-snapshot.json',
  './manifest.json',
  './offline.html',
  './icon-192.png',
  './icon-512.png',
  './1000392409.jpeg'
];

const FIREBASE_CDN_URLS = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js'
];

// إزالة علامة redirected لمنع خطأ ERR_FAILED في Chrome عند الأوفلاين
async function sanitizeResponse(res) {
  if (!res) return null;
  if (!res.redirected) return res;
  const buf = await res.arrayBuffer();
  const headers = new Headers(res.headers);
  headers.delete('location');
  return new Response(buf, {
    status: (res.status >= 300 && res.status < 400) ? 200 : res.status,
    statusText: res.statusText || 'OK',
    headers: headers
  });
}

function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req)
      .then((res) => { clearTimeout(t); resolve(res); })
      .catch((err) => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const staticCache = await caches.open(STATIC_CACHE);
    await Promise.allSettled(PRECACHE_URLS.map(async (u) => {
      try {
        const res = await fetch(u, { cache: 'reload' });
        if (res && res.ok) {
          const clean = await sanitizeResponse(res);
          if (clean) await staticCache.put(u, clean);
        }
      } catch (e) {}
    }));
    const runtimeCache = await caches.open(RUNTIME_CACHE);
    await Promise.allSettled(FIREBASE_CDN_URLS.map(async (u) => {
      try {
        const res = await fetch(u, { mode: 'cors' });
        if (res && (res.ok || res.type === 'opaque')) await runtimeCache.put(u, res);
      } catch (e) {}
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = [STATIC_CACHE, IMAGES_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (keep.indexOf(k) === -1 ? caches.delete(k) : null))
    ))
  );
  self.clients.claim();
});

// استقبال أمر تخزين صور المنتجات الجديدة تلقائياً من v91-engine.js
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'CACHE_IMAGES' && Array.isArray(data.urls) && data.urls.length > 0) {
    event.waitUntil((async () => {
      const imgCache = await caches.open(IMAGES_CACHE);
      await Promise.allSettled(data.urls.slice(0, 80).map(async (u) => {
        try {
          const hit = await imgCache.match(u);
          if (hit) return;
          const res = await fetch(u, { mode: 'cors' }).catch(() => fetch(u, { mode: 'no-cors' }));
          if (res && (res.ok || res.type === 'opaque')) await imgCache.put(u, res);
        } catch (e) {}
      }));
    })());
  }
});

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) {}
  const n = d.notification || {};
  event.waitUntil(self.registration.showNotification(n.title || '🌿 متجر زيت الشجرة المباركة', {
    body: n.body || 'لديك إشعار جديد من متجر زيت الشجرة المباركة',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: n.click_action || './'
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification && event.notification.data) || './';
  event.waitUntil(clients.openWindow(target));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // استثناء اتصالات قاعدة البيانات والمصادقة الحية
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com')
  ) {
    return;
  }

  // 1. التنقل: Network-First بمهلة سريعة (2.2 ثانية) ثم الكاش النظيف بدون أي 308 أو ERR_FAILED
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      try {
        const netRes = await fetchWithTimeout(req, 2200);
        if (netRes && netRes.ok) {
          const clean = await sanitizeResponse(netRes.clone());
          if (clean) {
            await cache.put('./index.html', clean.clone());
            await cache.put('./', clean.clone());
          }
          return netRes;
        }
      } catch (e) {}
      const hit = (await cache.match('./index.html')) || (await cache.match('./')) || (await cache.match('./offline.html'));
      if (hit) return await sanitizeResponse(hit);
      return new Response(
        '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>وضع عدم الاتصال</title></head><body style="font-family:Tahoma;text-align:center;padding:36px;background:#07180e;color:#fff;"><h2>📡 لا يوجد اتصال بالإنترنت</h2><p>أعد الاتصال ثم اضغط تحديث الصفحة.</p></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    })());
    return;
  }

  // 2. صور المنتجات (Cloudinary والمحلية): Cache-First + تحديث بالخلفية
  if (
    req.destination === 'image' ||
    url.hostname.includes('res.cloudinary.com') ||
    /\.(png|jpe?g|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)
  ) {
    event.respondWith((async () => {
      const imgCache = await caches.open(IMAGES_CACHE);
      const hit = (await imgCache.match(req)) || (await imgCache.match(req, { ignoreSearch: true }));
      const bg = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) imgCache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => null);
      if (hit) return hit;
      const net = await bg;
      if (net) return net;
      return (await caches.match('./1000392409.jpeg')) || new Response('', { status: 204 });
    })());
    return;
  }

  // 3. ملفات الواجهة ومكتبات Firebase gstatic: Stale-While-Revalidate فوري
  event.respondWith((async () => {
    const cacheName = url.origin === self.location.origin ? STATIC_CACHE : RUNTIME_CACHE;
    const cache = await caches.open(cacheName);
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    const bg = fetch(req).then(async (res) => {
      if (res && (res.ok || res.type === 'opaque')) {
        const clean = res.redirected ? await sanitizeResponse(res.clone()) : res.clone();
        if (clean) cache.put(req, clean).catch(() => {});
      }
      return res;
    }).catch(() => null);
    if (hit) return hit;
    const net = await bg;
    return net || new Response('', { status: 504 });
  })());
});
