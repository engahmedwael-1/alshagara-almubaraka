/* === ZAIT V96 ULTRA-LIGHT BRIDGE (ZERO IMPACT ON STORE SPEED + 100% OFFLINE) === */
(function () {
  "use strict";
  if (window.__ZAIT_V96_BRIDGE__) return;
  window.__ZAIT_V96_BRIDGE__ = true;

  var VAULT_DB = "zait_v96_games_vault";
  var VAULT_STORE = "assets";
  var FILES_TO_VAULT = [
    "./olive-games.css?v=97",
    "./olive-games.js?v=97",
    "./olive-quiz-bank.js?v=97",
    "./olive-games-extra.js?v=97"
  ];
  var loadedPromise = null;

  function openVault(cb) {
    if (!window.indexedDB) return cb(null);
    try {
      var r = indexedDB.open(VAULT_DB, 1);
      r.onupgradeneeded = function (e) {
        if (!e.target.result.objectStoreNames.contains(VAULT_STORE)) e.target.result.createObjectStore(VAULT_STORE);
      };
      r.onsuccess = function (e) { cb(e.target.result); };
      r.onerror = function () { cb(null); };
    } catch (e) { cb(null); }
  }

  function vaultPut(k, text) {
    openVault(function (db) {
      if (!db) return;
      try { db.transaction(VAULT_STORE, "readwrite").objectStore(VAULT_STORE).put(text, k); } catch (e) {}
    });
  }

  function vaultGet(k) {
    return new Promise(function (resolve) {
      openVault(function (db) {
        if (!db) return resolve(null);
        try {
          var rq = db.transaction(VAULT_STORE, "readonly").objectStore(VAULT_STORE).get(k);
          rq.onsuccess = function () { resolve(rq.result || null); };
          rq.onerror = function () { resolve(null); };
        } catch (e) { resolve(null); }
      });
    });
  }

  async function fetchOrVault(url) {
    var cleanKey = url.split("?")[0];
    if (navigator.onLine) {
      try {
        var r = await fetch(url);
        if (r && r.ok) {
          var txt = await r.text();
          if (txt && txt.length > 20) { vaultPut(cleanKey, txt); return txt; }
        }
      } catch (e) {}
    }
    var fromIdb = await vaultGet(cleanKey);
    if (fromIdb) return fromIdb;
    if ("caches" in window) {
      try {
        var hit = await caches.match(url, { ignoreSearch: true });
        if (hit) return await hit.text();
      } catch (e) {}
    }
    return null;
  }

  function injectCssText(css) {
    if (!css || document.getElementById("zait-v96-games-css-inline")) return;
    var s = document.createElement("style");
    s.id = "zait-v96-games-css-inline";
    s.textContent = css;
    document.head.appendChild(s);
  }

  function runJsText(code, id) {
    if (!code || document.getElementById(id)) return;
    var s = document.createElement("script");
    s.id = id;
    s.textContent = code;
    document.body.appendChild(s);
  }

  // تحميل الألعاب عند الطلب فقط (سواء أونلاين أو أوفلاين من الخزنة!)
  window.V96_loadAndOpenGames = function (directGameId) {
    if (window.ZaitGamesV96 && typeof window.ZaitGamesV96.open === "function") {
      window.ZaitGamesV96.open(directGameId);
      return;
    }
    if (!loadedPromise) {
      loadedPromise = (async function () {
        var css = await fetchOrVault("./olive-games.css?v=97");
        injectCssText(css);
        var quiz = await fetchOrVault("./olive-quiz-bank.js?v=97");
        runJsText(quiz, "zait-v96-quiz-run");
        var core = await fetchOrVault("./olive-games.js?v=97");
        runJsText(core, "zait-v96-core-run");
        var extra = await fetchOrVault("./olive-games-extra.js?v=97");
        if (extra) runJsText(extra, "zait-v96-extra-run");
      })();
    }
    loadedPromise.then(function () {
      if (window.ZaitGamesV96 && typeof window.ZaitGamesV96.open === "function") {
        window.ZaitGamesV96.open(directGameId);
      } else if (typeof window.showToast === "function") {
        window.showToast("📡 يرجى فتح المتجر مرة واحدة بالإنترنت لحفظ الألعاب للتشغيل بدون نت", "info");
      }
    });
  };

  window.openOliveGamesHub = window.V96_loadAndOpenGames;
  window.openGamesHub = window.V96_loadAndOpenGames;

  // تخزين صامت في الخلفية بعد فتح المتجر بـ 2.5 ثانية (صفر تأثير على سرعة التحميل!)
  function preCacheGamesSilently() {
    if (!navigator.onLine) return;
    FILES_TO_VAULT.forEach(function (u) {
      fetch(u).then(function (r) { return r && r.ok ? r.text() : null; }).then(function (txt) {
        if (txt && txt.length > 20) vaultPut(u.split("?")[0], txt);
      }).catch(function () {});
    });
  }

  // شريط تذكير بالكوبون النشط مع عدّاد تنازلي أعلى المتجر (يرفع المبيعات!)
  window.V96_refreshStoreCouponBar = function () {
    var existing = document.getElementById("v96-active-coupon-bar");
    var st = null;
    try { st = JSON.parse(localStorage.getItem("zait_v96_player_state") || "null"); } catch (e) {}
    var now = Date.now();
    var valid = (st && Array.isArray(st.coupons)) ? st.coupons.find(function (c) { return c && !c.used && (!c.expiresAt || c.expiresAt > now); }) : null;
    if (!valid) { if (existing) existing.remove(); return; }

    if (!existing) {
      existing = document.createElement("div");
      existing.id = "v96-active-coupon-bar";
      document.body.insertBefore(existing, document.body.firstChild);
    }
    var s = Math.max(0, Math.floor((valid.expiresAt - now) / 1000));
    var rem = String(Math.floor(s / 3600)).padStart(2, "0") + ":" + String(Math.floor((s % 3600) / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
    existing.innerHTML =
      '<span>🎁 معك <b>' + valid.label + '</b> (كود: <code>' + valid.code + '</code>) ينتهي خلال <b id="v96-bar-t">' + rem + '</b></span>' +
      '<button type="button" onclick="window.V96_applyCodeQuick(\'' + valid.code + '\')">🛒 استخدمه الآن</button>';
  };

  window.V96_applyCodeQuick = function (code) {
    try { navigator.clipboard && navigator.clipboard.writeText(code).catch(function () {}); } catch (e) {}
    if (typeof window.showPanel === "function") window.showPanel("cart");
    setTimeout(function () {
      var inp = document.getElementById("promo-code-input") || document.getElementById("coupon-input");
      if (inp) { inp.value = code; inp.dispatchEvent(new Event("input", { bubbles: true })); }
      if (typeof window.applyPromoCode === "function") try { window.applyPromoCode(); } catch (e) {}
    }, 250);
  };

  // تشجيع داخل السلة + ربط لوحة تحكم الألعاب V96 داخل صفحة الإعدادات
  function mountCartNudgeAndAdminBox() {
    var cartPanel = document.getElementById("cart-panel");
    if (cartPanel && !document.getElementById("v96-cart-nudge")) {
      var n = document.createElement("div");
      n.id = "v96-cart-nudge";
      n.className = "v96-cart-game-nudge";
      n.innerHTML = '<span>🎮 عاوز خصم فوري أو شحن مجاني على طلبك؟</span><button type="button" style="background:#f4cf6d;color:#08160e;border:none;border-radius:10px;padding:6px 12px;font-weight:900;cursor:pointer;" onclick="window.V96_loadAndOpenGames()">العب واكسب الآن!</button>';
      cartPanel.insertBefore(n, cartPanel.firstChild);
    }

    var setPanel = document.getElementById("admin-settings-panel") || document.getElementById("settings-panel");
    if (setPanel && !document.getElementById("v96-admin-games-mount")) {
      var box = document.createElement("div");
      box.id = "v96-admin-games-mount";
      box.innerHTML = '<button type="button" style="width:100%;margin:10px 0;padding:12px;border-radius:14px;border:2px solid #d59e2a;background:linear-gradient(135deg,#10301e,#1e5235);color:#fde68a;font-weight:900;font-size:.92rem;cursor:pointer;" id="v96-open-adm-games-btn">🎮 فتح لوحة التحكم الشاملة بمركز الألعاب V96 Pro (سلسلة الـ 7 أيام + الصعوبة + ROI)</button>';
      setPanel.insertBefore(box, setPanel.firstChild);
      document.getElementById("v96-open-adm-games-btn").onclick = function () {
        if (window.ZaitGamesV96) { window.ZaitGamesV96.mountAdminPanel(box); return; }
        window.V96_loadAndOpenGames();
        setTimeout(function () {
          if (window.ZaitGamesV96) {
            window.ZaitGamesV96.close();
            window.ZaitGamesV96.mountAdminPanel(box);
          }
        }, 450);
      };
    }
  }

  // التأكد من توجيه زر الألعاب العائم وزر القائمة الجانبية لـ V96 حتى بدون نت!
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest("#v94-games-fab, #v95-games-fab, #v94-games-sidebar-btn, #v95-games-sidebar-btn, [data-open-games]") : null;
    if (b) {
      e.preventDefault();
      e.stopPropagation();
      window.V96_loadAndOpenGames();
    }
  }, true);

  function bootBridge() {
    window.V96_refreshStoreCouponBar();
    setInterval(window.V96_refreshStoreCouponBar, 30000);
    setTimeout(preCacheGamesSilently, 2600);
    setTimeout(mountCartNudgeAndAdminBox, 1200);
    setInterval(mountCartNudgeAndAdminBox, 5000);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js?v=97", { scope: "/" }).catch(function () {});
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bootBridge);
  else bootBridge();
})();
