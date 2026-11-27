const SHELL_CACHE = 'zait-v99-shell';
const IMG_CACHE = 'zait-v99-imgs';
const GAMES_CACHE = 'zait-v99-games';

const SHELL_URLS = ['/', '/index.html', '/style.css', '/script.js', '/v98-bridge.js', '/manifest.json', '/offline.html', '/icon-192.png', '/1000392409.jpeg'];
const GAMES_URLS = ['/olive-games.css', '/olive-games.js', '/olive-games-pack2.js', '/olive-games-pack3.js', '/olive-v99-engine.js', '/olive-games-pack4.js', '/olive-games-pack5.js', '/olive-quiz-bank.js'];

async function cleanRes(res) {
  if (!res) return null;
  if (!res.redirected) return res;
  const buf = await res.arrayBuffer();
  const h = new Headers(res.headers);
  h.delete('location');
  return new Response(buf, { status: (res.status >= 300 && res.status < 400) ? 200 : res.status, headers: h });
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const sc = await caches.open(SHELL_CACHE);
    await Promise.allSettled(SHELL_URLS.map(async (u) => {
      try {
        const r = await fetch(u, { cache: 'reload' });
        if (r && r.ok) { const cl = await cleanRes(r); if (cl) await sc.put(u, cl); }
      } catch (err) {}
    }));
    const gc = await caches.open(GAMES_CACHE);
    await Promise.allSettled(GAMES_URLS.map(async (u) => {
      try {
        const r = await fetch(u, { cache: 'reload' });
        if (r && r.ok) { const cl = await cleanRes(r); if (cl) await gc.put(u, cl); }
      } catch (err) {}
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  const keep = [SHELL_CACHE, IMG_CACHE, GAMES_CACHE];
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.map((k) => (keep.indexOf(k) === -1 ? caches.delete(k) : null)))));
  self.clients.claim();
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
  ) return;

  // 1. HTML Navigation: Network-first (2.2s timeout) -> clean cached index.html (ZERO ERR_FAILED!)
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const sc = await caches.open(SHELL_CACHE);
      try {
        const net = await Promise.race([
          fetch(req),
          new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 2200))
        ]);
        if (net && net.ok) {
          const cl = await cleanRes(net.clone());
          if (cl) { await sc.put('/', cl.clone()); await sc.put('/index.html', cl.clone()); }
          return net;
        }
      } catch (err) {}
      const hit = (await sc.match('/index.html', { ignoreSearch: true })) || (await sc.match('/', { ignoreSearch: true })) || (await sc.match('/offline.html'));
      return hit ? await cleanRes(hit) : new Response('Offline', { status: 200 });
    })());
    return;
  }

  // 2. Images (Cloudinary + local): Instant Cache-First for lightning speed!
  if (req.destination === 'image' || url.hostname.includes('res.cloudinary.com') || /\.(png|jpe?g|webp|avif|gif|ico|svg)(\?|$)/i.test(url.pathname)) {
    e.respondWith((async () => {
      const ic = await caches.open(IMG_CACHE);
      const hit = (await ic.match(req)) || (await ic.match(req, { ignoreSearch: true }));
      if (hit) return hit;
      try {
        const net = await fetch(req);
        if (net && (net.ok || net.type === 'opaque')) ic.put(req, net.clone()).catch(() => {});
        return net;
      } catch (err) {
        return (await caches.match('/1000392409.jpeg')) || new Response('', { status: 204 });
      }
    })());
    return;
  }

  // 3. Games & Static JS/CSS: Instant Cache-First + silent background refresh (100% offline guaranteed!)
  const isGameFile = /olive-games|olive-v99|olive-quiz-bank|v98-bridge/.test(url.pathname);
  e.respondWith((async () => {
    const cache = await caches.open(isGameFile ? GAMES_CACHE : SHELL_CACHE);
    const hit = (await cache.match(req, { ignoreSearch: true })) || (await caches.match(req, { ignoreSearch: true }));
    const bg = fetch(req).then(async (r) => {
      if (r && (r.ok || r.type === 'opaque')) {
        const cl = r.redirected ? await cleanRes(r.clone()) : r.clone();
        if (cl) cache.put(req, cl).catch(() => {});
      }
      return r;
    }).catch(() => null);
    if (hit) return hit;
    const net = await bg;
    return net || new Response('', { status: 504 });
  })());
});
