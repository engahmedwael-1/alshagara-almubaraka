/* ============================================================================
   Zait Store Olive Games Pro — V97 Master Stage & OliveArt Vector Engine
   Supports Mobile, Tablet, Laptop & Desktop (Touch + Mouse + Keyboard)
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_GAMES_V97__) return;
  window.__ZAIT_OLIVE_GAMES_V97__ = true;

  var CFG_KEY = "zait_v96_games_config";
  var STATE_KEY = "zait_v96_player_state";
  var ROI_KEY = "zait_v96_games_analytics";
  var LB_KEY = "zait_v96_leaderboard_cache";

  // =========================================================================
  // 1. REALISTIC VECTOR OLIVE ART ENGINE (NO GENERIC RED/YELLOW CIRCLES!)
  // =========================================================================
  window.OliveArt = {
    // Draw authentic glossy Sinai olive with stem & green leaf
    drawOlive: function (ctx, x, y, r, variant) {
      ctx.save();
      ctx.translate(x, y);
      var grad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r * 1.15);
      if (variant === "gold") {
        grad.addColorStop(0, "#fef08a");
        grad.addColorStop(0.55, "#eab308");
        grad.addColorStop(1, "#854d0e");
      } else if (variant === "black") {
        grad.addColorStop(0, "#6b21a8");
        grad.addColorStop(0.5, "#3b0764");
        grad.addColorStop(1, "#111827");
      } else if (variant === "rotten") {
        grad.addColorStop(0, "#a8a29e");
        grad.addColorStop(0.6, "#57534e");
        grad.addColorStop(1, "#292524");
      } else {
        // Fresh Sinai green olive
        grad.addColorStop(0, "#bef264");
        grad.addColorStop(0.52, "#65a30d");
        grad.addColorStop(1, "#1e3a0f");
      }
      // Stem
      ctx.strokeStyle = "#422006";
      ctx.lineWidth = Math.max(1.5, r * 0.14);
      ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.quadraticCurveTo(r * 0.18, -r * 1.35, r * 0.35, -r * 1.3); ctx.stroke();
      // Leaf on fresh & golden olives
      if (variant !== "rotten") {
        ctx.fillStyle = variant === "gold" ? "#84cc16" : "#22c55e";
        ctx.beginPath();
        ctx.ellipse(-r * 0.42, -r * 1.05, r * 0.45, r * 0.2, -0.55, 0, Math.PI * 2);
        ctx.fill();
      }
      // Olive body (oval shape!)
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.82, r * 1.05, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Glossy reflection highlight
      ctx.fillStyle = "rgba(255,255,255,0.48)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.28, -r * 0.36, r * 0.2, r * 0.38, -0.35, 0, Math.PI * 2);
      ctx.fill();
      if (variant === "rotten") {
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, 5); ctx.moveTo(5, -5); ctx.lineTo(-5, 5); ctx.stroke();
      }
      ctx.restore();
    },

    // Draw Sinai Olive Oil Bottle with Blessed Tree Gold Label
    drawBottle: function (ctx, x, y, w, h, fillRatio) {
      ctx.save();
      ctx.translate(x, y);
      var neckW = w * 0.34, neckH = h * 0.22;
      // Cap
      ctx.fillStyle = "#b45309";
      ctx.fillRect(-neckW / 2 - 1, -h / 2 - 5, neckW + 2, 7);
      // Bottle silhouette
      ctx.beginPath();
      ctx.moveTo(-neckW / 2, -h / 2 + 2);
      ctx.lineTo(-neckW / 2, -h / 2 + neckH);
      ctx.quadraticCurveTo(-w / 2, -h / 2 + neckH + 10, -w / 2, -h / 2 + neckH + 22);
      ctx.lineTo(-w / 2, h / 2 - 6);
      ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2 + 8, h / 2);
      ctx.lineTo(w / 2 - 8, h / 2);
      ctx.quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - 6);
      ctx.lineTo(w / 2, -h / 2 + neckH + 22);
      ctx.quadraticCurveTo(w / 2, -h / 2 + neckH + 10, neckW / 2, -h / 2 + neckH);
      ctx.lineTo(neckW / 2, -h / 2 + 2);
      ctx.closePath();
      ctx.fillStyle = "rgba(12, 36, 22, 0.85)";
      ctx.fill();
      // Golden Olive Oil liquid inside
      ctx.save();
      ctx.clip();
      var fH = h * Math.max(0, Math.min(1, fillRatio !== undefined ? fillRatio : 0.85));
      var lg = ctx.createLinearGradient(0, h / 2 - fH, 0, h / 2);
      lg.addColorStop(0, "#fde047"); lg.addColorStop(0.5, "#ca8a04"); lg.addColorStop(1, "#713f12");
      ctx.fillStyle = lg;
      ctx.fillRect(-w / 2, h / 2 - fH, w, fH);
      ctx.restore();
      ctx.strokeStyle = "#e5b84b"; ctx.lineWidth = 2; ctx.stroke();
      // Brand Label
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(-w * 0.38, -2, w * 0.76, h * 0.24);
      ctx.strokeStyle = "#b45309"; ctx.lineWidth = 1;
      ctx.strokeRect(-w * 0.38, -2, w * 0.76, h * 0.24);
      ctx.fillStyle = "#153422";
      ctx.font = "900 " + Math.max(8, Math.round(w * 0.2)) + "px Cairo,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🌿 بكر", 0, h * 0.14);
      ctx.restore();
    },

    // Draw Wicker Harvest Basket
    drawBasket: function (ctx, x, y, w, h) {
      ctx.save();
      ctx.translate(x, y);
      var grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#d97706"); grad.addColorStop(1, "#78350f");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0);
      ctx.lineTo(w / 2 - 10, h); ctx.lineTo(-w / 2 + 10, h);
      ctx.closePath(); ctx.fill();
      // Weave lines
      ctx.strokeStyle = "rgba(254, 240, 138, 0.45)"; ctx.lineWidth = 1.4;
      for (var wy = 7; wy < h; wy += 7) {
        ctx.beginPath(); ctx.moveTo(-w / 2 + wy * 0.25, wy); ctx.lineTo(w / 2 - wy * 0.25, wy); ctx.stroke();
      }
      // Top rim
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(-w / 2 - 3, -5, w + 6, 7);
      ctx.strokeStyle = "#fde68a"; ctx.strokeRect(-w / 2 - 3, -5, w + 6, 7);
      ctx.restore();
    },

    // Draw Sinai Olive Tree Canopy Background
    drawTreeCanopy: function (ctx, W, H, themeIdx) {
      var skies = [
        ["#0c2618", "#17422a"],
        ["#1a1b3a", "#173c2d"],
        ["#2c1b0e", "#193a24"],
        ["#0b2938", "#133b27"],
        ["#1e132c", "#143522"]
      ];
      var pair = skies[(themeIdx || 0) % skies.length];
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, pair[0]); bg.addColorStop(1, pair[1]);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // Leafy olive branches at top
      ctx.fillStyle = "rgba(34, 139, 68, 0.45)";
      for (var i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.arc(i * (W / 7), 4, 34, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "rgba(20, 83, 45, 0.72)";
      for (var j = 0; j < 7; j++) {
        ctx.beginPath(); ctx.arc(25 + j * (W / 6.5), -6, 28, 0, Math.PI * 2); ctx.fill();
      }
    },

    // Draw Rock / Bomb Hazard
    drawHazard: function (ctx, x, y, r, kind) {
      ctx.save();
      ctx.translate(x, y);
      if (kind === "stone") {
        ctx.fillStyle = "#64748b";
        ctx.beginPath();
        ctx.moveTo(-r, 2); ctx.lineTo(-r * 0.5, -r * 0.85); ctx.lineTo(r * 0.6, -r * 0.7);
        ctx.lineTo(r, 3); ctx.lineTo(r * 0.4, r * 0.85); ctx.lineTo(-r * 0.65, r * 0.75);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1.4; ctx.stroke();
      } else {
        ctx.fillStyle = "#1f2937";
        ctx.beginPath(); ctx.arc(0, 2, r * 0.9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2; ctx.stroke();
        // Sparking fuse
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -r * 0.8); ctx.quadraticCurveTo(6, -r * 1.3, 10, -r * 1.1); ctx.stroke();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.arc(10, -r * 1.1, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    },

    // Draw Delivery Truck carrying olive oil crates
    drawTruck: function (ctx, x, y) {
      ctx.save();
      ctx.translate(x, y);
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(-24, -26, 48, 58);
      // Cargo bed (Olive green with golden trim)
      ctx.fillStyle = "#15803d";
      ctx.fillRect(-21, -24, 42, 36);
      ctx.strokeStyle = "#f4cf6d"; ctx.lineWidth = 2; ctx.strokeRect(-21, -24, 42, 36);
      // Olive emblem on roof
      ctx.fillStyle = "#fde047";
      ctx.beginPath(); ctx.ellipse(0, -6, 6, 8, 0.2, 0, Math.PI * 2); ctx.fill();
      // Cab
      ctx.fillStyle = "#f4cf6d";
      ctx.fillRect(-19, -36, 38, 14);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-15, -33, 30, 7);
      // Headlights
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(-17, -38, 7, 3); ctx.fillRect(10, -38, 7, 3);
      ctx.restore();
    }
  };

  // Plugin registry for Part 2 advanced level games
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
      catch:    { enabled: true, baseTime: 26, maxStages: 10 },
      press:    { enabled: true, baseTime: 24, maxStages: 8 },
      truck:    { enabled: true, baseTime: 30, maxStages: 8 },
      sorter:   { enabled: true, baseTime: 26, maxStages: 10 },
      memory:   { enabled: true, baseTime: 30, maxStages: 10 },
      quiz:     { enabled: true, baseTime: 12, maxStages: 10 },
      scratch:  { enabled: true, baseTime: 60, maxStages: 1 },
      // Part 2 Stage-Based Games
      zuma:     { enabled: true, baseTime: 65, maxStages: 10 },
      breakout: { enabled: true, baseTime: 70, maxStages: 10 },
      slice:    { enabled: true, baseTime: 30, maxStages: 10 },
      snake:    { enabled: true, baseTime: 55, maxStages: 10 },
      match:    { enabled: true, baseTime: 40, maxStages: 10 },
      reflex:   { enabled: true, baseTime: 26, maxStages: 10 },
      pipes:    { enabled: true, baseTime: 50, maxStages: 10 }
    }
  };

  var CORE_META = [
    { id: "catch",   icon: "🧺", name: "قطف الزيتون السيناوي", desc: "اقطف ثمار الزيتون الأخضر والذهبي الحقيقية عبر أدوار متصاعدة!", cat: "speed", tag: "أدوار 🫒" },
    { id: "press",   icon: "❄️", name: "معصرة العصر عالبارد", desc: "املأ عبوات 500مل ⬅️ 1لتر ⬅️ 2لتر ⬅️ جركن 5لتر تحت 27°م!", cat: "speed", tag: "مراحل ❄️" },
    { id: "truck",   icon: "🚚", name: "رحلة توصيل زيت سيناء", desc: "وصّل الشحنات من العريش لكل محافظات مصر بدون تصادم!", cat: "speed", tag: "خرائط 🚚" },
    { id: "sorter",  icon: "🎯", name: "سير فرز المعصرة", desc: "افرز ثمار الزيتون الطازجة واستبعد التالف والحجارة في كل دفعة!", cat: "speed", tag: "دفعات 🎯" },
    { id: "memory",  icon: "🌿", name: "ذاكرة المزرعة", desc: "أدوار متزايدة بعدد كروت أكبر ووقت أسرع كل مرحلة!", cat: "brain", tag: "مراحل 🌿" },
    { id: "quiz",    icon: "🧠", name: "خبير زيت الزيتون", desc: "+10,800 سؤال بمراحل متدرجة ومؤقت سريع بدون تكرار!", cat: "brain", tag: "+10,800 🧠" },
    { id: "scratch", icon: "🪙", name: "اكشط قطرة الذهب", desc: "كارت حظ يومي مستقل خارج حد الجوائز اليومية!", cat: "luck", tag: "حظ 🪙" }
  ];

  var RANKS = [
    { min: 0, title: "🌱 مبتدئ المزرعة" },
    { min: 200, title: "🧺 قاطف سيناوي" },
    { min: 600, title: "❄️ خبير المعصرة" },
    { min: 1400, title: "🏆 فارس الزيتون" },
    { min: 3000, title: "👑 شيخ الشجرة المباركة" }
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
          out.games[g] = Object.assign({ enabled: true, baseTime: 30, maxStages: 10 }, out.games[g] || {}, over.games[g]);
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
      streakCount: 0, lastStreakClaimDate: "", missionDate: "", missionDone: false,
      unlockedStage: {}, coupons: [], pendingPoints: 0, seenQuizIds: []
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
    if (typeof window.V96_refreshStoreCouponBar === "function") try { window.V96_refreshStoreCouponBar(); } catch (e) {}
  }
  function getFs() { var h = window.__V96_FS__ || {}; return (h.db && h.doc && h.setDoc && h.getDoc) ? h : null; }
  function getUser() { return window.currentUser || (window.auth && window.auth.currentUser) || null; }
  function toast(m, t) { if (typeof window.showToast === "function") try { window.showToast(m, t || "info"); return; } catch (e) {} }
  function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 14); } catch (e) {} }
  function getUnlocked(gid) { return Math.max(1, Number(pState.unlockedStage[gid] || 1)); }
  function getGameCfg(gid) { return (cfg.games && cfg.games[gid]) || { enabled: true, baseTime: 30, maxStages: 10 }; }
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
      if (type === "pop") { o.type = "sine"; o.frequency.setValueAtTime(520, now); o.frequency.exponentialRampToValueAtTime(860, now + 0.08); g.gain.setValueAtTime(0.1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.09); o.start(now); o.stop(now + 0.1); }
      else if (type === "gold") { o.type = "triangle"; o.frequency.setValueAtTime(700, now); o.frequency.setValueAtTime(1040, now + 0.06); g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2); o.start(now); o.stop(now + 0.2); }
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
        list.push({ id: id, icon: ex.icon || "🎮", name: ex.name || id, desc: ex.desc || "", cat: ex.cat || "speed", tag: ex.hardTag || "مراحل 🔥" });
      }
    });
    return list;
  }

  function setupHiDpiCanvas(canvas, cssW, cssH) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = "100%";
    canvas.style.aspectRatio = cssW + " / " + cssH;
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: cssW, h: cssH };
  }

  // =========================================================================
  // 2. CLOUD SYNC, POINTS, PRIZES, 7-DAY STREAK & LEADERBOARD
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
          if (ud.gameStages && typeof ud.gameStages === "object") {
            Object.keys(ud.gameStages).forEach(function (k) {
              pState.unlockedStage[k] = Math.max(getUnlocked(k), Number(ud.gameStages[k] || 1));
            });
          }
          if (pState.pendingPoints > 0) {
            var add = pState.pendingPoints; pState.pendingPoints = 0;
            await awardPoints(add);
          }
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
      await awardPoints(item.value || 15);
      await pushPlayerMetaCloud();
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

  function getActiveCoupons() {
    var now = Date.now();
    return (pState.coupons || []).filter(function (c) { return c && !c.used && (!c.expiresAt || c.expiresAt > now); });
  }

  function getStreakInfo() {
    var td = todayKey(), yd = yestKey(), claimed = pState.lastStreakClaimDate === td;
    var cnt = Number(pState.streakCount || 0);
    if (!claimed && pState.lastStreakClaimDate && pState.lastStreakClaimDate !== yd) cnt = 0;
    return { claimed: claimed, count: cnt, dayIdx: claimed ? ((cnt - 1) % 7) : (cnt % 7) };
  }

  async function claimStreak() {
    var st = getStreakInfo();
    if (st.claimed) return toast("✅ استلمت هدية اليوم بالفعل! عد غداً 🔥", "info");
    pState.streakCount = st.count + 1;
    pState.lastStreakClaimDate = todayKey();
    if (st.dayIdx < 6) {
      var pts = Number((cfg.dailyStreak.days && cfg.dailyStreak.days[st.dayIdx]) || ((st.dayIdx + 1) * 5));
      await awardPoints(pts); await pushPlayerMetaCloud();
      playSfx("win"); haptic(30);
      toast("🔥 هدية اليوم " + (st.dayIdx + 1) + ": +" + pts + " نقطة ولاء!", "success");
      renderHub();
    } else {
      var drawn = weightedDraw(cfg.dailyStreak.bigChestPrizes);
      var issued = await issuePrize(drawn, "الصندوق الذهبي (اليوم 7)");
      playSfx("win"); haptic([30, 50, 80]);
      showResultScreen({ won: true, isChest: true, forcedPrize: issued, score: 100, gameId: "chest", stage: 7 });
    }
  }

  // =========================================================================
  // 3. SHELL, HUB, STAGE SELECTOR, PAUSE, KEYBOARD & RESULT SCREEN
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
            '<div class="og-brand"><div class="og-brand-ic">🫒</div><div><h2>ألعاب الشجرة المباركة Pro</h2><small id="og-rank-lbl">🌱 مبتدئ المزرعة</small></div></div>' +
            '<div class="og-head-btns">' +
              '<button type="button" class="og-ic-btn" id="og-snd-btn" onclick="window.ZaitGamesV96.toggleSound()">🔊</button>' +
              '<button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV96.close()">✕</button>' +
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

  // Global keyboard shortcut: P or Escape pauses active game
  window.addEventListener("keydown", function (e) {
    if (!isOpen) return;
    if (currentView === "playing" && (e.key === "p" || e.key === "P" || e.key === "Escape")) {
      var h = document.getElementById("og-stage-host");
      if (h) togglePause(h);
    }
  });

  function renderHud() {
    var hud = document.getElementById("og-hud-bar");
    var rk = document.getElementById("og-rank-lbl");
    if (!hud) return;
    if (rk) rk.textContent = getRank(pState.totalScore) + " • " + pState.totalScore + " نقطة";
    var pts = (window.userProfile && Number(window.userProfile.loyaltyPoints)) || pState.totalScore;
    var st = getStreakInfo();
    hud.innerHTML =
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.backToHub()">⭐ نقاطك<strong>' + pts + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.openCoupons()">🎟️ كوبوناتي<strong>' + getActiveCoupons().length + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.openLeaderboard()">🏆 المتصدرين<strong>🔥 ' + st.count + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.backToHub()">🎁 جوائز اليوم<strong>' + pState.dailyPrizesWon + '/' + cfg.dailyPrizeCap + '</strong></div>';
  }

  function stopActive() {
    gamePaused = false;
    if (typeof activeCleanup === "function") { try { activeCleanup(); } catch (e) {} activeCleanup = null; }
  }

  function renderHub() {
    stopActive();
    currentView = "hub";
    renderHud();
    var body = document.getElementById("og-body");
    if (!body) return;
    var html = "";

    // 7-Day Streak Ladder
    if (cfg.dailyStreak && cfg.dailyStreak.enabled) {
      var st = getStreakInfo(), days = cfg.dailyStreak.days || [5, 10, 15, 20, 25, 30];
      var boxes = "";
      for (var i = 0; i < 7; i++) {
        var isChest = i === 6;
        var done = st.claimed ? (i <= st.dayIdx) : (i < st.dayIdx);
        var isTd = !st.claimed && i === st.dayIdx;
        boxes += '<div class="og-day-box' + (isChest ? " big-chest" : "") + (done ? " claimed" : "") + (isTd ? " today" : "") + '" ' + (isTd ? 'onclick="window.ZaitGamesV96.claimStreak()"' : '') + '>' +
          '<div class="og-day-num">يوم ' + (i + 1) + '</div><div class="og-day-ic">' + (done ? "✅" : (isChest ? "🎁" : "⭐")) + '</div><div class="og-day-val">' + (isChest ? "الصندوق!" : ("+" + days[i] + " ن")) + '</div></div>';
      }
      html += '<div class="og-card"><div class="og-streak-head"><div><strong style="font-size:.9rem;">🔥 هدايا الدخول اليومي (سلسلة 7 أيام + الصندوق الكبير)</strong><div style="font-size:.73rem;opacity:.8;">تعمل على الموبايل والكمبيوتر والتابلت — كل يوم نقاط أكثر حتى الصندوق الذهبي!</div></div>' +
        (!st.claimed ? '<button type="button" class="og-btn og-btn-gold" style="padding:7px 12px;font-size:.78rem;" onclick="window.ZaitGamesV96.claimStreak()">🎁 استلم يوم ' + (st.dayIdx + 1) + '</button>' : '<span style="font-size:.76rem;font-weight:900;color:#16a34a;">✅ تم الاستلام اليوم</span>') +
        '</div><div class="og-streak-grid">' + boxes + '</div></div>';
    }

    // Tabs
    var cats = [{ id: "all", l: "🎮 كل الألعاب" }, { id: "speed", l: "⚡ حركة وتحدي" }, { id: "brain", l: "🧠 ذكاء ومراحل" }, { id: "luck", l: "🪙 حظ يومي" }];
    html += '<div class="og-tabs">' + cats.map(function (c) {
      return '<button type="button" class="og-tab ' + (currentCat === c.id ? "active" : "") + '" onclick="window.ZaitGamesV96.setCat(\'' + c.id + '\')">' + c.l + '</button>';
    }).join("") + '</div>';

    // Games Grid
    var list = getAllGamesMeta().filter(function (g) {
      if (getGameCfg(g.id).enabled === false) return false;
      return currentCat === "all" || g.cat === currentCat;
    });
    html += '<div class="og-games-grid">' + list.map(function (g) {
      var unl = getUnlocked(g.id);
      return '<div class="og-game-tile" onclick="window.ZaitGamesV96.openGame(\'' + g.id + '\')">' +
        '<span class="og-game-badge ' + (g.cat === "luck" ? "luck" : "stage") + '">' + esc(g.tag) + '</span>' +
        '<div class="og-game-ic">' + g.icon + '</div>' +
        '<div><div class="og-game-name">' + esc(g.name) + '</div><div class="og-game-desc">' + esc(g.desc) + '</div></div>' +
        '<div><div class="og-game-meta"><span>' + (g.id === "scratch" ? "خارج حد اليوم" : ("🏁 واصل للدور " + unl)) + '</span></div>' +
        '<button type="button" class="og-play-pill" style="margin-top:5px;">▶ العب الدور ' + (g.id === "scratch" ? "" : unl) + '</button></div>' +
      '</div>';
    }).join("") + '</div>';

    body.innerHTML = html;
  }

  function openStageSelector(gid) {
    stopActive();
    activeGameId = gid;
    if (gid === "scratch") { launchStage("scratch", 1); return; }
    currentView = "stages";
    var meta = getAllGamesMeta().find(function (m) { return m.id === gid; }) || { name: gid, icon: "🎮", desc: "" };
    var gc = getGameCfg(gid);
    var maxSt = Math.max(5, Math.min(20, Number(gc.maxStages || 10)));
    var unl = Math.min(maxSt, getUnlocked(gid));

    var btns = "";
    for (var s = 1; s <= maxSt; s++) {
      var isLocked = s > unl;
      var isCur = s === unl;
      btns += '<button type="button" class="og-stage-btn ' + (isCur ? "current" : (isLocked ? "locked" : "")) + '" ' + (isLocked ? "disabled" : ('onclick="window.ZaitGamesV96.startStage(\'' + gid + '\',' + s + ')"')) + '>' +
        '<div style="font-size:1.25rem;">' + (isLocked ? "🔒" : (isCur ? "🔥" : "✅")) + '</div>' +
        '<div style="font-size:.82rem;font-weight:900;">الدور ' + s + '</div>' +
      '</button>';
    }

    document.getElementById("og-body").innerHTML =
      '<div class="og-card og-arena-wrap">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<strong style="font-size:1.05rem;">' + meta.icon + ' ' + esc(meta.name) + '</strong>' +
          '<button type="button" class="og-btn og-btn-ghost" style="padding:6px 12px;font-size:.78rem;" onclick="window.ZaitGamesV96.backToHub()">← خروج</button>' +
        '</div>' +
        '<p style="font-size:.82rem;opacity:.85;margin:0 0 10px;">' + esc(meta.desc) + ' — كل دور له تصميم مختلف وصعوبة أعلى تدريجياً:</p>' +
        '<button type="button" class="og-btn og-btn-gold" style="width:100%;margin-bottom:10px;padding:13px;" onclick="window.ZaitGamesV96.startStage(\'' + gid + '\',' + unl + ')">🚀 ابدأ الدور ' + unl + ' الآن</button>' +
        '<div class="og-stages-grid">' + btns + '</div>' +
      '</div>';
  }

  function createStageShell(title, stageNum, durationSec, goalText, kbHint) {
    var body = document.getElementById("og-body");
    body.innerHTML =
      '<div class="og-arena-wrap">' +
        '<div class="og-stage-bar">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
            '<span class="og-stat-chip" style="background:rgba(244,207,109,.25);color:#fde68a;">🏁 الدور ' + stageNum + '</span>' +
            '<span class="og-stat-chip" id="og-st-goal">🎯 ' + esc(goalText) + '</span>' +
            '<span class="og-stat-chip" id="og-st-extra"></span>' +
          '</div>' +
          '<div style="display:flex;gap:6px;align-items:center;">' +
            '<span class="og-stat-chip" id="og-st-time">⏱️ ' + durationSec + 'ث</span>' +
            '<button type="button" class="og-ic-btn" id="og-pause-btn" title="إيقاف مؤقت (P)">⏸️</button>' +
            '<button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV96.openGame(\'' + esc(activeGameId) + '\')">✕</button>' +
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
    var steps = ["3", "2", "1", "انطلق! 🫒"];
    var idx = 0;
    (function next() {
      if (!ov.parentNode) return;
      if (idx >= steps.length) { ov.remove(); onGo(); return; }
      ov.innerHTML = '<div style="font-size:.9rem;font-weight:800;color:#bbf7d0;">' + esc(label || "") + '</div><div class="og-cd-num">' + steps[idx] + '</div>';
      playSfx(idx === 3 ? "gold" : "tick");
      idx++;
      setTimeout(next, idx === 4 ? 380 : 520);
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
      ov.innerHTML = '<div style="font-size:2.4rem;">⏸️</div><h3 style="margin:0;color:#fde68a;">اللعبة متوقفة مؤقتاً</h3><div style="display:flex;gap:8px;"><button type="button" class="og-btn og-btn-gold" id="og-res-btn">▶ استكمال</button><button type="button" class="og-btn og-btn-ghost" onclick="window.ZaitGamesV96.backToHub()">🚪 خروج</button></div>';
      host.appendChild(ov);
      ov.querySelector("#og-res-btn").onclick = function () { togglePause(host); };
    } else if (old) old.remove();
  }

  async function showResultScreen(opts) {
    stopActive();
    currentView = "result";
    var won = !!opts.won, gid = opts.gameId || activeGameId, stNum = Number(opts.stage || activeStage || 1);
    var gc = getGameCfg(gid);
    var maxSt = Math.max(5, Number(gc.maxStages || 10));
    var nextStage = Math.min(maxSt, stNum + 1);

    var prize = opts.forcedPrize || null;
    var capHit = false;
    if (won && !opts.isChest && !opts.isScratch) {
      if (stNum >= getUnlocked(gid) && stNum < maxSt) {
        pState.unlockedStage[gid] = stNum + 1;
      }
      pState.totalScore += 25 + stNum * 10;
      if (pState.dailyPrizesWon < Number(cfg.dailyPrizeCap || 3)) {
        pState.dailyPrizesWon++;
        prize = await issuePrize(weightedDraw(cfg.prizePool), "إنجاز الدور " + stNum + " - " + gid);
      } else {
        capHit = true;
        await pushPlayerMetaCloud();
      }
    } else {
      saveState();
    }

    renderHud();
    playSfx(won ? "win" : "bad");
    haptic(won ? [25, 45, 70] : 50);

    var meta = getAllGamesMeta().find(function (m) { return m.id === gid; }) || { name: "اللعبة", icon: "🫒" };
    var waMsg = "🏆 أنهيت الدور " + stNum + " في لعبة (" + meta.name + ") داخل متجر زيت الشجرة المباركة!\nتقدر تتحداني وتكسب خصم فوري؟ 👇\n" + location.origin;

    var prizeHtml = "";
    if (won && prize && prize.type !== "none") {
      var isC = prize.type === "percent" || prize.type === "free_shipping";
      prizeHtml =
        '<div class="og-prize-card">' +
          '<div style="font-size:.78rem;color:#bbf7d0;font-weight:800;">🎉 مبروك هديتك العشوائية!</div>' +
          '<div style="font-size1.08rem;font-weight:900;color:#fde68a;margin:4px 0;">' + esc(prize.label) + '</div>' +
          (isC ? ('<div class="og-code-box">' + esc(prize.code) + '</div><div style="font-size:.74rem;color:#d1fae5;margin-bottom:8px;">⏳ صالح ' + cfg.couponExpiryHours + ' ساعة' + (prize.minOrder > 0 ? (" • حد أدنى " + prize.minOrder + " ج") : "") + '</div><button type="button" class="og-btn og-btn-gold" style="width:100%;" onclick="window.ZaitGamesV96.applyCouponAndShop(\'' + esc(prize.code) + '\')">🛒 تسوّق الآن بالخصم</button>') : '<div style="font-size:.82rem;color:#d1fae5;">تمت إضافة النقاط إلى رصيدك ⭐</div>') +
        '</div>';
    } else if (won && capHit) {
      prizeHtml = '<div class="og-card" style="background:rgba(245,158,11,.12);border-color:#f59e0b;font-size:.8rem;font-weight:800;">🏆 وصلت لحد جوائز اليوم (' + cfg.dailyPrizeCap + '/' + cfg.dailyPrizeCap + ') — أكمل فتح الأدوار الأصعب وصدارة الأسبوع!</div>';
    } else if (won && prize && prize.type === "none") {
      prizeHtml = '<div class="og-card" style="font-weight:900;">' + esc(prize.label) + '</div>';
    }

    document.getElementById("og-body").innerHTML =
      '<div class="og-card og-result-box og-arena-wrap">' +
        (won ? '<canvas id="og-confetti-cv"></canvas>' : '') +
        '<div style="position:relative;z-index:3;">' +
          '<div style="font-size:3.2rem;">' + (won ? "🏆🎉" : "😅⏱️") + '</div>' +
          '<h2 style="margin:6px 0;font-weight:900;color:' + (won ? "#15803d" : "#dc2626") + ';">' + (opts.isChest ? "فتحت الصندوق الذهبي الكبير!" : (won ? ("أنهيت الدور " + stNum + " بنجاح!") : (opts.loseReason || "انتهت المحاولة في الدور " + stNum))) + '</h2>' +
          (opts.summary ? '<div style="font-size:.84rem;font-weight:800;margin-bottom:6px;">' + esc(opts.summary) + '</div>' : '') +
          prizeHtml +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;">' +
            (won && !opts.isChest && !opts.isScratch && stNum < maxSt
              ? '<button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV96.startStage(\'' + gid + '\',' + nextStage + ')">🚀 الدور التالي (الدور ' + nextStage + ')</button>'
              : (!opts.isChest ? '<button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV96.startStage(\'' + gid + '\',' + stNum + ')">🔄 إعادة الدور ' + stNum + '</button>' : '')) +
            (!opts.isChest && !opts.isScratch ? '<button type="button" class="og-btn og-btn-dark" onclick="window.ZaitGamesV96.openGame(\'' + gid + '\')">🗺️ اختيار الدور</button>' : '') +
            '<button type="button" class="og-btn og-btn-ghost" onclick="window.ZaitGamesV96.backToHub()">🚪 خروج</button>' +
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
    stopActive();
    currentView = "playing";
    activeGameId = gid;
    activeStage = Math.max(1, Number(stageNum || 1));
    analytics.plays = analytics.plays || {};
    analytics.plays[gid] = Number(analytics.plays[gid] || 0) + 1;
    saveJson(ROI_KEY, analytics);

    var gc = getGameCfg(gid);
    var baseTime = Number(gc.baseTime || 30);

    // Delegate to Part 2 Extra Games Registry!
    if (window.ZaitGamesExtraRegistry && window.ZaitGamesExtraRegistry[gid] && typeof window.ZaitGamesExtraRegistry[gid].launch === "function") {
      window.ZaitGamesExtraRegistry[gid].launch({
        stage: activeStage,
        baseTime: baseTime,
        OliveArt: window.OliveArt,
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

    if (gid === "catch") return playOliveCatchStage(activeStage, baseTime);
    if (gid === "press") return playColdPressStage(activeStage, baseTime);
    if (gid === "truck") return playSinaiTruckStage(activeStage, baseTime);
    if (gid === "sorter") return playOliveSorterStage(activeStage, baseTime);
    if (gid === "memory") return playFarmMemoryStage(activeStage, baseTime);
    if (gid === "quiz") return playOliveQuizStage(activeStage, baseTime);
    if (gid === "scratch") return playScratchStage();
  }

  // =========================================================================
  // CORE GAME 1: 🧺 قطف الزيتون السيناوي (REAL ILLUSTRATED OLIVES + STAGES!)
  // =========================================================================
  function playOliveCatchStage(stage, baseTime) {
    var quota = 12 + stage * 5; // Win by harvesting required real olives!
    var duration = Math.max(20, baseTime + Math.min(8, stage));
    var lives = stage >= 5 ? 2 : 3;
    var st = createStageShell("قطف الزيتون", stage, duration, "اقطف 0/" + quota + " زيتونة", "💻 بالكمبيوتر: الماوس أو الأسهم (⬅️ ➡️) • 📱 بالموبايل: اسحب السلة بإصبعك");
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-catch"></canvas></div>';

    var cv = document.getElementById("og-cv-catch");
    var g = setupHiDpiCanvas(cv, 380, 420);
    var ctx = g.ctx, W = g.w, H = g.h;
    var bx = W / 2, bw = Math.max(58, 86 - stage * 3), keys = { l: false, r: false };
    var picked = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, acc = 0;
    var items = [];
    var fallSpeed = 145 + stage * 24;
    var spawnMs = Math.max(250, 560 - stage * 38);
    var hazardRate = Math.min(0.38, 0.16 + stage * 0.03);
    var wind = (stage - 1) * 24;

    function movePtr(ev) {
      var rect = cv.getBoundingClientRect();
      var cx = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
      bx = Math.max(bw / 2, Math.min(W - bw / 2, ((cx - rect.left) / rect.width) * W));
    }
    var onKD = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = true; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = true; };
    var onKU = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = false; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = false; };
    cv.addEventListener("pointermove", movePtr);
    cv.addEventListener("pointerdown", movePtr);
    cv.addEventListener("touchmove", movePtr, { passive: true });
    window.addEventListener("keydown", onKD);
    window.addEventListener("keyup", onKU);

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.045, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      if (keys.l) bx = Math.max(bw / 2, bx - 310 * dt);
      if (keys.r) bx = Math.min(W - bw / 2, bx + 310 * dt);

      rem -= dt;
      st.setTime(rem, duration);
      if (rem <= 0) {
        ended = true;
        showResultScreen({ won: false, gameId: "catch", stage: stage, loseReason: "انتهى الوقت! قطفت " + picked + " من " + quota + " زيتونة" });
        return;
      }

      acc += dt * 1000;
      if (acc >= spawnMs) {
        acc = 0;
        var r = Math.random();
        var kind = r < hazardRate * 0.55 ? "bomb" : (r < hazardRate ? "stone" : (r < hazardRate + 0.14 ? "rotten" : (r > 0.85 ? "gold" : (r > 0.65 ? "black" : "green"))));
        items.push({ x: 24 + Math.random() * (W - 48), y: -20, vy: fallSpeed + Math.random() * 85, vx: (Math.random() - 0.5) * wind, kind: kind });
      }

      window.OliveArt.drawTreeCanopy(ctx, W, H, stage - 1);

      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.y += it.vy * dt; it.x += it.vx * dt;
        if (it.x < 18 || it.x > W - 18) it.vx *= -1;

        if (it.kind === "stone" || it.kind === "bomb") window.OliveArt.drawHazard(ctx, it.x, it.y, 13, it.kind);
        else window.OliveArt.drawOlive(ctx, it.x, it.y, it.kind === "gold" ? 15 : 13, it.kind);

        if (it.y >= H - 56 && it.y <= H - 14 && Math.abs(it.x - bx) <= bw / 2 + 10) {
          if (it.kind === "bomb" || it.kind === "stone") {
            lives--;
            st.setExtra("❤️".repeat(Math.max(0, lives)));
            playSfx("bad"); haptic(50); st.shake();
            if (lives <= 0) {
              ended = true;
              showResultScreen({ won: false, gameId: "catch", stage: stage, loseReason: "💥 اصطدمت السلة بالأحجار والقنابل!" });
              return;
            }
          } else if (it.kind === "rotten") {
            picked = Math.max(0, picked - 2);
            playSfx("bad"); st.shake();
          } else {
            picked += it.kind === "gold" ? 3 : 1;
            playSfx(it.kind === "gold" ? "gold" : "pop"); haptic(12);
          }
          st.setGoal("🫒 " + picked + "/" + quota);
          items.splice(i, 1);
          if (picked >= quota) {
            ended = true;
            showResultScreen({ won: true, gameId: "catch", stage: stage, summary: "قطفت محصول الدور " + stage + " بنجاح (" + picked + " ثمرة سيناوية)!" });
            return;
          }
        } else if (it.y > H + 25) items.splice(i, 1);
      }

      window.OliveArt.drawBasket(ctx, bx, H - 46, bw, 32);
    }

    activeCleanup = function () {
      ended = true; if (raf) cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", movePtr); cv.removeEventListener("pointerdown", movePtr); cv.removeEventListener("touchmove", movePtr);
      window.removeEventListener("keydown", onKD); window.removeEventListener("keyup", onKU);
    };
    runCountdown(st.host, "الدور " + stage + " — اقطف " + quota + " ثمرة زيتون سيناوي!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // CORE GAME 2: ❄️ معصرة العصر عالبارد (BOTTLE STAGES: 500ml -> 1L -> 2L -> 5L!)
  // =========================================================================
  function playColdPressStage(stage, baseTime) {
    var bottleNames = ["عبوة 500 مل", "زجاجة 1 لتر بكر", "جركن 2 لتر سيناوي", "جركن 3 لتر عائلي", "جركن 5 لتر ملكي", "برميل معصرة 10 لتر"];
    var bName = bottleNames[(stage - 1) % bottleNames.length];
    var targetFill = 90 + stage * 22;
    var duration = Math.max(16, baseTime - Math.floor(stage / 2));
    var st = createStageShell("العصر عالبارد", stage, duration, bName, "💻 بالكمبيوتر: اضغط المسطرة (Space) أو بالماوس • 📱 بالموبايل: اضغط زر العصر");
    st.setExtra("🌡️ 18.0°م");
    st.host.innerHTML =
      '<div class="og-canvas-wrap"><canvas id="og-cv-press"></canvas></div>' +
      '<button type="button" id="og-press-tap" class="og-btn og-btn-gold" style="width:100%;margin-top:8px;padding:14px;font-size:1rem;">🫒 اعصر الزيتون على البارد (Space / ضغط)</button>';

    var cv = document.getElementById("og-cv-press");
    var g = setupHiDpiCanvas(cv, 380, 260);
    var ctx = g.ctx, W = g.w, H = g.h;
    var fill = 0, temp = 18, lockUntil = 0, rem = duration, running = false, ended = false, drops = [];
    var heatGain = 1.45 + stage * 0.22;
    var coolRate = Math.max(5.0, 7.6 - stage * 0.28);
    var fillGain = Math.max(2.0, 3.2 - stage * 0.12);

    function pressAction() {
      if (!running || gamePaused || ended) return;
      if (Date.now() < lockUntil) { playSfx("bad"); return; }
      temp += heatGain;
      var sweet = (temp >= 22 && temp <= 26.2) ? 1.35 : 1;
      fill = Math.min(targetFill, fill + fillGain * sweet);
      drops.push({ x: W * 0.42 + (Math.random() - 0.5) * 14, y: 46, vy: 180 });
      playSfx(sweet > 1 ? "gold" : "pop"); haptic(10);
      if (temp > 27) {
        lockUntil = Date.now() + 1400 + stage * 140;
        fill = Math.max(0, fill - (8 + stage * 2));
        playSfx("bad"); haptic(50); st.shake();
      }
      if (fill >= targetFill) {
        ended = true; clearInterval(iv);
        showResultScreen({ won: true, gameId: "press", stage: stage, summary: "تمت تعبئة (" + bName + ") بنسبة 100% على البارد! ❄️🫒" });
      }
    }

    document.getElementById("og-press-tap").onclick = pressAction;
    var onKey = function (e) { if (e.code === "Space") { e.preventDefault(); pressAction(); } };
    window.addEventListener("keydown", onKey);

    function drawPress() {
      ctx.fillStyle = "#0a2114"; ctx.fillRect(0, 0, W, H);
      // Olive hopper above bottle
      ctx.fillStyle = "#334155"; ctx.fillRect(W * 0.3, 8, W * 0.24, 34);
      window.OliveArt.drawOlive(ctx, W * 0.37, 22, 10, "green");
      window.OliveArt.drawOlive(ctx, W * 0.46, 22, 10, "gold");
      // Falling oil drops
      drops.forEach(function (d) {
        ctx.fillStyle = "#facc15";
        ctx.beginPath(); ctx.arc(d.x, d.y, 4.5, 0, Math.PI * 2); ctx.fill();
      });
      // Illustrated olive oil bottle
      window.OliveArt.drawBottle(ctx, W * 0.42, 155, 86, 155, fill / targetFill);
      // Thermometer bar on right
      var tx = W * 0.78, ty = 42, th = 175;
      ctx.fillStyle = "#1e293b"; ctx.fillRect(tx - 12, ty, 24, th);
      var tRatio = Math.max(0.05, Math.min(1, (temp - 15) / 16));
      ctx.fillStyle = temp >= 25.5 ? "#ef4444" : (temp >= 22 ? "#f59e0b" : "#22c55e");
      ctx.fillRect(tx - 10, ty + th * (1 - tRatio), 20, th * tRatio);
      // 27°C red danger line
      var lineY = ty + th * (1 - (27 - 15) / 16);
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(tx - 20, lineY); ctx.lineTo(tx + 20, lineY); ctx.stroke();
      ctx.fillStyle = "#fde68a"; ctx.font = "900 12px Cairo,sans-serif"; ctx.textAlign = "center";
      ctx.fillText("27°م حد أقصى", tx, lineY - 6);
      ctx.fillStyle = "#fff"; ctx.fillText(Math.round((fill / targetFill) * 100) + "%", W * 0.42, 248);
    }

    var iv = setInterval(function () {
      if (!running || gamePaused || ended) return;
      rem -= 0.05;
      temp = Math.max(17.5, temp - coolRate * 0.05);
      for (var i = drops.length - 1; i >= 0; i--) { drops[i].y += drops[i].vy * 0.05; if (drops[i].y > 140) drops.splice(i, 1); }
      st.setTime(rem, duration);
      st.setExtra("🌡️ " + temp.toFixed(1) + "°م");
      drawPress();
      if (rem <= 0) {
        ended = true; clearInterval(iv);
        showResultScreen({ won: false, gameId: "press", stage: stage, loseReason: "انتهى الوقت عند " + Math.round((fill / targetFill) * 100) + "% من تعبئة " + bName });
      }
    }, 50);

    drawPress();
    activeCleanup = function () { ended = true; clearInterval(iv); window.removeEventListener("keydown", onKey); };
    runCountdown(st.host, "الدور " + stage + " — تعبئة " + bName, function () { running = true; });
  }

  // =========================================================================
  // CORE GAME 3: 🚚 رحلة توصيل زيت سيناء (REACH CITY DESTINATION PER STAGE!)
  // =========================================================================
  function playSinaiTruckStage(stage, baseTime) {
    var cities = ["العريش", "الإسماعيلية", "الزقازيق", "القاهرة", "الجيزة", "الإسكندرية", "المنصورة", "أسيوط", "الأقصر", "أسوان"];
    var dest = cities[(stage - 1) % cities.length];
    var distGoal = 100 + stage * 35; // KM distance to reach city!
    var lives = stage >= 5 ? 2 : 3;
    var st = createStageShell("شاحنة سيناء", stage, baseTime, "الوجهة: " + dest, "💻 الأسهم ⬅️ ➡️ أو A/D • 📱 اللمس أو الأزرار بالأسفل");
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML =
      '<div class="og-canvas-wrap"><canvas id="og-cv-truck"></canvas></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">' +
        '<button type="button" class="og-btn og-btn-dark" id="og-tr-r">➡️ يمين</button>' +
        '<button type="button" class="og-btn og-btn-dark" id="og-tr-l">⬅️ يسار</button>' +
      '</div>';

    var cv = document.getElementById("og-cv-truck");
    var g = setupHiDpiCanvas(cv, 360, 400);
    var ctx = g.ctx, W = g.w, H = g.h;
    var lanes = [W * 0.22, W * 0.5, W * 0.78];
    var lane = 1, distDone = 0, running = false, ended = false, raf = null, lastTs = 0, acc = 0, dashY = 0;
    var objs = [];
    var spd = 205 + stage * 26;
    var spawnMs = Math.max(330, 680 - stage * 42);
    var obsRate = Math.min(0.66, 0.42 + stage * 0.03);

    function mv(d) { if (!running || gamePaused) return; lane = Math.max(0, Math.min(2, lane + d)); haptic(8); }
    document.getElementById("og-tr-l").onclick = function () { mv(-1); };
    document.getElementById("og-tr-r").onclick = function () { mv(1); };
    var onKey = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") mv(-1); if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") mv(1); };
    window.addEventListener("keydown", onKey);
    var tx0 = 0;
    cv.addEventListener("pointerdown", function (e) { tx0 = e.clientX; });
    cv.addEventListener("pointerup", function (e) {
      var dx = e.clientX - tx0;
      if (Math.abs(dx) > 20) mv(dx > 0 ? 1 : -1);
      else { var r = cv.getBoundingClientRect(); var rel = (e.clientX - r.left) / r.width; lane = rel < 0.33 ? 0 : (rel > 0.66 ? 2 : 1); }
    });

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.045, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;

      distDone += (6.5 + stage * 0.5) * dt;
      var pct = Math.min(100, Math.round((distDone / distGoal) * 100));
      st.setGoal("📍 " + dest + " (" + pct + "%)");
      st.setTime(Math.max(0, distGoal - distDone), distGoal);

      if (distDone >= distGoal) {
        ended = true;
        showResultScreen({ won: true, gameId: "truck", stage: stage, summary: "وصلت شحنة زيت الشجرة المباركة إلى " + dest + " بسلام! 🚚🫒" });
        return;
      }

      acc += dt * 1000;
      if (acc >= spawnMs) {
        acc = 0;
        var ln = Math.floor(Math.random() * 3);
        objs.push({ lane: ln, y: -28, rock: Math.random() < obsRate });
      }

      // Sinai desert & highway
      ctx.fillStyle = stage % 2 === 0 ? "#855834" : "#a17242"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1f2937"; ctx.fillRect(W * 0.08, 0, W * 0.84, H);
      ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 3; ctx.setLineDash([18, 16]);
      dashY = (dashY + spd * dt) % 34; ctx.lineDashOffset = -dashY;
      ctx.beginPath(); ctx.moveTo(W * 0.36, 0); ctx.lineTo(W * 0.36, H); ctx.moveTo(W * 0.64, 0); ctx.lineTo(W * 0.64, H); ctx.stroke(); ctx.setLineDash([]);

      for (var i = objs.length - 1; i >= 0; i--) {
        var o = objs[i];
        o.y += spd * dt;
        var ox = lanes[o.lane];
        if (o.rock) window.OliveArt.drawHazard(ctx, ox, o.y, 16, "stone");
        else window.OliveArt.drawBottle(ctx, ox, o.y, 24, 38, 0.9);

        if (o.lane === lane && Math.abs(o.y - (H - 64)) < 34) {
          if (o.rock) {
            lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
            playSfx("bad"); haptic(50); st.shake();
            if (lives <= 0) {
              ended = true;
              showResultScreen({ won: false, gameId: "truck", stage: stage, loseReason: "🚧 تعطلت الشاحنة قبل الوصول إلى " + dest + "!" });
              return;
            }
          } else {
            distDone += 8; playSfx("gold"); haptic(12);
          }
          objs.splice(i, 1);
        } else if (o.y > H + 35) objs.splice(i, 1);
      }

      window.OliveArt.drawTruck(ctx, lanes[lane], H - 64);
    }

    activeCleanup = function () { ended = true; if (raf) cancelAnimationFrame(raf); window.removeEventListener("keydown", onKey); };
    runCountdown(st.host, "الدور " + stage + " — طريق التوصيل إلى " + dest, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // CORE GAME 4: 🎯 سير فرز المعصرة (REAL OLIVES vs ROTTEN/STONES PER BATCH!)
  // =========================================================================
  function playOliveSorterStage(stage, baseTime) {
    var batchNeed = 14 + stage * 5;
    var duration = Math.max(18, baseTime);
    var lives = stage >= 5 ? 2 : 3;
    var st = createStageShell("فرز المعصرة", stage, duration, "فرز 0/" + batchNeed, "اضغط بالماوس أو اللمس على ثمار الزيتون الخضراء والذهبية فقط!");
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-sort"></canvas></div>';

    var cv = document.getElementById("og-cv-sort");
    var g = setupHiDpiCanvas(cv, 380, 360);
    var ctx = g.ctx, W = g.w, H = g.h;
    var items = [], done = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, acc = 0;
    var spd = 125 + stage * 24, spawnMs = Math.max(290, 620 - stage * 42);

    function clickBelt(e) {
      if (!running || gamePaused || ended) return;
      var r = cv.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        if (Math.hypot(it.x - x, it.y - y) <= 28) {
          if (it.kind === "green" || it.kind === "gold") {
            done += it.kind === "gold" ? 2 : 1;
            st.setGoal("🫒 " + done + "/" + batchNeed);
            playSfx(it.kind === "gold" ? "gold" : "pop"); haptic(12);
          } else {
            lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
            playSfx("bad"); haptic(45); st.shake();
            if (lives <= 0) { ended = true; showResultScreen({ won: false, gameId: "sorter", stage: stage, loseReason: "اخترت حبات تالفة أو أحجار!" }); return; }
          }
          items.splice(i, 1);
          if (done >= batchNeed) { ended = true; showResultScreen({ won: true, gameId: "sorter", stage: stage, summary: "أنهيت فرز الدفعة رقم " + stage + " بنقاء 100%! 🫒" }); }
          break;
        }
      }
    }
    cv.addEventListener("pointerdown", clickBelt);

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.045, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts; rem -= dt; st.setTime(rem, duration);
      if (rem <= 0) { ended = true; showResultScreen({ won: false, gameId: "sorter", stage: stage, loseReason: "انتهى الوقت عند " + done + "/" + batchNeed }); return; }

      acc += dt * 1000;
      if (acc >= spawnMs) {
        acc = 0;
        var row = Math.floor(Math.random() * 3);
        var r = Math.random();
        var k = r < 0.22 ? "stone" : (r < 0.42 ? "rotten" : (r > 0.84 ? "gold" : "green"));
        items.push({ x: -24, y: 74 + row * 102, kind: k });
      }

      ctx.fillStyle = "#0a1f13"; ctx.fillRect(0, 0, W, H);
      for (var b = 0; b < 3; b++) { ctx.fillStyle = "#193b27"; ctx.fillRect(0, 42 + b * 102, W, 64); }
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i]; it.x += spd * dt;
        if (it.kind === "stone") window.OliveArt.drawHazard(ctx, it.x, it.y, 15, "stone");
        else window.OliveArt.drawOlive(ctx, it.x, it.y, 16, it.kind);
        if (it.x > W + 30) items.splice(i, 1);
      }
    }

    activeCleanup = function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", clickBelt); };
    runCountdown(st.host, "الدور " + stage + " — افرز " + batchNeed + " ثمرة صالحة!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // CORE GAME 5: 🌿 ذاكرة المزرعة (ESCALATING PAIRS & LAYOUTS PER STAGE!)
  // =========================================================================
  function playFarmMemoryStage(stage, baseTime) {
    var pairs = Math.min(12, 3 + stage); // Stage 1=4 pairs (8 cards), Stage 2=5 (10), Stage 3=6 (12)...
    var duration = Math.max(16, baseTime + pairs * 2 - stage * 2);
    var syms = ["🫒", "🏺", "🌿", "🌳", "🧴", "💧", "🌞", "🏜️", "🥗", "🍯", "✨", "🏆"];
    var st = createStageShell("ذاكرة المزرعة", stage, duration, "0/" + pairs + " أزواج", "طابق كل الأزواج قبل انتهاء الوقت لفتح الدور التالي!");
    var deck = [];
    for (var i = 0; i < pairs; i++) deck.push(syms[i], syms[i]);
    for (var k = deck.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)); var t = deck[k]; deck[k] = deck[r]; deck[r] = t; }
    var cols = pairs >= 10 ? 5 : 4;

    st.host.innerHTML = '<div class="og-card"><div class="og-mem-grid" style="grid-template-columns:repeat(' + cols + ',1fr);">' +
      deck.map(function (s, idx) { return '<button type="button" class="og-mem-card" data-s="' + s + '" data-i="' + idx + '">🫒</button>'; }).join("") +
      '</div></div>';

    var open = [], matched = 0, lock = false, rem = duration, ended = false;
    st.host.querySelectorAll(".og-mem-card").forEach(function (c) {
      c.onclick = function () {
        if (lock || gamePaused || ended || c.classList.contains("open") || c.classList.contains("matched")) return;
        c.classList.add("open"); c.textContent = c.getAttribute("data-s"); playSfx("pop");
        open.push(c);
        if (open.length === 2) {
          lock = true;
          if (open[0].getAttribute("data-s") === open[1].getAttribute("data-s")) {
            open[0].classList.add("matched"); open[1].classList.add("matched");
            matched++; st.setGoal("🌿 " + matched + "/" + pairs); playSfx("gold"); haptic(14);
            open = []; lock = false;
            if (matched >= pairs) { ended = true; clearInterval(iv); showResultScreen({ won: true, gameId: "memory", stage: stage, summary: "أتممت مطابقة " + (pairs * 2) + " كارت في الدور " + stage + "!" }); }
          } else {
            setTimeout(function () { open[0].classList.remove("open"); open[1].classList.remove("open"); open[0].textContent = "🫒"; open[1].textContent = "🫒"; open = []; lock = false; }, Math.max(340, 560 - stage * 22));
          }
        }
      };
    });

    var iv = setInterval(function () {
      if (ended || gamePaused) return;
      rem -= 0.1; st.setTime(rem, duration);
      if (rem <= 0) { ended = true; clearInterval(iv); showResultScreen({ won: false, gameId: "memory", stage: stage, loseReason: "انتهى الوقت وتطابق " + matched + " من " + pairs + " أزواج!" }); }
    }, 100);
    activeCleanup = function () { ended = true; clearInterval(iv); };
  }

  // =========================================================================
  // CORE GAME 6: 🧠 خبير زيت الزيتون (+10,800 QUESTIONS + KEYBOARD 1-4!)
  // =========================================================================
  function playOliveQuizStage(stage, baseSec) {
    var diff = stage <= 2 ? "easy" : (stage <= 5 ? "medium" : "hard");
    var totalQ = Math.max(4, Number(cfg.quizQuestionCount || 7));
    var need = Math.min(totalQ, Math.ceil(totalQ * (stage >= 4 ? 0.85 : 0.72)));
    var secQ = Math.max(6, baseSec - Math.floor(stage / 2));
    var qs = (window.ZAIT_QUIZ_BANK && typeof window.ZAIT_QUIZ_BANK.getRound === "function")
      ? window.ZAIT_QUIZ_BANK.getRound(diff, totalQ, pState.seenQuizIds || [])
      : [
          { q: "ما الحد الأقصى لدرجة حرارة العصر على البارد؟", options: ["27 درجة مئوية", "55 درجة", "80 درجة", "100 درجة"], ans: 0 },
          { q: "ما الحد الأقصى لحموضة زيت الزيتون البكر الممتاز؟", options: ["0.8%", "2.5%", "4%", "6%"], ans: 0 },
          { q: "ما أفضل طريقة لحفظ زيت الزيتون البكر؟", options: ["زجاجة داكنة بعيداً عن الضوء والحرارة", "في الشمس", "مكشوف للهواء", "بجانب الفرن"], ans: 0 },
          { q: "أين تشتهر أجود مزارع الزيتون السيناوي؟", options: ["شمال سيناء وسيوة", "وسط القاهرة", "أسوان فقط", "الإسكندرية فقط"], ans: 0 }
        ];
    var st = createStageShell("خبير الزيتون", stage, secQ, "المطلوب " + need + "/" + qs.length, "💻 يمكنك الإجابة بأرقام الكيبورد (1 - 2 - 3 - 4) أو بالماوس واللمس");
    var qi = 0, ok = 0, rem = secQ, locked = false, ended = false;

    function pickOpt(idx) {
      if (locked || ended || gamePaused) return;
      locked = true;
      var q = qs[qi], ans = typeof q.ans === "number" ? q.ans : Number(q.a || 0);
      var btns = st.host.querySelectorAll(".og-quiz-opt");
      if (idx === ans) { ok++; if (btns[idx]) btns[idx].classList.add("correct"); playSfx("gold"); haptic(14); }
      else { if (btns[idx]) btns[idx].classList.add("wrong"); if (btns[ans]) btns[ans].classList.add("correct"); playSfx("bad"); st.shake(); }
      st.setGoal("✅ " + ok + "/" + need);
      setTimeout(function () { if (!ended) { qi++; renderQ(); } }, 720);
    }

    function renderQ() {
      if (qi >= qs.length) {
        ended = true; clearInterval(iv);
        showResultScreen({ won: ok >= need, gameId: "quiz", stage: stage, summary: "أجبت على " + ok + " من " + qs.length + " بشكل صحيح!", loseReason: "أجبت على " + ok + " فقط (المطلوب " + need + ")" });
        return;
      }
      locked = false; rem = secQ;
      var q = qs[qi], opts = q.options || q.o || [];
      st.setExtra("سؤال " + (qi + 1) + "/" + qs.length);
      st.host.innerHTML = '<div class="og-card"><h3 style="margin:0 0 12px;font-size:.98rem;line-height:1.55;">' + esc(q.q || q.question) + '</h3>' +
        opts.map(function (op, i) { return '<button type="button" class="og-quiz-opt" data-i="' + i + '"><b>' + (i + 1) + '.</b> ' + esc(op) + '</button>'; }).join("") + '</div>';
      st.host.querySelectorAll(".og-quiz-opt").forEach(function (b) { b.onclick = function () { pickOpt(Number(b.getAttribute("data-i"))); }; });
    }

    var onKey = function (e) { if (["1", "2", "3", "4"].indexOf(e.key) > -1) pickOpt(Number(e.key) - 1); };
    window.addEventListener("keydown", onKey);
    var iv = setInterval(function () {
      if (ended || locked || gamePaused) return;
      rem -= 0.1; st.setTime(rem, secQ);
      if (rem <= 0) { locked = true; playSfx("bad"); setTimeout(function () { if (!ended) { qi++; renderQ(); } }, 450); }
    }, 100);
    activeCleanup = function () { ended = true; clearInterval(iv); window.removeEventListener("keydown", onKey); };
    renderQ();
  }

  // =========================================================================
  // CORE GAME 7: 🪙 اكشط قطرة الذهب (OUTSIDE DAILY PRIZE CAP)
  // =========================================================================
  function playScratchStage() {
    var body = document.getElementById("og-body");
    var cap = Math.max(1, Number(cfg.dailyScratchCap || 1));
    if (pState.dailyScratchesUsed >= cap) {
      body.innerHTML = '<div class="og-card og-arena-wrap" style="text-align:center;padding:24px;"><div style="font-size:3rem;">🪙</div><h3>انتهت محاولات الكشط اليوم (' + cap + '/' + cap + ')</h3><button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV96.backToHub()">🏠 رجوع للألعاب</button></div>';
      return;
    }
    var drawn = weightedDraw(cfg.scratchPrizes), done = false, strokes = 0, down = false;
    body.innerHTML =
      '<div class="og-card og-arena-wrap" style="text-align:center;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong>🪙 كارت قطرة الذهب (خارج الحد اليومي)</strong><button type="button" class="og-btn og-btn-ghost" style="padding:5px 10px;" onclick="window.ZaitGamesV96.backToHub()">✕</button></div>' +
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
      var r = cv.getBoundingClientRect();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(((e.clientX - r.left) / r.width) * 340, ((e.clientY - r.top) / r.height) * 175, 26, 0, Math.PI * 2); ctx.fill();
      if (++strokes > 22) reveal();
    }
    cv.addEventListener("pointerdown", function (e) { down = true; sc(e); });
    cv.addEventListener("pointermove", function (e) { if (down) sc(e); });
    window.addEventListener("pointerup", function () { down = false; });
    document.getElementById("og-sc-auto").onclick = function () { ctx.clearRect(0, 0, 340, 175); reveal(); };
  }

  // =========================================================================
  // 4. COUPONS, LEADERBOARD & ADMIN PANEL
  // =========================================================================
  function openCoupons() {
    stopActive(); currentView = "coupons"; renderHud();
    var list = pState.coupons || [], now = Date.now();
    document.getElementById("og-body").innerHTML =
      '<div class="og-arena-wrap"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><strong>🎟️ كوبوناتي الخاصة</strong><button type="button" class="og-btn og-btn-dark" style="padding:6px 12px;" onclick="window.ZaitGamesV96.backToHub()">← رجوع</button></div>' +
      (list.length === 0 ? '<div class="og-card" style="text-align:center;padding:24px;">لا توجد كوبونات حالياً — العب واربح الآن! 🎮</div>' : list.map(function (c) {
        var exp = c.expiresAt && c.expiresAt <= now;
        return '<div class="og-card" style="opacity:' + ((c.used || exp) ? "0.6" : "1") + ';"><div style="display:flex;justify-content:space-between;"><strong>' + esc(c.label) + '</strong><span style="font-size:.75rem;font-weight:900;color:' + ((c.used || exp) ? "#ef4444" : "#15803d") + ';">' + (c.used ? "✅ مستخدم" : (exp ? "⌛ منتهي" : "🟢 فعال")) + '</span></div><div class="og-code-box" style="text-align:center;background:#10301e;">' + esc(c.code) + '</div>' + ((!c.used && !exp) ? '<button type="button" class="og-btn og-btn-gold" style="width:100%;" onclick="window.ZaitGamesV96.applyCouponAndShop(\'' + esc(c.code) + '\')">🛒 نسخ وتطبيق الكوبون</button>' : '') + '</div>';
      }).join("")) + '</div>';
  }

  function openLeaderboard() {
    stopActive(); currentView = "lb"; renderHud();
    var lb = loadJson(LB_KEY, []);
    document.getElementById("og-body").innerHTML =
      '<div class="og-arena-wrap"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><strong>🏆 لوحة المتصدرين</strong><button type="button" class="og-btn og-btn-dark" style="padding:6px 12px;" onclick="window.ZaitGamesV96.backToHub()">← رجوع</button></div>' +
      '<div class="og-card">' + (lb.length ? lb.slice(0, 10).map(function (r, i) { return '<div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px dashed rgba(200,162,75,.25);"><strong>#' + (i + 1) + ' ' + esc(r.name) + '</strong><strong style="color:#d97706;">' + r.score + ' ⭐</strong></div>'; }).join("") : '<div style="text-align:center;padding:22px;">العب وتصدّر القائمة الآن! 🏆</div>') + '</div></div>';
  }

  var admTab = "general";
  function renderAdmin(el) {
    if (!el) return;
    window.__V96_ADMIN_HOST__ = el;
    var tabs = [{ id: "general", l: "⚙️ عام" }, { id: "streak", l: "🔥 سلسلة 7 أيام والصندوق" }, { id: "prizes", l: "🎁 الجوائز والكشط" }, { id: "games", l: "🎮 الألعاب والأدوار" }, { id: "roi", l: "📊 إحصائيات ROI" }];
    var h = '<div style="border:2px solid #d59e2a;border-radius:18px;padding:14px;margin:12px 0;background:var(--panel-bg,#fff);"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;"><strong style="font-size:.98rem;color:var(--primary,#153422);">🎮 لوحة التحكم الشاملة بمركز الألعاب V97 Pro</strong><div style="display:flex;gap:6px;"><button type="button" class="og-btn og-btn-gold" style="padding:7px 14px;font-size:.8rem;" onclick="window.ZaitGamesV96.adminSaveConfig()">💾 حفظ ونشر</button><button type="button" class="og-btn og-btn-ghost" style="padding:7px 10px;font-size:.78rem;" onclick="window.ZaitGamesV96.adminResetMyTries()">🔄 تصفير للتجربة</button></div></div>' +
      '<div class="og-adm-tabs">' + tabs.map(function (t) { return '<button type="button" class="og-adm-tab ' + (admTab === t.id ? "active" : "") + '" onclick="window.ZaitGamesV96.adminSetTab(\'' + t.id + '\')">' + t.l + '</button>'; }).join("") + '</div>';

    if (admTab === "general") {
      h += '<div class="og-adm-row"><label><input type="checkbox" id="a-en" ' + (cfg.enabled ? "checked" : "") + '> تفعيل الألعاب</label><label><input type="checkbox" id="a-fl" ' + (cfg.showFloatBtn ? "checked" : "") + '> زر الرئيسية</label><label><input type="checkbox" id="a-sb" ' + (cfg.showSidebarBtn ? "checked" : "") + '> القائمة الجانبية</label></div>' +
        '<div class="og-adm-row"><span>🎁 جوائز اليوم لكل عميل:</span><input type="number" class="og-adm-inp" id="a-cap" value="' + cfg.dailyPrizeCap + '" style="width:76px;"></div>' +
        '<div class="og-adm-row"><span>🪙 كشط يومي (خارج الحد):</span><input type="number" class="og-adm-inp" id="a-scap" value="' + cfg.dailyScratchCap + '" style="width:76px;"></div>' +
        '<div class="og-adm-row"><span>⏳ صلاحية الكوبون (ساعة):</span><input type="number" class="og-adm-inp" id="a-exp" value="' + cfg.couponExpiryHours + '" style="width:76px;"></div>' +
        '<div class="og-adm-row"><span>🛒 حد أدنى افتراضي للطلب (ج):</span><input type="number" class="og-adm-inp" id="a-min" value="' + cfg.defaultMinOrder + '" style="width:86px;"></div>' +
        '<div class="og-adm-row"><span>🧠 عدد أسئلة مسابقة الخبير:</span><input type="number" class="og-adm-inp" id="a-qc" value="' + cfg.quizQuestionCount + '" style="width:76px;"></div>';
    } else if (admTab === "streak") {
      var days = cfg.dailyStreak.days || [5, 10, 15, 20, 25, 30];
      h += '<div class="og-adm-row"><label><input type="checkbox" id="a-sten" ' + (cfg.dailyStreak.enabled ? "checked" : "") + '> تفعيل سلسلة 7 أيام</label></div>' +
        '<div class="og-adm-row"><strong style="width:100%;">⭐ نقاط الأيام (1 إلى 6):</strong><div class="og-adm-grid3">' + days.map(function (v, i) { return '<label style="font-size:.75rem;">يوم ' + (i + 1) + ':<input type="number" class="og-adm-inp" id="a-sd' + i + '" value="' + v + '" style="width:100%;"></label>'; }).join("") + '</div></div>' +
        '<div class="og-adm-row"><strong>🎁 هدايا الصندوق الكبير (اليوم 7)</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.74rem;" onclick="window.ZaitGamesV96.adminAddPrize(\'chest\')">+ إضافة</button></div>' + renderPrizeEditor("chest", cfg.dailyStreak.bigChestPrizes || []);
    } else if (admTab === "prizes") {
      h += '<div class="og-adm-row"><strong>🎁 سلة الجوائز العشوائية</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.74rem;" onclick="window.ZaitGamesV96.adminAddPrize(\'pool\')">+ إضافة</button></div>' + renderPrizeEditor("pool", cfg.prizePool || []) +
        '<div class="og-adm-row"><strong>🪙 كارت الحظ (اكشط)</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.74rem;" onclick="window.ZaitGamesV96.adminAddPrize(\'scratch\')">+ إضافة</button></div>' + renderPrizeEditor("scratch", cfg.scratchPrizes || []);
    } else if (admTab === "games") {
      h += getAllGamesMeta().map(function (gm) {
        var gc = getGameCfg(gm.id);
        return '<div class="og-adm-row"><strong>' + gm.icon + ' ' + esc(gm.name) + '</strong><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><label><input type="checkbox" class="ag-en" data-g="' + gm.id + '" ' + (gc.enabled !== false ? "checked" : "") + '> تشغيل</label>' +
          (gm.id !== "scratch" ? '<label style="font-size:.74rem;">الوقت(ث):<input type="number" class="og-adm-inp ag-tm" data-g="' + gm.id + '" value="' + gc.baseTime + '" style="width:62px;"></label><label style="font-size:.74rem;">الأدوار:<input type="number" class="og-adm-inp ag-st" data-g="' + gm.id + '" value="' + gc.maxStages + '" style="width:54px;"></label>' : '') + '</div></div>';
      }).join("");
    } else {
      var pl = analytics.plays || {}, tot = Object.values(pl).reduce(function (s, n) { return s + Number(n || 0); }, 0);
      h += '<div class="og-adm-row"><span>🎮 مرات اللعب: <b>' + tot + '</b></span><span>🎟️ كوبونات صادرة: <b>' + Number(analytics.couponsIssued || 0) + '</b></span><span>✅ مستخدمة: <b>' + Number(analytics.couponsRedeemed || 0) + '</b></span></div>';
    }
    el.innerHTML = h + '</div>';
  }

  function renderPrizeEditor(kind, arr) {
    return arr.map(function (p, i) {
      return '<div class="og-adm-row" data-pk="' + kind + '"><input type="text" class="og-adm-inp ap-l" value="' + esc(p.label) + '" style="flex:1;min-width:120px;"><select class="og-adm-inp ap-t"><option value="points" ' + (p.type === "points" ? "selected" : "") + '>⭐ نقاط</option><option value="percent" ' + (p.type === "percent" ? "selected" : "") + '>🎟️ خصم%</option><option value="free_shipping" ' + (p.type === "free_shipping" ? "selected" : "") + '>🚚 شحن</option><option value="none" ' + (p.type === "none" ? "selected" : "") + '>🌿 حظ أوفر</option></select><input type="number" class="og-adm-inp ap-v" value="' + Number(p.value || 0) + '" style="width:54px;" title="القيمة"><input type="number" class="og-adm-inp ap-m" value="' + Number(p.minOrder || 0) + '" style="width:62px;" title="حد الطلب"><input type="number" class="og-adm-inp ap-w" value="' + Number(p.weight || 0) + '" style="width:52px;" title="النسبة%"><button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV96.adminDelPrize(\'' + kind + '\',' + i + ')">🗑️</button></div>';
    }).join("");
  }

  function readAdminInputs() {
    var gn = function (id, d) { var e = document.getElementById(id); return e ? Number(e.value || d) : d; };
    var gc = function (id, d) { var e = document.getElementById(id); return e ? !!e.checked : d; };
    var readPr = function (k) {
      var res = [];
      document.querySelectorAll('.og-adm-row[data-pk="' + k + '"]').forEach(function (r, idx) {
        res.push({ id: k + "_" + idx, label: r.querySelector(".ap-l").value, type: r.querySelector(".ap-t").value, value: Number(r.querySelector(".ap-v").value || 0), minOrder: Number(r.querySelector(".ap-m").value || 0), weight: Math.max(0, Number(r.querySelector(".ap-w").value || 0)) });
      });
      return res;
    };
    if (admTab === "general") {
      cfg.enabled = gc("a-en", cfg.enabled); cfg.showFloatBtn = gc("a-fl", cfg.showFloatBtn); cfg.showSidebarBtn = gc("a-sb", cfg.showSidebarBtn);
      cfg.dailyPrizeCap = Math.max(1, gn("a-cap", 3)); cfg.dailyScratchCap = Math.max(1, gn("a-scap", 1));
      cfg.couponExpiryHours = Math.max(1, gn("a-exp", 24)); cfg.defaultMinOrder = Math.max(0, gn("a-min", 300)); cfg.quizQuestionCount = Math.max(3, gn("a-qc", 7));
    } else if (admTab === "streak") {
      cfg.dailyStreak.enabled = gc("a-sten", true);
      for (var i = 0; i < 6; i++) cfg.dailyStreak.days[i] = Math.max(1, gn("a-sd" + i, (i + 1) * 5));
      cfg.dailyStreak.bigChestPrizes = readPr("chest");
    } else if (admTab === "prizes") {
      cfg.prizePool = readPr("pool"); cfg.scratchPrizes = readPr("scratch");
    } else if (admTab === "games") {
      document.querySelectorAll(".ag-en").forEach(function (e) { var g = e.getAttribute("data-g"); cfg.games[g] = getGameCfg(g); cfg.games[g].enabled = !!e.checked; });
      document.querySelectorAll(".ag-tm").forEach(function (e) { var g = e.getAttribute("data-g"); cfg.games[g].baseTime = Math.max(8, Number(e.value || 30)); });
      document.querySelectorAll(".ag-st").forEach(function (e) { var g = e.getAttribute("data-g"); cfg.games[g].maxStages = Math.max(1, Math.min(20, Number(e.value || 10))); });
    }
  }

  function openGames(direct) {
    if (!cfg.enabled) return toast("مركز الألعاب متوقف مؤقتاً", "info");
    ensureOverlay().classList.add("open"); isOpen = true; syncCloud();
    if (direct) openStageSelector(direct); else renderHub();
  }
  function closeGames() { stopActive(); isOpen = false; var ov = document.getElementById("og-overlay"); if (ov) ov.classList.remove("open"); }

  window.ZaitGamesV96 = window.ZaitOliveGames = {
    open: openGames, close: closeGames, backToHub: renderHub,
    openGame: openStageSelector, startStage: launchStage,
    openCoupons: openCoupons, openLeaderboard: openLeaderboard, claimStreak: claimStreak,
    setCat: function (c) { currentCat = c; renderHub(); },
    toggleSound: function () { soundOn = !soundOn; var b = document.getElementById("og-snd-btn"); if (b) b.textContent = soundOn ? "🔊" : "🔇"; },
    applyCouponAndShop: function (code) {
      try { navigator.clipboard && navigator.clipboard.writeText(code).catch(function () {}); } catch (e) {}
      closeGames();
      if (typeof window.V96_applyCodeQuick === "function") window.V96_applyCodeQuick(code);
      toast("✅ تم تطبيق الكوبون (" + code + ") بنجاح!", "success");
    },
    mountAdminPanel: renderAdmin,
    adminSetTab: function (t) { readAdminInputs(); admTab = t; renderAdmin(window.__V96_ADMIN_HOST__); },
    adminAddPrize: function (k) {
      readAdminInputs();
      var nw = { id: "n_" + Date.now(), label: "هدية جديدة 🎁", type: "points", value: 15, minOrder: 0, weight: 10 };
      if (k === "chest") cfg.dailyStreak.bigChestPrizes.push(nw);
      else if (k === "pool") cfg.prizePool.push(nw); else cfg.scratchPrizes.push(nw);
      renderAdmin(window.__V96_ADMIN_HOST__);
    },
    adminDelPrize: function (k, i) {
      readAdminInputs();
      if (k === "chest") cfg.dailyStreak.bigChestPrizes.splice(i, 1);
      else if (k === "pool") cfg.prizePool.splice(i, 1); else cfg.scratchPrizes.splice(i, 1);
      renderAdmin(window.__V96_ADMIN_HOST__);
    },
    adminSaveConfig: async function () {
      readAdminInputs(); saveJson(CFG_KEY, cfg);
      var fs = getFs();
      if (navigator.onLine && fs) { try { await fs.setDoc(fs.doc(fs.db, "settings", "olive_games_v96"), cfg, { merge: true }); } catch (e) {} }
      toast("✅ تم حفظ ونشر إعدادات الألعاب V97 بنجاح!", "success");
    },
    adminResetMyTries: async function () {
      pState.dailyPrizesWon = 0; pState.dailyScratchesUsed = 0; pState.lastStreakClaimDate = "";
      await pushPlayerMetaCloud();
      toast("🔄 تم تصفير محاولات اليوم للتجربة!", "success");
    }
  };
  window.openOliveGamesHub = openGames;
  window.openGamesHub = openGames;
  syncCloud();
})();
