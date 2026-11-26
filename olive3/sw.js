const SHELL_CACHE = 'zait-store-shell-v94';
const IMG_CACHE = 'zait-store-images-v94';

const STATIC_ASSETS = [
  '/style.css?v=94',
  '/v94-pro.css?v=94',
  '/olive-games.css?v=94',
  '/v94-pro.js?v=94',
  '/olive-games.js?v=94',
  '/script.js?v=94',
  '/manifest.json?v=94',
  '/icon-192.png',
  '/icon-512.png',
  '/1000392409.jpeg',
  '/offline.html'
];

const FIREBASE_MODULES = [
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
];

const INLINE_EMERGENCY_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>متجر زيت الشجرة المباركة — وضع عدم الاتصال</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background:#f7f4ec; color:#153422; margin:0; padding:24px; text-align:center; }
  .box { max-width:460px; margin:40px auto; background:#fff; border:2px solid #c59b27; border-radius:18px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,0.08); }
  h2 { margin:8px 0; }
  p { color:#475569; line-height:1.7; font-size:0.95rem; }
  button { background:#153422; color:#fff; border:none; padding:12px 24px; border-radius:12px; font-weight:800; font-size:0.95rem; cursor:pointer; width:100%; margin-top:10px; }
</style>
</head>
<body>
  <div class="box">
    <div style="font-size:3rem;">🫒</div>
    <h2>متجر زيت الشجرة المباركة</h2>
    <p>أنت غير متصل بالإنترنت حالياً. يرجى فتح المتجر مرة واحدة بإنترنت لحفظ أحدث المنتجات والصور على هاتفك لتعمل بعدها بدون إنترنت.</p>
    <button onclick="location.href='/'">🔄 إعادة المحاولة</button>
  </div>
</body>
</html>`;

// تحويل أي استجابة (حتى لو كانت Redirected) إلى Response نظيفة تماماً (redirected = false) تمنع ERR_FAILED في Chrome نهائياً!
async function buildCleanResponse(res, forcedContentType) {
  if (!res) return null;
  if (res.type === 'opaque') return res;
  try {
    const buf = await res.arrayBuffer();
    const headers = new Headers(res.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    if (forcedContentType) {
      headers.set('content-type', forcedContentType);
    }
    return new Response(buf, {
      status: res.status && res.status >= 200 && res.status < 300 ? res.status : 200,
      statusText: res.statusText || 'OK',
      headers
    });
  } catch (e) {
    return null;
  }
}

async function cacheHomeHtmlClean(cache, res) {
  const clean = await buildCleanResponse(res, 'text/html; charset=utf-8');
  if (!clean) return null;
  await Promise.allSettled([
    cache.put('/', clean.clone()),
    cache.put('/index.html', clean.clone())
  ]);
  return clean;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);

    // 1. جلب الصفحة الرئيسية '/' مرة واحدة وتخزين نسخة نظيفة (غير معاد توجيهها) تحت '/' و '/index.html' معاً
    try {
      const homeRes = await fetch(new Request('/', { cache: 'reload' }));
      if (homeRes && homeRes.ok) {
        await cacheHomeHtmlClean(cache, homeRes);
      }
    } catch (e) {}

    // 2. تخزين ملفات الكود والصور المحلية بشكل نظيف
    await Promise.allSettled(
      STATIC_ASSETS.map(async (u) => {
        try {
          const res = await fetch(new Request(u, { cache: 'reload' }));
          if (res && res.ok) {
            const clean = res.redirected ? await buildCleanResponse(res) : res;
            if (clean) await cache.put(u, clean);
          }
        } catch (e) {}
      })
    );

    // 3. تخزين مكتبات Firebase ESM بوضع CORS حتى يعمل script.js بدون إنترنت
    await Promise.allSettled(
      FIREBASE_MODULES.map(async (u) => {
        try {
          const res = await fetch(new Request(u, { mode: 'cors' }));
          if (res && res.ok) await cache.put(u, res);
        } catch (e) {}
      })
    );
  })());
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

async function fetchWithTimeout(req, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(req, { signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // لا نتدخل في مكالمات قواعد البيانات والمصادقة الحية
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return;
  }

  // 1. طلبات فتح الصفحة (Navigation): مستحيل إظهار ERR_FAILED سواء على / أو /index.html أو /?source=pwa!
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      try {
        const netRes = await fetchWithTimeout(req, 4500);
        if (netRes && netRes.ok) {
          const clean = await cacheHomeHtmlClean(cache, netRes.clone());
          if (clean) return clean;
        }
      } catch (e) {}

      // أوفلاين أو الشبكة متعثرة: نُرجع نسخة نظيفة تماماً غير معاد توجيهها من الكاش
      const cached =
        (await cache.match('/', { ignoreSearch: true })) ||
        (await cache.match('/index.html', { ignoreSearch: true })) ||
        (await cache.match('/offline.html', { ignoreSearch: true }));

      if (cached) {
        const cleanCached = cached.redirected ? await buildCleanResponse(cached, 'text/html; charset=utf-8') : cached;
        if (cleanCached) return cleanCached;
      }

      return new Response(INLINE_EMERGENCY_HTML, {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    })());
    return;
  }

  // 2. الصور + مكتبات Firebase (gstatic): كاش أولاً مع تحديث صامت
  if (
    req.destination === 'image' ||
    url.hostname.includes('gstatic.com') ||
    /\.(png|jpg|jpeg|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)
  ) {
    const cacheName = url.hostname.includes('gstatic.com') ? SHELL_CACHE : IMG_CACHE;
    event.respondWith((async () => {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(req);
      const netPromise = fetch(req).then(async (res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const toStore = res.redirected ? await buildCleanResponse(res.clone()) : res.clone();
          if (toStore) cache.put(req, toStore).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || netPromise;
    })());
    return;
  }

  // 3. ملفات الكود (JS / CSS / JSON): شبكة بمهلة سريعة ثم الكاش النظيف للأوفلاين
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    try {
      const netRes = await fetchWithTimeout(req, 4500);
      if (netRes && (netRes.ok || netRes.type === 'opaque')) {
        const toStore = netRes.redirected ? await buildCleanResponse(netRes.clone()) : netRes.clone();
        if (toStore) cache.put(req, toStore).catch(() => {});
        return netRes;
      }
    } catch (e) {}
    const cached = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
    if (cached) return cached;
    return new Response('', { status: 200 });
  })());
});
