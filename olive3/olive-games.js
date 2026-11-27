/* ============================================================================
   Zait Store Olive Games Ultra — V98 Master OS (Part 1 + Plugin Bridge for Packs 2 & 3)
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_GAMES_V98__) return;
  window.__ZAIT_OLIVE_GAMES_V98__ = true;

  var CFG_KEY = "zait_v96_games_config";
  var STATE_KEY = "zait_v96_player_state";
  var ROI_KEY = "zait_v96_games_analytics";
  var LB_KEY = "zait_v96_leaderboard_cache";

  // =========================================================================
  // 1. REALISTIC VECTOR ART LIBRARY (OliveArt) + 1:1 PIXEL-PERFECT POINTER
  // =========================================================================
  window.OliveArt = {
    drawOlive: function (ctx, x, y, r, variant) {
      ctx.save(); ctx.translate(x, y);
      var grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r * 1.15);
      if (variant === "gold") { grad.addColorStop(0, "#fef08a"); grad.addColorStop(0.55, "#eab308"); grad.addColorStop(1, "#854d0e"); }
      else if (variant === "black") { grad.addColorStop(0, "#6b21a8"); grad.addColorStop(0.5, "#3b0764"); grad.addColorStop(1, "#111827"); }
      else if (variant === "rotten") { grad.addColorStop(0, "#a8a29e"); grad.addColorStop(0.6, "#57534e"); grad.addColorStop(1, "#292524"); }
      else { grad.addColorStop(0, "#bef264"); grad.addColorStop(0.52, "#65a30d"); grad.addColorStop(1, "#1e3a0f"); }
      ctx.strokeStyle = "#422006"; ctx.lineWidth = Math.max(1.5, r * 0.14);
      ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.quadraticCurveTo(r * 0.18, -r * 1.32, r * 0.34, -r * 1.28); ctx.stroke();
      if (variant !== "rotten") {
        ctx.fillStyle = variant === "gold" ? "#84cc16" : "#22c55e";
        ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 1.02, r * 0.44, r * 0.2, -0.55, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.82, r * 1.04, 0.18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.beginPath(); ctx.ellipse(-r * 0.28, -r * 0.35, r * 0.2, r * 0.36, -0.35, 0, Math.PI * 2); ctx.fill();
      if (variant === "rotten") {
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, 5); ctx.moveTo(5, -5); ctx.lineTo(-5, 5); ctx.stroke();
      }
      ctx.restore();
    },
    drawBottle: function (ctx, x, y, w, h, fillRatio) {
      ctx.save(); ctx.translate(x, y);
      var nw = w * 0.34, nh = h * 0.22;
      ctx.fillStyle = "#b45309"; ctx.fillRect(-nw / 2 - 1, -h / 2 - 5, nw + 2, 7);
      ctx.beginPath();
      ctx.moveTo(-nw / 2, -h / 2 + 2); ctx.lineTo(-nw / 2, -h / 2 + nh);
      ctx.quadraticCurveTo(-w / 2, -h / 2 + nh + 10, -w / 2, -h / 2 + nh + 22);
      ctx.lineTo(-w / 2, h / 2 - 6); ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2 + 8, h / 2);
      ctx.lineTo(w / 2 - 8, h / 2); ctx.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - 6);
      ctx.lineTo(w / 2, -h / 2 + nh + 22); ctx.quadraticCurveTo(w / 2, -h / 2 + nh + 10, nw / 2, -h / 2 + nh);
      ctx.lineTo(nw / 2, -h / 2 + 2); ctx.closePath();
      ctx.fillStyle = "rgba(12, 36, 22, 0.85)"; ctx.fill();
      ctx.save(); ctx.clip();
      var fH = h * Math.max(0, Math.min(1, fillRatio !== undefined ? fillRatio : 0.85));
      var lg = ctx.createLinearGradient(0, h / 2 - fH, 0, h / 2);
      lg.addColorStop(0, "#fde047"); lg.addColorStop(0.5, "#ca8a04"); lg.addColorStop(1, "#713f12");
      ctx.fillStyle = lg; ctx.fillRect(-w / 2, h / 2 - fH, w, fH);
      ctx.restore();
      ctx.strokeStyle = "#e5b84b"; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = "#fef3c7"; ctx.fillRect(-w * 0.38, -2, w * 0.76, h * 0.24);
      ctx.fillStyle = "#153422"; ctx.font = "900 " + Math.max(8, Math.round(w * 0.2)) + "px Cairo,sans-serif"; ctx.textAlign = "center";
      ctx.fillText("🌿 بكر", 0, h * 0.14);
      ctx.restore();
    },
    drawBasket: function (ctx, x, y, w, h, hasShield) {
      ctx.save(); ctx.translate(x, y);
      if (hasShield) {
        ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, h / 2, w * 0.62, Math.PI, 0); ctx.stroke();
      }
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#d97706"); grad.addColorStop(1, "#78350f");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineTo(w / 2 - 10, h); ctx.lineTo(-w / 2 + 10, h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(254, 240, 138, 0.45)"; ctx.lineWidth = 1.4;
      for (var wy = 7; wy < h; wy += 7) { ctx.beginPath(); ctx.moveTo(-w / 2 + wy * 0.25, wy); ctx.lineTo(w / 2 - wy * 0.25, wy); ctx.stroke(); }
      ctx.fillStyle = "#f59e0b"; ctx.fillRect(-w / 2 - 3, -5, w + 6, 7);
      ctx.strokeStyle = "#fde68a"; ctx.strokeRect(-w / 2 - 3, -5, w + 6, 7);
      ctx.restore();
    },
    drawTreeCanopy: function (ctx, W, H, themeIdx) {
      var skies = [["#0c2618", "#17422a"], ["#1a1b3a", "#173c2d"], ["#2b1a0e", "#193a24"], ["#0a2838", "#133b27"], ["#1f132d", "#143522"]];
      var pair = skies[(themeIdx || 0) % skies.length];
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, pair[0]); bg.addColorStop(1, pair[1]);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(34, 139, 68, 0.42)";
      for (var i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(i * (W / 7), 4, 34, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = "rgba(20, 83, 45, 0.72)";
      for (var j = 0; j < 7; j++) { ctx.beginPath(); ctx.arc(25 + j * (W / 6.5), -6, 28, 0, Math.PI * 2); ctx.fill(); }
    },
    drawHazard: function (ctx, x, y, r, kind) {
      ctx.save(); ctx.translate(x, y);
      if (kind === "stone") {
        ctx.fillStyle = "#64748b";
        ctx.beginPath(); ctx.moveTo(-r, 2); ctx.lineTo(-r * 0.5, -r * 0.85); ctx.lineTo(r * 0.6, -r * 0.7); ctx.lineTo(r, 3); ctx.lineTo(r * 0.4, r * 0.85); ctx.lineTo(-r * 0.65, r * 0.75); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1.4; ctx.stroke();
      } else {
        ctx.fillStyle = "#1f2937"; ctx.beginPath(); ctx.arc(0, 2, r * 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; ctx.stroke();
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.quadraticCurveTo(6, -r * 1.3, 10, -r * 1.1); ctx.stroke();
        ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(10, -r * 1.1, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },
    drawTruck: function (ctx, x, y) {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(-24, -26, 48, 58);
      ctx.fillStyle = "#15803d"; ctx.fillRect(-21, -24, 42, 36);
      ctx.strokeStyle = "#f4cf6d"; ctx.lineWidth = 2; ctx.strokeRect(-21, -24, 42, 36);
      ctx.fillStyle = "#fde047"; ctx.beginPath(); ctx.ellipse(0, -6, 6, 8, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#f4cf6d"; ctx.fillRect(-19, -36, 38, 14);
      ctx.fillStyle = "#0f172a"; ctx.fillRect(-15, -33, 30, 7);
      ctx.fillStyle = "#fef08a"; ctx.fillRect(-17, -38, 7, 3); ctx.fillRect(10, -38, 7, 3);
      ctx.restore();
    }
  };

  // Exact 1:1 Pointer Mapper (Zero distortion across Phone / Tablet / Laptop / Desktop!)
  function getPointerPos(ev, canvas, W, H) {
    var rect = canvas.getBoundingClientRect();
    var cx = 0, cy = 0;
    if (ev.touches && ev.touches.length) { cx = ev.touches[0].clientX; cy = ev.touches[0].clientY; }
    else if (ev.changedTouches && ev.changedTouches.length) { cx = ev.changedTouches[0].clientX; cy = ev.changedTouches[0].clientY; }
    else { cx = ev.clientX; cy = ev.clientY; }
    return {
      x: ((cx - rect.left) / (rect.width || 1)) * W,
      y: ((cy - rect.top) / (rect.height || 1)) * H
    };
  }

  function setupHiDpiCanvas(canvas, cssW, cssH) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    // Keep parent wrapper strictly proportional so rect === drawn pixels 1:1!
    if (canvas.parentElement && canvas.parentElement.classList.contains("og-canvas-wrap")) {
      canvas.parentElement.style.aspectRatio = cssW + " / " + cssH;
      canvas.parentElement.style.maxWidth = "min(100%, 420px, calc(58dvh * " + (cssW / cssH).toFixed(3) + "))";
    }
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: cssW, h: cssH };
  }

  // Registry for Packs 2 & 3 (Seamless plugin system)
  window.ZaitGamesExtraRegistry = window.ZaitGamesExtraRegistry || {};
  window.ZaitRegisterExtraGame = function (id, def) {
    if (!id || !def) return;
    window.ZaitGamesExtraRegistry[id] = def;
    if (isOpen && currentView === "hub") renderHub();
  };

  var DEFAULT_CFG = {
    enabled: true, showFloatBtn: true, showSidebarBtn: true,
    dailyPrizeCap: 3, dailyScratchCap: 1, couponExpiryHours: 24, defaultMinOrder: 300,
    quizQuestionCount: 7, enableLeaderboard: true, enableDailyMission: true, dailyMissionBonus: 20, enableWhatsappChallenge: true,
    dailyStreak: {
      enabled: true,
      days: [5, 10, 15, 20, 25, 30],
      bigChestPrizes: [
        { id: "c1", label: "60 نقطة ولاء ذهبية ⭐", type: "points", value: 60, weight: 45, minOrder: 0 },
        { id: "c2", label: "كوبون خصم 10% 🎟️", type: "percent", value: 10, weight: 30, minOrder: 400 },
        { id: "c3", label: "توصيل مجاني 🚚", type: "free_shipping", value: 100, weight: 15, minOrder: 500 },
        { id: "c4", label: "كوبون خصم VIP 15% 👑", type: "percent", value: 15, weight: 10, minOrder: 800 }
      ]
    },
    prizePool: [
      { id: "p1", label: "خصم 5% فوري 🎟️", type: "percent", value: 5, weight: 45, minOrder: 250 },
      { id: "p2", label: "20 نقطة ولاء ⭐", type: "points", value: 20, weight: 30, minOrder: 0 },
      { id: "p3", label: "خصم 10% مميز 🔥", type: "percent", value: 10, weight: 18, minOrder: 500 },
      { id: "p4", label: "توصيل مجاني 🚚", type: "free_shipping", value: 100, weight: 7, minOrder: 600 }
    ],
    scratchPrizes: [
      { id: "s0", label: "حظ أوفر في المرة القادمة 🌿", type: "none", value: 0, weight: 90, minOrder: 0 },
      { id: "s1", label: "خصم 5% فوري 🎟️", type: "percent", value: 5, weight: 5, minOrder: 300 },
      { id: "s2", label: "توصيل مجاني 🚚", type: "free_shipping", value: 100, weight: 5, minOrder: 500 }
    ],
    games: {
      zuma:     { enabled: true, baseTime: 70, maxStages: 10 },
      breakout: { enabled: true, baseTime: 70, maxStages: 10 },
      catch:    { enabled: true, baseTime: 28, maxStages: 10 },
      scratch:  { enabled: true, baseTime: 60, maxStages: 1 },
      slice:    { enabled: true, baseTime: 30, maxStages: 10 },
      truck:    { enabled: true, baseTime: 32, maxStages: 10 },
      snake:    { enabled: true, baseTime: 55, maxStages: 10 },
      press:    { enabled: true, baseTime: 24, maxStages: 10 },
      sorter:   { enabled: true, baseTime: 26, maxStages: 10 },
      crush:    { enabled: true, baseTime: 65, maxStages: 10 },
      g2048:    { enabled: true, baseTime: 180, maxStages: 5 },
      pipes:    { enabled: true, baseTime: 55, maxStages: 10 },
      quiz:     { enabled: true, baseTime: 12, maxStages: 10 },
      memory:   { enabled: true, baseTime: 30, maxStages: 10 },
      reflex:   { enabled: true, baseTime: 26, maxStages: 10 }
    }
  };

  var CORE_META = [
    { id: "zuma",     icon: "🔮", grad: "linear-gradient(135deg,#3b0764,#15803d)", name: "زوما الزيتون ديلوكس", desc: "تصويب ليزر دقيق 1:1، كرات قنبلة وإبطاء، 5 خرائط — صفِّ كل الكور للفوز!", cat: "brain", tag: "ديلوكس 🔮" },
    { id: "breakout", icon: "🧱", grad: "linear-gradient(135deg,#9a3412,#b45309)", name: "كاسر البراميل برو", desc: "5 تشكيلات معصرة، براميل مدرّعة، وهدايا ليزر وتعدد كرات وتوسيع مضرب!", cat: "speed", tag: "برو 🧱" },
    { id: "catch",    icon: "🧺", grad: "linear-gradient(135deg,#14532d,#65a30d)", name: "قطف الزيتون السيناوي", desc: "ثمار زيتون حقيقية بأوراقها مع مغناطيس ودرع حماية ومراحل متصاعدة!", cat: "speed", tag: "أدوار 🫒" },
    { id: "scratch",  icon: "🪙", grad: "linear-gradient(135deg,#854d0e,#eab308)", name: "اكشط قطرة الذهب", desc: "كارت حظ يومي بطبقة ذهبية حقيقية — مستقل تماماً خارج حد الـ 3 جوائز!", cat: "luck", tag: "حظ 🪙" }
  ];

  var RANKS = [
    { min: 0, title: "🌱 مبتدئ المزرعة" }, { min: 200, title: "🧺 قاطف سيناوي" },
    { min: 600, title: "❄️ خبير المعصرة" }, { min: 1400, title: "🏆 فارس الزيتون" }, { min: 3000, title: "👑 شيخ الشجرة المباركة" }
  ];

  function loadJson(k, fb) { try { var r = localStorage.getItem(k); if (r) return JSON.parse(r); } catch (e) {} return JSON.parse(JSON.stringify(fb)); }
  function saveJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function todayKey() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function yestKey() { var d = new Date(Date.now() - 86400000); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function mergeCfg(base, over) {
    var out = JSON.parse(JSON.stringify(base));
    if (!over || typeof over !== "object") return out;
    Object.keys(over).forEach(function (k) {
      if (k === "games" && over.games) {
        Object.keys(over.games).forEach(function (g) {
          out.games[g] = Object.assign({ enabled: true, baseTime: 35, maxStages: 10 }, out.games[g] || {}, over.games[g]);
        });
      } else if (k === "dailyStreak" && over.dailyStreak) {
        out.dailyStreak = Object.assign({}, out.dailyStreak, over.dailyStreak);
      } else if (over[k] !== undefined) out[k] = over[k];
    });
    return out;
  }

  var cfg = mergeCfg(DEFAULT_CFG, loadJson(CFG_KEY, {}));
  var pState = (function () {
    var st = Object.assign({
      totalScore: 0, dailyDate: todayKey(), dailyPrizesWon: 0, dailyScratchesUsed: 0,
      streakCount: 0, lastStreakClaimDate: "", unlockedStage: {}, coupons: [], pendingPoints: 0, seenQuizIds: []
    }, loadJson(STATE_KEY, {}));
    if (st.dailyDate !== todayKey()) { st.dailyDate = todayKey(); st.dailyPrizesWon = 0; st.dailyScratchesUsed = 0; }
    if (!st.unlockedStage || typeof st.unlockedStage !== "object") st.unlockedStage = {};
    if (!Array.isArray(st.coupons)) st.coupons = [];
    return st;
  })();
  var analytics = loadJson(ROI_KEY, { plays: {}, couponsIssued: 0, couponsRedeemed: 0, revenueFromGames: 0 });

  var isOpen = false, currentView = "hub", currentCat = "all", soundOn = true;
  var activeGameId = null, activeStage = 1, activeCleanup = null, gamePaused = false, audioCtx = null;

  function saveState() {
    saveJson(STATE_KEY, pState);
    if (typeof window.V98_refreshStoreCouponBar === "function") try { window.V98_refreshStoreCouponBar(); } catch (e) {}
  }
  function getFs() { var h = window.__V96_FS__ || {}; return (h.db && h.doc && h.setDoc && h.getDoc) ? h : null; }
  function getUser() { return window.currentUser || (window.auth && window.auth.currentUser) || null; }
  function toast(m, t) { if (typeof window.showToast === "function") try { window.showToast(m, t || "info"); return; } catch (e) {} }
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 14); } catch (e) {} }
  function getUnlocked(gid) { return Math.max(1, Number(pState.unlockedStage[gid] || 1)); }
  function getGameCfg(gid) { return (cfg.games && cfg.games[gid]) || { enabled: true, baseTime: 35, maxStages: 10 }; }
  function getRank(pts) { var t = RANKS[0].title; RANKS.forEach(function (r) { if (pts >= r.min) t = r.title; }); return t; }

  function playSfx(type) {
    if (!soundOn) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      if (type === "pop") { o.type = "sine"; o.frequency.setValueAtTime(540, now); o.frequency.exponentialRampToValueAtTime(880, now + 0.08); g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.09); o.start(now); o.stop(now + 0.1); }
      else if (type === "gold") { o.type = "triangle"; o.frequency.setValueAtTime(720, now); o.frequency.setValueAtTime(1080, now + 0.06); g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2); o.start(now); o.stop(now + 0.2); }
      else if (type === "laser") { o.type = "sawtooth"; o.frequency.setValueAtTime(1200, now); o.frequency.exponentialRampToValueAtTime(300, now + 0.09); g.gain.setValueAtTime(0.07, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1); o.start(now); o.stop(now + 0.1); }
      else if (type === "bad") { o.type = "sawtooth"; o.frequency.setValueAtTime(210, now); o.frequency.linearRampToValueAtTime(105, now + 0.18); g.gain.setValueAtTime(0.11, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2); o.start(now); o.stop(now + 0.2); }
      else if (type === "tick") { o.type = "square"; o.frequency.setValueAtTime(760, now); g.gain.setValueAtTime(0.04, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05); o.start(now); o.stop(now + 0.05); }
      else if (type === "win") {
        [523, 659, 784, 1046].forEach(function (f, i) {
          var o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
          o2.type = "triangle"; o2.frequency.setValueAtTime(f, now + i * 0.085);
          g2.gain.setValueAtTime(0.12, now + i * 0.085); g2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.085 + 0.24);
          o2.connect(g2); g2.connect(audioCtx.destination); o2.start(now + i * 0.085); o2.stop(now + i * 0.085 + 0.25);
        });
      }
    } catch (e) {}
  }

  function getAllGamesMeta() {
    var list = CORE_META.slice();
    Object.keys(window.ZaitGamesExtraRegistry || {}).forEach(function (id) {
      var ex = window.ZaitGamesExtraRegistry[id];
      if (ex && !list.some(function (m) { return m.id === id; })) {
        list.push({
          id: id, icon: ex.icon || "🎮", grad: ex.grad || "linear-gradient(135deg,#14532d,#0f766e)",
          name: ex.name || id, desc: ex.desc || "", cat: ex.cat || "speed", tag: ex.hardTag || "مراحل 🔥"
        });
      }
    });
    return list;
  }

  // =========================================================================
  // 2. CLOUD SYNC, PRIZES, 7-DAY STREAK & COUPONS
  // =========================================================================
  async function syncCloud() {
    if (!navigator.onLine) return;
    var fs = getFs(); if (!fs) return;
    try {
      var cs = await fs.getDoc(fs.doc(fs.db, "settings", "olive_games_v96"));
      if (cs && cs.exists()) { cfg = mergeCfg(DEFAULT_CFG, cs.data()); saveJson(CFG_KEY, cfg); }
      var as = await fs.getDoc(fs.doc(fs.db, "settings", "olive_games_analytics"));
      if (as && as.exists()) { analytics = Object.assign({ plays: {}, couponsIssued: 0, couponsRedeemed: 0, revenueFromGames: 0 }, as.data()); saveJson(ROI_KEY, analytics); }
      var u = getUser();
      if (u && u.uid) {
        var us = await fs.getDoc(fs.doc(fs.db, "users", u.uid));
        if (us && us.exists()) {
          var ud = us.data() || {};
          if (ud.gameDailyLog && ud.gameDailyLog.date === todayKey()) {
            pState.dailyPrizesWon = Math.max(pState.dailyPrizesWon, Number(ud.gameDailyLog.prizesWon || 0));
            pState.dailyScratchesUsed = Math.max(pState.dailyScratchesUsed, Number(ud.gameDailyLog.scratchesUsed || 0));
          }
          if (ud.gameStages) Object.keys(ud.gameStages).forEach(function (k) { pState.unlockedStage[k] = Math.max(getUnlocked(k), Number(ud.gameStages[k] || 1)); });
          if (pState.pendingPoints > 0) { var add = pState.pendingPoints; pState.pendingPoints = 0; await awardPoints(add); }
          saveState();
        }
      }
    } catch (e) {}
  }

  async function awardPoints(pts) {
    var n = Math.max(0, Math.round(Number(pts || 0))); if (!n) return;
    pState.totalScore += n;
    var u = getUser(), fs = getFs();
    if (!navigator.onLine || !u || !u.uid || !fs) { pState.pendingPoints += n; saveState(); return; }
    try {
      var v = fs.increment ? fs.increment(n) : n;
      await fs.setDoc(fs.doc(fs.db, "users", u.uid), { loyaltyPoints: v, points: v }, { merge: true });
      if (window.userProfile) window.userProfile.loyaltyPoints = Number(window.userProfile.loyaltyPoints || 0) + n;
      saveState();
    } catch (e) { pState.pendingPoints += n; saveState(); }
  }

  async function pushPlayerMetaCloud() {
    saveState();
    var u = getUser(), fs = getFs();
    if (!navigator.onLine || !u || !u.uid || !fs) return;
    try {
      await fs.setDoc(fs.doc(fs.db, "users", u.uid), {
        gameDailyLog: { date: todayKey(), prizesWon: pState.dailyPrizesWon, scratchesUsed: pState.dailyScratchesUsed },
        gameStreak: { count: pState.streakCount, lastClaimDate: pState.lastStreakClaimDate },
        gameStages: pState.unlockedStage,
        gameCoupons: pState.coupons.slice(-25)
      }, { merge: true });
    } catch (e) {}
  }

  function weightedDraw(arr) {
    var valid = (arr || []).filter(function (x) { return Number(x.weight || 0) > 0; });
    if (!valid.length) return { label: "15 نقطة ولاء ⭐", type: "points", value: 15, minOrder: 0 };
    var tot = valid.reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
    var r = Math.random() * tot;
    for (var i = 0; i < valid.length; i++) { r -= Number(valid[i].weight || 0); if (r <= 0) return valid[i]; }
    return valid[valid.length - 1];
  }

  async function issuePrize(item, src) {
    if (!item || item.type === "none") return { type: "none", label: (item && item.label) || "حظ أوفر 🌿" };
    if (item.type === "points") {
      await awardPoints(item.value || 15); await pushPlayerMetaCloud();
      return { type: "points", value: Number(item.value || 15), label: item.label };
    }
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var rnd = function (n) { var s = ""; for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)]; return s; };
    var code = "ZM-" + rnd(4) + "-" + rnd(4);
    var u = getUser();
    var c = {
      code: code, type: item.type, value: Number(item.value || 5), label: item.label,
      minOrder: Number(item.minOrder !== undefined ? item.minOrder : (cfg.defaultMinOrder || 0)),
      createdAt: Date.now(), expiresAt: Date.now() + Math.max(1, Number(cfg.couponExpiryHours || 24)) * 3600000,
      used: false, ownerUid: (u && u.uid) || "guest", source: src || "ألعاب الشجرة"
    };
    pState.coupons.unshift(c);
    analytics.couponsIssued = Number(analytics.couponsIssued || 0) + 1;
    saveJson(ROI_KEY, analytics);
    await pushPlayerMetaCloud();
    var fs = getFs();
    if (navigator.onLine && fs) {
      fs.setDoc(fs.doc(fs.db, "promoCodes", code), {
        code: code, discount: c.type === "free_shipping" ? 0 : c.value, freeShipping: c.type === "free_shipping",
        minOrder: c.minOrder, maxUses: 1, usageCount: 0, active: true, ownerUid: c.ownerUid, expiresAt: c.expiresAt, fromGame: true
      }, { merge: true }).catch(function () {});
    }
    return c;
  }

  function getActiveCoupons() { var now = Date.now(); return (pState.coupons || []).filter(function (c) { return c && !c.used && (!c.expiresAt || c.expiresAt > now); }); }
  function getStreakInfo() {
    var td = todayKey(), yd = yestKey(), claimed = pState.lastStreakClaimDate === td;
    var cnt = Number(pState.streakCount || 0);
    if (!claimed && pState.lastStreakClaimDate && pState.lastStreakClaimDate !== yd) cnt = 0;
    return { claimed: claimed, count: cnt, dayIdx: claimed ? ((cnt - 1) % 7) : (cnt % 7) };
  }

  async function claimStreak() {
    var st = getStreakInfo();
    if (st.claimed) return toast("✅ استلمت هدية اليوم بالفعل! عد غداً 🔥", "info");
    pState.streakCount = st.count + 1; pState.lastStreakClaimDate = todayKey();
    if (st.dayIdx < 6) {
      var pts = Number((cfg.dailyStreak.days && cfg.dailyStreak.days[st.dayIdx]) || ((st.dayIdx + 1) * 5));
      await awardPoints(pts); await pushPlayerMetaCloud();
      playSfx("win"); haptic(30);
      toast("🔥 هدية اليوم " + (st.dayIdx + 1) + ": +" + pts + " نقطة ولاء!", "success");
      renderHub();
    } else {
      var issued = await issuePrize(weightedDraw(cfg.dailyStreak.bigChestPrizes), "الصندوق الذهبي (اليوم 7)");
      playSfx("win"); haptic([30, 50, 80]);
      showResultScreen({ won: true, isChest: true, forcedPrize: issued, gameId: "chest", stage: 7 });
    }
  }

  // =========================================================================
  // 3. SHELL, HUB, DEDICATED MINI-APP SPLASH, STAGE SHELL & RESULT
  // =========================================================================
  function ensureOverlay() {
    var ov = document.getElementById("og-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.id = "og-overlay";
    ov.innerHTML =
      '<div class="og-shell" role="dialog" aria-modal="true">' +
        '<div class="og-head">' +
          '<div class="og-head-top">' +
            '<div class="og-brand"><div class="og-brand-ic">🫒</div><div><h2>ألعاب الشجرة المباركة Ultra</h2><small id="og-rank-lbl">🌱 مبتدئ المزرعة</small></div></div>' +
            '<div class="og-head-btns">' +
              '<button type="button" class="og-ic-btn" id="og-snd-btn" onclick="window.ZaitGamesV98.toggleSound()">🔊</button>' +
              '<button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV98.close()">✕</button>' +
            '</div>' +
          '</div>' +
          '<div class="og-hud" id="og-hud-bar"></div>' +
        '</div>' +
        '<div class="og-body" id="og-body"></div>' +
      '</div>';
    ov.addEventListener("click", function (e) { if (e.target === ov) closeGames(); });
    document.body.appendChild(ov);
    return ov;
  }

  window.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (currentView === "playing" && (e.key === "p" || e.key === "P" || e.key === "Escape")) {
      var h = document.getElementById("og-stage-host");
      if (h) togglePause(h);
    }
  });

  function renderHud() {
    var hud = document.getElementById("og-hud-bar"), rk = document.getElementById("og-rank-lbl");
    if (!hud) return;
    if (rk) rk.textContent = getRank(pState.totalScore) + " • " + (navigator.onLine ? "🟢 متصل" : "📡 أوفلاين جاهز");
    var pts = (window.userProfile && Number(window.userProfile.loyaltyPoints)) || pState.totalScore;
    var st = getStreakInfo();
    hud.innerHTML =
      '<div class="og-hud-pill" onclick="window.ZaitGamesV98.backToHub()">⭐ نقاطك<strong>' + pts + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV98.openCoupons()">🎟️ كوبوناتي<strong>' + getActiveCoupons().length + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV98.openLeaderboard()">🏆 المتصدرين<strong>🔥 ' + st.count + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV98.backToHub()">🎁 جوائز اليوم<strong>' + pState.dailyPrizesWon + '/' + cfg.dailyPrizeCap + '</strong></div>';
  }

  function stopActive() {
    gamePaused = false;
    if (typeof activeCleanup === "function") { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
  }

  function renderHub() {
    stopActive(); currentView = "hub"; renderHud();
    var body = document.getElementById("og-body"); if (!body) return;
    var html = "";

    // 7-Day Streak Card
    if (cfg.dailyStreak && cfg.dailyStreak.enabled) {
      var st = getStreakInfo(), days = cfg.dailyStreak.days || [5, 10, 15, 20, 25, 30], boxes = "";
      for (var i = 0; i < 7; i++) {
        var isChest = i === 6, done = st.claimed ? (i <= st.dayIdx) : (i < st.dayIdx), isTd = !st.claimed && i === st.dayIdx;
        boxes += '<div class="og-day-box' + (isChest ? " big-chest" : "") + (done ? " claimed" : "") + (isTd ? " today" : "") + '" ' + (isTd ? 'onclick="window.ZaitGamesV98.claimStreak()"' : '') + '>' +
          '<div class="og-day-num">يوم ' + (i + 1) + '</div><div class="og-day-ic">' + (done ? "✅" : (isChest ? "🎁" : "⭐")) + '</div><div class="og-day-val">' + (isChest ? "الصندوق!" : ("+" + days[i] + " ن")) + '</div></div>';
      }
      html += '<div class="og-card"><div class="og-streak-head"><div><strong style="font-size:.9rem;">🔥 هدايا الدخول اليومي (7 أيام + الصندوق الكبير)</strong>' +
        '<div class="og-offline-pill">📡 الألعاب محفوظة وتعمل بدون إنترنت 100% ✅</div></div>' +
        (!st.claimed ? '<button type="button" class="og-btn og-btn-gold" style="padding:7px 12px;font-size:.78rem;" onclick="window.ZaitGamesV98.claimStreak()">🎁 استلم يوم ' + (st.dayIdx + 1) + '</button>' : '<span style="font-size:.76rem;font-weight:900;color:#16a34a;">✅ تم الاستلام اليوم</span>') +
        '</div><div class="og-streak-grid">' + boxes + '</div></div>';
    }

    var cats = [{ id: "all", l: "🎮 كل الألعاب" }, { id: "speed", l: "⚡ أكشن وسرعة" }, { id: "brain", l: "🧠 ذكاء ومراحل" }, { id: "luck", l: "🪙 حظ يومي" }];
    html += '<div class="og-tabs">' + cats.map(function (c) {
      return '<button type="button" class="og-tab ' + (currentCat === c.id ? "active" : "") + '" onclick="window.ZaitGamesV98.setCat(\'' + c.id + '\')">' + c.l + '</button>';
    }).join("") + '</div>';

    var list = getAllGamesMeta().filter(function (g) {
      if (getGameCfg(g.id).enabled === false) return false;
      return currentCat === "all" || g.cat === currentCat;
    });

    html += '<div class="og-games-grid">' + list.map(function (g) {
      var unl = getUnlocked(g.id);
      return '<div class="og-game-tile" onclick="window.ZaitGamesV98.openGame(\'' + g.id + '\')">' +
        '<span class="og-game-badge">' + esc(g.tag) + '</span>' +
        '<div class="og-app-icon" style="background:' + (g.grad || 'linear-gradient(135deg,#14532d,#0f766e)') + ';">' + g.icon + '</div>' +
        '<div><div class="og-game-name">' + esc(g.name) + '</div><div class="og-game-desc">' + esc(g.desc) + '</div></div>' +
        '<div><div class="og-game-meta"><span>' + (g.id === "scratch" ? "خارج حد اليوم" : ("🏁 الدور " + unl)) + '</span><span>⭐ 5.0</span></div>' +
        '<button type="button" class="og-play-pill" style="margin-top:5px;">▶ فتح اللعبة</button></div>' +
      '</div>';
    }).join("") + '</div>';

    body.innerHTML = html;
  }

  function openGameSplash(gid) {
    stopActive(); activeGameId = gid;
    if (gid === "scratch") { launchStage("scratch", 1); return; }
    currentView = "stages";
    var meta = getAllGamesMeta().find(function (m) { return m.id === gid; }) || { name: gid, icon: "🎮", desc: "", grad: "linear-gradient(135deg,#14532d,#0f766e)" };
    var gc = getGameCfg(gid), maxSt = Math.max(5, Math.min(20, Number(gc.maxStages || 10))), unl = Math.min(maxSt, getUnlocked(gid));

    var btns = "";
    for (var s = 1; s <= maxSt; s++) {
      var locked = s > unl, cur = s === unl;
      btns += '<button type="button" class="og-stage-btn ' + (cur ? "current" : (locked ? "locked" : "")) + '" ' + (locked ? "disabled" : ('onclick="window.ZaitGamesV98.startStage(\'' + gid + '\',' + s + ')"')) + '>' +
        '<div style="font-size:1.25rem;">' + (locked ? "🔒" : (cur ? "🔥" : "✅")) + '</div><div style="font-size:.82rem;font-weight:900;">الدور ' + s + '</div></button>';
    }

    document.getElementById("og-body").innerHTML =
      '<div class="og-arena-wrap">' +
        '<div class="og-app-splash" style="background:' + meta.grad + ';">' +
          '<button type="button" class="og-ic-btn" style="position:absolute;top:10px;left:10px;" onclick="window.ZaitGamesV98.backToHub()">← الصالة</button>' +
          '<div style="font-size:3.2rem;margin-bottom:4px;">' + meta.icon + '</div>' +
          '<h2 style="margin:0;font-size:1.25rem;font-weight:900;color:#fde68a;">' + esc(meta.name) + '</h2>' +
          '<p style="font-size:.8rem;color:#e2f5e9;margin:6px auto 12px;max-width:360px;">' + esc(meta.desc) + '</p>' +
          '<button type="button" class="og-btn og-btn-gold" style="width:100%;max-width:280px;padding:13px;font-size:.95rem;" onclick="window.ZaitGamesV98.startStage(\'' + gid + '\',' + unl + ')">🚀 ابدأ الدور ' + unl + ' الآن</button>' +
        '</div>' +
        '<div class="og-card"><strong style="display:block;font-size:.86rem;margin-bottom:6px;">🗺️ خريطة الأدوار والمراحل (' + maxSt + ' دور):</strong><div class="og-stages-grid">' + btns + '</div></div>' +
      '</div>';
  }

  function createStageShell(title, stageNum, durationSec, goalText, kbHint) {
    document.getElementById("og-body").innerHTML =
      '<div class="og-arena-wrap">' +
        '<div class="og-stage-bar">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
            '<span class="og-stat-chip" style="background:rgba(244,207,109,.25);color:#fde68a;">🏁 الدور ' + stageNum + '</span>' +
            '<span class="og-stat-chip" id="og-st-goal">' + esc(goalText) + '</span>' +
            '<span class="og-stat-chip" id="og-st-extra"></span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;align-items:center;">' +
            '<span class="og-stat-chip" id="og-st-time">⏱️ ' + durationSec + 'ث</span>' +
            '<button type="button" class="og-ic-btn" id="og-pause-btn" title="إيقاف مؤقت (P)">⏸️</button>' +
            '<button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV98.openGame(\'' + esc(activeGameId) + '\')">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="og-time-track"><div class="og-time-fill" id="og-time-fill" style="width:100%;"></div></div>' +
        '<div id="og-stage-host" style="position:relative;"></div>' +
        (kbHint ? '<div class="og-kb-hint">' + esc(kbHint) + '</div>' : '') +
      '</div>';

    var host = document.getElementById("og-stage-host");
    document.getElementById("og-pause-btn").onclick = function () { togglePause(host); };
    return {
      host: host,
      setGoal: function (t) { var e = document.getElementById("og-st-goal"); if (e) e.textContent = t; },
      setExtra: function (t) { var e = document.getElementById("og-st-extra"); if (e) { e.textContent = t; e.style.display = t ? "" : "none"; } },
      setTime: function (rem, tot) {
        var e = document.getElementById("og-st-time"), f = document.getElementById("og-time-fill");
        if (e) e.textContent = "⏱️ " + Math.max(0, Math.ceil(rem)) + "ث";
        if (f) { f.style.width = Math.max(0, Math.min(100, (rem / Math.max(1, tot)) * 100)) + "%"; f.classList.toggle("danger", rem <= 5); }
      },
      shake: function () { host.classList.remove("og-shake"); void host.offsetWidth; host.classList.add("og-shake"); }
    };
  }

  function runCountdown(host, label, onGo) {
    var ov = document.createElement("div");
    ov.className = "og-stage-overlay";
    host.appendChild(ov);
    var steps = ["3", "2", "1", "انطلق! 🚀"], idx = 0;
    (function next() {
      if (!ov.parentNode) return;
      if (idx >= steps.length) { ov.remove(); onGo(); return; }
      ov.innerHTML = '<div style="font-size:.9rem;font-weight:800;color:#bbf7d0;">' + esc(label || "") + '</div><div class="og-cd-num">' + steps[idx] + '</div>';
      playSfx(idx === 3 ? "gold" : "tick");
      idx++;
      setTimeout(next, idx === 4 ? 360 : 500);
    })();
  }

  function togglePause(host) {
    if (currentView !== "playing") return;
    gamePaused = !gamePaused;
    var old = host.querySelector(".og-pause-ov");
    if (gamePaused) {
      if (old) return;
      var ov = document.createElement("div");
      ov.className = "og-stage-overlay og-pause-ov";
      ov.innerHTML = '<div style="font-size:2.4rem;">⏸️</div><h3 style="margin:0;color:#fde68a;">اللعبة متوقفة مؤقتاً</h3><div style="display:flex;gap:8px;"><button type="button" class="og-btn og-btn-gold" id="og-res-btn">▶ استكمال</button><button type="button" class="og-btn og-btn-ghost" onclick="window.ZaitGamesV98.openGame(\'' + esc(activeGameId) + '\')">🗺️ الأدوار</button></div>';
      host.appendChild(ov);
      ov.querySelector("#og-res-btn").onclick = function () { togglePause(host); };
    } else if (old) old.remove();
  }

  async function showResultScreen(opts) {
    stopActive(); currentView = "result";
    var won = !!opts.won, gid = opts.gameId || activeGameId, stNum = Number(opts.stage || activeStage || 1);
    var maxSt = Math.max(5, Number(getGameCfg(gid).maxStages || 10)), nextSt = Math.min(maxSt, stNum + 1);
    var prize = opts.forcedPrize || null, capHit = false;

    if (won && !opts.isChest && !opts.isScratch) {
      if (stNum >= getUnlocked(gid) && stNum < maxSt) pState.unlockedStage[gid] = stNum + 1;
      pState.totalScore += 30 + stNum * 12;
      if (pState.dailyPrizesWon < Number(cfg.dailyPrizeCap || 3)) {
        pState.dailyPrizesWon++;
        prize = await issuePrize(weightedDraw(cfg.prizePool), "فوز " + gid + " دور " + stNum);
      } else { capHit = true; await pushPlayerMetaCloud(); }
    } else saveState();

    renderHud(); playSfx(won ? "win" : "bad"); haptic(won ? [25, 45, 70] : 50);

    var meta = getAllGamesMeta().find(function (m) { return m.id === gid; }) || { name: "اللعبة", icon: "🫒" };
    var waMsg = "🏆 أنهيت الدور " + stNum + " في لعبة (" + meta.name + ") داخل متجر زيت الشجرة المباركة!\nتقدر تتحداني وتكسب خصم فوري؟ 👇\n" + location.origin;

    var prizeHtml = "";
    if (won && prize && prize.type !== "none") {
      var isC = prize.type === "percent" || prize.type === "free_shipping";
      prizeHtml =
        '<div class="og-prize-card">' +
          '<div style="font-size:.78rem;color:#bbf7d0;font-weight:800;">🎉 مبروك جائزتك!</div>' +
          '<div style="font-size:1.08rem;font-weight:900;color:#fde68a;margin:4px 0;">' + esc(prize.label) + '</div>' +
          (isC ? ('<div class="og-code-box">' + esc(prize.code) + '</div><div style="font-size:.73rem;color:#d1fae5;margin-bottom:8px;">⏳ صالح ' + cfg.couponExpiryHours + ' ساعة' + (prize.minOrder > 0 ? (" • حد أدنى " + prize.minOrder + " ج") : "") + '</div><button type="button" class="og-btn og-btn-gold" style="width:100%;" onclick="window.ZaitGamesV98.applyCouponAndShop(\'' + esc(prize.code) + '\')">🛒 تسوّق الآن بالخصم</button>') : '<div style="font-size:.82rem;color:#d1fae5;">تمت إضافة النقاط لرصيدك ⭐</div>') +
        '</div>';
    } else if (won && capHit) {
      prizeHtml = '<div class="og-card" style="background:rgba(245,158,11,.12);border-color:#f59e0b;font-size:.8rem;font-weight:800;">🏆 وصلت لحد جوائز اليوم (' + cfg.dailyPrizeCap + '/' + cfg.dailyPrizeCap + ') — أكمل فتح الأدوار الأصعب!</div>';
    } else if (won && prize && prize.type === "none") {
      prizeHtml = '<div class="og-card" style="font-weight:900;">' + esc(prize.label) + '</div>';
    }

    document.getElementById("og-body").innerHTML =
      '<div class="og-card og-result-box og-arena-wrap">' +
        (won ? '<canvas id="og-confetti-cv"></canvas>' : '') +
        '<div style="position:relative;z-index:3;">' +
          '<div style="font-size:3.2rem;">' + (won ? "🏆🎉" : "😅⏱️") + '</div>' +
          '<h2 style="margin:6px 0;font-weight:900;color:' + (won ? "#15803d" : "#dc2626") + ';">' + (opts.isChest ? "فتحت الصندوق الذهبي الكبير!" : (won ? ("أنهيت الدور " + stNum + " بنجاح!") : (opts.loseReason || "انتهت المحاولة!"))) + '</h2>' +
          (opts.summary ? '<div style="font-size:.83rem;font-weight:800;margin-bottom:6px;">' + esc(opts.summary) + '</div>' : '') +
          prizeHtml +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;">' +
            (won && !opts.isChest && !opts.isScratch && stNum < maxSt
              ? '<button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV98.startStage(\'' + gid + '\',' + nextSt + ')">🚀 الدور التالي (' + nextSt + ')</button>'
              : (!opts.isChest ? '<button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV98.startStage(\'' + gid + '\',' + stNum + ')">🔄 إعادة الدور ' + stNum + '</button>' : '')) +
            (!opts.isChest && !opts.isScratch ? '<button type="button" class="og-btn og-btn-dark" onclick="window.ZaitGamesV98.openGame(\'' + gid + '\')">🗺️ الأدوار</button>' : '') +
            '<button type="button" class="og-btn og-btn-ghost" onclick="window.ZaitGamesV98.backToHub()">🚪 خروج</button>' +
          '</div>' +
          (won && !opts.isChest && cfg.enableWhatsappChallenge ? '<a href="https://wa.me/?text=' + encodeURIComponent(waMsg) + '" target="_blank" rel="noopener" class="og-btn og-btn-wa" style="width:100%;max-width:340px;margin-top:10px;text-decoration:none;">⚔️ تحدَّ صديقك على واتساب</a>' : '') +
        '</div>' +
      '</div>';

    if (won) {
      var cv = document.getElementById("og-confetti-cv");
      if (cv) {
        var r = cv.getBoundingClientRect(), ctx = cv.getContext("2d");
        cv.width = r.width || 380; cv.height = r.height || 340;
        var cols = ["#f4cf6d", "#22c55e", "#ef4444", "#38bdf8", "#a855f7"], pts = [];
        for (var i = 0; i < 65; i++) pts.push({ x: Math.random() * cv.width, y: -Math.random() * 140, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3.5, sz: 5 + Math.random() * 6, c: cols[i % cols.length] });
        var f = 0;
        (function loop() { if (!cv.parentNode || f++ > 125) return; ctx.clearRect(0, 0, cv.width, cv.height); pts.forEach(function (p) { p.x += p.vx; p.y += p.vy; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.sz, p.sz * 0.6); }); requestAnimationFrame(loop); })();
      }
    }
  }

  function launchStage(gid, stageNum) {
    stopActive(); currentView = "playing"; activeGameId = gid; activeStage = Math.max(1, Number(stageNum || 1));
    analytics.plays = analytics.plays || {}; analytics.plays[gid] = Number(analytics.plays[gid] || 0) + 1;
    saveJson(ROI_KEY, analytics);
    var baseTime = Number(getGameCfg(gid).baseTime || 35);

    // Delegate to Packs 2 & 3 Extra Games Registry!
    if (window.ZaitGamesExtraRegistry && window.ZaitGamesExtraRegistry[gid] && typeof window.ZaitGamesExtraRegistry[gid].launch === "function") {
      window.ZaitGamesExtraRegistry[gid].launch({
        stage: activeStage,
        baseTime: baseTime,
        quizQuestionCount: cfg.quizQuestionCount || 7,
        seenQuizIds: pState.seenQuizIds || [],
        OliveArt: window.OliveArt,
        getPointerPos: getPointerPos,
        createStageShell: createStageShell,
        setupHiDpiCanvas: setupHiDpiCanvas,
        runCountdown: runCountdown,
        playSfx: playSfx,
        haptic: haptic,
        isPaused: function () { return gamePaused; },
        setCleanup: function (fn) { activeCleanup = fn; },
        finish: function (won, summary, loseReason) {
          showResultScreen({ won: won, gameId: gid, stage: activeStage, summary: summary, loseReason: loseReason });
        }
      });
      return;
    }

    if (gid === "zuma") return playZumaDeluxe(activeStage, baseTime);
    if (gid === "breakout") return playArkanoidPro(activeStage, baseTime);
    if (gid === "catch") return playHarvestDeluxe(activeStage, baseTime);
    if (gid === "scratch") return playGoldScratch();
  }

  // =========================================================================
  // FLAGSHIP GAME 1: 🔮 ZUMA DELUXE (1:1 SNIPER AIMING + DRAG LASER + POWER ORBS + 5 MAPS)
  // =========================================================================
  function playZumaDeluxe(stage, baseTime) {
    var mapIdx = (stage - 1) % 5;
    var mapNames = ["المسار الحلزوني السيناوي", "طريق الثعبان المتعرج", "قلعة المعصرة المربعة", "الأفق المزدوج", "موجة سيناء السريعة"];
    var duration = Math.max(60, baseTime + stage * 6);
    var st = createStageShell("زوما ديلوكس", stage, duration, mapNames[mapIdx], "🎯 المس واسحب لتصويب الليزر بدقة ثم ارفع إصبعك للإطلاق • Space / كليك يمين للتبديل");
    st.host.innerHTML =
      '<div class="og-canvas-wrap"><canvas id="og-cv-zuma"></canvas></div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;flex-wrap:wrap;">' +
        '<span style="font-size:.74rem;font-weight:800;opacity:.88;">🔮 كرات خاصة: 💣 تفجير • ❄️ تجميد • ⏪ إرجاع للخلف</span>' +
        '<button type="button" id="og-z-swap" class="og-btn og-btn-dark" style="padding:7px 12px;font-size:.77rem;">🔄 تبديل الكرة</button>' +
      '</div>';

    var cv = document.getElementById("og-cv-zuma");
    var g = setupHiDpiCanvas(cv, 400, 440);
    var ctx = g.ctx, W = g.w, H = g.h;

    function smoothPoly(ctrl, segs) {
      var out = [];
      for (var i = 0; i < ctrl.length - 1; i++) {
        for (var s = 0; s < segs; s++) {
          var t = s / segs;
          out.push({ x: ctrl[i].x + (ctrl[i + 1].x - ctrl[i].x) * t, y: ctrl[i].y + (ctrl[i + 1].y - ctrl[i].y) * t });
        }
      }
      out.push(ctrl[ctrl.length - 1]);
      return out;
    }

    var turret = { x: W / 2, y: H / 2 + 8 }, rawPts = [];
    if (mapIdx === 0) {
      for (var i0 = 0; i0 <= 900; i0++) {
        var u0 = i0 / 900, th0 = u0 * Math.PI * 5.0, r0 = 180 - u0 * 128;
        rawPts.push({ x: W / 2 + Math.cos(th0) * r0, y: H / 2 + 8 + Math.sin(th0) * r0 });
      }
    } else if (mapIdx === 1) {
      turret = { x: W / 2, y: H - 54 };
      rawPts = smoothPoly([{ x: 26, y: 38 }, { x: 370, y: 38 }, { x: 374, y: 118 }, { x: 34, y: 118 }, { x: 28, y: 202 }, { x: 368, y: 202 }, { x: 368, y: 286 }, { x: 64, y: 286 }], 65);
    } else if (mapIdx === 2) {
      rawPts = smoothPoly([{ x: 28, y: 30 }, { x: 372, y: 30 }, { x: 372, y: 406 }, { x: 28, y: 406 }, { x: 28, y: 86 }, { x: 318, y: 86 }, { x: 318, y: 348 }, { x: 86, y: 348 }, { x: 86, y: 142 }, { x: 266, y: 142 }], 55);
    } else if (mapIdx === 3) {
      turret = { x: W / 2, y: H - 62 };
      for (var i3 = 0; i3 <= 820; i3++) {
        var u3 = i3 / 820;
        rawPts.push({ x: W / 2 + Math.sin(u3 * Math.PI * 3.1) * (166 - u3 * 46), y: 36 + u3 * 276 + Math.cos(u3 * Math.PI * 6.2) * 18 });
      }
    } else {
      turret = { x: W / 2, y: H / 2 };
      for (var i4 = 0; i4 <= 900; i4++) {
        var u4 = i4 / 900, th4 = -u4 * Math.PI * 4.8;
        rawPts.push({ x: W / 2 + Math.cos(th4) * (180 - u4 * 120), y: H / 2 + Math.sin(th4) * (202 - u4 * 134) });
      }
    }

    var pathPts = [rawPts[0]], cum = [0], totalLen = 0;
    for (var j = 1; j < rawPts.length; j++) {
      var ds = Math.hypot(rawPts[j].x - rawPts[j - 1].x, rawPts[j].y - rawPts[j - 1].y);
      if (ds < 0.01) continue;
      totalLen += ds; pathPts.push(rawPts[j]); cum.push(totalLen);
    }

    function sampleAt(dist) {
      if (dist <= 0) return pathPts[0];
      if (dist >= totalLen) return pathPts[pathPts.length - 1];
      var lo = 0, hi = cum.length - 1;
      while (lo < hi - 1) { var m = (lo + hi) >> 1; if (cum[m] <= dist) lo = m; else hi = m; }
      var t = (dist - cum[lo]) / (cum[hi] - cum[lo] || 1);
      return { x: pathPts[lo].x + (pathPts[hi].x - pathPts[lo].x) * t, y: pathPts[lo].y + (pathPts[hi].y - pathPts[lo].y) * t };
    }

    var ORBS = [
      { f: "#4ade80", d: "#166534", r: "#bbf7d0" },
      { f: "#facc15", d: "#854d0e", r: "#fef08a" },
      { f: "#ef4444", d: "#7f1d1d", r: "#fecaca" },
      { f: "#38bdf8", d: "#075985", r: "#bae6fd" },
      { f: "#a855f7", d: "#4c1d95", r: "#e9d5ff" }
    ];
    var numCols = stage >= 4 ? 5 : 4, ORB_R = 12.5, SPACING = ORB_R * 2.04;
    var marchSpeed = 23 + stage * 3.8;
    var initN = Math.min(22, 12 + stage * 2), reserveN = 10 + stage * 4;
    var chain = [];
    function rndC() { return Math.floor(Math.random() * numCols); }
    for (var b = 0; b < initN; b++) {
      var c = (b > 0 && Math.random() < 0.36) ? chain[b - 1].c : rndC();
      var pw = Math.random() < 0.06 ? (Math.random() < 0.45 ? "bomb" : (Math.random() < 0.75 ? "slow" : "rev")) : null;
      chain.push({ dist: b * SPACING + 12, c: c, pw: pw });
    }

    var curC = rndC(), nextC = rndC(), aimAngle = -Math.PI / 2, aimPoint = { x: turret.x, y: turret.y - 120 };
    var shots = [], pops = [], running = false, ended = false, raf = null, lastTs = 0, shootCD = 0, rem = duration;
    var slowUntil = 0, revUntil = 0, isDragging = false;

    function leftCnt() { return chain.length + reserveN; }
    st.setGoal("🔮 متبقي: " + leftCnt());

    function pickLiveC() {
      if (!chain.length) return rndC();
      var s = {}; chain.forEach(function (it) { s[it.c] = true; });
      var ks = Object.keys(s); return Number(ks[Math.floor(Math.random() * ks.length)]);
    }
    function swap() { if (!running || gamePaused || ended) return; var t = curC; curC = nextC; nextC = t; playSfx("pop"); haptic(10); }
    document.getElementById("og-z-swap").onclick = swap;

    function aimAtEvent(ev) {
      var p = getPointerPos(ev, cv, W, H);
      aimPoint = p;
      aimAngle = Math.atan2(p.y - turret.y, p.x - turret.x);
      return p;
    }
    function shootNow() {
      if (!running || gamePaused || ended || shootCD > 0) return;
      shots.push({
        x: turret.x + Math.cos(aimAngle) * 20, y: turret.y + Math.sin(aimAngle) * 20,
        vx: Math.cos(aimAngle) * 580, vy: Math.sin(aimAngle) * 580, c: curC
      });
      curC = nextC; nextC = pickLiveC(); shootCD = 0.18;
      playSfx("pop"); haptic(10);
    }

    var onDown = function (ev) {
      if (ev.button === 2) { ev.preventDefault(); swap(); return; }
      var p = aimAtEvent(ev);
      if (Math.hypot(p.x - turret.x, p.y - turret.y) < 26) { swap(); return; }
      isDragging = true;
    };
    var onMove = function (ev) { aimAtEvent(ev); };
    var onUp = function (ev) {
      if (!isDragging) return;
      isDragging = false;
      aimAtEvent(ev);
      shootNow();
    };
    var onCtx = function (e) { e.preventDefault(); swap(); };
    var onKey = function (e) { if (e.code === "Space") { e.preventDefault(); swap(); } };

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    cv.addEventListener("contextmenu", onCtx);
    window.addEventListener("keydown", onKey);

    function burst(x, y, col) { for (var i = 0; i < 10; i++) pops.push({ x: x, y: y, vx: (Math.random() - 0.5) * 190, vy: (Math.random() - 0.5) * 190, life: 0.44, c: col }); }
    function enforceSpace() { for (var i = 1; i < chain.length; i++) if (chain[i].dist < chain[i - 1].dist + SPACING) chain[i].dist = chain[i - 1].dist + SPACING; }

    function checkMatch(idx, depth) {
      if (idx < 0 || idx >= chain.length) return;
      var tc = chain[idx].c, L = idx, R = idx;
      while (L > 0 && chain[L - 1].c === tc && (chain[L].dist - chain[L - 1].dist) <= SPACING * 1.48) L--;
      while (R < chain.length - 1 && chain[R + 1].c === tc && (chain[R + 1].dist - chain[R].dist) <= SPACING * 1.48) R++;
      var run = R - L + 1;
      if (run >= 3) {
        var bombHit = false;
        for (var m = L; m <= R; m++) {
          var mp = sampleAt(chain[m].dist);
          burst(mp.x, mp.y, ORBS[tc].f);
          if (chain[m].pw === "bomb") bombHit = true;
          else if (chain[m].pw === "slow") { slowUntil = Date.now() + 5000; st.setExtra("❄️ تجميد 5ث!"); }
          else if (chain[m].pw === "rev") { revUntil = Date.now() + 2600; st.setExtra("⏪ تراجع!"); }
        }
        var cutL = bombHit ? Math.max(0, L - 2) : L;
        var cutR = bombHit ? Math.min(chain.length - 1, R + 2) : R;
        if (bombHit) { st.shake(); st.setExtra("💣 انفجار هائل!"); }
        chain.splice(cutL, cutR - cutL + 1);
        playSfx(depth > 1 || bombHit ? "gold" : "pop");
        haptic(depth > 1 || bombHit ? 30 : 15);
        st.setGoal("🔮 متبقي: " + leftCnt());
        if (depth > 1) st.setExtra("🔥 كومبو ×" + depth);

        if (cutL > 0 && cutL < chain.length && chain[cutL - 1].c === chain[cutL].c) {
          var gap = chain[cutL].dist - chain[cutL - 1].dist;
          if (gap < SPACING * 5) {
            for (var f = cutL; f < chain.length; f++) chain[f].dist -= (gap - SPACING);
            setTimeout(function () { if (!ended) checkMatch(cutL, depth + 1); }, 110);
          }
        }
        if (chain.length === 0 && reserveN <= 0) {
          ended = true;
          showResultScreen({ won: true, gameId: "zuma", stage: stage, summary: "صفّيت كامل سلسلة الكور في " + mapNames[mapIdx] + "! 🔮🏆" });
        }
      }
    }

    function drawOrb(x, y, cIdx, r, pw) {
      var t = ORBS[cIdx % ORBS.length];
      var gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
      gr.addColorStop(0, t.r); gr.addColorStop(0.46, t.f); gr.addColorStop(1, t.d);
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = pw ? "#fde047" : "rgba(0,0,0,0.36)"; ctx.lineWidth = pw ? 2.2 : 1.4; ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.3, r * 0.2, r * 0.32, -0.4, 0, Math.PI * 2); ctx.fill();
      if (pw) {
        ctx.font = "11px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(pw === "bomb" ? "💣" : (pw === "slow" ? "❄️" : "⏪"), x, y + 4);
      }
    }

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts; rem -= dt;
      if (shootCD > 0) shootCD -= dt;
      st.setTime(rem, duration);
      if (rem <= 0) { ended = true; showResultScreen({ won: false, gameId: "zuma", stage: stage, loseReason: "انتهى الوقت وتبقّى " + leftCnt() + " كرة!" }); return; }

      var nowMs = Date.now();
      var effSpd = nowMs < revUntil ? -marchSpeed * 1.4 : (nowMs < slowUntil ? marchSpeed * 0.35 : marchSpeed);

      if (chain.length > 0) {
        chain[0].dist = Math.max(10, chain[0].dist + effSpd * dt);
        for (var i = 1; i < chain.length; i++) {
          if (effSpd < 0) chain[i].dist = Math.max(chain[i - 1].dist + SPACING, chain[i].dist + effSpd * dt);
          else if (chain[i].dist - chain[i - 1].dist <= SPACING + 1.5) chain[i].dist = chain[i - 1].dist + SPACING;
          else chain[i].dist += effSpd * 0.22 * dt;
        }
        if (reserveN > 0 && chain[0].dist > SPACING + 6) {
          var pwNew = Math.random() < 0.07 ? (Math.random() < 0.45 ? "bomb" : (Math.random() < 0.75 ? "slow" : "rev")) : null;
          chain.unshift({ dist: chain[0].dist - SPACING, c: (Math.random() < 0.3 ? chain[0].c : rndC()), pw: pwNew });
          reserveN--; st.setGoal("🔮 متبقي: " + leftCnt());
        }
        if (chain[chain.length - 1].dist >= totalLen - 6) {
          ended = true; playSfx("bad"); haptic(60); st.shake();
          showResultScreen({ won: false, gameId: "zuma", stage: stage, loseReason: "🕳️ وصلت السلسلة للحفرة في " + mapNames[mapIdx] + "!" });
          return;
        }
      } else if (reserveN > 0) {
        chain.push({ dist: 12, c: rndC(), pw: null }); reserveN--;
      } else {
        ended = true; showResultScreen({ won: true, gameId: "zuma", stage: stage, summary: "صفّيت كل الكور في الدور " + stage + "! 🔮🏆" }); return;
      }

      // Shot collision with sub-step accuracy so fast shots NEVER tunnel through marbles!
      for (var s = shots.length - 1; s >= 0; s--) {
        var sh = shots[s];
        var steps = 3, hit = -1;
        for (var sub = 0; sub < steps && hit === -1; sub++) {
          sh.x += (sh.vx * dt) / steps; sh.y += (sh.vy * dt) / steps;
          for (var c = 0; c < chain.length; c++) {
            var cp = sampleAt(chain[c].dist);
            if (Math.hypot(cp.x - sh.x, cp.y - sh.y) <= ORB_R * 1.95) { hit = c; break; }
          }
        }
        if (hit !== -1) {
          var pBef = sampleAt(Math.max(0, chain[hit].dist - SPACING));
          var pAft = sampleAt(Math.min(totalLen, chain[hit].dist + SPACING));
          var ins = Math.hypot(pAft.x - sh.x, pAft.y - sh.y) < Math.hypot(pBef.x - sh.x, pBef.y - sh.y) ? hit + 1 : hit;
          var nd = ins === hit ? chain[hit].dist : chain[hit].dist + SPACING;
          chain.splice(ins, 0, { dist: nd, c: sh.c, pw: null });
          enforceSpace(); shots.splice(s, 1);
          st.setGoal("🔮 متبقي: " + leftCnt());
          checkMatch(ins, 1);
        } else if (sh.x < -25 || sh.x > W + 25 || sh.y < -25 || sh.y > H + 25) {
          shots.splice(s, 1);
        }
      }

      // Render Scene
      window.OliveArt.drawTreeCanopy(ctx, W, H, mapIdx);
      ctx.strokeStyle = "rgba(213, 158, 42, 0.3)"; ctx.lineWidth = 24; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      for (var p = 0; p < pathPts.length; p += 3) { if (p === 0) ctx.moveTo(pathPts[p].x, pathPts[p].y); else ctx.lineTo(pathPts[p].x, pathPts[p].y); }
      ctx.stroke();

      var pit = pathPts[pathPts.length - 1];
      ctx.fillStyle = "#040404"; ctx.beginPath(); ctx.arc(pit.x, pit.y, 17, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.8; ctx.stroke();

      // Live Precision Laser Aiming Beam & Reticle!
      ctx.save();
      ctx.strokeStyle = isDragging ? ORBS[curC].f : "rgba(253, 230, 138, 0.45)";
      ctx.setLineDash([6, 6]); ctx.lineWidth = isDragging ? 2.8 : 2;
      ctx.beginPath(); ctx.moveTo(turret.x, turret.y);
      ctx.lineTo(turret.x + Math.cos(aimAngle) * 260, turret.y + Math.sin(aimAngle) * 260);
      ctx.stroke();
      if (isDragging) {
        ctx.setLineDash([]); ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(aimPoint.x, aimPoint.y, 13, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      for (var k = 0; k < chain.length; k++) { var sp = sampleAt(chain[k].dist); drawOrb(sp.x, sp.y, chain[k].c, ORB_R, chain[k].pw); }
      shots.forEach(function (sh) { drawOrb(sh.x, sh.y, sh.c, ORB_R, null); });

      // Turret
      ctx.save(); ctx.translate(turret.x, turret.y); ctx.rotate(aimAngle);
      ctx.fillStyle = "#0e2b1b"; ctx.strokeStyle = "#f4cf6d"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#d59e2a"; ctx.fillRect(10, -7, 18, 14);
      ctx.restore();
      drawOrb(turret.x + Math.cos(aimAngle) * 16, turret.y + Math.sin(aimAngle) * 16, curC, 10.5, null);
      drawOrb(turret.x - Math.cos(aimAngle) * 11, turret.y - Math.sin(aimAngle) * 11, nextC, 6.5, null);

      for (var q = pops.length - 1; q >= 0; q--) {
        var pr = pops[q]; pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
        if (pr.life <= 0) { pops.splice(q, 1); continue; }
        ctx.globalAlpha = Math.max(0, pr.life * 2.2); ctx.fillStyle = pr.c;
        ctx.beginPath(); ctx.arc(pr.x, pr.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
    }

    activeCleanup = function () {
      ended = true; if (raf) cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp); cv.removeEventListener("contextmenu", onCtx); window.removeEventListener("keydown", onKey);
    };
    runCountdown(st.host, "الدور " + stage + " — " + mapNames[mapIdx], function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // FLAGSHIP GAME 2: 🧱 ARKANOID PRO (5 FORMATIONS + LASER + MULTIBALL + 1:1 INPUT)
  // =========================================================================
  function playArkanoidPro(stage, baseTime) {
    var formIdx = (stage - 1) % 5;
    var formNames = ["صفوف المعصرة", "هرم سيناء", "الماسة الذهبية", "البوابتين", "القلعة المدرّعة"];
    var duration = Math.max(55, baseTime + stage * 5);
    var lives = stage >= 5 ? 2 : 3;
    var st = createStageShell("كاسر البراميل برو", stage, duration, formNames[formIdx], "💻 الماوس أو الأسهم ⬅️ ➡️ • 📱 اسحب المضرب • التقط 🔫 ليزر و🔥 كرات مضاعفة!");
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-brk"></canvas></div>';

    var cv = document.getElementById("og-cv-brk");
    var g = setupHiDpiCanvas(cv, 380, 420);
    var ctx = g.ctx, W = g.w, H = g.h;

    var padW = Math.max(62, 96 - stage * 3), padX = W / 2, padY = H - 30;
    var baseSpd = 240 + stage * 22;
    var balls = [{ x: W / 2, y: padY - 14, vx: baseSpd * 0.56, vy: -baseSpd * 0.83, r: 8 }];
    var bricks = [], powerups = [], lasers = [], keys = { l: false, r: false };
    var laserUntil = 0, laserAcc = 0;
    var cols = 7, rows = Math.min(7, 4 + Math.floor(stage / 2)), bw = (W - 28) / cols, bh = 22;
    var rowCols = ["#dc2626", "#ea580c", "#d97706", "#65a30d", "#16a34a", "#0284c7", "#7c3aed"];

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var keep = true;
        if (formIdx === 1) keep = Math.abs(c - 3) <= r + 1;
        else if (formIdx === 2) keep = Math.abs(c - 3) + Math.abs(r - Math.floor(rows / 2)) <= 3;
        else if (formIdx === 3) keep = c !== 3;
        else if (formIdx === 4) keep = (r + c) % 2 === 0 || r === 0 || r === rows - 1;
        if (!keep) continue;
        var hp = (stage >= 3 && r < 2) ? (stage >= 6 && r === 0 ? 3 : 2) : 1;
        bricks.push({ x: 14 + c * bw + 2, y: 36 + r * (bh + 5), w: bw - 4, h: bh, hp: hp, col: rowCols[r % rowCols.length] });
      }
    }
    st.setGoal("🧱 متبقي: " + bricks.length);

    var rem = duration, running = false, ended = false, raf = null, lastTs = 0;
    var movePad = function (ev) { var p = getPointerPos(ev, cv, W, H); padX = Math.max(padW / 2, Math.min(W - padW / 2, p.x)); };
    var onKD = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = true; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = true; };
    var onKU = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = false; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = false; };
    cv.addEventListener("pointermove", movePad); cv.addEventListener("pointerdown", movePad); cv.addEventListener("touchmove", movePad, { passive: true });
    window.addEventListener("keydown", onKD); window.addEventListener("keyup", onKU);

    function hitBrick(i) {
      var bk = bricks[i]; bk.hp--;
      if (bk.hp <= 0) {
        playSfx("gold"); haptic(12);
        if (Math.random() < 0.24) {
          var rk = Math.random();
          powerups.push({ x: bk.x + bk.w / 2, y: bk.y, kind: rk < 0.3 ? "wide" : (rk < 0.58 ? "laser" : (rk < 0.84 ? "multi" : "heart")) });
        }
        bricks.splice(i, 1);
        st.setGoal("🧱 متبقي: " + bricks.length);
        if (bricks.length === 0) { ended = true; showResultScreen({ won: true, gameId: "breakout", stage: stage, summary: "كسّرت جميع براميل (" + formNames[formIdx] + ") في الدور " + stage + "! 🧱🏆" }); }
      } else playSfx("pop");
    }

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      if (keys.l) padX = Math.max(padW / 2, padX - 340 * dt);
      if (keys.r) padX = Math.min(W - padW / 2, padX + 340 * dt);

      rem -= dt; st.setTime(rem, duration);
      if (rem <= 0) { ended = true; showResultScreen({ won: false, gameId: "breakout", stage: stage, loseReason: "انتهى الوقت وتبقّى " + bricks.length + " برميل!" }); return; }

      // Auto-fire dual lasers when Laser Power-Up is active!
      if (Date.now() < laserUntil) {
        laserAcc += dt;
        if (laserAcc >= 0.34) {
          laserAcc = 0;
          lasers.push({ x: padX - padW * 0.38, y: padY - 6 }, { x: padX + padW * 0.38, y: padY - 6 });
          playSfx("laser");
        }
      }
      for (var li = lasers.length - 1; li >= 0; li--) {
        var lz = lasers[li]; lz.y -= 440 * dt;
        if (lz.y < 0) { lasers.splice(li, 1); continue; }
        for (var bi = bricks.length - 1; bi >= 0; bi--) {
          var bk0 = bricks[bi];
          if (lz.x > bk0.x && lz.x < bk0.x + bk0.w && lz.y > bk0.y && lz.y < bk0.y + bk0.h) {
            lasers.splice(li, 1); hitBrick(bi); break;
          }
        }
        if (ended) return;
      }

      for (var k = balls.length - 1; k >= 0; k--) {
        var b = balls[k]; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); playSfx("tick"); }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); playSfx("tick"); }
        if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); playSfx("tick"); }

        if (b.vy > 0 && b.y + b.r >= padY && b.y - b.r <= padY + 14 && Math.abs(b.x - padX) <= padW / 2 + b.r) {
          var rel = (b.x - padX) / (padW / 2), spd = Math.hypot(b.vx, b.vy), ang = rel * 1.15;
          b.vx = Math.sin(ang) * spd; b.vy = -Math.cos(ang) * spd; b.y = padY - b.r - 1;
          playSfx("pop"); haptic(10);
        }
        if (b.y > H + 18) {
          balls.splice(k, 1);
          if (!balls.length) {
            lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
            playSfx("bad"); haptic(50); st.shake();
            if (lives <= 0) { ended = true; showResultScreen({ won: false, gameId: "breakout", stage: stage, loseReason: "سقطت الكرة ونفدت محاولاتك!" }); return; }
            balls.push({ x: padX, y: padY - 16, vx: baseSpd * 0.55, vy: -baseSpd * 0.84, r: 8 });
          }
          continue;
        }
        for (var i = bricks.length - 1; i >= 0; i--) {
          var bk = bricks[i];
          if (b.x + b.r > bk.x && b.x - b.r < bk.x + bk.w && b.y + b.r > bk.y && b.y - b.r < bk.y + bk.h) {
            b.vy *= -1; hitBrick(i); break;
          }
        }
        if (ended) return;
      }

      window.OliveArt.drawTreeCanopy(ctx, W, H, formIdx);
      bricks.forEach(function (bk) {
        ctx.fillStyle = bk.col; ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
        ctx.strokeStyle = bk.hp > 1 ? "#fde68a" : "rgba(0,0,0,0.35)"; ctx.lineWidth = bk.hp > 1 ? 2.2 : 1;
        ctx.strokeRect(bk.x + 1, bk.y + 1, bk.w - 2, bk.h - 2);
        if (bk.hp > 1) { ctx.fillStyle = "#fff"; ctx.font = "900 11px Cairo,sans-serif"; ctx.textAlign = "center"; ctx.fillText(String(bk.hp), bk.x + bk.w / 2, bk.y + 15); }
      });

      for (var p = powerups.length - 1; p >= 0; p--) {
        var pw = powerups[p]; pw.y += 148 * dt;
        ctx.font = "18px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(pw.kind === "wide" ? "⚡" : (pw.kind === "laser" ? "🔫" : (pw.kind === "multi" ? "🔥" : "❤️")), pw.x, pw.y);
        if (pw.y >= padY - 6 && pw.y <= padY + 18 && Math.abs(pw.x - padX) <= padW / 2 + 14) {
          if (pw.kind === "wide") padW = Math.min(142, padW + 22);
          else if (pw.kind === "laser") laserUntil = Date.now() + 7000;
          else if (pw.kind === "heart") { lives = Math.min(4, lives + 1); st.setExtra("❤️".repeat(lives)); }
          else if (balls.length < 3) balls.push({ x: padX, y: padY - 14, vx: -baseSpd * 0.6, vy: -baseSpd * 0.8, r: 8 });
          playSfx("gold"); powerups.splice(p, 1);
        } else if (pw.y > H + 20) powerups.splice(p, 1);
      }

      ctx.fillStyle = "#fde047";
      lasers.forEach(function (lz) { ctx.fillRect(lz.x - 2, lz.y - 10, 4, 12); });

      var pg = ctx.createLinearGradient(padX - padW / 2, padY, padX + padW / 2, padY);
      pg.addColorStop(0, Date.now() < laserUntil ? "#dc2626" : "#b45309"); pg.addColorStop(0.5, "#fde68a"); pg.addColorStop(1, Date.now() < laserUntil ? "#dc2626" : "#b45309");
      ctx.fillStyle = pg; ctx.fillRect(padX - padW / 2, padY, padW, 12);
      balls.forEach(function (b) { ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke(); });
    }

    activeCleanup = function () {
      ended = true; if (raf) cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", movePad); cv.removeEventListener("pointerdown", movePad); cv.removeEventListener("touchmove", movePad);
      window.removeEventListener("keydown", onKD); window.removeEventListener("keyup", onKU);
    };
    runCountdown(st.host, "الدور " + stage + " — " + formNames[formIdx], function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // FLAGSHIP GAME 3: 🧺 HARVEST DELUXE (REAL VECTOR OLIVES + MAGNET & SHIELD!)
  // =========================================================================
  function playHarvestDeluxe(stage, baseTime) {
    var quota = 14 + stage * 5, duration = Math.max(22, baseTime + Math.min(8, stage)), lives = stage >= 5 ? 2 : 3;
    var st = createStageShell("قطف الزيتون", stage, duration, "🫒 0/" + quota, "💻 الماوس أو الأسهم • 📱 اسحب السلة • التقط 🧲 مغناطيس و🛡️ درع حماية!");
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-catch"></canvas></div>';

    var cv = document.getElementById("og-cv-catch");
    var g = setupHiDpiCanvas(cv, 380, 420);
    var ctx = g.ctx, W = g.w, H = g.h;
    var bx = W / 2, bw = Math.max(60, 88 - stage * 3), keys = { l: false, r: false };
    var picked = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, acc = 0;
    var items = [], magnetUntil = 0, shieldUntil = 0;
    var fallSpeed = 150 + stage * 24, spawnMs = Math.max(250, 540 - stage * 36), hazRate = Math.min(0.38, 0.16 + stage * 0.028), wind = (stage - 1) * 22;

    var movePtr = function (ev) { var p = getPointerPos(ev, cv, W, H); bx = Math.max(bw / 2, Math.min(W - bw / 2, p.x)); };
    var onKD = function (e) { if (e.key === "ArrowLeft" || e.key === "a") keys.l = true; if (e.key === "ArrowRight" || e.key === "d") keys.r = true; };
    var onKU = function (e) { if (e.key === "ArrowLeft" || e.key === "a") keys.l = false; if (e.key === "ArrowRight" || e.key === "d") keys.r = false; };
    cv.addEventListener("pointermove", movePtr); cv.addEventListener("pointerdown", movePtr); cv.addEventListener("touchmove", movePtr, { passive: true });
    window.addEventListener("keydown", onKD); window.addEventListener("keyup", onKU);

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.045, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      if (keys.l) bx = Math.max(bw / 2, bx - 320 * dt);
      if (keys.r) bx = Math.min(W - bw / 2, bx + 320 * dt);

      rem -= dt; st.setTime(rem, duration);
      if (rem <= 0) { ended = true; showResultScreen({ won: false, gameId: "catch", stage: stage, loseReason: "انتهى الوقت عند " + picked + "/" + quota + " ثمرة!" }); return; }

      acc += dt * 1000;
      if (acc >= spawnMs) {
        acc = 0;
        var r = Math.random();
        var kind = r < 0.05 ? "magnet" : (r < 0.09 ? "shield" : (r < 0.09 + hazRate * 0.55 ? "bomb" : (r < 0.09 + hazRate ? "stone" : (r < 0.09 + hazRate + 0.13 ? "rotten" : (r > 0.86 ? "gold" : (r > 0.66 ? "black" : "green"))))));
        items.push({ x: 24 + Math.random() * (W - 48), y: -20, vy: fallSpeed + Math.random() * 85, vx: (Math.random() - 0.5) * wind, kind: kind });
      }

      var now = Date.now(), hasMag = now < magnetUntil, hasShd = now < shieldUntil;
      window.OliveArt.drawTreeCanopy(ctx, W, H, stage - 1);

      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.y += it.vy * dt; it.x += it.vx * dt;
        if (hasMag && (it.kind === "green" || it.kind === "gold" || it.kind === "black") && it.y > 140) {
          it.x += (bx - it.x) * 4.5 * dt;
        }
        if (it.x < 18 || it.x > W - 18) it.vx *= -1;

        if (it.kind === "magnet" || it.kind === "shield") {
          ctx.font = "22px sans-serif"; ctx.textAlign = "center";
          ctx.fillText(it.kind === "magnet" ? "🧲" : "🛡️", it.x, it.y + 6);
        } else if (it.kind === "stone" || it.kind === "bomb") {
          window.OliveArt.drawHazard(ctx, it.x, it.y, 13, it.kind);
        } else {
          window.OliveArt.drawOlive(ctx, it.x, it.y, it.kind === "gold" ? 15 : 13, it.kind);
        }

        if (it.y >= H - 56 && it.y <= H - 14 && Math.abs(it.x - bx) <= bw / 2 + 12) {
          if (it.kind === "magnet") { magnetUntil = Date.now() + 6000; playSfx("gold"); }
          else if (it.kind === "shield") { shieldUntil = Date.now() + 6000; playSfx("gold"); }
          else if (it.kind === "bomb" || it.kind === "stone") {
            if (!hasShd) {
              lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
              playSfx("bad"); haptic(50); st.shake();
              if (lives <= 0) { ended = true; showResultScreen({ won: false, gameId: "catch", stage: stage, loseReason: "💥 اصطدمت السلة بالأحجار والقنابل!" }); return; }
            } else playSfx("pop");
          } else if (it.kind === "rotten") {
            picked = Math.max(0, picked - 2); playSfx("bad"); st.shake();
          } else {
            picked += it.kind === "gold" ? 3 : 1;
            playSfx(it.kind === "gold" ? "gold" : "pop"); haptic(12);
          }
          st.setGoal("🫒 " + picked + "/" + quota);
          items.splice(i, 1);
          if (picked >= quota) { ended = true; showResultScreen({ won: true, gameId: "catch", stage: stage, summary: "قطفت محصول الدور " + stage + " بنجاح (" + picked + " ثمرة سيناوية)! 🫒🏆" }); return; }
        } else if (it.y > H + 25) items.splice(i, 1);
      }

      window.OliveArt.drawBasket(ctx, bx, H - 46, bw, 32, hasShd);
    }

    activeCleanup = function () {
      ended = true; if (raf) cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", movePtr); cv.removeEventListener("pointerdown", movePtr); cv.removeEventListener("touchmove", movePtr);
      window.removeEventListener("keydown", onKD); window.removeEventListener("keyup", onKU);
    };
    runCountdown(st.host, "الدور " + stage + " — اقطف " + quota + " ثمرة زيتون!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // FLAGSHIP GAME 4: 🪙 GOLD SCRATCH CARD (INDEPENDENT OF DAILY CAP)
  // =========================================================================
  function playGoldScratch() {
    var body = document.getElementById("og-body"), cap = Math.max(1, Number(cfg.dailyScratchCap || 1));
    if (pState.dailyScratchesUsed >= cap) {
      body.innerHTML = '<div class="og-card og-arena-wrap" style="text-align:center;padding:24px;"><div style="font-size:3rem;">🪙</div><h3>استخدمت محاولات الكشط اليوم (' + cap + '/' + cap + ')</h3><button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV98.backToHub()">🏠 رجوع للألعاب</button></div>';
      return;
    }
    var drawn = weightedDraw(cfg.scratchPrizes), done = false, strokes = 0, down = false;
    body.innerHTML =
      '<div class="og-card og-arena-wrap" style="text-align:center;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong>🪙 كارت قطرة الذهب (خارج الحد اليومي)</strong><button type="button" class="og-btn og-btn-ghost" style="padding:5px 10px;" onclick="window.ZaitGamesV98.backToHub()">✕</button></div>' +
        '<div style="position:relative;width:100%;max-width:340px;height:175px;margin:0 auto 12px;border-radius:18px;overflow:hidden;border:2px solid #d59e2a;background:linear-gradient(135deg,#0f2e1d,#1e5436);display:flex;align-items:center;justify-content:center;color:#fde68a;font-size:1.15rem;font-weight:900;">' +
          '<div>' + esc(drawn.label) + '</div><canvas id="og-sc-cv" width="340" height="175" style="position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:pointer;"></canvas></div>' +
        '<button type="button" class="og-btn og-btn-gold" id="og-sc-auto">✨ كشط سريع</button></div>';

    var cv = document.getElementById("og-sc-cv"), ctx = cv.getContext("2d");
    var gr = ctx.createLinearGradient(0, 0, 340, 175);
    gr.addColorStop(0, "#f5d376"); gr.addColorStop(0.5, "#c99220"); gr.addColorStop(1, "#f2cc63");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 340, 175);
    ctx.fillStyle = "#102819"; ctx.font = "900 19px Cairo,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("🪙 امسح بالماوس أو الإصبع 🪙", 170, 94);

    async function reveal() {
      if (done) return; done = true; pState.dailyScratchesUsed++;
      var issued = await issuePrize(drawn, "كارت قطرة الذهب");
      await pushPlayerMetaCloud();
      showResultScreen({ won: true, isScratch: true, forcedPrize: issued, gameId: "scratch", stage: 1 });
    }
    function sc(e) {
      if (done) return;
      var p = getPointerPos(e, cv, 340, 175);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(p.x, p.y, 26, 0, Math.PI * 2); ctx.fill();
      if (++strokes > 22) reveal();
    }
    cv.addEventListener("pointerdown", function (e) { down = true; sc(e); });
    cv.addEventListener("pointermove", function (e) { if (down) sc(e); });
    window.addEventListener("pointerup", function () { down = false; });
    document.getElementById("og-sc-auto").onclick = function () { ctx.clearRect(0, 0, 340, 175); reveal(); };
  }

  // =========================================================================
  // 4. COUPONS, LEADERBOARD & COMPLETE ADMIN CONTROL PANEL (WITH ALL ALIASES!)
  // =========================================================================
  function openCoupons() {
    stopActive(); currentView = "coupons"; renderHud();
    var list = pState.coupons || [], now = Date.now();
    document.getElementById("og-body").innerHTML =
      '<div class="og-arena-wrap"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><strong>🎟️ كوبوناتي الخاصة</strong><button type="button" class="og-btn og-btn-dark" style="padding:6px 12px;" onclick="window.ZaitGamesV98.backToHub()">← رجوع</button></div>' +
      (list.length === 0 ? '<div class="og-card" style="text-align:center;padding:24px;">لا توجد كوبونات حالياً — العب واربح الآن! 🎮</div>' : list.map(function (c) {
        var exp = c.expiresAt && c.expiresAt <= now;
        return '<div class="og-card" style="opacity:' + ((c.used || exp) ? "0.6" : "1") + ';"><div style="display:flex;justify-content:space-between;"><strong>' + esc(c.label) + '</strong><span style="font-size:.75rem;font-weight:900;color:' + ((c.used || exp) ? "#ef4444" : "#15803d") + ';">' + (c.used ? "✅ مستخدم" : (exp ? "⌛ منتهي" : "🟢 فعال")) + '</span></div><div class="og-code-box" style="text-align:center;background:#10301e;">' + esc(c.code) + '</div>' + ((!c.used && !exp) ? '<button type="button" class="og-btn og-btn-gold" style="width:100%;" onclick="window.ZaitGamesV98.applyCouponAndShop(\'' + esc(c.code) + '\')">🛒 نسخ وتطبيق الكوبون</button>' : '') + '</div>';
      }).join("")) + '</div>';
  }

  function openLeaderboard() {
    stopActive(); currentView = "lb"; renderHud();
    var lb = loadJson(LB_KEY, []);
    document.getElementById("og-body").innerHTML =
      '<div class="og-arena-wrap"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><strong>🏆 لوحة المتصدرين</strong><button type="button" class="og-btn og-btn-dark" style="padding:6px 12px;" onclick="window.ZaitGamesV98.backToHub()">← رجوع</button></div>' +
      '<div class="og-card">' + (lb.length ? lb.slice(0, 10).map(function (r, i) { return '<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px dashed rgba(200,162,75,.25);"><strong>#' + (i + 1) + ' ' + esc(r.name) + '</strong><strong style="color:#d97706;">' + r.score + ' ⭐</strong></div>'; }).join("") : '<div style="text-align:center;padding:22px;">العب وتصدّر القائمة الآن! 🏆</div>') + '</div></div>';
  }

  var admTab = "general";
  function mountAdminPanel(el) {
    if (!el) return;
    window.__V98_ADMIN_HOST__ = el;
    var tabs = [{ id: "general", l: "⚙️ عام" }, { id: "streak", l: "🔥 7 أيام والصندوق" }, { id: "prizes", l: "🎁 الجوائز والكشط" }, { id: "games", l: "🎮 الألعاب والأدوار" }, { id: "roi", l: "📊 ROI" }];
    var h = '<div class="og-adm-box"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;"><strong style="font-size:.96rem;color:var(--primary,#153422);">🎮 لوحة تحكم مركز الألعاب V98 Ultra</strong><div style="display:flex;gap:6px;"><button type="button" class="og-btn og-btn-gold" style="padding:7px 14px;font-size:.78rem;" onclick="window.ZaitGamesV98.adminSaveConfig()">💾 حفظ ونشر</button><button type="button" class="og-btn og-btn-ghost" style="padding:7px 10px;font-size:.76rem;" onclick="window.ZaitGamesV98.adminResetMyTries()">🔄 تصفير للتجربة</button></div></div>' +
      '<div class="og-adm-tabs">' + tabs.map(function (t) { return '<button type="button" class="og-adm-tab ' + (admTab === t.id ? "active" : "") + '" onclick="window.ZaitGamesV98.adminSetTab(\'' + t.id + '\')">' + t.l + '</button>'; }).join("") + '</div>';

    if (admTab === "general") {
      h += '<div class="og-adm-row"><label><input type="checkbox" id="a98-en" ' + (cfg.enabled ? "checked" : "") + '> تفعيل الألعاب</label><label><input type="checkbox" id="a98-fl" ' + (cfg.showFloatBtn ? "checked" : "") + '> زر الرئيسية</label><label><input type="checkbox" id="a98-sb" ' + (cfg.showSidebarBtn ? "checked" : "") + '> القائمة الجانبية</label></div>' +
        '<div class="og-adm-row"><span>🎁 الحد اليومي للجوائز:</span><input type="number" class="og-adm-inp" id="a98-cap" value="' + cfg.dailyPrizeCap + '" style="width:74px;"></div>' +
        '<div class="og-adm-row"><span>🪙 كشط يومي (خارج الحد):</span><input type="number" class="og-adm-inp" id="a98-scap" value="' + cfg.dailyScratchCap + '" style="width:74px;"></div>' +
        '<div class="og-adm-row"><span>⏳ صلاحية الكوبون (ساعة):</span><input type="number" class="og-adm-inp" id="a98-exp" value="' + cfg.couponExpiryHours + '" style="width:74px;"></div>' +
        '<div class="og-adm-row"><span>🛒 الحد الأدنى للطلب (ج):</span><input type="number" class="og-adm-inp" id="a98-min" value="' + cfg.defaultMinOrder + '" style="width:84px;"></div>' +
        '<div class="og-adm-row"><span>🧠 عدد أسئلة مسابقة الخبير:</span><input type="number" class="og-adm-inp" id="a98-qc" value="' + cfg.quizQuestionCount + '" style="width:74px;"></div>';
    } else if (admTab === "streak") {
      var days = cfg.dailyStreak.days || [5, 10, 15, 20, 25, 30];
      var cSum = (cfg.dailyStreak.bigChestPrizes || []).reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
      h += '<div class="og-adm-row"><label><input type="checkbox" id="a98-sten" ' + (cfg.dailyStreak.enabled ? "checked" : "") + '> 🔥 تفعيل سلسلة هدايا الـ 7 أيام</label></div>' +
        '<div class="og-adm-row"><strong style="width:100%;">⭐ نقاط الأيام (1 إلى 6):</strong><div class="og-adm-grid3">' + days.map(function (v, i) { return '<label style="font-size:.74rem;">يوم ' + (i + 1) + ':<input type="number" class="og-adm-inp" id="a98-sd' + i + '" value="' + v + '" style="width:100%;"></label>'; }).join("") + '</div></div>' +
        '<div class="og-adm-row"><strong>🎁 الصندوق الكبير (اليوم 7) — المجموع: ' + cSum + '%</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.73rem;" onclick="window.ZaitGamesV98.adminAddPrize(\'chest\')">+ هدية</button></div>' + renderPrizeEd("chest", cfg.dailyStreak.bigChestPrizes || []);
    } else if (admTab === "prizes") {
      var pSum = (cfg.prizePool || []).reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
      var sSum = (cfg.scratchPrizes || []).reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
      h += '<div class="og-adm-row"><strong>🎁 الجوائز العشوائية — المجموع: ' + pSum + '%</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.73rem;" onclick="window.ZaitGamesV98.adminAddPrize(\'pool\')">+ جائزة</button></div>' + renderPrizeEd("pool", cfg.prizePool || []) +
        '<div class="og-adm-row"><strong>🪙 نسب كارت الكشط — المجموع: ' + sSum + '%</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.73rem;" onclick="window.ZaitGamesV98.adminAddPrize(\'scratch\')">+ عنصر</button></div>' + renderPrizeEd("scratch", cfg.scratchPrizes || []);
    } else if (admTab === "games") {
      h += getAllGamesMeta().map(function (gm) {
        var gc = getGameCfg(gm.id);
        return '<div class="og-adm-row"><strong>' + gm.icon + ' ' + esc(gm.name) + '</strong><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><label><input type="checkbox" class="ag98-en" data-g="' + gm.id + '" ' + (gc.enabled !== false ? "checked" : "") + '> تشغيل</label>' +
          (gm.id !== "scratch" ? '<label style="font-size:.73rem;">الوقت(ث):<input type="number" class="og-adm-inp ag98-tm" data-g="' + gm.id + '" value="' + gc.baseTime + '" style="width:60px;"></label><label style="font-size:.73rem;">الأدوار:<input type="number" class="og-adm-inp ag98-st" data-g="' + gm.id + '" value="' + gc.maxStages + '" style="width:52px;"></label>' : '') + '</div></div>';
      }).join("");
    } else {
      var pl = analytics.plays || {}, tot = Object.values(pl).reduce(function (s, n) { return s + Number(n || 0); }, 0);
      h += '<div class="og-adm-row"><span>🎮 مرات اللعب: <b>' + tot + '</b></span><span>🎟️ كوبونات صادرة: <b>' + Number(analytics.couponsIssued || 0) + '</b></span><span>✅ مستخدمة: <b>' + Number(analytics.couponsRedeemed || 0) + '</b></span></div>' +
        getAllGamesMeta().map(function (gm) { return '<div class="og-adm-row"><span>' + gm.icon + ' ' + esc(gm.name) + '</span><b>' + Number(pl[gm.id] || 0) + ' مرة</b></div>'; }).join("");
    }
    el.innerHTML = h + '</div>';
  }

  function renderPrizeEd(kind, arr) {
    return arr.map(function (p, i) {
      return '<div class="og-adm-row" data-pk98="' + kind + '"><input type="text" class="og-adm-inp ap-l" value="' + esc(p.label) + '" style="flex:1;min-width:115px;"><select class="og-adm-inp ap-t"><option value="points" ' + (p.type === "points" ? "selected" : "") + '>⭐ نقاط</option><option value="percent" ' + (p.type === "percent" ? "selected" : "") + '>🎟️ خصم%</option><option value="free_shipping" ' + (p.type === "free_shipping" ? "selected" : "") + '>🚚 شحن</option><option value="none" ' + (p.type === "none" ? "selected" : "") + '>🌿 حظ أوفر</option></select><input type="number" class="og-adm-inp ap-v" value="' + Number(p.value || 0) + '" style="width:52px;" title="القيمة"><input type="number" class="og-adm-inp ap-m" value="' + Number(p.minOrder || 0) + '" style="width:60px;" title="حد الطلب"><input type="number" class="og-adm-inp ap-w" value="' + Number(p.weight || 0) + '" style="width:50px;" title="النسبة%"><button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV98.adminDelPrize(\'' + kind + '\',' + i + ')">🗑️</button></div>';
    }).join("");
  }

  function readAdmInputs() {
    var gn = function (id, d) { var e = document.getElementById(id); return e ? Number(e.value || d) : d; };
    var gc = function (id, d) { var e = document.getElementById(id); return e ? !!e.checked : d; };
    var rp = function (k) {
      var res = [];
      document.querySelectorAll('.og-adm-row[data-pk98="' + k + '"]').forEach(function (r, idx) {
        res.push({ id: k + "_" + idx, label: r.querySelector(".ap-l").value, type: r.querySelector(".ap-t").value, value: Number(r.querySelector(".ap-v").value || 0), minOrder: Number(r.querySelector(".ap-m").value || 0), weight: Math.max(0, Number(r.querySelector(".ap-w").value || 0)) });
      });
      return res;
    };
    if (admTab === "general") {
      cfg.enabled = gc("a98-en", cfg.enabled); cfg.showFloatBtn = gc("a98-fl", cfg.showFloatBtn); cfg.showSidebarBtn = gc("a98-sb", cfg.showSidebarBtn);
      cfg.dailyPrizeCap = Math.max(1, gn("a98-cap", 3)); cfg.dailyScratchCap = Math.max(1, gn("a98-scap", 1));
      cfg.couponExpiryHours = Math.max(1, gn("a98-exp", 24)); cfg.defaultMinOrder = Math.max(0, gn("a98-min", 300)); cfg.quizQuestionCount = Math.max(3, gn("a98-qc", 7));
    } else if (admTab === "streak") {
      cfg.dailyStreak.enabled = gc("a98-sten", true);
      for (var i = 0; i < 6; i++) cfg.dailyStreak.days[i] = Math.max(1, gn("a98-sd" + i, (i + 1) * 5));
      cfg.dailyStreak.bigChestPrizes = rp("chest");
    } else if (admTab === "prizes") {
      cfg.prizePool = rp("pool"); cfg.scratchPrizes = rp("scratch");
    } else if (admTab === "games") {
      document.querySelectorAll(".ag98-en").forEach(function (e) { var g = e.getAttribute("data-g"); cfg.games[g] = getGameCfg(g); cfg.games[g].enabled = !!e.checked; });
      document.querySelectorAll(".ag98-tm").forEach(function (e) { var g = e.getAttribute("data-g"); cfg.games[g].baseTime = Math.max(8, Number(e.value || 35)); });
      document.querySelectorAll(".ag98-st").forEach(function (e) { var g = e.getAttribute("data-g"); cfg.games[g].maxStages = Math.max(1, Math.min(20, Number(e.value || 10))); });
    }
  }

  function openGames(direct) {
    if (!cfg.enabled) return toast("مركز الألعاب متوقف مؤقتاً", "info");
    ensureOverlay().classList.add("open"); isOpen = true; syncCloud();
    if (direct) openGameSplash(direct); else renderHub();
  }
  function closeGames() { stopActive(); isOpen = false; var ov = document.getElementById("og-overlay"); if (ov) ov.classList.remove("open"); }

  // Expose full API with EVERY legacy alias so V94/V95/V96/V97/V98 calls all succeed 100%!
  var PUBLIC_API = {
    open: openGames, close: closeGames, backToHub: renderHub,
    openGame: openGameSplash, startStage: launchStage,
    openCoupons: openCoupons, openLeaderboard: openLeaderboard, claimStreak: claimStreak,
    setCat: function (c) { currentCat = c; renderHub(); },
    toggleSound: function () { soundOn = !soundOn; var b = document.getElementById("og-snd-btn"); if (b) b.textContent = soundOn ? "🔊" : "🔇"; },
    applyCouponAndShop: function (code) {
      try { navigator.clipboard && navigator.clipboard.writeText(code).catch(function () {}); } catch (e) {}
      closeGames();
      if (typeof window.V98_applyCodeQuick === "function") window.V98_applyCodeQuick(code);
      toast("✅ تم نسخ وتطبيق الكوبون (" + code + ") بنجاح!", "success");
    },
    mountAdminPanel: mountAdminPanel,
    renderAdminPanel: mountAdminPanel,
    renderAdminControl: mountAdminPanel,
    renderAdminSettings: mountAdminPanel,
    initAdminPanel: mountAdminPanel,
    adminSetTab: function (t) { readAdmInputs(); admTab = t; mountAdminPanel(window.__V98_ADMIN_HOST__); },
    adminAddPrize: function (k) {
      readAdmInputs();
      var nw = { id: "n_" + Date.now(), label: "هدية جديدة 🎁", type: "points", value: 15, minOrder: 0, weight: 10 };
      if (k === "chest") cfg.dailyStreak.bigChestPrizes.push(nw);
      else if (k === "pool") cfg.prizePool.push(nw); else cfg.scratchPrizes.push(nw);
      mountAdminPanel(window.__V98_ADMIN_HOST__);
    },
    adminDelPrize: function (k, i) {
      readAdmInputs();
      if (k === "chest") cfg.dailyStreak.bigChestPrizes.splice(i, 1);
      else if (k === "pool") cfg.prizePool.splice(i, 1); else cfg.scratchPrizes.splice(i, 1);
      mountAdminPanel(window.__V98_ADMIN_HOST__);
    },
    adminSaveConfig: async function () {
      readAdmInputs(); saveJson(CFG_KEY, cfg);
      var fs = getFs();
      if (navigator.onLine && fs) { try { await fs.setDoc(fs.doc(fs.db, "settings", "olive_games_v96"), cfg, { merge: true }); } catch (e) {} }
      toast("✅ تم حفظ ونشر إعدادات الألعاب V98 Ultra بنجاح!", "success");
    },
    adminResetMyTries: async function () {
      pState.dailyPrizesWon = 0; pState.dailyScratchesUsed = 0; pState.lastStreakClaimDate = "";
      await pushPlayerMetaCloud();
      toast("🔄 تم تصفير محاولات اليوم للتجربة!", "success");
    }
  };

  window.ZaitGamesV98 = window.ZaitGamesV96 = window.ZaitOliveGames = PUBLIC_API;
  window.openOliveGamesHub = openGames;
  window.openGamesHub = openGames;
  syncCloud();
})();
