/* ============================================================================
   Zait Store V98 Ultra Bridge — Offline Vault + Admin Panel Fix + Speed Turbo
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_V98_BRIDGE__) return;
  window.__ZAIT_V98_BRIDGE__ = true;

  var VAULT_DB = "zait_v98_offline_vault";
  var VAULT_STORE = "files";
  var ASSET_LIST = [
    { key: "olive-games.css", url: "/olive-games.css?v=99", required: true },
    { key: "olive-games.js", url: "/olive-games.js?v=99", required: true },
    { key: "olive-games-pack2.js", url: "/olive-games-pack2.js?v=99", required: false },
    { key: "olive-games-pack3.js", url: "/olive-games-pack3.js?v=99", required: false },
    { key: "olive-v99-engine.js", url: "/olive-v99-engine.js?v=99", required: false },
    { key: "olive-games-pack4.js", url: "/olive-games-pack4.js?v=99", required: false },
    { key: "olive-games-pack5.js", url: "/olive-games-pack5.js?v=99", required: false },
    { key: "olive-quiz-bank.js", url: "/olive-quiz-bank.js?v=99", required: false }
  ];

  var enginePromise = null;
  var vaultReadyFlag = false;

  function openIdb() {
    return new Promise(function (resolve) {
      if (!window.indexedDB) return resolve(null);
      try {
        var req = indexedDB.open(VAULT_DB, 1);
        req.onupgradeneeded = function (e) {
          if (!e.target.result.objectStoreNames.contains(VAULT_STORE)) {
            e.target.result.createObjectStore(VAULT_STORE);
          }
        };
        req.onsuccess = function (e) { resolve(e.target.result); };
        req.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
  }

  async function idbPut(key, val) {
    var db = await openIdb();
    if (!db) return;
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction(VAULT_STORE, "readwrite");
        tx.objectStore(VAULT_STORE).put(val, key);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      } catch (e) { resolve(false); }
    });
  }

  async function idbGet(key) {
    var db = await openIdb();
    if (!db) return null;
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction(VAULT_STORE, "readonly");
        var rq = tx.objectStore(VAULT_STORE).get(key);
        rq.onsuccess = function () { resolve(rq.result || null); };
        rq.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
  }

  async function fetchAssetOfflineSafe(item) {
    // 1. Try IndexedDB immediately if offline
    if (!navigator.onLine) {
      var cachedIdb = await idbGet(item.key);
      if (cachedIdb) return cachedIdb;
      if ("caches" in window) {
        try {
          var hit = await caches.match("/" + item.key, { ignoreSearch: true }) || await caches.match("./" + item.key, { ignoreSearch: true });
          if (hit && hit.ok) {
            var txt0 = await hit.text();
            if (txt0 && txt0.length > 20 && txt0.indexOf("<!DOCTYPE") === -1) return txt0;
          }
        } catch (e) {}
      }
      return null;
    }

    // 2. Online: try network with 6s timeout, save to IDB, fallback to IDB/Cache
    try {
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var tm = ctrl ? setTimeout(function () { ctrl.abort(); }, 6000) : null;
      var res = await fetch(item.url, ctrl ? { signal: ctrl.signal } : undefined);
      if (tm) clearTimeout(tm);
      if (res && res.ok) {
        var txt = await res.text();
        if (txt && txt.length > 20 && txt.indexOf("<!DOCTYPE") === -1) {
          idbPut(item.key, txt);
          return txt;
        }
      }
    } catch (e) {}

    var fb = await idbGet(item.key);
    if (fb) return fb;
    if ("caches" in window) {
      try {
        var cHit = await caches.match("/" + item.key, { ignoreSearch: true });
        if (cHit && cHit.ok) return await cHit.text();
      } catch (e) {}
    }
    return null;
  }

  function injectCss(cssText) {
    if (!cssText) return;
    var old = document.getElementById("zait-v98-games-css");
    if (old) old.textContent = cssText;
    else {
      var st = document.createElement("style");
      st.id = "zait-v98-games-css";
      st.textContent = cssText;
      document.head.appendChild(st);
    }
  }

  function executeJsReliable(code, id) {
    if (!code || document.getElementById(id)) return Promise.resolve(true);
    return new Promise(function (resolve) {
      try {
        var blob = new Blob([code], { type: "application/javascript" });
        var blobUrl = URL.createObjectURL(blob);
        var sc = document.createElement("script");
        sc.id = id;
        sc.src = blobUrl;
        sc.onload = function () { URL.revokeObjectURL(blobUrl); resolve(true); };
        sc.onerror = function () {
          URL.revokeObjectURL(blobUrl);
          sc.remove();
          // Fallback to inline execution
          try {
            var sc2 = document.createElement("script");
            sc2.id = id;
            sc2.textContent = code;
            document.body.appendChild(sc2);
          } catch (e2) {}
          resolve(true);
        };
        document.body.appendChild(sc);
      } catch (e) {
        try {
          var sc3 = document.createElement("script");
          sc3.id = id;
          sc3.textContent = code;
          document.body.appendChild(sc3);
        } catch (e3) {}
        resolve(true);
      }
    });
  }

  // Ensures the complete V98 Games OS + all available packs are loaded (Online OR Offline!)
  window.V98_ensureGamesLoaded = function () {
    if (window.ZaitGamesV98 && typeof window.ZaitGamesV98.open === "function") {
      return Promise.resolve(window.ZaitGamesV98);
    }
    if (!enginePromise) {
      enginePromise = (async function () {
        var css = await fetchAssetOfflineSafe(ASSET_LIST[0]);
        injectCss(css);
        var quiz = await fetchAssetOfflineSafe({ key: "olive-quiz-bank.js", url: "/olive-quiz-bank.js?v=99" });
        if (quiz) await executeJsReliable(quiz, "zait-v98-quiz-js");
        var core = await fetchAssetOfflineSafe(ASSET_LIST[1]);
        if (core) await executeJsReliable(core, "zait-v98-core-js");
        var pack2 = await fetchAssetOfflineSafe(ASSET_LIST[2]);
        if (pack2) await executeJsReliable(pack2, "zait-v98-pack2-js");
        var pack3 = await fetchAssetOfflineSafe(ASSET_LIST[3]);
        if (pack3) await executeJsReliable(pack3, "zait-v98-pack3-js");
        var v99Eng = await fetchAssetOfflineSafe({ key: "olive-v99-engine.js", url: "/olive-v99-engine.js?v=99" });
        if (v99Eng) await executeJsReliable(v99Eng, "zait-v99-engine-js");
        var pack4 = await fetchAssetOfflineSafe({ key: "olive-games-pack4.js", url: "/olive-games-pack4.js?v=99" });
        if (pack4) await executeJsReliable(pack4, "zait-v99-pack4-js");
        var pack5 = await fetchAssetOfflineSafe({ key: "olive-games-pack5.js", url: "/olive-games-pack5.js?v=99" });
        if (pack5) await executeJsReliable(pack5, "zait-v99-pack5-js");
        if (!window.ZaitGamesV98) enginePromise = null; // Allow retry if failed
        return window.ZaitGamesV98 || null;
      })();
    }
    return enginePromise;
  };

  window.V98_openGames = async function (directGameId) {
    var api = await window.V98_ensureGamesLoaded();
    if (api && typeof api.open === "function") {
      api.open(directGameId);
    } else if (typeof window.showToast === "function") {
      window.showToast("📡 يرجى فتح المتجر مرة واحدة بالإنترنت (5 ثوانٍ) ليتم حفظ الألعاب للعمل بدون نت!", "info");
    }
  };

  window.V98_mountAdminInto = async function (containerEl) {
    if (!containerEl) return;
    containerEl.innerHTML = '<div style="padding:14px;text-align:center;font-weight:800;color:#15803d;">⏳ جاري فتح لوحة تحكم الألعاب V98 Ultra...</div>';
    var api = await window.V98_ensureGamesLoaded();
    if (api && typeof api.mountAdminPanel === "function") {
      api.mountAdminPanel(containerEl);
    } else {
      containerEl.innerHTML = '<div style="padding:12px;color:#dc2626;font-weight:800;">⚠️ يرجى تحديث الصفحة بالإنترنت مرة واحدة لحفظ ملفات الألعاب. <button type="button" onclick="window.V98_mountAdminInto(this.parentElement.parentElement)" style="margin-right:8px;padding:5px 12px;border-radius:8px;border:none;background:#153422;color:#fde68a;font-weight:800;cursor:pointer;">إعادة المحاولة</button></div>';
    }
  };

  // Lock global entry functions so legacy V94/V95 scripts can NEVER hijack or break them!
  function bindGlobalEntries() {
    window.V96_loadAndOpenGames = window.V98_openGames;
    window.openOliveGamesHub = window.V98_openGames;
    window.openGamesHub = window.V98_openGames;
  }
  bindGlobalEntries();
  setTimeout(bindGlobalEntries, 1200);

  // Capture-phase click guard: catches ANY games button or the broken V95 admin games card!
  document.addEventListener("click", function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest("button, a, [onclick], [id*='games'], [data-open-games]") : null;
    if (!el) return;

    // 1. Games Floating Button / Sidebar Button / Offline Play Button
    var idCls = ((el.id || "") + " " + (el.className || "")).toLowerCase();
    var oc = (el.getAttribute("onclick") || "");
    if (
      /v9[4568]-games-fab|v9[4568]-games-sidebar|open-games-btn/.test(idCls) ||
      /openOliveGamesHub|openGamesHub|V96_loadAndOpenGames/.test(oc) ||
      el.hasAttribute("data-open-games")
    ) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      window.V98_openGames();
      return;
    }

    // 2. Fix Legacy V95 Admin Card click ("إدارة مركز ألعاب الشجرة المباركة")!
    var txt = (el.textContent || "").trim();
    if (txt.indexOf("إدارة مركز ألعاب") > -1 || (txt.indexOf("فتح / تعديل") > -1 && el.closest("div") && (el.closest("div").textContent || "").indexOf("ألعاب الشجرة") > -1)) {
      var card = el.closest(".settings-card, .admin-card, details, section, div[style*='border']") || el.parentElement;
      if (card) {
        setTimeout(function () { healLegacyAdminGamesError(card); }, 120);
      }
    }
  }, true);

  // Immediately heals the red "تعذر تحميل لوحة التحكم" error from V95 anywhere in the DOM!
  function healLegacyAdminGamesError(rootNode) {
    var scope = rootNode || document;
    var nodes = scope.querySelectorAll("div, p, span");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.children.length > 1) continue;
      var t = (n.textContent || "").trim();
      if (t.indexOf("تعذر تحميل لوحة التحكم") > -1) {
        var host = n.parentElement || n;
        if (!host.dataset.v98Healed) {
          host.dataset.v98Healed = "1";
          window.V98_mountAdminInto(host);
        }
        return;
      }
    }
  }

  // Silent Idle Pre-Cache (Runs ONLY after page & product images finish loading — ZERO store lag!)
  function preCacheAllGamesOnIdle() {
    if (!navigator.onLine) {
      idbGet("olive-games.js").then(function (v) { vaultReadyFlag = !!v; window.__V98_OFFLINE_READY__ = vaultReadyFlag; });
      return;
    }
    var run = async function () {
      var okCore = false;
      for (var i = 0; i < ASSET_LIST.length; i++) {
        var txt = await fetchAssetOfflineSafe(ASSET_LIST[i]);
        if (ASSET_LIST[i].key === "olive-games.js" && txt) okCore = true;
      }
      vaultReadyFlag = okCore;
      window.__V98_OFFLINE_READY__ = okCore;
    };
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(run, { timeout: 5000 });
    } else {
      setTimeout(run, 4200);
    }
  }

  // Store Speed & Image Turbo (Optimizes Cloudinary images on the fly without heavy polling!)
  function optimizeStoreImagesOnce() {
    try {
      var imgs = document.querySelectorAll("img[src*='res.cloudinary.com']");
      imgs.forEach(function (img, idx) {
        if (img.dataset.v98Opt) return;
        img.dataset.v98Opt = "1";
        var src = img.getAttribute("src") || "";
        if (src.indexOf("/image/upload/") > -1 && src.indexOf("f_auto") === -1) {
          img.setAttribute("src", src.replace("/image/upload/", "/image/upload/f_auto,q_auto:eco,w_480,c_limit/"));
        }
        img.decoding = "async";
        if (idx < 4) img.setAttribute("fetchpriority", "high");
        else if (!img.getAttribute("loading")) img.setAttribute("loading", "lazy");
      });
    } catch (e) {}
  }

  // Top Active Coupon Countdown Bar (Zero heavy interval — updates smoothly only if coupon exists)
  var barTimer = null;
  window.V96_refreshStoreCouponBar = window.V98_refreshStoreCouponBar = function () {
    var existing = document.getElementById("v98-active-coupon-bar");
    var old96 = document.getElementById("v96-active-coupon-bar");
    if (old96) old96.remove();

    var st = null;
    try { st = JSON.parse(localStorage.getItem("zait_v96_player_state") || "null"); } catch (e) {}
    var now = Date.now();
    var valid = (st && Array.isArray(st.coupons)) ? st.coupons.find(function (c) { return c && !c.used && (!c.expiresAt || c.expiresAt > now); }) : null;
    if (!valid) {
      if (existing) existing.remove();
      if (barTimer) { clearInterval(barTimer); barTimer = null; }
      return;
    }
    if (!existing) {
      existing = document.createElement("div");
      existing.id = "v98-active-coupon-bar";
      document.body.insertBefore(existing, document.body.firstChild);
    }
    function paintBar() {
      var remMs = (valid.expiresAt || 0) - Date.now();
      if (remMs <= 0) { existing.remove(); if (barTimer) clearInterval(barTimer); return; }
      var s = Math.floor(remMs / 1000);
      var t = String(Math.floor(s / 3600)).padStart(2, "0") + ":" + String(Math.floor((s % 3600) / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      existing.innerHTML =
        '<span>🎁 معك <b>' + valid.label + '</b> (كود: <code>' + valid.code + '</code>) ينتهي خلال <b>' + t + '</b></span>' +
        '<button type="button" onclick="window.V98_applyCodeQuick(\'' + valid.code + '\')">🛒 استخدمه الآن</button>';
    }
    paintBar();
    if (!barTimer) barTimer = setInterval(paintBar, 1000);
  };

  window.V96_applyCodeQuick = window.V98_applyCodeQuick = function (code) {
    try { navigator.clipboard && navigator.clipboard.writeText(code).catch(function () {}); } catch (e) {}
    if (typeof window.showPanel === "function") window.showPanel("cart");
    setTimeout(function () {
      var inp = document.getElementById("promo-code-input") || document.getElementById("coupon-input") || document.querySelector('input[placeholder*="كوبون"], input[placeholder*="خصم"]');
      if (inp) { inp.value = code; inp.dispatchEvent(new Event("input", { bubbles: true })); }
      if (typeof window.applyPromoCode === "function") try { window.applyPromoCode(); } catch (e) {}
    }, 250);
  };

  // Lightweight debounced observer (only for healing V95 admin error + optimizing new images!)
  var mutDeb = null;
  function setupLightweightObserver() {
    var obs = new MutationObserver(function () {
      if (mutDeb) clearTimeout(mutDeb);
      mutDeb = setTimeout(function () {
        healLegacyAdminGamesError(document);
        optimizeStoreImagesOnce();
      }, 450);
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    window.V98_refreshStoreCouponBar();
    optimizeStoreImagesOnce();
    healLegacyAdminGamesError(document);
    setupLightweightObserver();
    if (document.readyState === "complete") preCacheAllGamesOnIdle();
    else window.addEventListener("load", preCacheAllGamesOnIdle, { once: true });

    // Force-register upgraded V98 Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js?v=99", { scope: "/" }).catch(function () {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
