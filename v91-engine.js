/* ============================================================================
   Zait Store V91 Pro — Standalone Runtime Engine (v91-engine.js)
   Features:
   1. Instant Snapshot & Dynamic Offline Sync + Anti-Wipe Shield
   2. Auto-Clean Deleted/Unavailable Products from Customer Cart
   3. Interactive "?" Help Encyclopedia (50 Detailed Arabic Topics)
   4. Mobile Layout Fix for Admin/Stats/Inventory Tables + Hide Floating Widgets
   5. On-Demand Lazy Leaflet Loader
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_V91_ENGINE_BOOTED__) return;
  window.__ZAIT_V91_ENGINE_BOOTED__ = true;

  var REST_PRODUCTS_URL = "https://firestore.googleapis.com/v1/projects/olive-oile-store/databases/(default)/documents/products?pageSize=100";
  var SNAPSHOT_URL = "./products-snapshot.json?v=91";
  var CACHE_PRODS_KEY = "zait_v91_cached_products";
  var CACHE_GRID_KEY = "zait_v91_cached_grid_html";

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function showToastV91(msg) {
    if (typeof window.showToast === "function") {
      try { window.showToast(msg, "info"); return; } catch (e) {}
    }
    var old = document.getElementById("v91-toast");
    if (old) old.remove();
    var el = document.createElement("div");
    el.id = "v91-toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el && el.parentNode) el.remove(); }, 3800);
  }

  function optImgUrl(url) {
    if (!url || typeof url !== "string") return "1000392409.jpeg";
    if (url.indexOf("data:image/") === 0) return "1000392409.jpeg";
    if (url.indexOf("res.cloudinary.com") > -1 && url.indexOf("/image/upload/") > -1 && url.indexOf("f_auto") === -1) {
      return url.replace("/image/upload/", "/image/upload/f_auto,q_auto:eco,w_420,c_limit/");
    }
    return url;
  }

  function parseFsVal(v) {
    if (!v || typeof v !== "object") return null;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return Number(v.doubleValue);
    if ("booleanValue" in v) return Boolean(v.booleanValue);
    if ("timestampValue" in v) return v.timestampValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return ((v.arrayValue && v.arrayValue.values) || []).map(parseFsVal);
    if ("mapValue" in v) {
      var o = {}, f = (v.mapValue && v.mapValue.fields) || {};
      Object.keys(f).forEach(function (k) { o[k] = parseFsVal(f[k]); });
      return o;
    }
    return null;
  }

  function findGridEl() {
    return document.querySelector("#products-container, #products-grid, #products-list, .products-container, .products-grid");
  }

  function isProductActive(p) {
    if (!p || typeof p !== "object") return false;
    if (p.deleted === true || p.isDeleted === true) return false;
    if (p.hidden === true || p.isHidden === true) return false;
    if (p.active === false) return false;
    if (p.archived === true) return false;
    return true;
  }

  function hasRealProductCards(el) {
    if (!el) return false;
    var cards = el.querySelectorAll(".product-card, .item-card, .v91-card, [data-product-id], [data-id]");
    return cards.length > 0;
  }

  // =========================================================================
  // FEATURE 1: INSTANT SNAPSHOT + DYNAMIC OFFLINE SYNC + ANTI-WIPE SHIELD
  // =========================================================================
  var antiWipeObserver = null;
  var nativeLiveRendered = false;
  var restoringNow = false;
  var userFiltered = false;

  document.addEventListener("input", function (e) {
    var t = e.target;
    if (t && (t.type === "search" || /search|filter/i.test((t.id || "") + " " + (t.className || "")))) {
      userFiltered = true;
    }
  }, true);

  function updateOfflinePill() {
    var existing = document.getElementById("v91-offline-pill");
    if (navigator.onLine) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var pill = document.createElement("div");
    pill.id = "v91-offline-pill";
    pill.innerHTML =
      '<span>📡 وضع عدم الاتصال — يتم عرض أحدث المنتجات المحفوظة</span>' +
      '<button type="button" aria-label="إغلاق">✕</button>';
    pill.querySelector("button").onclick = function () { pill.remove(); };
    document.body.appendChild(pill);
  }

  function askSwToCacheImages(list) {
    if (!navigator.onLine || !Array.isArray(list) || !list.length) return;
    var urls = [];
    list.forEach(function (p) {
      if (!p) return;
      var raw = p.imageUrl || p.image || (Array.isArray(p.images) && p.images[0]) || "";
      if (raw && typeof raw === "string" && raw.indexOf("data:") !== 0) {
        urls.push(optImgUrl(raw));
        if (raw !== optImgUrl(raw)) urls.push(raw);
      }
    });
    if (!urls.length) return;
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CACHE_IMAGES", urls: urls.slice(0, 80) });
      } else if ("caches" in window) {
        caches.open("zait-images-v91").then(function (cache) {
          urls.slice(0, 50).forEach(function (u) {
            cache.match(u).then(function (hit) {
              if (hit) return;
              fetch(u, { mode: "no-cors" }).then(function (r) {
                if (r) cache.put(u, r).catch(function () {});
              }).catch(function () {});
            }).catch(function () {});
          });
        }).catch(function () {});
      }
    } catch (e) {}
  }

  function getCachedProducts() {
    try {
      var raw = localStorage.getItem(CACHE_PRODS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  }

  function saveProductsToCache(list) {
    if (!Array.isArray(list) || !list.length) return;
    var clean = list.filter(function (p) { return p && p.deleted !== true && p.isDeleted !== true; }).map(function (p) {
      var c = Object.assign({}, p);
      if (c.imageUrl) c.imageUrl = optImgUrl(c.imageUrl);
      if (c.image) c.image = optImgUrl(c.image);
      if (Array.isArray(c.images)) c.images = c.images.map(optImgUrl);
      return c;
    });
    if (!clean.length) return;
    try { localStorage.setItem(CACHE_PRODS_KEY, JSON.stringify(clean)); } catch (e) {}
    askSwToCacheImages(clean);
  }

  function captureLiveNativeGridHtml() {
    var grid = findGridEl();
    if (!grid) return;
    var nativeCards = grid.querySelectorAll(".product-card:not(.v91-card), .item-card:not(.v91-card)");
    if (nativeCards.length > 0) {
      var html = grid.innerHTML;
      if (html && html.length > 100 && html.length < 480000) {
        try { localStorage.setItem(CACHE_GRID_KEY, html); } catch (e) {}
      }
      if (navigator.onLine) {
        nativeLiveRendered = true;
      }
    }
  }

  window.__V91_QUICK_ADD__ = function (pid) {
    if (typeof window.addToCart === "function") {
      try { return window.addToCart(pid); } catch (e) {}
    }
    var list = window.__V91_LIVE_PRODUCTS__ || getCachedProducts();
    var p = list.find(function (x) { return x && String(x.id) === String(pid); });
    if (!p) return;
    var cartKey = "cart";
    ["cart", "zait_cart", "shoppingCart", "olive_cart", "savedCart"].some(function (k) {
      if (localStorage.getItem(k)) { cartKey = k; return true; }
      return false;
    });
    var arr = [];
    try { arr = JSON.parse(localStorage.getItem(cartKey) || "[]"); } catch (e) { arr = []; }
    if (!Array.isArray(arr)) arr = [];
    var ex = arr.find(function (c) { return String(c.id || c.productId || c.docId) === String(p.id); });
    if (ex) {
      ex.quantity = Number(ex.quantity || ex.qty || 1) + 1;
      if ("qty" in ex) ex.qty = ex.quantity;
    } else {
      arr.push({
        id: p.id,
        productId: p.id,
        name: p.name || "منتج زيت الشجرة المباركة",
        price: Number(p.price || 0),
        quantity: 1,
        imageUrl: optImgUrl(p.imageUrl || p.image || (Array.isArray(p.images) && p.images[0]) || "1000392409.jpeg"),
        selected: true
      });
    }
    try { localStorage.setItem(cartKey, JSON.stringify(arr)); } catch (e) {}
    syncDomCartBadges(arr);
    if (typeof window.updateCartUI === "function") try { window.updateCartUI(); } catch (e) {}
    if (typeof window.renderCart === "function") try { window.renderCart(); } catch (e) {}
    showToastV91("✅ تمت إضافة " + (p.name || "المنتج") + " إلى السلة!");
  };

  window.__V91_QUICK_OPEN__ = function (pid) {
    if (typeof window.openProductModal === "function") return window.openProductModal(pid);
    if (typeof window.showProductDetails === "function") return window.showProductDetails(pid);
    showToastV91("📡 يمكنك إضافة المنتج للسلة الآن وإتمام الطلب فور عودة الاتصال");
  };

  function renderCardsHtml(list) {
    var active = (list || []).filter(isProductActive);
    return active.map(function (p, i) {
      var img = optImgUrl(p.imageUrl || p.image || (Array.isArray(p.images) && p.images[0]) || "1000392409.jpeg");
      var price = Number(p.price || 0);
      var oldP = Number(p.oldPrice || 0);
      var disc = oldP > price ? Math.round(((oldP - price) / oldP) * 100) : 0;
      var out = (p.inStock === false) || (p.stock !== undefined && p.stock !== null && Number(p.stock) <= 0);
      return (
        '<div class="product-card v91-card" data-product-id="' + escHtml(p.id) + '">' +
          '<div class="v91-card-img" onclick="window.__V91_QUICK_OPEN__(\'' + escHtml(p.id) + '\')">' +
            '<img src="' + escHtml(img) + '" alt="' + escHtml(p.name) + '" ' + (i < 4 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" onerror="this.onerror=null;this.src=\'1000392409.jpeg\'">' +
            (disc > 0 ? '<span class="v91-card-badge">وفّر ' + disc + '%</span>' : '') +
          '</div>' +
          '<div class="v91-card-body">' +
            '<h3 class="v91-card-title" onclick="window.__V91_QUICK_OPEN__(\'' + escHtml(p.id) + '\')">' + escHtml(p.name) + '</h3>' +
            '<div>' +
              '<div style="margin-bottom:6px;">' +
                '<span class="v91-card-price">' + price.toLocaleString("ar-EG") + ' ج</span>' +
                (oldP > price ? '<span class="v91-card-old">' + oldP.toLocaleString("ar-EG") + ' ج</span>' : '') +
              '</div>' +
              '<button type="button" class="v91-card-btn" ' +
                (out ? 'disabled style="opacity:0.55"' : 'onclick="window.__V91_QUICK_ADD__(\'' + escHtml(p.id) + '\')"') +
              '>' + (out ? 'نفد المخزون' : '🛒 أضف للسلة') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function renderInstantOrOffline(force, explicitList) {
    var grid = findGridEl();
    if (!grid) return;
    if (!force && hasRealProductCards(grid)) return;
    restoringNow = true;
    try {
      var cachedHtml = "";
      if (!explicitList) {
        try { cachedHtml = localStorage.getItem(CACHE_GRID_KEY) || ""; } catch (e) {}
      }
      if (cachedHtml && cachedHtml.length > 100 && /product-card|item-card/i.test(cachedHtml)) {
        grid.innerHTML = cachedHtml;
      } else {
        var list = explicitList || getCachedProducts();
        if (list.length > 0) {
          grid.innerHTML = renderCardsHtml(list);
        }
      }
    } finally {
      setTimeout(function () { restoringNow = false; }, 60);
    }
  }

  function attachAntiWipeObserver() {
    var grid = findGridEl();
    if (!grid || antiWipeObserver) return;
    antiWipeObserver = new MutationObserver(function () {
      if (restoringNow) return;
      if (navigator.onLine) {
        var nativeCards = grid.querySelectorAll(".product-card:not(.v91-card), .item-card:not(.v91-card)");
        if (nativeCards.length > 0) {
          captureLiveNativeGridHtml();
          return;
        }
        if (nativeLiveRendered && userFiltered) return;
      }
      if (!hasRealProductCards(grid) && !userFiltered) {
        renderInstantOrOffline(true);
      }
    });
    antiWipeObserver.observe(grid, { childList: true, subtree: false });
  }

  // =========================================================================
  // FEATURE 2: AUTO-CLEAN DELETED / UNAVAILABLE PRODUCTS FROM CUSTOMER CART
  // =========================================================================
  function normalizeTitle(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function syncDomCartBadges(arr) {
    var qty = 0;
    if (Array.isArray(arr)) {
      arr.forEach(function (it) { qty += Math.max(1, Number(it && (it.quantity || it.qty) || 1)); });
    }
    document.querySelectorAll("#cart-count, #mobile-cart-badge, .cart-count, .cart-badge").forEach(function (el) {
      el.textContent = String(qty);
    });
  }

  function cleanCustomerCartAgainstLiveProducts(liveProducts) {
    if (!navigator.onLine) return 0;
    if (!Array.isArray(liveProducts) || liveProducts.length === 0) return 0;

    var activeProducts = liveProducts.filter(isProductActive);
    if (activeProducts.length === 0) return 0;

    var validIds = new Set();
    var validTitles = new Set();
    activeProducts.forEach(function (p) {
      if (p.id != null) validIds.add(String(p.id).trim());
      if (p.productId != null) validIds.add(String(p.productId).trim());
      if (p.docId != null) validIds.add(String(p.docId).trim());
      if (p.name) validTitles.add(normalizeTitle(p.name));
      if (p.title) validTitles.add(normalizeTitle(p.title));
    });

    var cartKeys = ["cart", "zait_cart", "shoppingCart", "olive_cart", "savedCart"];
    var removedNames = [];
    var totalRemoved = 0;
    var latestCleaned = null;

    function itemIsValid(item) {
      if (!item || typeof item !== "object") return false;
      var rawId = item.id != null ? item.id : (item.productId != null ? item.productId : item.docId);
      if (rawId != null && String(rawId).trim() !== "") {
        return validIds.has(String(rawId).trim());
      }
      var title = normalizeTitle(item.name || item.title || "");
      return title ? validTitles.has(title) : false;
    }

    cartKeys.forEach(function (key) {
      var raw = null;
      try { raw = localStorage.getItem(key); } catch (e) {}
      if (!raw) return;
      var arr = null;
      try { arr = JSON.parse(raw); } catch (e) {}
      if (!Array.isArray(arr) || arr.length === 0) return;

      var kept = [];
      arr.forEach(function (it) {
        if (itemIsValid(it)) {
          kept.push(it);
        } else {
          totalRemoved++;
          var nm = (it && (it.name || it.title)) ? String(it.name || it.title).trim() : "منتج غير متوفر";
          if (removedNames.indexOf(nm) === -1) removedNames.push(nm);
        }
      });

      if (kept.length !== arr.length) {
        latestCleaned = kept;
        try { localStorage.setItem(key, JSON.stringify(kept)); } catch (e) {}
      }
    });

    // مزامنة window.cart و window.state.cart إذا كانا موجودين
    try {
      if (Array.isArray(window.cart) && window.cart.length > 0) {
        var keptWin = window.cart.filter(function (it) {
          if (itemIsValid(it)) return true;
          var nm = (it && (it.name || it.title)) ? String(it.name || it.title).trim() : "منتج غير متوفر";
          if (removedNames.indexOf(nm) === -1) removedNames.push(nm);
          return false;
        });
        if (keptWin.length !== window.cart.length) {
          totalRemoved = Math.max(totalRemoved, window.cart.length - keptWin.length);
          window.cart.length = 0;
          keptWin.forEach(function (x) { window.cart.push(x); });
          latestCleaned = keptWin;
        }
      }
      if (window.state && Array.isArray(window.state.cart) && window.state.cart.length > 0) {
        var keptSt = window.state.cart.filter(itemIsValid);
        if (keptSt.length !== window.state.cart.length) {
          totalRemoved = Math.max(totalRemoved, window.state.cart.length - keptSt.length);
          window.state.cart.length = 0;
          keptSt.forEach(function (x) { window.state.cart.push(x); });
          latestCleaned = keptSt;
        }
      }
    } catch (e) {}

    if (totalRemoved > 0) {
      if (latestCleaned) syncDomCartBadges(latestCleaned);
      ["updateCartUI", "renderCart", "updateCartCount", "updateCartBadge", "syncCartToCloud"].forEach(function (fn) {
        if (typeof window[fn] === "function") {
          try { window[fn](); } catch (e) {}
        }
      });
      var label = removedNames.length ? removedNames.slice(0, 3).join("، ") : ("(" + totalRemoved + ") منتج");
      showToastV91("تمت إزالة [" + label + "] من السلة تلقائياً لعدم توفره حالياً");
    }

    return totalRemoved;
  }
  window.__V91_CLEAN_CART__ = cleanCustomerCartAgainstLiveProducts;

  var lastRestCheck = 0;
  function fetchLiveProductsFromFirestore(force) {
    if (!navigator.onLine) return;
    var now = Date.now();
    if (!force && now - lastRestCheck < 8000) return;
    lastRestCheck = now;

    fetch(REST_PRODUCTS_URL).then(function (r) {
      return r.ok ? r.json() : null;
    }).then(function (data) {
      if (!data || !Array.isArray(data.documents) || !data.documents.length) return;
      var liveList = data.documents.map(function (docObj) {
        var parts = String(docObj.name || "").split("/");
        var item = { id: parts[parts.length - 1] };
        var fields = docObj.fields || {};
        Object.keys(fields).forEach(function (k) { item[k] = parseFsVal(fields[k]); });
        return item;
      });
      if (liveList.length > 0) {
        window.__V91_LIVE_PRODUCTS__ = liveList;
        saveProductsToCache(liveList);
        cleanCustomerCartAgainstLiveProducts(liveList);
        if (!hasRealProductCards(findGridEl())) {
          renderInstantOrOffline(true, liveList);
        }
      }
    }).catch(function () {});
  }

  // إعادة الفحص تلقائياً عند فتح السلة أثناء وجود الإنترنت
  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest("button, a, [onclick], [data-tab], [data-panel]") : null;
    if (!t || !navigator.onLine) return;
    var hint = ((t.id || "") + " " + (t.className || "") + " " + (t.getAttribute("onclick") || "") + " " + (t.textContent || "")).toLowerCase();
    if (/cart|السلة|السله|عربة/.test(hint)) {
      if (Array.isArray(window.__V91_LIVE_PRODUCTS__) && window.__V91_LIVE_PRODUCTS__.length > 0) {
        cleanCustomerCartAgainstLiveProducts(window.__V91_LIVE_PRODUCTS__);
      } else {
        fetchLiveProductsFromFirestore(true);
      }
    }
  }, true);

  // =========================================================================
  // FEATURE 3: COMPLETE 50-TOPIC INTERACTIVE "?" HELP ENCYCLOPEDIA
  // =========================================================================
  var HELP_TOPICS = [
    {
      id: "inventory-table",
      cat: "المخزون والأسعار",
      title: "📦 جدول إدارة المخزون والأسعار السريع (Amazon Seller Central)",
      keys: ["جدول إدارة المخزون", "المخزون والأسعار", "amazon seller", "seller central"],
      what: "جدول موحّد مستوحى من لوحة بائعي أمازون يجمع كل عبوات وأحجام زيت الزيتون في مكان واحد لتعديل الأسعار والخصومات والمخزون خلال ثوانٍ دون فتح كل منتج بمفرده.",
      details: [
        "عمود (المنتج): يعرض الاسم الكامل للعبوة وحجمها (نصف لتر، لتر، جركن 2 لتر...).",
        "عمود (السعر ج): السعر الفعلي الحالي الذي يشتري به العميل، ويمكن تعديله مباشرة.",
        "عمود (قبل الخصم): السعر الأصلي المشطوب لإظهار نسبة التوفير للعميل.",
        "عمود (المخزون): عدد القطع المتوفرة أو حالة التوفر (متاح / نفد) لمنع بيع منتج غير موجود.",
        "زر الحفظ السريع: يحدّث Firebase فوراً ويظهر السعر الجديد لكل العملاء."
      ],
      usage: "راجعه يومياً قبل إطلاق إعلانات فيسبوك وتيك توك لضبط أسعار العبوات والتأكد من توفر المخزون الكافي.",
      example: "تعديل سعر عبوة 1 لتر إلى 490 ج.م ووضع السعر قبل الخصم 560 ج.م مع مخزون 40 عبوة يظهر للعميل شارة توفير 13% فوراً."
    },
    {
      id: "account-health",
      cat: "صحة المتجر",
      title: "🟢 صحة الحساب وصحة المتجر (Account Health)",
      keys: ["صحة الحساب", "صحة المتجر", "account health", "ممتاز 100%"],
      what: "مقياس جودة عام يقيّم أداء متجر الشجرة المباركة بناءً على نسبة تسليم الطلبات بنجاح مقارنة بالطلبات المرتجعة أو الملغاة.",
      details: [
        "95% إلى 100% (ممتاز - أخضر): أداء احترافي وثقة عملاء مرتفعة جداً.",
        "85% إلى 94% (جيد - أصفر): يوجد مرتجعات أو إلغاءات بسيطة تحتاج مراجعة.",
        "أقل من 85% (خطر - أحمر): يحتاج تدخلاً فورياً في التغليف أو شركة الشحن أو تأكيد الطلبات."
      ],
      usage: "أكد كل طلب بمكالمة أو رسالة واتساب قبل الشحن وغلّف عبوات الزيت جيداً للحفاظ على صحة المتجر فوق 96%.",
      example: "تسليم 48 طلباً بنجاح من أصل 50 طلباً يعطي صحة حساب 96% (ممتاز)."
    },
    {
      id: "return-rate",
      cat: "صحة المتجر",
      title: "🔄 معدل المرتجعات (Return Rate)",
      keys: ["معدل المرتجعات", "نسبة المرتجعات", "return rate", "المرتجعات"],
      what: "النسبة المئوية للطلبات التي عادت من شركة الشحن دون استلام أو طلب العميل إرجاعها.",
      details: [
        "المعدل الصحي في مصر لمتاجر المواد الغذائية هو أقل من 5%.",
        "كل طلب مرتجع يخصم منك تكلفة الشحن ذهاباً وإياباً (60 إلى 110 ج.م خسارة مباشرة).",
        "أهم أسبابه: عدم رد العميل على المندوب، تأخر الشحن، أو عدم توضيح الإجمالي قبل الخروج."
      ],
      usage: "اعرض الإجمالي شاملاً الشحن في رسالة التأكيد وفعّل خصماً بسيطاً للدفع المسبق بإنستاباي لتقليل المرتجعات.",
      example: "من 40 شحنة عاد طلبان فقط -> معدل المرتجعات = (2 ÷ 40) × 100 = 5%."
    },
    {
      id: "delivered-orders",
      cat: "الطلبات",
      title: "🚚 الطلبات المسلمة (Delivered Orders)",
      keys: ["الطلبات المسلمة", "تم التوصيل", "delivered", "المكتملة"],
      what: "عدد الطلبات التي استلمها العملاء فعلياً وتم تحصيل قيمتها بنجاح.",
      details: [
        "يمثل المبيعات المحققة فعلياً وليس مجرد طلبات جديدة تحت المراجعة.",
        "يستبعد تلقائياً الطلبات الملغاة والمرتجعة.",
        "يعكس كفاءة شركة الشحن في تغطية محافظات مصر."
      ],
      usage: "قارنه بإجمالي الطلبات المشحونة كل أسبوع لقياس نسبة نجاح شركة الشحن.",
      example: "شحن 30 طلباً وتسليم 27 طلباً يعني نسبة تسليم ممتازة تبلغ 90% بإيراد محقق 21,600 ج.م."
    },
    {
      id: "total-revenue",
      cat: "المالية والمبيعات",
      title: "💰 إجمالي المبيعات والإيرادات (Total Revenue)",
      keys: ["إجمالي المبيعات", "اجمالي المبيعات", "الإيرادات", "المبيعات", "revenue", "total sales"],
      what: "إجمالي المبالغ الناتجة عن مبيعات المتجر من الطلبات الفعالة قبل طرح تكلفة الزيت والعبوات والمصاريف.",
      details: [
        "يُحدث تلقائياً فور وصول طلبات جديدة أو تغيير حالة الطلب.",
        "يستبعد الطلبات الملغاة والمرتجعة لتبقى الأرقام حقيقية.",
        "تذكر أنه يمثل (إجمالي الدخل) وليس (صافي الربح)."
      ],
      usage: "تابع منحنى المبيعات أسبوعياً لمعرفة أفضل الأيام للحملات الإعلانية ومواسم الإقبال مثل رمضان.",
      example: "بيع 25 عبوة لتر بسعر 500 ج.م يحقق إجمالي مبيعات = 12,500 ج.م."
    },
    {
      id: "net-profit",
      cat: "المالية والمبيعات",
      title: "📈 صافي الأرباح (Net Profit)",
      keys: ["صافي الربح", "صافي الأرباح", "الربح الصافي", "الأرباح", "net profit"],
      what: "المبلغ الحقيقي المتبقي لك كربح صافٍ بعد خصم تكلفة الزيت، العبوات، الكراتين، الشحن، والإعلانات.",
      details: [
        "المعادلة: صافي الربح = إجمالي المبيعات − (تكلفة البضاعة + المصاريف + الإعلانات).",
        "يعتمد في دقته على إدخالك لسعر التكلفة في كل منتج وتدوين المصاريف أولاً بأول.",
        "المؤشر الأهم لقياس نجاح متجر الشجرة المباركة ونموه."
      ],
      usage: "راجع صافي الربح نهاية كل أسبوع لتتأكد أن الإنفاق الإعلاني لا يلتهم هامش ربحك.",
      example: "مبيعات 12,500 ج.م − تكلفة زيت وعبوات 7,800 ج.م − إعلانات ومصاريف 1,700 ج.م = صافي ربح 3,000 ج.م."
    },
    {
      id: "profit-margin",
      cat: "المالية والمبيعات",
      title: "📊 هامش الربح (Profit Margin %)",
      keys: ["هامش الربح", "نسبة الربح", "profit margin"],
      what: "النسبة المئوية لصافي الربح من كل 100 جنيه مبيعات داخل المتجر.",
      details: [
        "المعادلة: (صافي الربح ÷ إجمالي المبيعات) × 100.",
        "الهامش الصحي لزيت الزيتون السيناوي البكر الممتاز يتراوح بين 20% و35%.",
        "انخفاض الهامش يعني ضرورة رفع متوسط الفاتورة أو تقليل تكلفة الإعلان أو التوريد."
      ],
      usage: "راقب هامش الربح لكل حجم عبوة؛ غالباً ما يكون هامش الجراكن 2 لتر و4 لتر أعلى ربحية في الشحن.",
      example: "ربح صافٍ 3,000 ج.م من مبيعات 12,500 ج.م يعني هامش ربح ممتاز قدره 24%."
    },
    {
      id: "aov",
      cat: "مؤشرات الأداء KPI",
      title: "🛒 متوسط قيمة الطلب (AOV)",
      keys: ["متوسط قيمة الطلب", "متوسط الطلب", "aov", "average order"],
      what: "متوسط المبلغ الذي ينفقه العميل الواحد في كل فاتورة داخل المتجر.",
      details: [
        "المعادلة: إجمالي المبيعات ÷ عدد الطلبات الفعالة.",
        "زيادة AOV ترفع أرباحك فوراً دون دفع جنيه واحد زيادة في الإعلانات.",
        "يرتفع عبر باقات التوفير وعرض الشحن المجاني فوق حد معين."
      ],
      usage: "اضبط حد الشحن المجاني ليكون أعلى بـ 200 ج.م من متوسط الطلب الحالي لتحفيز العميل على زيادة الكمية.",
      example: "مبيعات 16,000 ج.م من 20 طلباً تعني متوسط طلب 800 ج.م؛ وضع شحن مجاني فوق 1,000 ج.م يرفعه سريعاً."
    },
    {
      id: "conversion-rate",
      cat: "مؤشرات الأداء KPI",
      title: "🎯 معدل التحويل (Conversion Rate)",
      keys: ["معدل التحويل", "نسبة التحويل", "conversion rate", "conversion"],
      what: "نسبة الزوار الذين تحوّلوا فعلياً إلى مشترين وأكملوا طلباً مقارنة بإجمالي الزوار.",
      details: [
        "المعادلة: (عدد الطلبات ÷ عدد الزوار) × 100.",
        "المعدل الجيد في التجارة الإلكترونية بمصر يتراوح بين 1.5% و4%.",
        "يتأثر بسرعة فتح الموقع، جودة الصور، وضوح السعر، وتقييمات العملاء."
      ],
      usage: "إذا كان الترافيك عالياً ومعدل التحويل أقل من 1%، راجع سعر الشحن وأضف فيديوهات حقيقية للزيت وتقييمات موثقة.",
      example: "دخول 300 زائر للمتجر وإتمام 9 طلبات يعطي معدل تحويل 3% (ممتاز)."
    },
    {
      id: "abandoned-carts",
      cat: "التسويق والمبيعات",
      title: "🛍️ السلات المتروكة (Abandoned Carts)",
      keys: ["السلات المتروكة", "السلال المتروكة", "سلة متروكة", "abandoned"],
      what: "العملاء الذين اختاروا منتجات زيت زيتون وأضافوها للسلة لكنهم خرجوا قبل تأكيد الطلب.",
      details: [
        "هؤلاء عملاء دافئون ومهتمون بالشراء بالفعل وأسهل في الإقناع من الزائر الجديد.",
        "غالباً ما يتوقفون بسبب الانشغال أو التردد في مصاريف الشحن.",
        "استرجاع 25% من السلات المتروكة يزيد أرباحك دون أي مصاريف إعلان إضافية."
      ],
      usage: "تواصل معهم برسالة واتساب لطيفة خلال ساعتين مع كود خصم 5% أو شحن مخفض لإكمال الطلب.",
      example: "عميل ترك 2 لتر زيت بقيمة 960 ج.م؛ رسالة تذكير بكود خصم 50 ج.م تحوّل السلة لطلب مؤكد فوراً."
    },
    {
      id: "visitors-traffic",
      cat: "الزيارات والتحليلات",
      title: "👁️ إجمالي الزيارات وزيارات اليوم (Visitors)",
      keys: ["إجمالي الزيارات", "زيارات اليوم", "الزوار", "الزيارات", "visitors"],
      what: "عداد دقيق يسجل عدد الزيارات التي استقبلها متجرك اليوم وإجمالاً منذ التأسيس أو آخر تصفير.",
      details: [
        "زيارات اليوم: تساعدك في قياس تفاعل حملاتك الإعلانية اليومية لحظياً.",
        "إجمالي الزيارات: يوضح نمو شعبية المتجر على المدى الطويل.",
        "يستثني زيارات المدير نفسه حتى لا تتضخم الأرقام بشكل غير حقيقي."
      ],
      usage: "قارن زيارات اليوم بعدد الطلبات اليومية لتعرف هل إعلان اليوم يجذب زواراً مهتمين فعلاً أم لا.",
      example: "وصول 180 زيارة اليوم ونتج عنها 6 طلبات يعني استهدافاً ناجحاً جداً بمعدل 3.3%."
    },
    {
      id: "traffic-sources",
      cat: "الزيارات والتحليلات",
      title: "🌐 مصادر الزيارات والترافيك (Traffic Sources)",
      keys: ["مصادر الزيارات", "مصادر الترافيك", "traffic sources", "الترافيك"],
      what: "يكشف المنصات التي يأتي منها عملاؤك: فيسبوك، تيك توك، واتساب، بحث جوجل، أو دخول مباشر للتطبيق.",
      details: [
        "يميز بين الترافيك المجاني (جوجل وواتساب والبحث) والمدفوع (إعلانات فيسبوك وتيك توك).",
        "يساعدك على استثمار وقتك وميزانيتك في القناة الأكثر تحقيقاً للمبيعات."
      ],
      usage: "ركز نشر الفيديوهات القصيرة للزيت على المنصة التي تحقق أعلى مبيعات بأقل تكلفة.",
      example: "إذا جلب فيسبوك 60% من الطلبات وواتساب 25%، فاهتم بمتابعة حالات واتساب وصفحة فيسبوك يومياً."
    },
    {
      id: "top-products",
      cat: "تحليلات المنتجات",
      title: "🏆 المنتجات الأكثر مبيعاً (Top Selling)",
      keys: ["الأكثر مبيعاً", "الاكثر مبيعا", "أفضل المنتجات", "top selling", "المنتجات الرائجة"],
      what: "قائمة بأكثر العبوات والأحجام طلباً وإيراداً داخل متجر الشجرة المباركة.",
      details: [
        "يوضح الحجم الأكثر جاذبية لعملائك (نصف لتر، لتر، 2 لتر، أو باقة العيلة).",
        "يحدد لك المنتج البطل الذي يجب أن يتصدر إعلاناتك وصفحتك الرئيسية."
      ],
      usage: "احرص ألا ينفد مخزون المنتج الأول مبيعاً أبداً وضع عليه شارة (الأكثر طلباً).",
      example: "إذا حققت عبوة 1 لتر عصرة أولى مبيعات 18,000 ج.م (65% من المتجر)، اجعلها محور إعلانك الرئيسي."
    },
    {
      id: "slow-products",
      cat: "تحليلات المنتجات",
      title: "🐢 المنتجات الأقل مبيعاً والراكدة (Slow Moving)",
      keys: ["الأقل مبيعاً", "الاقل مبيعا", "الراكدة", "slow moving"],
      what: "المنتجات التي لم تحقق مبيعات قوية خلال الفترة الأخيرة وبقيت في المخزون.",
      details: [
        "تحذرك من تجميد السيولة المالية في أصناف بطيئة الحركة.",
        "تكشف لك حاجة المنتج لتغيير صورته أو سعره أو وضعه داخل عرض باقة."
      ],
      usage: "ادمج الصنف الأقل مبيعاً كإضافة بخصم خاص مع العبوة الأكثر مبيعاً لتنشيط حركته.",
      example: "عرض عبوة 250 مل بطيئة الحركة بسعر 110 ج.م بدلاً من 150 ج.م عند شراء 2 لتر زيت."
    },
    {
      id: "low-stock",
      cat: "المخزون والأسعار",
      title: "⚠️ تنبيهات نقص المخزون (Low Stock Alerts)",
      keys: ["نقص المخزون", "المخزون المنخفض", "low stock", "وشك النفاد", "نفاد المخزون"],
      what: "تحذير مبكر يظهر تلقائياً عندما تنخفض الكمية المتبقية من أي منتج عن الحد الآمن.",
      details: [
        "يمنع توقف مبيعاتك وإعلاناتك فجأة بسبب نفاد العبوات.",
        "يوضح بالضبط كم قطعة متبقية من كل صنف لتطلب التعبئة في الوقت المناسب."
      ],
      usage: "جهّز توريدة جديدة من سيناء والعبوات الفارغة فور ظهور التنبيه قبل وصول المخزون لصفر.",
      example: "عند تبقّي 5 عبوات فقط من جركن 2 لتر، يظهر التنبيه لتجهيز 30 جركناً جديداً قبل عطلة نهاية الأسبوع."
    },
    {
      id: "pricing-discounts",
      cat: "المخزون والأسعار",
      title: "🏷️ السعر قبل الخصم وبعد الخصم (Pricing & Discounts)",
      keys: ["قبل الخصم", "بعد الخصم", "الأسعار", "السعر", "خصم", "pricing", "discount"],
      what: "آلية تسعير ذكية تُظهر السعر الحالي والسعر السابق المشطوب لحساب نسبة التوفير تلقائياً للعميل.",
      details: [
        "يعزز القيمة النفسية للعرض ويوضح للعميل كم وفّر بالجنيه والنسبة المئوية.",
        "تأكد دائماً أن (السعر قبل الخصم) أكبر من (السعر الحالي) ليظهر العرض بشكل سليم."
      ],
      usage: "استخدم أسعاراً واضحة ومغرية (مثل 490 ج.م بدلاً من 550 ج.م) خاصة في المواسم والعروض.",
      example: "سعر حالي 480 ج.م وسعر قبل الخصم 560 ج.م = توفير فوري 80 ج.م (خصم 14%)."
    },
    {
      id: "orders-management",
      cat: "الطلبات",
      title: "📋 إدارة الطلبات وحالات الشحن (Orders Management)",
      keys: ["إدارة الطلبات", "الطلبات", "حالة الطلب", "orders"],
      what: "غرفة العمليات المركزية لمراجعة الطلبات الواردة، وتأكيدها، وتحديث حالتها، وطباعة فواتيرها.",
      details: [
        "يعرض بيانات العميل الكاملة: الاسم، رقمي الهاتف، المحافظة، العنوان، العبوات، وطريقة الدفع.",
        "تحديث الحالة هنا ينعكس فوراً في صفحة تتبع الطلب لدى العميل.",
        "يؤثر مباشرة على إحصائيات المبيعات وصحة المتجر."
      ],
      usage: "خصص فترتين يومياً (الصباح والعصر) لمراجعة الطلبات الجديدة وتحديث حالات الشحن أولاً بأول.",
      example: "تحويل الطلب #1052 من (قيد المراجعة) إلى (تم الشحن) بعد تسليمه للمندوب وإرسال رقم التتبع للعميل."
    },
    {
      id: "pending-orders",
      cat: "الطلبات",
      title: "⏳ الطلبات قيد المراجعة (Pending Orders)",
      keys: ["قيد المراجعة", "طلبات جديدة", "pending"],
      what: "الطلبات الجديدة التي أرسلها العملاء للتو وتنتظر منك التأكيد الهاتفي أو عبر واتساب قبل التجهيز.",
      details: [
        "كلما أكدت الطلب أسرع (خلال 15–30 دقيقة)، زادت احتمالية استلام العميل وقلّت الإلغاءات.",
        "يسمح النظام للعميل بإلغاء طلبه ذاتياً وهو في هذه الحالة فقط قبل الشحن."
      ],
      usage: "لا تترك أي طلب قيد المراجعة لأكثر من ساعتين خلال ساعات العمل.",
      example: "وصول 4 طلبات قيد المراجعة بقيمة 3,200 ج.م -> تأكيدها سريعاً يضمن شحنها في نفس اليوم."
    },
    {
      id: "processing-shipped",
      cat: "الطلبات",
      title: "📦 الطلبات قيد التجهيز والمشحونة (Processing & Shipped)",
      keys: ["قيد التجهيز", "مشحون", "جاري الشحن", "في الطريق", "processing", "shipped"],
      what: "الطلبات التي تم تأكيدها وجارٍ تعبئتها أو تم تسليمها بالفعل لشركة الشحن في طريقها للعميل.",
      details: [
        "قيد التجهيز: تم التأكيد مع العميل وجارٍ التغليف المحكم.",
        "مشحون / في الطريق: خرجت الكرتونة مع شركة الشحن وتصل عادة خلال 1–3 أيام عمل."
      ],
      usage: "تابع الطلبات التي ظلت بحالة (مشحون) أكثر من 4 أيام مع شركة الشحن لمنع تحولها لمرتجع.",
      example: "متابعة شحنة متأخرة في الإسكندرية بقيمة 950 ج.م مع شركة الشحن تنقذها من الإرجاع."
    },
    {
      id: "cancelled-orders",
      cat: "الطلبات",
      title: "❌ الطلبات الملغاة والمرفوضة (Cancelled Orders)",
      keys: ["ملغي", "ملغى", "الملغاة", "المرفوضة", "cancelled", "canceled"],
      what: "الطلبات التي تم إلغاؤها قبل الشحن أو رفضها العميل، وتُستبعد تلقائياً من صافي المبيعات.",
      details: [
        "تساعدك مراجعة أسباب الإلغاء في حل مشاكل التسعير أو الشحن.",
        "لا يتم حذف الفاتورة نهائياً من الأرشيف حتى تبقى السجلات شفافة."
      ],
      usage: "دوّن سبب الإلغاء في الملاحظات (مثل: تأخر الرد / سعر الشحن) لتحسين تجربتك مستقبلاً.",
      example: "إذا تكرر الإلغاء بسبب ارتفاع شحن الصعيد (90 ج.م)، جرب عرض شحن ثابت 65 ج.م للعبوتين."
    },
    {
      id: "crm-customers",
      cat: "العملاء والولاء",
      title: "👥 إدارة العملاء وقاعدة البيانات (CRM)",
      keys: ["إدارة العملاء", "العملاء", "قاعدة العملاء", "crm", "customers", "users"],
      what: "دليل متكامل لكل عملاء متجر الشجرة المباركة مع تاريخ طلباتهم وأرقام هواتفهم وإجمالي مشترياتهم.",
      details: [
        "يساعدك على معرفة العميل الجديد من العميل القديم بلمح البصر.",
        "يتيح متابعة نقاط الولاء الخاصة بكل عميل وتاريخ آخر طلب له."
      ],
      usage: "زيت الزيتون منتج يتجدد شراؤه كل 45–60 يوماً؛ تواصل مع عملائك القدامى بعرض خاص قبل نفاد الزيت لديهم.",
      example: "إرسال رسالة لـ 30 عميلاً اشتروا قبل شهرين بعرض (خصم 10% للعميل العائد) يولد 8–10 طلبات مجانية."
    },
    {
      id: "vip-rfm",
      cat: "العملاء والولاء",
      title: "👑 عملاء VIP والعملاء المتكررون (RFM Analysis)",
      keys: ["vip", "العملاء المتكررين", "المتكررون", "العملاء الجدد", "rfm"],
      what: "تصنيف ذكي للعملاء حسب تكرار الشراء وحجم الإنفاق للتركيز على أفضل عملائك.",
      details: [
        "عملاء VIP: أنفقوا أعلى مبالغ أو اشتروا 3 مرات فأكثر، وهم سفراء علامتك التجارية.",
        "العملاء المتكررون: دليل عملي على رضا الناس عن جودة وطعم زيتك السيناوي.",
        "العملاء الجدد: يحتاجون تجربة أولى ممتازة وتغليفاً فخماً ليعودوا للشراء."
      ],
      usage: "كافئ عملاء VIP بهدية صغيرة أو أولوية في حجز أول عصرة جديدة من الموسم.",
      example: "عميل اشترى 4 مرات بإجمالي 3,600 ج.م -> إرسال عينة زعتر أو خصم VIP 15% يضمن ولاءه لسنوات."
    },
    {
      id: "loyalty-points",
      cat: "العملاء والولاء",
      title: "⭐ برنامج نقاط الولاء (Loyalty Points)",
      keys: ["نقاط الولاء", "الولاء", "النقاط", "loyalty"],
      what: "نظام مكافآت تلقائي يمنح العميل نقاطاً مع كل طلب ليحولها لخصم حقيقي في طلبه القادم.",
      details: [
        "يزيد من معدل تكرار الشراء ويمنع العميل من التوجه لمنافس آخر.",
        "يمكنك تحديد كم نقطة تُمنح لكل جنيه وكم تساوي النقطة عند الاستبدال."
      ],
      usage: "اذكر للعميل في رسالة واتساب أنه كسب رصيد نقاط يمكنه خصمه في الطلب القادم.",
      example: "كل 100 ج.م شراء تمنح 10 نقاط (قيمتها 5 ج.م خصم)؛ طلب بـ 1,000 ج.م يعطي العميل 50 ج.م خصماً لطلبه التالي."
    },
    {
      id: "coupons-promo",
      cat: "التسويق والمبيعات",
      title: "🎟️ الكوبونات وأكواد الخصم (Coupons & Promo Codes)",
      keys: ["الكوبونات", "أكواد الخصم", "كوبون", "كود خصم", "coupons", "promo"],
      what: "أداة إنشاء وإدارة أكواد الخصم (نسبة مئوية أو مبلغ ثابت بالجنيه) مع حد استخدام وتاريخ انتهاء.",
      details: [
        "يعرض عدد مرات استخدام كل كود لتقيس نجاح كل حملة إعلانية بدقة.",
        "يمكنك إيقاف أو تعديل أو حذف أي كود بضغطة واحدة."
      ],
      usage: "اصنع كوداً خاصاً لكل قناة (FB10 لفيسبوك، TT10 لتيك توك، WA10 لواتساب) لتعرف أين تأتي المبيعات.",
      example: "كود SINAI10 يعطي خصم 10% بحد أقصى 50 استخداماً؛ على فاتورة 900 ج.م يخصم 90 ج.م تلقائياً."
    },
    {
      id: "referral-program",
      cat: "التسويق والمبيعات",
      title: "🤝 نظام الإحالة والتسويق بالعمولة (Referrals)",
      keys: ["الإحالة", "الاحالة", "دعوة الأصدقاء", "العمولة", "referral", "affiliate"],
      what: "يمنح كل عميل رابطاً أو كوداً خاصاً لدعوة أهله وأصدقائه، ويحصل الطرفان على خصم أو مكافأة عند أول شراء.",
      details: [
        "توصية الصديق هي أقوى دعاية لمنتج طبيعي مثل زيت الزيتون البكر.",
        "يتتبع النظام تلقائياً عدد الإحالات الناجحة والعمولات المستحقة."
      ],
      usage: "شجع العملاء السعداء بجودة الزيت على مشاركة رابطهم في جروبات العائلة مقابل رصيد 50 ج.م لكل صديق يشتري.",
      example: "دعا عميل 3 من أصدقائه واشترى كل منهم بـ 500 ج.م -> حققت 1,500 ج.م مبيعات مجانية مقابل 150 ج.م مكافأة."
    },
    {
      id: "gift-cards",
      cat: "التسويق والمبيعات",
      title: "🎁 بطاقات الهدايا (Gift Cards)",
      keys: ["بطاقات الهدايا", "قسائم الهدايا", "gift card", "هدايا"],
      what: "قسائم شراء رقمية مسبقة الدفع برمز سري يهديها العميل لمن يحب ليختار بها ما يشاء من متجرك.",
      details: [
        "تدخل السيولة النقدية لحسابك مقدماً وتعرّف عملاء جدداً بمتجر الشجرة المباركة.",
        "يمكن متابعة رصيد كل بطاقة وحالتها (نشطة / مستخدمة) من لوحة الإدارة."
      ],
      usage: "سوّق لها في المواسم والأعياد وعيد الأم كهدية صحية فاخرة من زيت سيناء البكر.",
      example: "شراء بطاقة هدية بقيمة 1,000 ج.م يتيح للمستلم إدخال الكود في السلة وخصم الـ 1,000 ج.م فوراً."
    },
    {
      id: "pixels-tracking",
      cat: "التسويق والمبيعات",
      title: "📡 البكسل والتتبع (Facebook / TikTok / Google Analytics)",
      keys: ["البكسل", "التتبع", "facebook pixel", "tiktok", "google analytics", "pixel"],
      what: "ربط متجرك بحسابات إعلانات فيسبوك وتيك توك وجوجل لتسجيل كل زيارة وإضافة للسلة وعملية شراء تلقائياً.",
      details: [
        "يعلّم خوارزمية الإعلانات شكل العميل الذي يشتري زيت الزيتون فعلاً فتقل تكلفة الطلب لديك.",
        "يتيح عمل إعلانات إعادة الاستهداف (Retargeting) لمن زار الموقع ولم يشترِ بعد.",
        "فقط أدخل رقم الـ Pixel ID واضغط حفظ."
      ],
      usage: "تأكد من وضع Facebook Pixel ID قبل إطلاق أي حملة مبيعات لتوفير 30% إلى 50% من ميزانية الإعلان.",
      example: "عند إتمام طلب بـ 950 ج.م يرسل البكسل حدث Purchase بقيمة 950 EGP لفيسبوك لتحسين الحملة تلقائياً."
    },
    {
      id: "push-notifications",
      cat: "التسويق والمبيعات",
      title: "🔔 إشعارات الدفع الفورية (Push Notifications / FCM)",
      keys: ["الإشعارات", "الاشعارات", "إشعارات الدفع", "إرسال إشعار", "push", "fcm"],
      what: "إرسال رسائل تنبيهية مباشرة لشاشة هواتف العملاء الذين فعّلوا الإشعارات أو ثبّتوا تطبيق المتجر.",
      details: [
        "وسيلة تواصل مجانية 100% تصل مباشرة لجيب العميل.",
        "ممتازة لإعلان وصول العصرة الجديدة أو عرض نهاية الأسبوع."
      ],
      usage: "أرسل 1–2 إشعار أسبوعياً فقط في أوقات المساء (8–10 م) مع عرض واضح ومباشر.",
      example: "إشعار لـ 250 مشتركاً: 🫒 خصم 15% الليلة فقط على جركن 2 لتر السيناوي! قد يحقق 10 طلبات بلا أي تكلفة."
    },
    {
      id: "whatsapp-quick",
      cat: "التواصل والخدمة",
      title: "📱 رسائل واتساب السريعة وتأكيد الطلب",
      keys: ["واتساب", "رسائل واتساب", "تأكيد واتساب", "whatsapp"],
      what: "أزرار ذكية تفتح محادثة واتساب جاهزة مع العميل برسالة منسقة تحتوي رقم الطلب وتفاصيله وإجماليه.",
      details: [
        "توفر وقت الكتابة اليدوية وتمنع الأخطاء في الأرقام والعناوين.",
        "تعطي العميل إحساساً فورياً بالثقة والاحترافية."
      ],
      usage: "اضغط زر واتساب فور وصول كل طلب جديد لتأكيد العنوان وموعد التوصيل خلال دقائق.",
      example: "رسالة سريعة: أهلاً أستاذ محمد، تم استلام طلبك #1088 (2 لتر زيت سيناوي) بإجمالي 960 ج.م شامل الشحن؛ هل نعتمد التجهيز؟"
    },
    {
      id: "invoices-print",
      cat: "الطلبات",
      title: "🖨️ طباعة الفواتير وبوالص الشحن (Invoices & Print)",
      keys: ["الفواتير", "فاتورة", "طباعة", "بوليصة", "invoice", "print"],
      what: "توليد فاتورة احترافية باسم وشعار متجر زيت الشجرة المباركة للطباعة أو الحفظ بصيغة PDF ولصقها على الشحنة.",
      details: [
        "تضم اسم العميل، الهاتف الأساسي والاحتياطي، العنوان، العبوات، والمبلغ المطلوب تحصيله.",
        "تقلل أخطاء مناديب الشحن وترفع قيمة العلامة التجارية في عين العميل."
      ],
      usage: "اطبع الفاتورة قبل تغليف كل شحنة وضع نسخة داخل الكرتونة مع كارت شكر صغير.",
      example: "بوليصة شحن جاهزة عليها التحصيل المطلوب 545 ج.م ورقم خدمة العملاء للمعاينة عند الاستلام."
    },
    {
      id: "export-excel",
      cat: "البيانات والتقارير",
      title: "📥 تصدير البيانات إلى Excel / CSV",
      keys: ["تصدير", "excel", "csv", "إكسل", "كشف", "export"],
      what: "تحميل جدول الطلبات أو المنتجات أو العملاء في ملف Excel/CSV لفتحه على الكمبيوتر أو إرساله لشركة الشحن.",
      details: [
        "يدعم اللغة العربية بالكامل بدون حروف مقطعة.",
        "مثالي لعمل كشف تسليم يومي للمندوب أو مراجعة المحاسبة الشهرية."
      ],
      usage: "صدّر طلبات اليوم الجاهزة للشحن في ملف Excel واحد وأرسله مباشرة لشركة الشحن.",
      example: "تصدير 18 طلباً في ملف Excel واحد خلال ثانيتين بإجمالي تحصيل 14,200 ج.م."
    },
    {
      id: "backup-restore",
      cat: "البيانات والتقارير",
      title: "💾 النسخ الاحتياطي والاستعادة (Backup & Restore)",
      keys: ["نسخ احتياطي", "نسخة احتياطية", "استعادة", "backup", "restore"],
      what: "حفظ نسخة كاملة من بيانات متجرك (منتجات، طلبات، إعدادات، عملاء) على جهازك والقدرة على استعادتها عند الحاجة.",
      details: [
        "يحمي تعبك وبيانات عملائك من أي حذف خاطئ أو طارئ.",
        "ملف خفيف يمكنك حفظه على اللابتوب أو Google Drive."
      ],
      usage: "اعمل نسخة احتياطية أسبوعياً كل جمعة أو قبل إجراء تعديلات كبيرة على المنتجات.",
      example: "حفظ ملف backup_2026_11.json بحجم 180 KB يضمن أمان كل بيانات متجرك 100%."
    },
    {
      id: "reviews-management",
      cat: "العملاء والولاء",
      title: "⭐ إدارة التقييمات والمراجعات (Reviews & Ratings)",
      keys: ["التقييمات", "المراجعات", "آراء العملاء", "reviews", "ratings"],
      what: "مراجعة تعليقات العملاء وتقييماتهم بالنجوم (1 إلى 5) والرد عليها أو إزالة التعليقات غير اللائقة.",
      details: [
        "التقييمات الحقيقية هي أقوى أداة إقناع للعملاء الجدد عند شراء زيت الزيتون أونلاين.",
        "الرد المهذب على كل تقييم يظهر اهتمامك الحقيقي بعملائك."
      ],
      usage: "بعد استلام العميل بيومين، اطلب منه كتابة تجربته الصادقة على المتجر.",
      example: "ظهور 30 تقييماً حقيقياً بمتوسط 4.9 نجوم قد يرفع معدل الشراء بنسبة 35%."
    },
    {
      id: "bundle-builder",
      cat: "التسويق والمبيعات",
      title: "🎁 عروض الباقات والباندل (Bundle Builder)",
      keys: ["الباقات", "الباندل", "العروض المجمعة", "باقة", "bundle", "bundles"],
      what: "إنشاء عروض مجمعة (مثلاً 2 لتر + نصف لتر أو زيت + زيتون) بسعر خاص لزيادة حجم الفاتورة.",
      details: [
        "ترفع متوسط قيمة الطلب وتقلل نسبة مصاريف الشحن مقارنة بقيمة الفاتورة.",
        "تجعل العميل يشعر أنه حصل على صفقة توفير ممتازة."
      ],
      usage: "جهّز باقة (تجربة) وباقة (العيلة السيناوية) وباقة (الجملة) لتناسب كل الميزانيات.",
      example: "باقة 3 لتر بسعر 1,380 ج.م وشحن مجاني بدلاً من 1,500 ج.م + 70 ج.م شحن (توفير 190 ج.م)."
    },
    {
      id: "spin-wheel",
      cat: "التسويق والمبيعات",
      title: "🎡 عجلة الحظ (Spin Wheel — جرب حظك واربح!)",
      keys: ["عجلة الحظ", "جرب حظك", "اربح", "spin", "wheel"],
      what: "لعبة تفاعلية جذابة يديرها الزائر ليربح خصماً فورياً أو شحناً مجانياً مقابل تسجيل رقمه.",
      details: [
        "تجمع لك قائمة أرقام عملاء مهتمين فعلاً بالشراء.",
        "تحفز الزائر المتردد على الطلب فوراً لاستخدام الجائزة قبل انتهائها."
      ],
      usage: "اضبط الجوائز بذكاء (خصم 5%، خصم 10%، شحن مجاني فوق 900 ج.م) حتى تبقى كل جائزة مربحة لك.",
      example: "ربح زائر كود خصم 10% على عبوة لتر (480 ج.م) -> يدفع 432 ج.م وتكسب عميلاً دائماً جديداً."
    },
    {
      id: "flash-offers",
      cat: "التسويق والمبيعات",
      title: "⏱️ العروض الخاطفة والعد التنازلي (Flash Sales)",
      keys: ["العروض الخاطفة", "العرض الخاطف", "العد التنازلي", "المؤقت", "flash", "timer"],
      what: "عرض بخصم مميز لفترة محدودة يظهر معه عداد تنازلي لحث الزائر على عدم التأجيل.",
      details: [
        "يرفع المبيعات السريعة في أيام الركود أو عطلة نهاية الأسبوع.",
        "يمكن تشغيله وإيقافه وتحديد وقت انتهائه بسهولة."
      ],
      usage: "شغّله لمدة 24 أو 48 ساعة فقط في نهاية الشهر أو مع نزول الراتب لنتائج مذهلة.",
      example: "عرض 24 ساعة: جركن 2 لتر بـ 920 ج.م بدلاً من 1,000 ج.م يحقق قفزة سريعة في طلبات اليوم."
    },
    {
      id: "shipping-govs",
      cat: "الشحن والتوصيل",
      title: "🗺️ الشحن والمحافظات والشحن المجاني",
      keys: ["الشحن", "المحافظات", "أسعار الشحن", "الشحن المجاني", "shipping", "governorate"],
      what: "إعداد أسعار الشحن لكل محافظة في مصر، وتحديد الحد الأدنى للشحن المجاني، ومتابعة أكثر المحافظات طلباً.",
      details: [
        "يمكنك تخصيص سعر أقل لمحافظتك (الشرقية / القاهرة / الدلتا) وسعر مناسب للصعيد والمحافظات الحدودية.",
        "تحليل المحافظات يكشف أين يجب أن تركز إعلاناتك الممولة."
      ],
      usage: "اجعل الشحن المجاني يبدأ من مبلغ يشجع على شراء لترين فأكثر لتغطية تكلفة الشحن من الربح.",
      example: "شحن الشرقية 45 ج.م، القاهرة والجيزة 60 ج.م، الصعيد 85 ج.م، ومجاني لأي طلب فوق 1,000 ج.م."
    },
    {
      id: "payment-methods",
      cat: "المالية والمبيعات",
      title: "💳 الدفع الإلكتروني وكاش (COD / InstaPay / Paymob)",
      keys: ["طرق الدفع", "الدفع الإلكتروني", "إنستاباي", "فودافون كاش", "paymob", "كاش", "payment"],
      what: "التحكم في وسائل الدفع المتاحة: الدفع عند الاستلام (كاش)، فودافون كاش، إنستاباي، أو بوابة Paymob.",
      details: [
        "الدفع عند الاستلام مع إمكانية المعاينة يبني الثقة مع العميل الجديد.",
        "تشجيع الدفع بإنستاباي أو فودافون كاش يضمن جدية الطلب بنسبة 100%."
      ],
      usage: "تأكد دائماً من وصول التحويل الفعلي على هاتفك أو حسابك قبل شحن الطلب المدفوع إلكترونياً.",
      example: "منح خصم 25 ج.م أو شحن مخفض عند الدفع بإنستاباي يرفع المدفوعات المسبقة ويمنع المرتجعات."
    },
    {
      id: "products-management",
      cat: "المخزون والأسعار",
      title: "🫒 إدارة المنتجات وإضافة منتج جديد",
      keys: ["إدارة المنتجات", "إضافة منتج", "اضافة منتج", "تعديل منتج", "المنتجات", "products"],
      what: "القسم المخصص لإضافة عبوات وأصناف جديدة، وتعديل الصور والوصف والأحجام والأسعار، أو إخفاء/حذف منتج.",
      details: [
        "في V91 أي منتج جديد تضيفه يتم مزامنته تلقائياً للعمل أونلاين وأوفلاين مع صوره.",
        "أي منتج تحذفه أو تخفيه يُزال تلقائياً من سلات العملاء بمجرد اتصالهم بالإنترنت."
      ],
      usage: "اكتب عنواناً واضحاً وصوراً مضاءة جيداً للزجاجة ولون الزيت الذهبي الأخضر لتضاعف المبيعات.",
      example: "إضافة منتج (زيت زيتون سيناوي بكر ممتاز — عصرة أولى على البارد 1 لتر) بسعر 490 ج.م."
    },
    {
      id: "expenses-finance",
      cat: "المالية والمبيعات",
      title: "🧾 المصاريف والتقرير المالي (Expenses & P&L)",
      keys: ["المصاريف", "المصروفات", "التقرير المالي", "المالية", "expenses", "finance"],
      what: "دفتر لتسجيل كل نفقات المشروع (إعلانات، زجاجات، كراتين، استيكرات، فرق شحن) لاستخراج صافي الربح الحقيقي.",
      details: [
        "يفصل حسابات متجر الشجرة المباركة عن مصروفاتك الشخصية.",
        "يوضح لك أي بند يستهلك أكبر جزء من أرباحك لتتمكن من ترشيده."
      ],
      usage: "دوّن كل مصروف في يومه ولو كان مبلغاً صغيراً للحصول على تقرير مالي دقيق نهاية الشهر.",
      example: "تسجيل 1,200 ج.م إعلان فيسبوك + 350 ج.م كراتين وتغليف يُخصم تلقائياً من الأرباح."
    },
    {
      id: "treasury-ledger",
      cat: "المالية والمبيعات",
      title: "🏦 الخزينة ودفتر النقدية (Treasury Ledger)",
      keys: ["الخزينة", "دفتر النقدية", "التحصيل", "treasury", "ledger"],
      what: "متابعة السيولة النقدية الفعلية (كاش في اليد، محفظة فودافون كاش، حساب بنكي، وتحويلات شركة الشحن).",
      details: [
        "يوضح الفرق بين المبيعات المؤجلة عند شركة الشحن والفلوس التي دخلت جيبك فعلياً.",
        "يسهل مراجعة كشف حساب شركة الشحن أسبوعياً."
      ],
      usage: "سجّل كل دفعة تحصيل تستلمها من شركة الشحن هنا لتتأكد أنه لا يوجد طلبات منسية.",
      example: "استلام تحويل 7,450 ج.م من شركة الشحن عن 9 طلبات مسلّمة -> يُسجّل إيداعاً في الخزينة."
    },
    {
      id: "suppliers-purchases",
      cat: "المخزون والأسعار",
      title: "🏭 الموردين ومزارع ومعاصر سيناء (Suppliers)",
      keys: ["الموردين", "المشتريات", "المعصرة", "suppliers"],
      what: "سجل بيانات المزارع والمعاصر وموردي العبوات والزجاجات وتكاليف كل دفعة شراء.",
      details: [
        "يحفظ أسعار الجملة لكل دفعة لتعرف متوسط تكلفة اللتر بدقة.",
        "يتابع الدفعات المدفوعة والمتبقية للموردين."
      ],
      usage: "سجّل تاريخ العصرة والمورد لكل دفعة لضمان ثبات أعلى جودة للعملاء.",
      example: "شراء 100 لتر من معصرة سيناء بتكلفة 33,000 ج.م = تكلفة اللتر جملة 330 ج.م قبل العبوة."
    },
    {
      id: "live-chat",
      cat: "التواصل والخدمة",
      title: "💬 الشات المباشر ودعم العملاء (Live Chat)",
      keys: ["الشات", "المحادثات", "رسائل العملاء", "الدعم", "chat", "messages"],
      what: "صندوق محادثات فوري للرد على أسئلة العملاء داخل المتجر دون أن يغادروا الصفحة.",
      details: [
        "يعرض إشعاراً بالرسائل الجديدة غير المقروءة.",
        "الرد السريع خلال دقائق يرفع فرص الشراء بشكل ملموس."
      ],
      usage: "جهز ردوداً جاهزة عن نسبة الحموضة، طريقة الحفظ، العصرة الباردة، ومدة الشحن.",
      example: "عميل يستفسر عن الفرق بين اللتر وجركن 2 لتر؛ ردك خلال دقيقتين يقنعه بطلب الجركن بـ 940 ج.م."
    },
    {
      id: "return-requests",
      cat: "الطلبات",
      title: "↩️ طلبات الاسترجاع والاستبدال (Return Requests)",
      keys: ["طلبات الاسترجاع", "الاستبدال", "الاسترجاع", "return requests"],
      what: "قسم يستقبل طلبات العملاء لاستبدال أو إرجاع شحنة بها تلف أو خطأ لمعالجتها بسرعة.",
      details: [
        "يعرض رقم الطلب وسبب المشكلة ووسيلة التواصل مع العميل.",
        "حسن التعامل مع المشاكل يحوّل العميل الغاضب إلى عميل دائم."
      ],
      usage: "تواصل مع العميل فوراً واعرض الاستبدال السريع لأي عبوة تضررت أثناء النقل.",
      example: "استبدال عبوة نصف لتر (250 ج.م) تسرّبت في الشحن يكسبك سمعة ممتازة وطلبات متكررة بآلاف الجنيهات."
    },
    {
      id: "stock-price-alerts",
      cat: "التسويق والمبيعات",
      title: "📩 تنبيهات توفر المنتج وانخفاض السعر",
      keys: ["تنبيهات التوفر", "تنبيه السعر", "أخبرني", "stock alerts", "price alerts"],
      what: "قائمة العملاء الذين سجلوا أرقامهم ليصلهم إشعار فور عودة منتج نفد مخزونه أو نزول خصم عليه.",
      details: [
        "عملاء جاهزون للشراء الفوري بدون دفع مليم واحد في الإعلانات.",
        "تكشف لك الأصناف المطلوبة بشدة لتوفر منها كميات أكبر."
      ],
      usage: "فور تجديد المخزون أرسل رسالة لكل المسجلين في القائمة لتحقيق مبيعات فورية.",
      example: "تواصل مع 15 عميلاً ينتظرون زيت الزيتون بالزعتر -> يشتري منهم 9 عملاء خلال نفس اليوم."
    },
    {
      id: "admins-security",
      cat: "الأمان والإدارة",
      title: "🛡️ الأمان وصلاحيات المدير والموظفين",
      keys: ["الأمان", "صلاحيات", "المدير", "المشرفين", "الموظفين", "staff", "admins", "security"],
      what: "إدارة حسابات المشرفين وموظفي خدمة العملاء وتحديد صلاحيات كل شخص لحماية بيانات المتجر.",
      details: [
        "المدير العام (Super Admin) فقط يتحكم في إضافة وحذف المشرفين والإعدادات الحساسة.",
        "يحمي المتجر من التعديل العشوائي أو تسريب بيانات العملاء."
      ],
      usage: "لا تشارك كلمة سر حسابك الأساسي؛ أضف بريد كل موظف بصلاحياته المحددة فقط.",
      example: "إعطاء موظف تأكيد الطلبات صلاحية تحديث حالات الطلب فقط دون صلاحية حذف المنتجات."
    },
    {
      id: "audit-logs",
      cat: "الأمان والإدارة",
      title: "📜 سجل التدقيق والمراقبة الأمنية (Audit Logs)",
      keys: ["سجل التدقيق", "المراقبة", "سجل النشاط", "audit", "logs"],
      what: "سجل تلقائي يوثّق كل تعديل إداري مهم (تغيير سعر، تعديل مخزون، تغيير حالة طلب) بالوقت واسم المنفّذ.",
      details: [
        "يكشف فوراً سبب أي خطأ أو تعديل غير مقصود في الأسعار أو الطلبات.",
        "يعزز الأمان والشفافية عندما يعمل معك أكثر من شخص."
      ],
      usage: "راجعه إذا لاحظت اختلافاً في سعر منتج أو كمية مخزون لتعرف متى ومن قام بالتعديل.",
      example: "تسجيل: تم تعديل سعر (عبوة 1 لتر) من 480 ج.م إلى 490 ج.م بتاريخ اليوم الساعة 8:30 م."
    },
    {
      id: "blacklist-appeals",
      cat: "الأمان والإدارة",
      title: "🚫 قائمة الحظر والطعون (Blacklist & Appeals)",
      keys: ["الحظر", "المحظورين", "القائمة السوداء", "الطعون", "blacklist", "ban", "appeal"],
      what: "حماية المتجر من الطلبات الوهمية أو الأرقام التي تتعمد رفض الاستلام وتكبيدك خسائر الشحن.",
      details: [
        "يسمح بحظر رقم مسيء ومراجعة طلبات فك الحظر إن وجدت.",
        "يوفر مئات الجنيهات من مصاريف الشحن الضائعة شهرياً."
      ],
      usage: "استخدمه فقط مع الأرقام التي تكرر منها الإلغاء الوهمي بعد التأكد ومحاولة التواصل.",
      example: "حظر رقم وهمي طلب 3 مرات وأغلق هاتفه يوفر عليك 210 ج.م مصاريف شحن رايح جاي."
    },
    {
      id: "admin-bar-toggle",
      cat: "الأمان والإدارة",
      title: "👁️ إخفاء وإظهار شريط الإدارة (Admin Bar Toggle)",
      keys: ["إخفاء شريط الإدارة", "اخفاء شريط الادارة", "شريط الإدارة", "admin bar"],
      what: "زر سريع يطوي شريط أدوات المدير مؤقتاً لمعاينة شكل المتجر تماماً كما يراه العميل العادي.",
      details: [
        "لا يخرجك من حساب المدير، ويمكنك إظهار الشريط مرة أخرى بضغطة واحدة.",
        "مفيد جداً لتصوير شاشة المتجر في الإعلانات والفيديوهات الترويجية."
      ],
      usage: "اضغطه قبل تسجيل فيديو ترويجي للمتجر حتى تظهر واجهة الشراء نظيفة وجذابة.",
      example: "إخفاء شريط الإدارة ثم تصوير تجربة إضافة عبوة اللتر للسلة ونشرها على صفحة فيسبوك."
    },
    {
      id: "ai-insights",
      cat: "التحليلات الذكية",
      title: "🤖 التوقعات وتحليلات الذكاء الاصطناعي (AI Insights)",
      keys: ["الذكاء الاصطناعي", "التوقعات", "توصيات", "ai", "insights", "forecast"],
      what: "تحليل ذكي لأنماط مبيعاتك السابقة يتوقع حجم الطلب القادم ويقترح أفضل قرارات المخزون والتسويق.",
      details: [
        "يتنبأ بالأصناف التي ستنفد قريباً بناءً على معدل البيع اليومي.",
        "يقترح أوقات الذروة المناسبة لإطلاق العروض والإشعارات."
      ],
      usage: "استعن به قبل المواسم لتحديد كمية الجراكن واللتر المطلوب تعبئتها مسبقاً.",
      example: "إذا كان متوسط بيعك 4 عبوات لتر يومياً، ينصحك النظام بتجهيز 120 عبوة على الأقل للشهر القادم."
    }
  ];

  function findBestHelpTopic(labelText, ctxText) {
    var hay = normalizeTitle(labelText + " " + (ctxText || ""));
    var normLabel = normalizeTitle(labelText);
    var best = null;
    var bestScore = 0;

    HELP_TOPICS.forEach(function (t) {
      var score = 0;
      t.keys.forEach(function (k) {
        var nk = normalizeTitle(k);
        if (!nk) return;
        if (normLabel.indexOf(nk) > -1) score += nk.length >= 6 ? 8 : 5;
        else if (hay.indexOf(nk) > -1) score += nk.length >= 6 ? 4 : 2;
      });
      if (normLabel.length >= 3 && normalizeTitle(t.title).indexOf(normLabel) > -1) score += 6;
      if (score > bestScore) {
        bestScore = score;
        best = t;
      }
    });

    if (best) return best;

    var cleanTitle = String(labelText || "أداة إدارية").replace(/\?/g, "").trim().slice(0, 85);
    return {
      id: "contextual",
      cat: "شرح مخصص للإدارة",
      title: "💡 شرح: " + cleanTitle,
      what: "هذا العنصر (" + cleanTitle + ") هو جزء من أدوات الإدارة والإحصائيات داخل متجر زيت الشجرة المباركة، ومهمته عرض بيانات محدثة أو تنفيذ إجراء إداري سريع.",
      details: [
        "يعمل بربط مباشر مع قاعدة بيانات المتجر السحابية (Firebase) لعرض أدق الأرقام.",
        "يُنصح بوجود اتصال إنترنت مستقر عند حفظ أي تعديل لضمان وصوله لكل العملاء فوراً.",
        "يمكنك الضغط على (فهرس الـ 50 شرحاً) بالأسفل للبحث عن أي مؤشر أو جدول آخر بالتفصيل الممل."
      ],
      usage: "راجع هذا العنصر ضمن متابعتك اليومية للطلبات والمخزون ولاحظ أثره على مبيعاتك وصحة المتجر.",
      example: "مراقبة التغييرات في (" + cleanTitle + ") أسبوعياً تساعدك على زيادة الأرباح وتقليل المرتجعات في متجر الشجرة المباركة.",
      isFallback: true
    };
  }

  function ensureHelpModal() {
    var modal = document.getElementById("v91-help-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "v91-help-modal";
    modal.className = "v91-help-modal";
    modal.innerHTML =
      '<div class="v91-help-sheet" role="dialog" aria-modal="true">' +
        '<div class="v91-help-head">' +
          '<div>' +
            '<span class="v91-help-cat" id="v91-help-cat">موسوعة الإدارة</span>' +
            '<h3 id="v91-help-title">📚 دليل الإحصائيات والإدارة</h3>' +
          '</div>' +
          '<button type="button" class="v91-help-close" id="v91-help-close" aria-label="إغلاق">✕</button>' +
        '</div>' +
        '<div class="v91-help-body" id="v91-help-body"></div>' +
        '<div class="v91-help-foot">' +
          '<button type="button" class="v91-help-index-btn" id="v91-help-index-btn">📚 تصفح كل المواضيع (' + HELP_TOPICS.length + ' شرح بالتفصيل)</button>' +
        '</div>' +
      '</div>';
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.classList.remove("open");
    });
    document.body.appendChild(modal);
    document.getElementById("v91-help-close").onclick = function () { modal.classList.remove("open"); };
    document.getElementById("v91-help-index-btn").onclick = function () { openHelpIndex(""); };
    return modal;
  }

  function openHelpTopic(topic) {
    var modal = ensureHelpModal();
    document.getElementById("v91-help-cat").textContent = topic.cat || "دليل الإدارة";
    document.getElementById("v91-help-title").textContent = topic.title;
    var body = document.getElementById("v91-help-body");

    var html =
      '<div class="v91-help-sec"><h4>1️⃣ ما هو هذا العنصر؟</h4><p style="margin:0;">' + escHtml(topic.what) + '</p></div>' +
      '<div class="v91-help-sec"><h4>2️⃣ شرح التفاصيل والأعمدة والأرقام بالتفصيل الممل:</h4><ul>' +
        topic.details.map(function (d) { return '<li>' + escHtml(d) + '</li>'; }).join("") +
      '</ul></div>' +
      '<div class="v91-help-sec"><h4>3️⃣ كيف تستفيد منه عملياً لمتجر زيت الزيتون "الشجرة المباركة"؟</h4><p style="margin:0;">' + escHtml(topic.usage) + '</p></div>' +
      '<div class="v91-help-sec"><h4>4️⃣ مثال عملي بالأرقام بالجنيه المصري (ج.م):</h4><p style="margin:0;color:#fde68a;font-weight:700;">' + escHtml(topic.example) + '</p></div>';

    if (topic.isFallback) {
      html += '<div class="v91-help-sec"><h4>🔗 شروحات أساسية قد تبحث عنها:</h4>' +
        HELP_TOPICS.slice(0, 5).map(function (rel) {
          return '<button type="button" class="v91-help-idx-item" data-tid="' + escHtml(rel.id) + '"><span>' + escHtml(rel.title) + '</span><span>◀</span></button>';
        }).join("") + '</div>';
    }

    body.innerHTML = html;
    body.querySelectorAll("[data-tid]").forEach(function (b) {
      b.onclick = function () {
        var found = HELP_TOPICS.find(function (x) { return x.id === b.getAttribute("data-tid"); });
        if (found) openHelpTopic(found);
      };
    });
    modal.classList.add("open");
  }

  function openHelpIndex(query) {
    var modal = ensureHelpModal();
    document.getElementById("v91-help-cat").textContent = "الفهرس الكامل (" + HELP_TOPICS.length + " موضوعاً)";
    document.getElementById("v91-help-title").textContent = "📚 موسوعة شرح كل أقسام الإحصائيات والإدارة";
    var body = document.getElementById("v91-help-body");
    var nq = normalizeTitle(query || "");

    var filtered = HELP_TOPICS.filter(function (item) {
      if (!nq) return true;
      var hay = normalizeTitle(item.title + " " + item.cat + " " + item.what + " " + item.keys.join(" "));
      return hay.indexOf(nq) > -1;
    });

    body.innerHTML =
      '<input type="search" id="v91-help-search" class="v91-help-search" placeholder="🔎 ابحث عن أي قسم أو مؤشر (المخزون، المرتجعات، صافي الربح، البكسل...)" value="' + escHtml(query || "") + '">' +
      '<div>' +
        (filtered.length
          ? filtered.map(function (it) {
              return '<button type="button" class="v91-help-idx-item" data-tid="' + escHtml(it.id) + '"><span>' + escHtml(it.title) + '</span><span style="color:#f4cf6d;font-size:0.78rem;">شرح ◀</span></button>';
            }).join("")
          : '<div style="text-align:center;padding:24px;color:#cbd5e1;">لا توجد نتائج مطابقة لبحثك</div>') +
      '</div>';

    var inp = document.getElementById("v91-help-search");
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      inp.oninput = function () { openHelpIndex(inp.value); };
    }
    body.querySelectorAll("[data-tid]").forEach(function (b) {
      b.onclick = function () {
        var found = HELP_TOPICS.find(function (x) { return x.id === b.getAttribute("data-tid"); });
        if (found) openHelpTopic(found);
      };
    });
    modal.classList.add("open");
  }
  window.__V91_OPEN_HELP_INDEX__ = function () { openHelpIndex(""); };

  // =========================================================================
  // FEATURE 3 & 4: ADMIN DETECTOR, "?" INJECTOR, MOBILE TABLE WRAPPER & FLOAT HIDER
  // =========================================================================
  var ADMIN_SELECTOR = [
    '[id*="admin"]', '[id*="stat"]', '[id*="analytics"]', '[id*="dashboard"]',
    '[id*="inventory"]', '[id*="report"]', '[id*="seller"]', '[id*="sales"]',
    '[id*="finance"]', '[id*="crm"]', '[id*="marketing"]', '[id*="pixel"]',
    '[id*="coupon"]', '[id*="loyalty"]', '[id*="referral"]', '[id*="gift"]',
    '[class*="admin-panel"]', '[class*="stats-panel"]', '[class*="analytics-panel"]',
    '[class*="seller-central"]', '[class*="inventory-panel"]'
  ].join(",");

  function isVisibleElement(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.id === "v91-help-modal" || el.closest("#v91-help-modal")) return false;
    var st = window.getComputedStyle(el);
    if (st.display === "none" || st.visibility === "hidden" || Number(st.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    return r.width > 40 && r.height > 40;
  }

  function makeHelpBtn(label, ctx) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "v91-help-btn";
    b.textContent = "?";
    b.title = "شرح بالتفصيل: " + label;
    b.setAttribute("aria-label", "شرح " + label);
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openHelpTopic(findBestHelpTopic(label, ctx));
    });
    return b;
  }

  function enhanceAdminAndStatsUI() {
    var containers = Array.prototype.slice.call(document.querySelectorAll(ADMIN_SELECTOR));
    // أيضاً اكتشاف اللوحات الديناميكية عن طريق النص (مثل جدول إدارة المخزون / لوحة التحكم / الإحصائيات)
    document.querySelectorAll(".panel, .modal-content, section").forEach(function (el) {
      if (containers.indexOf(el) > -1) return;
      if (el.id === "products-container" || el.closest("#products-container")) return;
      var head = el.querySelector("h1, h2, h3");
      if (head && /جدول إدارة المخزون|الإحصائيات|لوحة التحكم|صحة المتجر|Amazon Seller/i.test(head.textContent || "")) {
        containers.push(el);
      }
    });

    var anyAdminOpen = false;

    containers.forEach(function (box) {
      if (!isVisibleElement(box)) return;
      if (box.id === "products-container" || box.closest("#products-container")) return;
      var rect = box.getBoundingClientRect();
      if (rect.height > 140 && rect.width > 220 && !/^(BUTTON|A|INPUT|SPAN)$/i.test(box.tagName)) {
        anyAdminOpen = true;
      }

      // 1. حقن زر (?) بجانب العناوين، التبويبات، البطاقات، رؤوس الجداول، والأزرار الرئيسية
      var targets = box.querySelectorAll("h1, h2, h3, h4, th, .stat-title, .kpi-title, .card-title, .stat-label, .admin-tab, .tab-btn, button");
      targets.forEach(function (el) {
        if (el.dataset.v91Helped) return;
        if (el.classList.contains("v91-help-btn") || el.closest("#v91-help-modal")) return;
        if (el.querySelector(".v91-help-btn")) { el.dataset.v91Helped = "1"; return; }
        var txt = (el.textContent || "").replace(/\s+/g, " ").trim();
        if (!txt || txt.length < 3 || txt.length > 110) return;
        if (/^(✕|×|x|حفظ|إغلاق|اغلاق|إلغاء|الغاء|نعم|لا|تعديل|حذف|متاح|نفد|\+|\-|\d+)$/i.test(txt)) return;

        el.dataset.v91Helped = "1";
        var ctx = (box.id || "") + " " + (box.className || "");
        el.appendChild(makeHelpBtn(txt, ctx));
      });

      // 2. تغليف كل <table> داخل غلاف التمرير الأفقي وتلميح السحب للموبايل
      box.querySelectorAll("table").forEach(function (tbl) {
        if (tbl.closest(".v91-table-scroll") || !tbl.parentNode) return;
        var hint = document.createElement("div");
        hint.className = "v91-swipe-hint";
        hint.textContent = "⬅️ اسحب الجدول يميناً ويساراً لعرض جميع الأعمدة ➡️";
        var wrap = document.createElement("div");
        wrap.className = "v91-table-scroll";
        tbl.parentNode.insertBefore(hint, tbl);
        tbl.parentNode.insertBefore(wrap, tbl);
        wrap.appendChild(tbl);
      });
    });

    // 3. إخفاء الأزرار العائمة للعملاء أثناء فتح أي لوحة إدارة/إحصائيات على الموبايل
    document.body.classList.toggle("v91-admin-open", anyAdminOpen);
    if (anyAdminOpen) {
      document.querySelectorAll("button, a, div").forEach(function (el) {
        if (el.closest("#v91-help-modal") || el.closest(ADMIN_SELECTOR)) return;
        var st = window.getComputedStyle(el);
        if (st.position !== "fixed") return;
        var sig = ((el.id || "") + " " + (el.className || "") + " " + (el.textContent || "")).toLowerCase();
        if (/جرب حظك|واربح|wheel|spin|chat|whatsapp|shield|install/.test(sig)) {
          el.classList.add("v91-floating-hidden");
        }
      });
    } else {
      document.querySelectorAll(".v91-floating-hidden").forEach(function (el) {
        el.classList.remove("v91-floating-hidden");
      });
    }
  }

  var adminDebounce = null;
  function scheduleAdminEnhance() {
    if (adminDebounce) clearTimeout(adminDebounce);
    adminDebounce = setTimeout(enhanceAdminAndStatsUI, 280);
  }

  // =========================================================================
  // FEATURE 5: ON-DEMAND LAZY LEAFLET LOADER (NEVER BLOCKS INITIAL LOAD)
  // =========================================================================
  var leafletPromise = null;
  window.__V91_LOAD_LEAFLET__ = function () {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve) {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(l);
      var s = document.createElement("script");
      s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = function () { resolve(window.L); };
      s.onerror = function () { resolve(null); };
      document.head.appendChild(s);
    });
    return leafletPromise;
  };

  document.addEventListener("click", function (ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("button, a") : null;
    if (!b) return;
    var h = ((b.id || "") + " " + (b.className || "") + " " + (b.getAttribute("onclick") || "") + " " + (b.textContent || "")).toLowerCase();
    if (/map|location|خريطة|خريطه|موقع/.test(h)) {
      window.__V91_LOAD_LEAFLET__();
    }
  }, true);

  // =========================================================================
  // BOOTSTRAP V91 ENGINE
  // =========================================================================
  function bootEngine() {
    updateOfflinePill();
    attachAntiWipeObserver();

    // 1. عرض فوري من الكاش المحلي أو snapshot خلال أجزاء من الثانية
    var cached = getCachedProducts();
    if (cached.length > 0) {
      if (!hasRealProductCards(findGridEl())) renderInstantOrOffline(false, cached);
    } else {
      fetch(SNAPSHOT_URL).then(function (r) { return r.ok ? r.json() : null; }).then(function (snap) {
        if (Array.isArray(snap) && snap.length > 0) {
          saveProductsToCache(snap);
          if (!hasRealProductCards(findGridEl())) renderInstantOrOffline(false, snap);
        }
      }).catch(function () {});
    }

    // 2. عند وجود الإنترنت: تحديث المنتجات وتنقية السلة من أي منتج محذوف
    if (navigator.onLine) {
      fetchLiveProductsFromFirestore(true);
    }

    // 3. تسجيل Service Worker المحدّث V91
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js?v=91", { scope: "/" }).catch(function () {});
    }

    window.addEventListener("offline", function () {
      updateOfflinePill();
      attachAntiWipeObserver();
      renderInstantOrOffline(false);
    });
    window.addEventListener("online", function () {
      updateOfflinePill();
      fetchLiveProductsFromFirestore(true);
    });

    // 4. مراقب التغييرات للوحات الإدارة وتحديث الكاش عند إضافة منتجات جديدة
    var bodyObserver = new MutationObserver(function () {
      scheduleAdminEnhance();
      if (navigator.onLine) captureLiveNativeGridHtml();
      if (Array.isArray(window.products) && window.products.length > 0 && navigator.onLine) {
        saveProductsToCache(window.products);
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });

    setTimeout(enhanceAdminAndStatsUI, 450);
    setTimeout(captureLiveNativeGridHtml, 1600);
    setTimeout(function () {
      if (Array.isArray(window.products) && window.products.length > 0 && navigator.onLine) {
        saveProductsToCache(window.products);
        cleanCustomerCartAgainstLiveProducts(window.products);
      }
    }, 3200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootEngine);
  } else {
    bootEngine();
  }
})();
