const SHELL_CACHE = 'zait-store-shell-v83';
const IMG_CACHE = 'zait-store-images-v83';
const LOCAL_PRECACHE = [
  '/',
  '/index.html',
  '/style.css?v=83',
  '/script.js?v=83',
  '/manifest.json?v=83',
  '/offline.html',
  '/privacy.html',
  '/terms.html',
  '/returns.html',
  '/icon-192.png',
  '/icon-512.png',
  '/1000392409.jpeg'
];
const EXTERNAL_PRECACHE = [
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js"
];

// دالة حاسمة تمنع خطأ ERR_FAILED في Chrome عند وجود أي Redirect!
async function cleanNonRedirectedResponse(res) {
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

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled(LOCAL_PRECACHE.map(async (u) => {
      try {
        const res = await fetch(u, { cache: 'reload' });
        if (res && res.ok) {
          const clean = await cleanNonRedirectedResponse(res);
          if (clean) await cache.put(u, clean);
        }
      } catch (e) {}
    }));
    // تخزين مكتبات Firebase وخطوط المتجر مسبقاً ليعمل الكود 100% بدون إنترنت
    await Promise.allSettled(EXTERNAL_PRECACHE.map(async (u) => {
      try {
        const res = await fetch(u, { mode: 'cors' });
        if (res && (res.ok || res.type === 'opaque')) await cache.put(u, res);
      } catch (e) {
        try {
          const opq = await fetch(u, { mode: 'no-cors' });
          if (opq) await cache.put(u, opq);
        } catch (e2) {}
      }
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => (k !== SHELL_CACHE && k !== IMG_CACHE ? caches.delete(k) : null))
    ))
  );
  self.clients.claim();
});

// معالج الإشعارات الموحّد داخل sw.js (يمنع تعارض firebase-messaging-sw.js)
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
  const url = (event.notification && event.notification.data) || '/';
  event.waitUntil(clients.openWindow(url));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // عدم تخزين اتصالات قاعدة البيانات الحية والمصادقة
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('firebase.googleapis.com')
  ) {
    return;
  }

  // 1. التنقل وفتح الصفحة (/, /index.html, /?source=pwa): آمن 100% بدون ERR_FAILED!
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const netRes = await fetch(req);
        if (netRes && netRes.ok) {
          const clean = await cleanNonRedirectedResponse(netRes.clone());
          if (clean) {
            if (url.pathname === '/' || url.pathname === '/index.html') {
              await cache.put('/', clean.clone());
              await cache.put('/index.html', clean.clone());
            } else {
              await cache.put(url.pathname, clean.clone());
            }
          }
          return netRes;
        }
      } catch (err) {
        // أوفلاين: استرجاع النسخة المخزنة النظيفة
      }
      const hit =
        (await cache.match(url.pathname)) ||
        (await cache.match('/')) ||
        (await cache.match('/index.html')) ||
        (await cache.match('/offline.html'));
      if (hit) {
        return await cleanNonRedirectedResponse(hit);
      }
      return new Response(
        '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>بدون إنترنت</title></head><body style="font-family:Tahoma;text-align:center;padding:36px;background:#0b1f14;color:#fff;"><h2>📡 لا يوجد اتصال بالإنترنت</h2><p>افتح المتجر مرة واحدة بإنترنت ثم جرب الأوفلاين.</p><button onclick="location.reload()" style="padding:10px 22px;border-radius:10px;background:#d9ae49;border:none;font-weight:bold;">🔄 إعادة المحاولة</button></body></html>',
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    })());
    return;
  }

  // 2. الصور (Cloudinary WebP + محلية): كاش أولاً مع تحديث صامت بالخلفية
  if (req.destination === 'image' || /\.(png|jpg|jpeg|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMG_CACHE);
      const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
      const netPromise = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => null);
      if (hit) return hit;
      const netRes = await netPromise;
      if (netRes) return netRes;
      const logo = await caches.match('/1000392409.jpeg');
      return logo || new Response('', { status: 204 });
    })());
    return;
  }

  // 3. ملفات CSS / JS / مكتبات Firebase / الخطوط: عرض فوري من الكاش + تحديث صامت
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    const netPromise = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    if (hit) return hit;
    const netRes = await netPromise;
    return netRes || new Response('', { status: 504, statusText: 'Offline' });
  })());
});