/* ============================================================================
   Zait Store Olive Games Pro — V96 Master Engine (Part 1 + Part 2 Plugin Bridge)
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_GAMES_V96__) return;
  window.__ZAIT_OLIVE_GAMES_V96__ = true;

  var CFG_STORAGE_KEY = "zait_v96_games_config";
  var STATE_STORAGE_KEY = "zait_v96_player_state";
  var ANALYTICS_STORAGE_KEY = "zait_v96_games_analytics";
  var LEADERBOARD_KEY = "zait_v96_leaderboard_cache";
  var CFG_DOC_PATH = ["settings", "olive_games_v96"];
  var ANALYTICS_DOC_PATH = ["settings", "olive_games_analytics"];

  // جسر جاهز لاستقبال الـ 5 ألعاب الجديدة في الجزء الثاني (زوما، تقطيع الزيتون، ثعبان، كاسر البراميل، حارس الشجرة)
  window.ZaitGamesExtraRegistry = window.ZaitGamesExtraRegistry || {};
  window.ZaitRegisterExtraGame = function (id, def) {
    if (!id || !def) return;
    window.ZaitGamesExtraRegistry[id] = def;
    if (isOpen && currentView === "hub") renderHub();
  };

  // الإعدادات الافتراضية الشاملة — قابلة للتعديل 100% من لوحة المدير!
  var DEFAULT_CONFIG = {
    enabled: true,
    showFloatBtn: true,
    showSidebarBtn: true,
    dailyPrizeCap: 3,
    dailyScratchCap: 1,
    couponExpiryHours: 24,
    defaultMinOrder: 300,
    quizQuestionCount: 7,
    enableLeaderboard: true,
    enableDailyMission: true,
    dailyMissionBonus: 20,
    enableWhatsappChallenge: true,
    // سلسلة الهدايا اليومية (7 أيام) + الصندوق الكبير لليوم 7
    dailyStreak: {
      enabled: true,
      days: [5, 10, 15, 20, 25, 30],
      bigChestTitle: "الصندوق الذهبي الكبير 🎁",
      bigChestPrizes: [
        { id: "ch_pts", label: "60 نقطة ولاء ذهبية ⭐", type: "points", value: 60, weight: 45, minOrder: 0 },
        { id: "ch_p10", label: "كوبون خصم 10% 🎟️", type: "percent", value: 10, weight: 30, minOrder: 400 },
        { id: "ch_ship", label: "توصيل مجاني لطلبك 🚚", type: "free_shipping", value: 100, weight: 15, minOrder: 500 },
        { id: "ch_p15", label: "كوبون خصم VIP 15% 👑", type: "percent", value: 15, weight: 10, minOrder: 800 }
      ]
    },
    // سلة الجوائز العشوائية عند الفوز بأي لعبة مهارة
    prizePool: [
      { id: "pz1", label: "خصم 5% فوري 🎟️", type: "percent", value: 5, weight: 45, minOrder: 250 },
      { id: "pz2", label: "20 نقطة ولاء ⭐", type: "points", value: 20, weight: 30, minOrder: 0 },
      { id: "pz3", label: "خصم 10% مميز 🔥", type: "percent", value: 10, weight: 18, minOrder: 500 },
      { id: "pz4", label: "توصيل مجاني 🚚", type: "free_shipping", value: 100, weight: 7, minOrder: 600 }
    ],
    // كارت الحظ (اكشط قطرة الذهب) — خارج حد الجوائز اليومية!
    scratchPrizes: [
      { id: "sc0", label: "حظ أوفر في المرة القادمة 🌿", type: "none", value: 0, weight: 90, minOrder: 0 },
      { id: "sc1", label: "خصم 5% فوري 🎟️", type: "percent", value: 5, weight: 5, minOrder: 300 },
      { id: "sc2", label: "توصيل مجاني 🚚", type: "free_shipping", value: 100, weight: 5, minOrder: 500 }
    ],
    // إعدادات كل لعبة: التفعيل + الوقت (ثانية) + نقاط المكسب المطلوبة (الهدف) لكل صعوبة!
    games: {
      catch:   { enabled: true, times: { easy: 25, medium: 24, hard: 22 }, targets: { easy: 30, medium: 48, hard: 70 } },
      press:   { enabled: true, times: { easy: 24, medium: 21, hard: 18 }, targets: { easy: 100, medium: 120, hard: 145 } },
      quiz:    { enabled: true, times: { easy: 14, medium: 10, hard: 7 },  targets: { easy: 5, medium: 6, hard: 7 } },
      memory:  { enabled: true, times: { easy: 32, medium: 28, hard: 24 }, targets: { easy: 3, medium: 3, hard: 3 } },
      truck:   { enabled: true, times: { easy: 28, medium: 26, hard: 24 }, targets: { easy: 32, medium: 52, hard: 76 } },
      sorter:  { enabled: true, times: { easy: 26, medium: 24, hard: 22 }, targets: { easy: 26, medium: 42, hard: 62 } },
      match:   { enabled: true, times: { easy: 34, medium: 30, hard: 26 }, targets: { easy: 180, medium: 290, hard: 420 } },
      scratch: { enabled: true, times: { easy: 60, medium: 60, hard: 60 }, targets: { easy: 1, medium: 1, hard: 1 } },
      // فتحات جاهزة للـ 5 ألعاب الجديدة في الجزء الثاني
      zuma:    { enabled: true, times: { easy: 50, medium: 45, hard: 40 }, targets: { easy: 220, medium: 360, hard: 520 } },
      slice:   { enabled: true, times: { easy: 30, medium: 28, hard: 25 }, targets: { easy: 45, medium: 75, hard: 110 } },
      snake:   { enabled: true, times: { easy: 45, medium: 40, hard: 35 }, targets: { easy: 14, medium: 22, hard: 32 } },
      breakout:{ enabled: true, times: { easy: 55, medium: 50, hard: 45 }, targets: { easy: 24, medium: 32, hard: 42 } },
      reflex:  { enabled: true, times: { easy: 25, medium: 22, hard: 20 }, targets: { easy: 28, medium: 44, hard: 64 } }
    }
  };

  var CORE_GAMES_META = [
    { id: "catch",   icon: "🧺", name: "قطف الزيتون السيناوي", desc: "التقط الزيتون الذهبي وتفادَ القنابل والرياح!", cat: "speed", hardTag: "متحدٍ" },
    { id: "press",   icon: "❄️", name: "تحدي العصر عالبارد", desc: "املأ الزجاجة وحافظ على الحرارة تحت 27°م!", cat: "speed", hardTag: "دقة عالية" },
    { id: "quiz",    icon: "🧠", name: "خبير زيت الزيتون", desc: "+10,800 سؤال بمؤقت سريع ومنع تكرار!", cat: "brain", hardTag: "ذكاء" },
    { id: "memory",  icon: "🌿", name: "ذاكرة المزرعة (3 مراحل)", desc: "مراحل تصاعدية بكروت أكثر ووقت أقل!", cat: "brain", hardTag: "3 مراحل" },
    { id: "truck",   icon: "🚚", name: "شاحنة زيت سيناء", desc: "تجاوز العقبات السريعة واجمع جراكن الزيت!", cat: "speed", hardTag: "سريع" },
    { id: "sorter",  icon: "🎯", name: "فرز حبات الزيتون", desc: "افرز الثمار الطازجة على سير المعصرة السريع!", cat: "speed", hardTag: "تركيز" },
    { id: "match",   icon: "🫧", name: "مطابقة قطرات الذهب", desc: "فجّر مجموعات القطرات المتشابهة بكومبو!", cat: "brain", hardTag: "استراتيجي" },
    { id: "scratch", icon: "🪙", name: "اكشط قطرة الذهب", desc: "كارت حظ يومي مستقل خارج حد الجوائز!", cat: "luck", hardTag: "حظ 🪙" }
  ];

  var RANKS = [
    { min: 0,    title: "🌱 مبتدئ المزرعة" },
    { min: 150,  title: "🧺 قاطف محترف" },
    { min: 500,  title: "❄️ خبير المعصرة" },
    { min: 1200, title: "🏆 فارس الزيتون" },
    { min: 2500, title: "👑 شيخ الزيتون السيناوي" }
  ];

  var cfg = deepMergeConfig(DEFAULT_CONFIG, loadLocalJson(CFG_STORAGE_KEY, {}));
  var pState = loadPlayerState();
  var analytics = loadLocalJson(ANALYTICS_STORAGE_KEY, { plays: {}, couponsIssued: 0, couponsRedeemed: 0, revenueFromGames: 0 });

  var isOpen = false;
  var currentView = "hub";
  var currentCategory = "all";
  var soundOn = true;
  var activeGameId = null;
  var activeDiff = "medium";
  var activeGameCleanup = null;
  var gamePaused = false;
  var pauseListeners = [];
  var audioCtx = null;

  // =========================================================================
  // HELPERS, SOUND & HAPTICS
  // =========================================================================
  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function yesterdayKey() {
    var d = new Date(Date.now() - 86400000);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function loadLocalJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return JSON.parse(JSON.stringify(fallback));
  }
  function saveLocalJson(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
  }
  function deepMergeConfig(base, over) {
    var out = JSON.parse(JSON.stringify(base));
    if (!over || typeof over !== "object") return out;
    Object.keys(over).forEach(function (k) {
      if (k === "games" && over.games && typeof over.games === "object") {
        Object.keys(over.games).forEach(function (gid) {
          var bg = out.games[gid] || { enabled: true, times: { easy: 30, medium: 25, hard: 20 }, targets: { easy: 20, medium: 35, hard: 50 } };
          var og = over.games[gid] || {};
          out.games[gid] = {
            enabled: og.enabled !== undefined ? !!og.enabled : bg.enabled,
            times: Object.assign({}, bg.times, og.times || {}),
            targets: Object.assign({}, bg.targets, og.targets || {})
          };
        });
      } else if (k === "dailyStreak" && over.dailyStreak && typeof over.dailyStreak === "object") {
        out.dailyStreak = Object.assign({}, out.dailyStreak, over.dailyStreak);
        if (!Array.isArray(out.dailyStreak.days) || out.dailyStreak.days.length !== 6) {
          out.dailyStreak.days = base.dailyStreak.days.slice();
        }
      } else if (over[k] !== undefined) {
        out[k] = over[k];
      }
    });
    return out;
  }

  function loadPlayerState() {
    var def = {
      totalScore: 0,
      dailyDate: todayKey(),
      dailyPrizesWon: 0,
      dailyScratchesUsed: 0,
      streakCount: 0,
      lastStreakClaimDate: "",
      missionDate: "",
      missionDone: false,
      bestScores: {},
      coupons: [],
      pendingPoints: 0,
      seenQuizIds: []
    };
    var st = Object.assign(def, loadLocalJson(STATE_STORAGE_KEY, {}));
    if (st.dailyDate !== todayKey()) {
      st.dailyDate = todayKey();
      st.dailyPrizesWon = 0;
      st.dailyScratchesUsed = 0;
    }
    if (!Array.isArray(st.coupons)) st.coupons = [];
    return st;
  }
  function savePlayerState() {
    saveLocalJson(STATE_STORAGE_KEY, pState);
    if (typeof window.V96_refreshStoreCouponBar === "function") {
      try { window.V96_refreshStoreCouponBar(); } catch (e) {}
    }
  }

  function haptic(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms || 15); } catch (e) {}
  }

  function playSfx(type) {
    if (!soundOn) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.connect(g);
      g.connect(audioCtx.destination);
      if (type === "pop") {
        osc.type = "sine"; osc.frequency.setValueAtTime(520, now); osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        g.gain.setValueAtTime(0.11, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
      } else if (type === "gold") {
        osc.type = "triangle"; osc.frequency.setValueAtTime(680, now); osc.frequency.setValueAtTime(980, now + 0.06); osc.frequency.setValueAtTime(1320, now + 0.12);
        g.gain.setValueAtTime(0.13, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now); osc.stop(now + 0.22);
      } else if (type === "bad") {
        osc.type = "sawtooth"; osc.frequency.setValueAtTime(220, now); osc.frequency.linearRampToValueAtTime(110, now + 0.18);
        g.gain.setValueAtTime(0.11, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
      } else if (type === "tick") {
        osc.type = "square"; osc.frequency.setValueAtTime(760, now);
        g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now); osc.stop(now + 0.05);
      } else if (type === "win") {
        [523, 659, 784, 1046].forEach(function (f, idx) {
          var o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
          o2.type = "triangle"; o2.frequency.setValueAtTime(f, now + idx * 0.09);
          g2.gain.setValueAtTime(0.12, now + idx * 0.09); g2.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.24);
          o2.connect(g2); g2.connect(audioCtx.destination);
          o2.start(now + idx * 0.09); o2.stop(now + idx * 0.09 + 0.25);
        });
      }
    } catch (e) {}
  }

  function toast(msg, type) {
    if (typeof window.showToast === "function") {
      try { window.showToast(msg, type || "info"); return; } catch (e) {}
    }
    var d = document.createElement("div");
    d.textContent = msg;
    d.style.cssText = "position:fixed;bottom:84px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#10321f;color:#fde68a;border:1.5px solid #d59e2a;padding:10px 18px;border-radius:14px;font-weight:800;font-size:13px;box-shadow:0 12px 30px rgba(0,0,0,.45)";
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 2800);
  }

  function getUserObj() {
    return window.currentUser || (window.auth && window.auth.currentUser) || null;
  }

  function getRankTitle(pts) {
    var t = RANKS[0].title;
    RANKS.forEach(function (r) { if (pts >= r.min) t = r.title; });
    return t;
  }

  function getGameConfig(gid) {
    return (cfg.games && cfg.games[gid]) || { enabled: true, times: { easy: 30, medium: 25, hard: 20 }, targets: { easy: 25, medium: 40, hard: 60 } };
  }

  function getAllGamesMeta() {
    var list = CORE_GAMES_META.slice();
    Object.keys(window.ZaitGamesExtraRegistry || {}).forEach(function (id) {
      var ex = window.ZaitGamesExtraRegistry[id];
      if (ex && !list.some(function (m) { return m.id === id; })) {
        list.push({
          id: id,
          icon: ex.icon || "🎮",
          name: ex.name || id,
          desc: ex.desc || "لعبة تحدٍ جديدة!",
          cat: ex.cat || "speed",
          hardTag: ex.hardTag || "جديد 🔥"
        });
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
    return { ctx: ctx, w: cssW, h: cssH, dpr: dpr };
  }

  // =========================================================================
  // FIREBASE SYNC (CONFIG, POINTS, SERVER-BACKED CAP, LEADERBOARD, ROI)
  // =========================================================================
  function getFsHelpers() {
    var h = window.__V96_FS__ || {};
    return (h.db && h.doc && h.setDoc && h.getDoc) ? h : null;
  }

  async function syncFromCloud() {
    if (!navigator.onLine) return;
    var fs = getFsHelpers();
    if (!fs) return;
    try {
      var cSnap = await fs.getDoc(fs.doc(fs.db, CFG_DOC_PATH[0], CFG_DOC_PATH[1]));
      if (cSnap && cSnap.exists()) {
        cfg = deepMergeConfig(DEFAULT_CONFIG, cSnap.data());
        saveLocalJson(CFG_STORAGE_KEY, cfg);
      }
      var aSnap = await fs.getDoc(fs.doc(fs.db, ANALYTICS_DOC_PATH[0], ANALYTICS_DOC_PATH[1]));
      if (aSnap && aSnap.exists()) {
        analytics = Object.assign({ plays: {}, couponsIssued: 0, couponsRedeemed: 0, revenueFromGames: 0 }, aSnap.data());
        saveLocalJson(ANALYTICS_STORAGE_KEY, analytics);
      }
      var u = getUserObj();
      if (u && u.uid) {
        var uSnap = await fs.getDoc(fs.doc(fs.db, "users", u.uid));
        if (uSnap && uSnap.exists()) {
          var ud = uSnap.data() || {};
          // Server-backed daily cap sync (Anti-cheat against incognito/clear storage)
          if (ud.gameDailyLog && ud.gameDailyLog.date === todayKey()) {
            pState.dailyPrizesWon = Math.max(pState.dailyPrizesWon, Number(ud.gameDailyLog.prizesWon || 0));
            pState.dailyScratchesUsed = Math.max(pState.dailyScratchesUsed, Number(ud.gameDailyLog.scratchesUsed || 0));
          }
          if (ud.gameStreak && ud.gameStreak.lastClaimDate) {
            if (ud.gameStreak.lastClaimDate >= pState.lastStreakClaimDate) {
              pState.streakCount = Number(ud.gameStreak.count || 0);
              pState.lastStreakClaimDate = ud.gameStreak.lastClaimDate;
            }
          }
          if (Array.isArray(ud.gameCoupons) && ud.gameCoupons.length) {
            var map = {};
            pState.coupons.concat(ud.gameCoupons).forEach(function (c) {
              if (c && c.code) {
                if (!map[c.code] || c.used) map[c.code] = c;
              }
            });
            pState.coupons = Object.values(map);
          }
          // Flush offline pending loyalty points
          if (pState.pendingPoints > 0) {
            var addPts = pState.pendingPoints;
            pState.pendingPoints = 0;
            await awardLoyaltyPointsCloud(addPts);
          }
          savePlayerState();
        }
      }
    } catch (e) {}
  }

  async function awardLoyaltyPointsCloud(pts) {
    var num = Math.max(0, Math.round(Number(pts || 0)));
    if (!num) return;
    pState.totalScore += num;
    var u = getUserObj();
    var fs = getFsHelpers();
    if (!navigator.onLine || !u || !u.uid || !fs) {
      pState.pendingPoints = (pState.pendingPoints || 0) + num;
      savePlayerState();
      return;
    }
    try {
      var ref = fs.doc(fs.db, "users", u.uid);
      var curPts = fs.increment ? fs.increment(num) : num;
      await fs.setDoc(ref, { loyaltyPoints: curPts, points: curPts }, { merge: true });
      if (window.userProfile) {
        window.userProfile.loyaltyPoints = Number(window.userProfile.loyaltyPoints || 0) + num;
      }
      savePlayerState();
    } catch (e) {
      pState.pendingPoints = (pState.pendingPoints || 0) + num;
      savePlayerState();
    }
  }

  async function syncPlayerCapsAndCouponsToCloud() {
    savePlayerState();
    var u = getUserObj();
    var fs = getFsHelpers();
    if (!navigator.onLine || !u || !u.uid || !fs) return;
    try {
      await fs.setDoc(fs.doc(fs.db, "users", u.uid), {
        gameDailyLog: {
          date: todayKey(),
          prizesWon: pState.dailyPrizesWon,
          scratchesUsed: pState.dailyScratchesUsed
        },
        gameStreak: {
          count: pState.streakCount,
          lastClaimDate: pState.lastStreakClaimDate
        },
        gameCoupons: pState.coupons.slice(-25)
      }, { merge: true });
    } catch (e) {}
  }

  async function recordPlayAnalytics(gid) {
    analytics.plays = analytics.plays || {};
    analytics.plays[gid] = Number(analytics.plays[gid] || 0) + 1;
    saveLocalJson(ANALYTICS_STORAGE_KEY, analytics);
    var fs = getFsHelpers();
    if (navigator.onLine && fs) {
      var upd = {};
      upd["plays." + gid] = fs.increment ? fs.increment(1) : analytics.plays[gid];
      fs.setDoc(fs.doc(fs.db, ANALYTICS_DOC_PATH[0], ANALYTICS_DOC_PATH[1]), { plays: analytics.plays }, { merge: true }).catch(function () {});
    }
  }

  async function recordCouponIssuedAnalytics() {
    analytics.couponsIssued = Number(analytics.couponsIssued || 0) + 1;
    saveLocalJson(ANALYTICS_STORAGE_KEY, analytics);
    var fs = getFsHelpers();
    if (navigator.onLine && fs) {
      fs.setDoc(fs.doc(fs.db, ANALYTICS_DOC_PATH[0], ANALYTICS_DOC_PATH[1]), { couponsIssued: analytics.couponsIssued }, { merge: true }).catch(function () {});
    }
  }

  async function submitToLeaderboard(scoreGain) {
    if (!cfg.enableLeaderboard || !scoreGain) return;
    var u = getUserObj();
    var name = (u && u.displayName) ? u.displayName.split(" ")[0] : "لاعب الشجرة";
    var gov = (window.userProfile && window.userProfile.gov) ? window.userProfile.gov : "مصر";
    var uid = (u && u.uid) ? u.uid : ("guest_" + (localStorage.getItem("zait_dev_fp") || "local"));
    var lb = loadLocalJson(LEADERBOARD_KEY, []);
    var ex = lb.find(function (x) { return x.uid === uid; });
    if (ex) { ex.score = Math.max(ex.score, pState.totalScore); ex.name = name; }
    else lb.push({ uid: uid, name: name, gov: gov, score: pState.totalScore });
    lb.sort(function (a, b) { return b.score - a.score; });
    saveLocalJson(LEADERBOARD_KEY, lb.slice(0, 15));

    var fs = getFsHelpers();
    if (navigator.onLine && fs && u && u.uid) {
      try {
        await fs.setDoc(fs.doc(fs.db, "settings", "olive_games_leaderboard"), { top: lb.slice(0, 15), updatedAt: new Date().toISOString() }, { merge: true });
      } catch (e) {}
    }
  }

  // =========================================================================
  // PRIZE & UNIQUE EXPIRING COUPON ENGINE
  // =========================================================================
  function weightedDraw(list) {
    var valid = (Array.isArray(list) ? list : []).filter(function (x) { return Number(x.weight || 0) > 0; });
    if (!valid.length) return { label: "15 نقطة ولاء ⭐", type: "points", value: 15, minOrder: 0 };
    var total = valid.reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < valid.length; i++) {
      r -= Number(valid[i].weight || 0);
      if (r <= 0) return valid[i];
    }
    return valid[valid.length - 1];
  }

  function generateUniqueCouponCode() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var seg = function (n) {
      var s = "";
      for (var i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    };
    return "ZM-" + seg(4) + "-" + seg(4);
  }

  async function issuePrize(prizeItem, sourceLabel) {
    if (!prizeItem || prizeItem.type === "none") {
      return { type: "none", label: (prizeItem && prizeItem.label) || "حظ أوفر في المرة القادمة 🌿" };
    }
    if (prizeItem.type === "points") {
      var pts = Math.max(1, Number(prizeItem.value || 10));
      await awardLoyaltyPointsCloud(pts);
      await syncPlayerCapsAndCouponsToCloud();
      return { type: "points", value: pts, label: prizeItem.label || (pts + " نقطة ولاء ⭐") };
    }

    // Unique single-use, user-bound, time-expiring coupon with Min Order Value
    var u = getUserObj();
    var code = generateUniqueCouponCode();
    var expHrs = Math.max(1, Number(cfg.couponExpiryHours || 24));
    var minOrd = Number(prizeItem.minOrder !== undefined ? prizeItem.minOrder : (cfg.defaultMinOrder || 0));
    var couponObj = {
      code: code,
      type: prizeItem.type, // 'percent' or 'free_shipping'
      value: Number(prizeItem.value || 5),
      label: prizeItem.label || (prizeItem.type === "free_shipping" ? "توصيل مجاني 🚚" : ("خصم " + prizeItem.value + "%")),
      minOrder: minOrd,
      createdAt: Date.now(),
      expiresAt: Date.now() + expHrs * 3600 * 1000,
      used: false,
      ownerUid: (u && u.uid) ? u.uid : "guest",
      ownerEmail: (u && u.email) ? u.email.toLowerCase() : "",
      source: sourceLabel || "ألعاب الشجرة المباركة"
    };
    pState.coupons.unshift(couponObj);
    await syncPlayerCapsAndCouponsToCloud();
    await recordCouponIssuedAnalytics();

    // Register in Firestore promoCodes if online so native checkout validates it too
    var fs = getFsHelpers();
    if (navigator.onLine && fs) {
      try {
        await fs.setDoc(fs.doc(fs.db, "promoCodes", code), {
          code: code,
          discount: couponObj.type === "free_shipping" ? 0 : couponObj.value,
          freeShipping: couponObj.type === "free_shipping",
          minOrder: couponObj.minOrder,
          maxUses: 1,
          usageCount: 0,
          active: true,
          ownerUid: couponObj.ownerUid,
          ownerEmail: couponObj.ownerEmail,
          expiresAt: couponObj.expiresAt,
          fromGame: true
        }, { merge: true });
      } catch (e) {}
    }
    return couponObj;
  }

  function getActiveCoupons() {
    var now = Date.now();
    return (pState.coupons || []).filter(function (c) {
      return c && !c.used && (!c.expiresAt || c.expiresAt > now);
    });
  }

  function formatCountdown(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0");
  }

  // =========================================================================
  // DAILY 7-DAY STREAK + BIG GOLDEN CHEST LOGIC
  // =========================================================================
  function getStreakStatus() {
    var today = todayKey();
    var yest = yesterdayKey();
    var claimedToday = pState.lastStreakClaimDate === today;
    var currentStreak = Number(pState.streakCount || 0);
    if (!claimedToday && pState.lastStreakClaimDate && pState.lastStreakClaimDate !== yest) {
      currentStreak = 0; // Missed a day -> starts fresh from Day 1
    }
    var nextDayIndex = claimedToday ? ((currentStreak - 1) % 7) : (currentStreak % 7); // 0..6
    return {
      claimedToday: claimedToday,
      streakCount: currentStreak,
      activeDayIndex: nextDayIndex // 0 = Day 1, ..., 6 = Day 7 Big Chest
    };
  }

  async function claimDailyStreakReward() {
    var st = getStreakStatus();
    if (st.claimedToday) return toast("✅ لقد استلمت هدية اليوم بالفعل! عد غداً لإكمال السلسلة 🔥", "info");

    var dayIdx = st.activeDayIndex; // 0..6
    pState.streakCount = st.streakCount + 1;
    pState.lastStreakClaimDate = todayKey();

    if (dayIdx < 6) {
      var pts = Number((cfg.dailyStreak && cfg.dailyStreak.days && cfg.dailyStreak.days[dayIdx]) || ((dayIdx + 1) * 5));
      await awardLoyaltyPointsCloud(pts);
      await syncPlayerCapsAndCouponsToCloud();
      playSfx("win");
      haptic(35);
      toast("🔥 رائع! استلمت هدية اليوم " + (dayIdx + 1) + ": +" + pts + " نقطة ولاء!", "success");
      renderHub();
    } else {
      // Day 7 -> BIG GOLDEN CHEST DRAW!
      var chestList = (cfg.dailyStreak && cfg.dailyStreak.bigChestPrizes) || DEFAULT_CONFIG.dailyStreak.bigChestPrizes;
      var drawn = weightedDraw(chestList);
      var issued = await issuePrize(drawn, "الصندوق الذهبي (اليوم 7)");
      playSfx("win");
      haptic([30, 50, 80]);
      showBigChestModal(issued);
      renderHub();
    }
  }

  function showBigChestModal(issued) {
    var body = document.getElementById("og-body");
    if (!body) return;
    currentView = "chest";
    var isCoupon = issued && (issued.type === "percent" || issued.type === "free_shipping");
    body.innerHTML =
      '<div class="og-card og-result-box">' +
        '<canvas id="og-confetti-cv"></canvas>' +
        '<div style="position:relative;z-index:3;">' +
          '<div style="font-size:3.6rem;">🎁✨</div>' +
          '<h2 style="margin:6px 0;font-weight:900;color:#d97706;">مبروك! فتحت الصندوق الذهبي لليوم السابع!</h2>' +
          '<div class="og-prize-card">' +
            '<div style="font-size:1.05rem;font-weight:900;color:#fde68a;">' + esc(issued.label) + '</div>' +
            (isCoupon ? (
              '<div class="og-code-box">' + esc(issued.code) + '</div>' +
              '<div style="font-size:.76rem;color:#bbf7d0;margin-bottom:8px;">⏳ صالح لمدة ' + cfg.couponExpiryHours + ' ساعة' + (issued.minOrder > 0 ? (' • الحد الأدنى للطلب ' + issued.minOrder + ' ج') : '') + '</div>' +
              '<button type="button" class="og-btn og-btn-gold" style="width:100%;" onclick="window.ZaitGamesV96.applyCouponAndShop(\'' + esc(issued.code) + '\')">🛒 تسوّق الآن بالخصم وتطبيق الكوبون</button>'
            ) : '<div style="font-size:.86rem;color:#d1fae5;margin-top:6px;">تمت إضافة المكافأة لرصيدك بنجاح!</div>') +
          '</div>' +
          '<button type="button" class="og-btn og-btn-dark" style="margin-top:10px;" onclick="window.ZaitGamesV96.backToHub()">🏠 العودة لصالة الألعاب</button>' +
        '</div>' +
      '</div>';
    launchConfetti();
  }

  // =========================================================================
  // DAILY MISSION
  // =========================================================================
  function getTodayMission() {
    var dayNum = Math.floor(Date.now() / 86400000);
    var pool = [
      { id: "m_any", text: "فُز بأي لعبة مهارة في المستوى المتوسط أو الصعب اليوم", check: function (g, d, w) { return w && (d === "medium" || d === "hard"); } },
      { id: "m_catch", text: "فُز في لعبة قطف الزيتون السيناوي اليوم", check: function (g, d, w) { return w && g === "catch"; } },
      { id: "m_quiz", text: "فُز في تحدي خبير زيت الزيتون اليوم", check: function (g, d, w) { return w && g === "quiz"; } },
      { id: "m_hard", text: "حقق فوزاً في المستوى الصعب في أي لعبة اليوم", check: function (g, d, w) { return w && d === "hard"; } }
    ];
    return pool[dayNum % pool.length];
  }

  // =========================================================================
  // MODAL SHELL & HUB UI
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
            '<div class="og-brand">' +
              '<div class="og-brand-ic">🫒</div>' +
              '<div><h2>مركز ألعاب الشجرة المباركة</h2><small id="og-rank-lbl">🌱 مبتدئ المزرعة</small></div>' +
            '</div>' +
            '<div class="og-head-btns">' +
              '<button type="button" class="og-ic-btn" id="og-snd-btn" onclick="window.ZaitGamesV96.toggleSound()">🔊</button>' +
              '<button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV96.close()">✕</button>' +
            '</div>' +
          '</div>' +
          '<div class="og-hud" id="og-hud-bar"></div>' +
        '</div>' +
        '<div class="og-body" id="og-body"></div>' +
      '</div>';
    ov.addEventListener("click", function (e) {
      if (e.target === ov) closeGames();
    });
    document.body.appendChild(ov);
    return ov;
  }

  function renderHud() {
    var hud = document.getElementById("og-hud-bar");
    var rk = document.getElementById("og-rank-lbl");
    if (!hud) return;
    if (rk) rk.textContent = getRankTitle(pState.totalScore) + " • " + pState.totalScore + " نقطة";
    var actCoups = getActiveCoupons().length;
    var st = getStreakStatus();
    var pts = (window.userProfile && Number(window.userProfile.loyaltyPoints)) || pState.totalScore;
    hud.innerHTML =
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.backToHub()">⭐ نقاطك<strong>' + pts + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.openCoupons()">🎟️ كوبوناتي<strong>' + actCoups + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.openLeaderboard()">🏆 المتصدرين<strong>🔥 ' + st.streakCount + '</strong></div>' +
      '<div class="og-hud-pill" onclick="window.ZaitGamesV96.backToHub()">🎁 جوائز اليوم<strong>' + pState.dailyPrizesWon + '/' + cfg.dailyPrizeCap + '</strong></div>';
  }

  function renderHub() {
    stopActiveGame();
    currentView = "hub";
    renderHud();
    var body = document.getElementById("og-body");
    if (!body) return;

    var html = "";

    // 1. 7-Day Daily Streak Ladder + Day 7 Big Chest
    if (cfg.dailyStreak && cfg.dailyStreak.enabled) {
      var st = getStreakStatus();
      var daysArr = cfg.dailyStreak.days || [5, 10, 15, 20, 25, 30];
      var boxesHtml = "";
      for (var i = 0; i < 7; i++) {
        var isChest = i === 6;
        var isClaimed = st.claimedToday ? (i <= st.activeDayIndex) : (i < st.activeDayIndex);
        var isToday = !st.claimedToday && i === st.activeDayIndex;
        var cls = "og-day-box" + (isChest ? " big-chest" : "") + (isClaimed ? " claimed" : "") + (isToday ? " today" : "");
        boxesHtml +=
          '<div class="' + cls + '" ' + (isToday ? 'onclick="window.ZaitGamesV96.claimStreak()"' : '') + '>' +
            '<div class="og-day-num">يوم ' + (i + 1) + '</div>' +
            '<div class="og-day-ic">' + (isClaimed ? "✅" : (isChest ? "🎁" : "⭐")) + '</div>' +
            '<div class="og-day-val">' + (isChest ? "الصندوق!" : ("+" + daysArr[i] + " ن")) + '</div>' +
          '</div>';
      }
      html +=
        '<div class="og-card">' +
          '<div class="og-streak-head">' +
            '<div><strong style="font-size:.9rem;">🔥 هدايا الدخول اليومي (سلسلة 7 أيام)</strong><div style="font-size:.73rem;opacity:.8;">ادخل يومياً لتحصل على نقاطك وتفتح الصندوق الذهبي الكبير في اليوم 7!</div></div>' +
            (!st.claimedToday
              ? '<button type="button" class="og-btn og-btn-gold" style="padding:7px 12px;font-size:.78rem;" onclick="window.ZaitGamesV96.claimStreak()">🎁 استلم هدية اليوم ' + (st.activeDayIndex + 1) + '</button>'
              : '<span style="font-size:.76rem;font-weight:900;color:#16a34a;">✅ تم الاستلام اليوم</span>') +
          '</div>' +
          '<div class="og-streak-grid">' + boxesHtml + '</div>' +
        '</div>';
    }

    // 2. Daily Mission Banner
    if (cfg.enableDailyMission) {
      var ms = getTodayMission();
      var done = pState.missionDate === todayKey() && pState.missionDone;
      html +=
        '<div class="og-mission">' +
          '<div style="min-width:0;flex:1;"><strong style="color:#fde68a;font-size:.82rem;">🎯 مهمة اليوم (+' + Number(cfg.dailyMissionBonus || 20) + ' نقطة ولاء):</strong><div style="font-size:.76rem;color:#e2f5e9;margin-top:2px;">' + esc(ms.text) + '</div></div>' +
          '<span style="font-size:.76rem;font-weight:900;padding:4px 10px;border-radius:99px;background:' + (done ? '#16a34a' : 'rgba(244,207,109,.2)') + ';color:' + (done ? '#fff' : '#fde68a') + ';">' + (done ? '✅ مكتملة' : '🔥 جارية') + '</span>' +
        '</div>';
    }

    // 3. Category Filter Tabs
    var cats = [
      { id: "all", label: "🎮 كل الألعاب" },
      { id: "speed", label: "⚡ سرعة وأكشن" },
      { id: "brain", label: "🧠 ذكاء وتحدي" },
      { id: "luck", label: "🪙 حظ يومي" }
    ];
    html += '<div class="og-tabs">' + cats.map(function (c) {
      return '<button type="button" class="og-tab ' + (currentCategory === c.id ? "active" : "") + '" onclick="window.ZaitGamesV96.setCat(\'' + c.id + '\')">' + c.label + '</button>';
    }).join("") + '</div>';

    // 4. 2x2 / 3x3 Games Grid
    var allGames = getAllGamesMeta().filter(function (g) {
      var gc = getGameConfig(g.id);
      if (gc.enabled === false) return false;
      if (currentCategory !== "all" && g.cat !== currentCategory) return false;
      return true;
    });

    html += '<div class="og-games-grid">' + allGames.map(function (g) {
      var best = pState.bestScores[g.id] || 0;
      var badgeCls = g.cat === "luck" ? "luck" : (g.cat === "speed" ? "hard" : "");
      return (
        '<div class="og-game-tile" onclick="window.ZaitGamesV96.openGame(\'' + esc(g.id) + '\')">' +
          '<span class="og-game-badge ' + badgeCls + '">' + esc(g.hardTag) + '</span>' +
          '<div class="og-game-ic">' + g.icon + '</div>' +
          '<div>' +
            '<div class="og-game-name">' + esc(g.name) + '</div>' +
            '<div class="og-game-desc">' + esc(g.desc) + '</div>' +
          '</div>' +
          '<div>' +
            '<div class="og-game-meta"><span>' + (g.id === "scratch" ? "خارج الحد اليومي" : (best > 0 ? ("🏆 أعلى رقم: " + best) : "3 مستويات")) + '</span></div>' +
            '<button type="button" class="og-play-pill" style="margin-top:5px;">▶ العب الآن</button>' +
          '</div>' +
        '</div>'
      );
    }).join("") + '</div>';

    body.innerHTML = html;
  }

  // =========================================================================
  // COUPONS DRAWER (WITH LIVE EXPIRY COUNTDOWN) & WEEKLY LEADERBOARD
  // =========================================================================
  var couponTick = null;
  function openCouponsView() {
    stopActiveGame();
    currentView = "coupons";
    renderHud();
    var body = document.getElementById("og-body");
    var list = pState.coupons || [];
    var now = Date.now();

    body.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<strong style="font-size:1rem;">🎟️ كوبوناتي الخاصة</strong>' +
        '<button type="button" class="og-btn og-btn-dark" style="padding:6px 12px;font-size:.78rem;" onclick="window.ZaitGamesV96.backToHub()">← رجوع</button>' +
      '</div>' +
      (list.length === 0
        ? '<div class="og-card" style="text-align:center;padding:28px;">لا توجد كوبونات حالياً — العب واربح كوبونك الفوري الآن! 🎮</div>'
        : list.map(function (c) {
            var expired = c.expiresAt && c.expiresAt <= now;
            var rem = c.expiresAt ? formatCountdown(c.expiresAt - now) : "مفتوح";
            var badge = c.used ? "✅ مستخدم" : (expired ? "⌛ منتهي" : ("⏳ ينتهي خلال " + rem));
            return (
              '<div class="og-card" style="opacity:' + ((c.used || expired) ? "0.6" : "1") + ';">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">' +
                  '<strong>' + esc(c.label) + '</strong>' +
                  '<span class="og-cp-timer" data-exp="' + (c.expiresAt || 0) + '" style="font-size:.74rem;font-weight:900;color:' + ((c.used || expired) ? "#ef4444" : "#15803d") + ';">' + badge + '</span>' +
                '</div>' +
                '<div class="og-code-box" style="text-align:center;background:rgba(16,48,30,.92);">' + esc(c.code) + '</div>' +
                '<div style="font-size:.75rem;opacity:.8;margin-bottom:8px;">' +
                  (c.minOrder > 0 ? ('الحد الأدنى للطلب: ' + c.minOrder + ' ج • ') : '') +
                  'استخدام مرة واحدة على حسابك فقط' +
                '</div>' +
                ((!c.used && !expired)
                  ? '<button type="button" class="og-btn og-btn-gold" style="width:100%;" onclick="window.ZaitGamesV96.applyCouponAndShop(\'' + esc(c.code) + '\')">🛒 نسخ وتطبيق الكوبون والتسوق الآن</button>'
                  : '') +
              '</div>'
            );
          }).join(""));

    couponTick = setInterval(function () {
      if (currentView !== "coupons") { clearInterval(couponTick); return; }
      var t = Date.now();
      document.querySelectorAll(".og-cp-timer[data-exp]").forEach(function (el) {
        var exp = Number(el.getAttribute("data-exp") || 0);
        if (!exp) return;
        if (exp <= t) el.textContent = "⌛ منتهي";
        else if (el.textContent.indexOf("✅") === -1) el.textContent = "⏳ ينتهي خلال " + formatCountdown(exp - t);
      });
    }, 1000);
  }

  async function openLeaderboardView() {
    stopActiveGame();
    currentView = "leaderboard";
    renderHud();
    var body = document.getElementById("og-body");
    var lb = loadLocalJson(LEADERBOARD_KEY, []);

    var fs = getFsHelpers();
    if (navigator.onLine && fs) {
      try {
        var snap = await fs.getDoc(fs.doc(fs.db, "settings", "olive_games_leaderboard"));
        if (snap && snap.exists() && Array.isArray(snap.data().top)) {
          lb = snap.data().top;
          saveLocalJson(LEADERBOARD_KEY, lb);
        }
      } catch (e) {}
    }

    var medals = ["🥇", "🥈", "🥉"];
    body.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<strong style="font-size:1rem;">🏆 لوحة المتصدرين الأسبوعية</strong>' +
        '<button type="button" class="og-btn og-btn-dark" style="padding:6px 12px;font-size:.78rem;" onclick="window.ZaitGamesV96.backToHub()">← رجوع</button>' +
      '</div>' +
      '<div class="og-card">' +
        (lb.length === 0
          ? '<div style="text-align:center;padding:24px;">كن أول متصدر هذا الأسبوع! العب الآن واجمع النقاط 🏆</div>'
          : lb.slice(0, 10).map(function (row, idx) {
              return (
                '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 10px;border-bottom:1px dashed rgba(200,162,75,.28);">' +
                  '<div><strong>' + (medals[idx] || ("#" + (idx + 1))) + ' ' + esc(row.name || "لاعب") + '</strong> <small style="opacity:.75;">(' + esc(row.gov || "مصر") + ')</small></div>' +
                  '<strong style="color:#d97706;">' + Number(row.score || 0) + ' ⭐</strong>' +
                '</div>'
              );
            }).join("")) +
      '</div>';
  }

  // =========================================================================
  // DIFFICULTY SELECTOR, COUNTDOWN (3-2-1), PAUSE & WIN/LOSE RESULT SCREEN
  // =========================================================================
  function openGameEntry(gid) {
    stopActiveGame();
    activeGameId = gid;
    if (gid === "scratch") {
      startGameRun("scratch", "easy");
      return;
    }
    var meta = getAllGamesMeta().find(function (m) { return m.id === gid; }) || { name: gid, icon: "🎮", desc: "" };
    var gc = getGameConfig(gid);
    currentView = "diff";
    var body = document.getElementById("og-body");
    body.innerHTML =
      '<div class="og-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<strong style="font-size:1.05rem;">' + meta.icon + ' ' + esc(meta.name) + '</strong>' +
          '<button type="button" class="og-btn og-btn-ghost" style="padding:6px 12px;font-size:.78rem;" onclick="window.ZaitGamesV96.backToHub()">← خروج</button>' +
        '</div>' +
        '<p style="font-size:.82rem;opacity:.85;margin:0 0 10px;">' + esc(meta.desc) + ' — اختر مستوى التحدي:</p>' +
        '<div class="og-diff-grid">' +
          '<button type="button" class="og-diff-btn easy" onclick="window.ZaitGamesV96.startGame(\'' + gid + '\',\'easy\')">' +
            '<div><strong>🟢 مستوى سهل (تحدي متوازن)</strong><div style="font-size:.74rem;opacity:.8;">الهدف للفوز: ' + gc.targets.easy + ' • الوقت: ' + gc.times.easy + 'ث</div></div>' +
            '<span style="font-size:1.2rem;">▶</span>' +
          '</button>' +
          '<button type="button" class="og-diff-btn medium" onclick="window.ZaitGamesV96.startGame(\'' + gid + '\',\'medium\')">' +
            '<div><strong>🟡 مستوى متوسط (سرعة أعلى وعقبات أكثر)</strong><div style="font-size:.74rem;opacity:.8;">الهدف للفوز: ' + gc.targets.medium + ' • الوقت: ' + gc.times.medium + 'ث</div></div>' +
            '<span style="font-size:1.2rem;">▶</span>' +
          '</button>' +
          '<button type="button" class="og-diff-btn hard" onclick="window.ZaitGamesV96.startGame(\'' + gid + '\',\'hard\')">' +
            '<div><strong>🔴 مستوى صعب (للمحترفين فقط!)</strong><div style="font-size:.74rem;opacity:.8;">الهدف للفوز: ' + gc.targets.hard + ' • الوقت: ' + gc.times.hard + 'ث</div></div>' +
            '<span style="font-size:1.2rem;">▶</span>' +
          '</button>' +
        '</div>' +
      '</div>';
  }

  function stopActiveGame() {
    gamePaused = false;
    pauseListeners = [];
    if (couponTick) { clearInterval(couponTick); couponTick = null; }
    if (typeof activeGameCleanup === "function") {
      try { activeGameCleanup(); } catch (e) {}
      activeGameCleanup = null;
    }
  }

  function runCountdown(stageEl, onGo) {
    var ov = document.createElement("div");
    ov.className = "og-stage-overlay";
    stageEl.appendChild(ov);
    var steps = ["3", "2", "1", "انطلق! 🚀"];
    var idx = 0;
    function next() {
      if (!ov.parentNode) return;
      if (idx >= steps.length) { ov.remove(); onGo(); return; }
      ov.innerHTML = '<div class="og-cd-num">' + steps[idx] + '</div>';
      playSfx(idx === 3 ? "gold" : "tick");
      idx++;
      setTimeout(next, idx === 4 ? 420 : 580);
    }
    next();
  }

  function togglePause(stageEl) {
    if (currentView !== "playing") return;
    gamePaused = !gamePaused;
    pauseListeners.forEach(function (fn) { try { fn(gamePaused); } catch (e) {} });
    var old = stageEl.querySelector(".og-pause-ov");
    if (gamePaused) {
      if (old) return;
      var ov = document.createElement("div");
      ov.className = "og-stage-overlay og-pause-ov";
      ov.innerHTML =
        '<div style="font-size:2.4rem;">⏸️</div>' +
        '<h3 style="margin:0;color:#fde68a;">اللعبة متوقفة مؤقتاً</h3>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">' +
          '<button type="button" class="og-btn og-btn-gold" id="og-resume-btn">▶ استكمال اللعب</button>' +
          '<button type="button" class="og-btn og-btn-ghost" onclick="window.ZaitGamesV96.backToHub()">🚪 خروج</button>' +
        '</div>';
      stageEl.appendChild(ov);
      ov.querySelector("#og-resume-btn").onclick = function () { togglePause(stageEl); };
    } else if (old) {
      old.remove();
    }
  }

  async function finishGame(opts) {
    stopActiveGame();
    currentView = "result";
    var won = !!opts.won;
    var score = Math.max(0, Math.round(Number(opts.score || 0)));
    var gid = opts.gameId || activeGameId;
    var diff = opts.diff || activeDiff;
    var target = opts.target || 0;

    if (score > Number(pState.bestScores[gid] || 0)) pState.bestScores[gid] = score;
    if (won) {
      pState.totalScore += Math.max(10, Math.min(score, 120));
      submitToLeaderboard(score);
    }

    var prizeResult = null;
    var capReached = false;
    var missionBonus = 0;

    if (won && opts.isScratch) {
      prizeResult = opts.scratchIssued;
    } else if (won) {
      // Check Daily Mission
      if (cfg.enableDailyMission && !(pState.missionDate === todayKey() && pState.missionDone)) {
        var ms = getTodayMission();
        if (ms.check(gid, diff, true)) {
          pState.missionDate = todayKey();
          pState.missionDone = true;
          missionBonus = Number(cfg.dailyMissionBonus || 20);
          await awardLoyaltyPointsCloud(missionBonus);
        }
      }
      // Check Daily Prize Cap (default 3)
      if (pState.dailyPrizesWon < Number(cfg.dailyPrizeCap || 3)) {
        pState.dailyPrizesWon++;
        var picked = weightedDraw(cfg.prizePool);
        prizeResult = await issuePrize(picked, "فوز بلعبة " + gid);
      } else {
        capReached = true;
        await syncPlayerCapsAndCouponsToCloud();
      }
    } else {
      savePlayerState();
    }

    renderHud();
    playSfx(won ? "win" : "bad");
    haptic(won ? [25, 45, 75] : 50);

    var meta = getAllGamesMeta().find(function (m) { return m.id === gid; }) || { name: "اللعبة", icon: "🎮" };
    var diffLbl = diff === "hard" ? "صعب 🔴" : (diff === "medium" ? "متوسط 🟡" : "سهل 🟢");
    var waText = "🏆 جبت " + score + " نقطة في لعبة (" + meta.name + " - " + diffLbl + ") داخل متجر زيت الشجرة المباركة" +
      (prizeResult && prizeResult.code ? " وكسبت خصم فوري!" : "!") +
      "\nتقدر تكسر رقمي وتكسب جائزتك؟ 👇\n" + location.origin;

    var prizeBoxHtml = "";
    if (won && prizeResult && prizeResult.type !== "none") {
      var isC = prizeResult.type === "percent" || prizeResult.type === "free_shipping";
      prizeBoxHtml =
        '<div class="og-prize-card">' +
          '<div style="font-size:.78rem;color:#bbf7d0;font-weight:800;">🎉 مبروك جائزتك العشوائية!</div>' +
          '<div style="font-size:1.1rem;font-weight:900;color:#fde68a;margin:4px 0;">' + esc(prizeResult.label) + '</div>' +
          (isC ? (
            '<div class="og-code-box">' + esc(prizeResult.code) + '</div>' +
            '<div style="font-size:.74rem;color:#d1fae5;margin-bottom:9px;">⏳ صالح لمدة ' + cfg.couponExpiryHours + ' ساعة' + (prizeResult.minOrder > 0 ? (' • الحد الأدنى ' + prizeResult.minOrder + ' ج') : '') + ' • استخدام مرة واحدة</div>' +
            '<button type="button" class="og-btn og-btn-gold" style="width:100%;" onclick="window.ZaitGamesV96.applyCouponAndShop(\'' + esc(prizeResult.code) + '\')">🛒 تسوّق الآن بالخصم (تطبيق فوري)</button>'
          ) : '<div style="font-size:.82rem;color:#d1fae5;">تمت إضافة النقاط إلى حسابك بنجاح ⭐</div>') +
        '</div>';
    } else if (won && capReached) {
      prizeBoxHtml = '<div class="og-card" style="background:rgba(245,158,11,.12);border-color:#f59e0b;font-size:.82rem;font-weight:800;">🏆 فوز رائع! وصلت للحد اليومي للجوائز (' + cfg.dailyPrizeCap + '/' + cfg.dailyPrizeCap + ') — استمر باللعب لتحطيم الأرقام القياسية وصدارة الأسبوع!</div>';
    } else if (won && prizeResult && prizeResult.type === "none") {
      prizeBoxHtml = '<div class="og-card" style="font-size:.9rem;font-weight:900;">' + esc(prizeResult.label) + '</div>';
    }

    var body = document.getElementById("og-body");
    body.innerHTML =
      '<div class="og-card og-result-box">' +
        (won ? '<canvas id="og-confetti-cv"></canvas>' : '') +
        '<div style="position:relative;z-index:3;">' +
          '<div style="font-size:3.2rem;">' + (won ? "🏆🎉" : "😅⏱️") + '</div>' +
          '<h2 style="margin:6px 0;font-weight:900;color:' + (won ? "#15803d" : "#dc2626") + ';">' + (won ? "أحسنت! فزت بالتحدي!" : (opts.loseReason || "انتهى الوقت ولم تصل للهدف!")) + '</h2>' +
          '<div style="font-size:.86rem;font-weight:800;margin-bottom:8px;">نتيجتك: <strong>' + score + '</strong>' + (target > 0 && !opts.isScratch ? (' / الهدف المطلوب: <strong>' + target + '</strong>') : '') + ' • ' + diffLbl + '</div>' +
          (missionBonus > 0 ? '<div style="display:inline-block;background:#16a34a;color:#fff;padding:4px 12px;border-radius:99px;font-size:.76rem;font-weight:900;margin-bottom:8px;">🎯 أنجزت مهمة اليوم: +' + missionBonus + ' نقطة إضافية!</div>' : '') +
          prizeBoxHtml +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px;">' +
            '<button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV96.startGame(\'' + esc(gid) + '\',\'' + esc(diff) + '\')">🔄 العب تاني</button>' +
            (gid !== "scratch" ? '<button type="button" class="og-btn og-btn-dark" onclick="window.ZaitGamesV96.openGame(\'' + esc(gid) + '\')">🎚️ تحديد الصعوبة</button>' : '') +
            '<button type="button" class="og-btn og-btn-ghost" onclick="window.ZaitGamesV96.backToHub()">🚪 خروج</button>' +
          '</div>' +
          (won && cfg.enableWhatsappChallenge ? '<a href="https://wa.me/?text=' + encodeURIComponent(waText) + '" target="_blank" rel="noopener" class="og-btn og-btn-wa" style="width:100%;max-width:340px;margin-top:10px;text-decoration:none;">⚔️ تحدَّ صديقك على واتساب</a>' : '') +
        '</div>' +
      '</div>';

    if (won) launchConfetti();
  }

  function launchConfetti() {
    var cv = document.getElementById("og-confetti-cv");
    if (!cv) return;
    var r = cv.getBoundingClientRect();
    var ctx = cv.getContext("2d");
    cv.width = r.width || 360;
    cv.height = r.height || 360;
    var cols = ["#f4cf6d", "#22c55e", "#ef4444", "#38bdf8", "#f97316", "#a855f7"];
    var parts = [];
    for (var i = 0; i < 65; i++) {
      parts.push({ x: Math.random() * cv.width, y: -Math.random() * 140, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3.5, sz: 5 + Math.random() * 6, c: cols[i % cols.length], rot: Math.random() * 6 });
    }
    var frames = 0;
    (function loop() {
      if (!cv.parentNode || frames++ > 130) return;
      ctx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += 0.1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.c; ctx.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz * 0.6);
        ctx.restore();
      });
      requestAnimationFrame(loop);
    })();
  }

  // =========================================================================
  // GAME RUNNER + SHARED HELPER API FOR PART-2 GAMES
  // =========================================================================
  function createStageShell(title, durationSec, targetLabel) {
    var body = document.getElementById("og-body");
    body.innerHTML =
      '<div class="og-stage-bar">' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
          '<span class="og-stat-chip" id="og-st-score">⭐ 0</span>' +
          (targetLabel ? '<span class="og-stat-chip" id="og-st-target">🎯 ' + esc(targetLabel) + '</span>' : '') +
          '<span class="og-stat-chip" id="og-st-extra"></span>' +
        '</div>' +
        '<div style="display:flex;gap:6px;align-items:center;">' +
          '<span class="og-stat-chip" id="og-st-time">⏱️ ' + durationSec + 'ث</span>' +
          '<button type="button" class="og-ic-btn" id="og-pause-btn" title="إيقاف مؤقت">⏸️</button>' +
          '<button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV96.backToHub()">✕</button>' +
        '</div>' +
      '</div>' +
      '<div class="og-time-track"><div class="og-time-fill" id="og-time-fill" style="width:100%;"></div></div>' +
      '<div id="og-stage-host" style="position:relative;"></div>';

    var host = document.getElementById("og-stage-host");
    document.getElementById("og-pause-btn").onclick = function () { togglePause(host); };
    return {
      host: host,
      setScore: function (t) { var e = document.getElementById("og-st-score"); if (e) e.textContent = t; },
      setTarget: function (t) { var e = document.getElementById("og-st-target"); if (e) e.textContent = t; },
      setExtra: function (t) { var e = document.getElementById("og-st-extra"); if (e) { e.textContent = t; e.style.display = t ? "" : "none"; } },
      setTime: function (rem, total) {
        var e = document.getElementById("og-st-time");
        var f = document.getElementById("og-time-fill");
        if (e) e.textContent = "⏱️ " + Math.max(0, Math.ceil(rem)) + "ث";
        if (f) {
          var pct = Math.max(0, Math.min(100, (rem / Math.max(1, total)) * 100));
          f.style.width = pct + "%";
          f.classList.toggle("danger", rem <= 5);
        }
      },
      shake: function () {
        host.classList.remove("og-shake");
        void host.offsetWidth;
        host.classList.add("og-shake");
      },
      onPauseChange: function (fn) { pauseListeners.push(fn); }
    };
  }

  function startGameRun(gid, diff) {
    stopActiveGame();
    currentView = "playing";
    activeGameId = gid;
    activeDiff = diff || "medium";
    recordPlayAnalytics(gid);

    var gc = getGameConfig(gid);
    var duration = Number((gc.times && gc.times[activeDiff]) || 25);
    var target = Number((gc.targets && gc.targets[activeDiff]) || 30);

    // Check Part-2 Extra Games Registry first!
    if (window.ZaitGamesExtraRegistry && window.ZaitGamesExtraRegistry[gid] && typeof window.ZaitGamesExtraRegistry[gid].launch === "function") {
      var api = {
        diff: activeDiff,
        duration: duration,
        target: target,
        createStageShell: createStageShell,
        setupHiDpiCanvas: setupHiDpiCanvas,
        runCountdown: runCountdown,
        playSfx: playSfx,
        haptic: haptic,
        isPaused: function () { return gamePaused; },
        setCleanup: function (fn) { activeGameCleanup = fn; },
        finish: function (won, score, loseReason) {
          finishGame({ won: won, score: score, target: target, gameId: gid, diff: activeDiff, loseReason: loseReason });
        }
      };
      window.ZaitGamesExtraRegistry[gid].launch(api);
      return;
    }

    if (gid === "catch") return playCatchGame(activeDiff, duration, target);
    if (gid === "press") return playColdPressGame(activeDiff, duration, target);
    if (gid === "quiz") return playQuizGame(activeDiff, duration, target);
    if (gid === "memory") return playMemoryGame(activeDiff, duration, target);
    if (gid === "truck") return playTruckGame(activeDiff, duration, target);
    if (gid === "sorter") return playSorterGame(activeDiff, duration, target);
    if (gid === "match") return playMatchGame(activeDiff, duration, target);
    if (gid === "scratch") return playScratchCardGame();
  }

  // =========================================================================
  // GAME 1: 🧺 قطف الزيتون السيناوي (HARDER, RETINA CANVAS, WIND, BOMBS, LIVES)
  // =========================================================================
  function playCatchGame(diff, duration, target) {
    var st = createStageShell("قطف الزيتون", duration, "الهدف: " + target);
    var lives = diff === "hard" ? 2 : 3;
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-catch"></canvas></div>';
    var cv = document.getElementById("og-cv-catch");
    var g = setupHiDpiCanvas(cv, 360, 420);
    var ctx = g.ctx, W = g.w, H = g.h;

    var basketX = W / 2, basketW = diff === "hard" ? 64 : (diff === "medium" ? 72 : 80);
    var score = 0, rem = duration, running = false, ended = false;
    var items = [], particles = [], raf = null, lastTs = 0, spawnAcc = 0, lastSecTick = duration;

    var speedMul = diff === "hard" ? 1.65 : (diff === "medium" ? 1.3 : 1.0);
    var spawnMs = diff === "hard" ? 310 : (diff === "medium" ? 410 : 520);
    var bombRate = diff === "hard" ? 0.30 : (diff === "medium" ? 0.23 : 0.16);
    var windAmp = diff === "hard" ? 1.6 : (diff === "medium" ? 0.85 : 0.25);

    function setPos(clientX) {
      var rect = cv.getBoundingClientRect();
      var nx = ((clientX - rect.left) / rect.width) * W;
      basketX = Math.max(basketW / 2, Math.min(W - basketW / 2, nx));
    }
    var onMove = function (e) { if (e.touches && e.touches[0]) setPos(e.touches[0].clientX); else setPos(e.clientX); };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerdown", onMove);
    cv.addEventListener("touchmove", onMove, { passive: true });

    function spawnItem() {
      var r = Math.random();
      var kind = r < bombRate ? "bomb" : (r < bombRate + 0.14 ? "rotten" : (r > 0.84 ? "gold" : "olive"));
      items.push({
        x: 24 + Math.random() * (W - 48),
        y: -20,
        vy: (155 + Math.random() * 115) * speedMul,
        vx: (Math.random() - 0.5) * 70 * windAmp,
        kind: kind,
        rad: kind === "gold" ? 15 : 14
      });
    }

    function burst(x, y, col) {
      for (var i = 0; i < 10; i++) {
        particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 180, vy: (Math.random() - 0.7) * 180, life: 0.45, c: col });
      }
    }

    function drawBasket() {
      var bx = basketX - basketW / 2, by = H - 46;
      var grad = ctx.createLinearGradient(bx, by, bx, by + 30);
      grad.addColorStop(0, "#e5b84b"); grad.addColorStop(1, "#9a6b14");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(bx, by); ctx.lineTo(bx + basketW, by);
      ctx.lineTo(bx + basketW - 10, by + 28); ctx.lineTo(bx + 10, by + 28);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 2; ctx.stroke();
    }

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      rem -= dt;
      if (rem <= 5 && Math.ceil(rem) < lastSecTick) { lastSecTick = Math.ceil(rem); playSfx("tick"); }
      st.setTime(rem, duration);
      if (rem <= 0) {
        ended = true;
        finishGame({ won: score >= target, score: score, target: target, gameId: "catch", diff: diff });
        return;
      }

      spawnAcc += dt * 1000;
      if (spawnAcc >= spawnMs) { spawnAcc = 0; spawnItem(); }

      // Background
      var bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0b2416"); bg.addColorStop(1, "#163d27");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Update items
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.y += it.vy * dt;
        it.x += it.vx * dt;
        if (it.x < 16 || it.x > W - 16) it.vx *= -1;

        // Draw vector item
        ctx.save();
        ctx.translate(it.x, it.y);
        if (it.kind === "olive" || it.kind === "gold") {
          ctx.fillStyle = it.kind === "gold" ? "#facc15" : "#4ade80";
          ctx.beginPath(); ctx.ellipse(0, 0, it.rad * 0.85, it.rad, 0.25, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.beginPath(); ctx.arc(-4, -4, 3.5, 0, Math.PI * 2); ctx.fill();
        } else if (it.kind === "rotten") {
          ctx.fillStyle = "#78716c";
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fff"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("✕", 0, 4);
        } else {
          ctx.fillStyle = "#dc2626";
          ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fde68a"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center"; ctx.fillText("💣", 0, 5);
        }
        ctx.restore();

        // Catch collision
        if (it.y >= H - 52 && it.y <= H - 16 && Math.abs(it.x - basketX) <= basketW / 2 + 10) {
          if (it.kind === "olive") { score += 2; playSfx("pop"); haptic(10); burst(it.x, it.y, "#4ade80"); }
          else if (it.kind === "gold") { score += 5; playSfx("gold"); haptic(20); burst(it.x, it.y, "#facc15"); }
          else if (it.kind === "rotten") { score = Math.max(0, score - 4); playSfx("bad"); st.shake(); burst(it.x, it.y, "#a8a29e"); }
          else {
            lives--; score = Math.max(0, score - 6);
            st.setExtra("❤️".repeat(Math.max(0, lives)));
            playSfx("bad"); haptic(45); st.shake(); burst(it.x, it.y, "#ef4444");
            if (lives <= 0) {
              ended = true;
              finishGame({ won: false, score: score, target: target, gameId: "catch", diff: diff, loseReason: "💥 نفدت محاولاتك بسبب القنابل!" });
              return;
            }
          }
          st.setScore("⭐ " + score);
          items.splice(i, 1);
          if (score >= target) {
            ended = true;
            finishGame({ won: true, score: score, target: target, gameId: "catch", diff: diff });
            return;
          }
        } else if (it.y > H + 25) {
          items.splice(i, 1);
        }
      }

      // Particles
      for (var p = particles.length - 1; p >= 0; p--) {
        var pt = particles[p];
        pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
        if (pt.life <= 0) { particles.splice(p, 1); continue; }
        ctx.globalAlpha = Math.max(0, pt.life * 2);
        ctx.fillStyle = pt.c; ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      drawBasket();
    }

    activeGameCleanup = function () {
      ended = true;
      if (raf) cancelAnimationFrame(raf);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onMove);
      cv.removeEventListener("touchmove", onMove);
    };
    runCountdown(st.host, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // GAME 2: ❄️ تحدي العصر عالبارد (STRICT 27°C LIMIT + OVERHEAT PENALTY!)
  // =========================================================================
  function playColdPressGame(diff, duration, target) {
    var st = createStageShell("العصر عالبارد", duration, "الهدف: " + target + " نقطة");
    st.setExtra("🌡️ 18.0°م");
    st.host.innerHTML =
      '<div class="og-card" style="text-align:center;">' +
        '<div style="display:flex;justify-content:center;align-items:flex-end;gap:24px;margin:10px 0 14px;">' +
          '<div>' +
            '<div style="width:74px;height:175px;border:3px solid #d59e2a;border-radius:16px 16px 22px 22px;background:#0a1d13;position:relative;overflow:hidden;margin:0 auto;">' +
              '<div id="og-oil-fill" style="position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(180deg,#facc15,#a16207);transition:height .1s;"></div>' +
            '</div>' +
            '<div id="og-oil-pct" style="font-weight:900;margin-top:6px;">0 / ' + target + '</div>' +
          '</div>' +
          '<div>' +
            '<div style="width:28px;height:175px;border:2px solid #94a3b8;border-radius:99px;background:#0f172a;position:relative;overflow:hidden;margin:0 auto;">' +
              '<div style="position:absolute;bottom:68%;left:0;right:0;height:2px;background:#ef4444;z-index:3;"></div>' +
              '<div id="og-temp-fill" style="position:absolute;bottom:0;left:0;right:0;height:20%;background:#22c55e;transition:height .08s;"></div>' +
            '</div>' +
            '<div id="og-temp-lbl" style="font-weight:900;margin-top:6px;font-size:.82rem;">18.0°م</div>' +
          '</div>' +
        '</div>' +
        '<div id="og-press-msg" style="font-size:.78rem;font-weight:800;margin-bottom:10px;min-height:20px;">اضغط بسرعة لعصر الزيتون دون تجاوز 27°م!</div>' +
        '<button type="button" id="og-press-btn" class="og-btn og-btn-gold" style="width:100%;max-width:300px;padding:15px;font-size:1rem;">🫒 اعصر على البارد الآن!</button>' +
      '</div>';

    var oil = 0, temp = 18, lockedUntil = 0, rem = duration, running = false, ended = false;
    var heatPerTap = diff === "hard" ? 2.55 : (diff === "medium" ? 2.05 : 1.55);
    var oilPerTap = diff === "hard" ? 2.3 : (diff === "medium" ? 2.6 : 3.0);
    var coolPerSec = diff === "hard" ? 5.6 : (diff === "medium" ? 6.4 : 7.4);

    var btn = document.getElementById("og-press-btn");
    btn.onclick = function () {
      if (!running || gamePaused || ended) return;
      if (Date.now() < lockedUntil) { playSfx("bad"); return; }
      temp += heatPerTap;
      var bonus = (temp >= 22 && temp <= 26.2) ? 1.35 : 1;
      oil = Math.min(target, oil + oilPerTap * bonus);
      playSfx(bonus > 1 ? "gold" : "pop");
      haptic(12);
      if (temp > 27) {
        lockedUntil = Date.now() + (diff === "hard" ? 2100 : 1600);
        oil = Math.max(0, oil - (diff === "hard" ? 14 : 9));
        playSfx("bad"); haptic(50); st.shake();
        document.getElementById("og-press-msg").textContent = "🔥 ارتفعت الحرارة فوق 27°م! توقف للتبريد (-" + (diff === "hard" ? 14 : 9) + " نقطة)";
      }
      updateUI();
      if (oil >= target) {
        ended = true;
        finishGame({ won: true, score: Math.round(oil), target: target, gameId: "press", diff: diff });
      }
    };

    function updateUI() {
      var of = document.getElementById("og-oil-fill");
      var op = document.getElementById("og-oil-pct");
      var tf = document.getElementById("og-temp-fill");
      var tl = document.getElementById("og-temp-lbl");
      if (of) of.style.height = Math.min(100, (oil / target) * 100) + "%";
      if (op) op.textContent = Math.round(oil) + " / " + target;
      var tPct = Math.min(100, Math.max(5, ((temp - 15) / 17) * 100));
      if (tf) { tf.style.height = tPct + "%"; tf.style.background = temp >= 25.5 ? "#ef4444" : (temp >= 22 ? "#f59e0b" : "#22c55e"); }
      if (tl) tl.textContent = temp.toFixed(1) + "°م";
      st.setScore("⭐ " + Math.round(oil));
      st.setExtra("🌡️ " + temp.toFixed(1) + "°م");
    }

    var iv = setInterval(function () {
      if (!running || gamePaused || ended) return;
      rem -= 0.1;
      temp = Math.max(17.5, temp - coolPerSec * 0.1);
      if (Date.now() >= lockedUntil && document.getElementById("og-press-msg")) {
        document.getElementById("og-press-msg").textContent = temp >= 22 && temp <= 26.2 ? "⚡ منطقة مثالية! عصر مضاعف!" : "حافظ على الحرارة تحت 27°م!";
      }
      st.setTime(rem, duration);
      updateUI();
      if (rem <= 0) {
        ended = true; clearInterval(iv);
        finishGame({ won: oil >= target, score: Math.round(oil), target: target, gameId: "press", diff: diff });
      }
    }, 100);

    activeGameCleanup = function () { ended = true; clearInterval(iv); };
    runCountdown(st.host, function () { running = true; });
  }

  // =========================================================================
  // GAME 3: 🧠 تحدي خبير زيت الزيتون (10,800+ QUESTIONS + STRICT PER-Q TIMER)
  // =========================================================================
  function getQuizQuestions(diff, count) {
    var bank = window.ZAIT_QUIZ_BANK;
    if (bank && typeof bank.getRound === "function") {
      try {
        var qs = bank.getRound(diff, count, pState.seenQuizIds || []);
        if (Array.isArray(qs) && qs.length >= count) return qs;
      } catch (e) {}
    }
    if (bank && Array.isArray(bank[diff]) && bank[diff].length >= count) {
      var copy = bank[diff].slice();
      for (var i = copy.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
      }
      return copy.slice(0, count);
    }
    return [
      { q: "ما هي الدرجة القصوى لعصر زيت الزيتون على البارد؟", options: ["27 درجة مئوية", "55 درجة مئوية", "80 درجة مئوية", "100 درجة مئوية"], ans: 0 },
      { q: "ما الحد الأقصى لحموضة زيت الزيتون البكر الممتاز؟", options: ["0.8%", "2.5%", "4%", "6%"], ans: 0 },
      { q: "ما أفضل طريقة لحفظ زيت الزيتون البكر؟", options: ["زجاجة داكنة بعيداً عن الضوء والحرارة", "تحت الشمس المباشرة", "في وعاء مكشوف", "بجوار البوتاجاز"], ans: 0 },
      { q: "أين تشتهر أجود مزارع الزيتون البكر في مصر؟", options: ["شمال سيناء وسيوة", "وسط القاهرة", "الأقصر فقط", "أسوان فقط"], ans: 0 },
      { q: "ما سبب اللذعة الخفيفة في الحلق عند تذوق الزيت الأصلي؟", options: ["غناه بمضادات الأكسدة (البوليفينول)", "تلف الزيت", "إضافة ملح", "خلطه بالماء"], ans: 0 },
      { q: "أي فيتامين يتوفر بكثرة في زيت الزيتون البكر؟", options: ["فيتامين E و K", "فيتامين C", "فيتامين B12", "فيتامين D"], ans: 0 },
      { q: "هل تجمّد زيت الزيتون في الثلاجة وحده يثبت نقاءه؟", options: ["لا، التحليل المعملي والتذوق أدق", "نعم دائماً بنسبة 100%", "الزيت الأصلي لا يبرد", "لا علاقة له بدرجة الحرارة"], ans: 0 }
    ].slice(0, count);
  }

  function playQuizGame(diff, secPerQ, targetCorrect) {
    var totalQ = Math.max(3, Number(cfg.quizQuestionCount || 7));
    var need = Math.min(totalQ, Math.max(1, targetCorrect));
    var questions = getQuizQuestions(diff, totalQ);
    var st = createStageShell("خبير زيت الزيتون", secPerQ, "للفوز: " + need + "/" + totalQ);
    var qIdx = 0, correct = 0, rem = secPerQ, locked = false, ended = false;

    function renderQ() {
      if (qIdx >= questions.length) {
        ended = true;
        finishGame({
          won: correct >= need,
          score: correct,
          target: need,
          gameId: "quiz",
          diff: diff,
          loseReason: "أجبت على " + correct + " من " + totalQ + " (المطلوب للفوز " + need + ")"
        });
        return;
      }
      locked = false;
      rem = secPerQ;
      var q = questions[qIdx];
      st.setExtra("سؤال " + (qIdx + 1) + "/" + totalQ);
      st.setScore("✅ " + correct);
      st.setTime(rem, secPerQ);

      var opts = q.options || q.o || [];
      var ansIdx = typeof q.ans === "number" ? q.ans : Number(q.a || 0);
      st.host.innerHTML =
        '<div class="og-card">' +
          '<h3 style="margin:0 0 12px;font-size:.98rem;line-height:1.55;">' + esc(q.q || q.question) + '</h3>' +
          opts.map(function (op, i) {
            return '<button type="button" class="og-quiz-opt" data-idx="' + i + '">' + esc(op) + '</button>';
          }).join("") +
        '</div>';

      st.host.querySelectorAll(".og-quiz-opt").forEach(function (b) {
        b.onclick = function () {
          if (locked || gamePaused) return;
          locked = true;
          var chosen = Number(b.getAttribute("data-idx"));
          if (chosen === ansIdx) {
            correct++; b.classList.add("correct"); playSfx("gold"); haptic(15);
          } else {
            b.classList.add("wrong");
            var rightBtn = st.host.querySelector('.og-quiz-opt[data-idx="' + ansIdx + '"]');
            if (rightBtn) rightBtn.classList.add("correct");
            playSfx("bad"); haptic(40); st.shake();
          }
          st.setScore("✅ " + correct);
          setTimeout(function () { if (!ended) { qIdx++; renderQ(); } }, 780);
        };
      });
    }

    var iv = setInterval(function () {
      if (ended || locked || gamePaused) return;
      rem -= 0.1;
      st.setTime(rem, secPerQ);
      if (rem <= 0) {
        locked = true; playSfx("bad"); st.shake();
        setTimeout(function () { if (!ended) { qIdx++; renderQ(); } }, 500);
      }
    }, 100);

    activeGameCleanup = function () { ended = true; clearInterval(iv); };
    renderQ();
  }

  // =========================================================================
  // GAME 4: 🌿 ذاكرة المزرعة (3 ESCALATING STAGES WITH TIGHTER TIMERS!)
  // =========================================================================
  function playMemoryGame(diff, baseSec, stagesCount) {
    var totalStages = Math.max(1, Math.min(4, stagesCount || 3));
    var stagePairs = diff === "hard" ? [6, 8, 10] : (diff === "medium" ? [5, 7, 9] : [4, 6, 8]);
    var symbols = ["🫒", "🏺", "🌿", "🌳", "🧴", "💧", "🌞", "🏜️", "🥗", "🍯", "✨", "🏆"];
    var curStage = 0, totalScore = 0, ended = false, iv = null;

    var st = createStageShell("ذاكرة المزرعة", baseSec, "3 مراحل");

    function startStage() {
      if (iv) clearInterval(iv);
      var pairs = stagePairs[Math.min(curStage, stagePairs.length - 1)];
      var stageTime = Math.max(14, baseSec - curStage * (diff === "hard" ? 4 : 2));
      var rem = stageTime;
      st.setExtra("المرحلة " + (curStage + 1) + "/" + totalStages);
      st.setTarget("🎯 " + pairs + " أزواج");
      st.setTime(rem, stageTime);

      var deck = [];
      for (var i = 0; i < pairs; i++) { deck.push(symbols[i % symbols.length], symbols[i % symbols.length]); }
      for (var k = deck.length - 1; k > 0; k--) {
        var r = Math.floor(Math.random() * (k + 1));
        var t = deck[k]; deck[k] = deck[r]; deck[r] = t;
      }

      var cols = pairs >= 8 ? 4 : (pairs >= 6 ? 4 : 4);
      st.host.innerHTML =
        '<div class="og-card"><div class="og-mem-grid" style="grid-template-columns:repeat(' + cols + ',1fr);">' +
          deck.map(function (sym, idx) {
            return '<button type="button" class="og-mem-card" data-i="' + idx + '" data-s="' + sym + '">?</button>';
          }).join("") +
        '</div></div>';

      var open = [], matched = 0, lock = false;
      st.host.querySelectorAll(".og-mem-card").forEach(function (card) {
        card.onclick = function () {
          if (lock || gamePaused || card.classList.contains("open") || card.classList.contains("matched")) return;
          card.classList.add("open");
          card.textContent = card.getAttribute("data-s");
          playSfx("pop");
          open.push(card);
          if (open.length === 2) {
            lock = true;
            var a = open[0], b = open[1];
            if (a.getAttribute("data-s") === b.getAttribute("data-s")) {
              a.classList.add("matched"); b.classList.add("matched");
              matched++; totalScore += 15;
              st.setScore("⭐ " + totalScore);
              playSfx("gold"); haptic(15);
              open = []; lock = false;
              if (matched >= pairs) {
                clearInterval(iv);
                curStage++;
                if (curStage >= totalStages) {
                  ended = true;
                  finishGame({ won: true, score: totalScore + Math.round(rem * 2), target: totalStages, gameId: "memory", diff: diff });
                } else {
                  toast("🔥 ممتاز! الانتقال للمرحلة " + (curStage + 1) + " الأصعب!", "success");
                  setTimeout(startStage, 650);
                }
              }
            } else {
              setTimeout(function () {
                a.classList.remove("open"); b.classList.remove("open");
                a.textContent = "?"; b.textContent = "?";
                open = []; lock = false;
              }, diff === "hard" ? 420 : 560);
            }
          }
        };
      });

      iv = setInterval(function () {
        if (ended || gamePaused) return;
        rem -= 0.1;
        st.setTime(rem, stageTime);
        if (rem <= 0) {
          ended = true; clearInterval(iv);
          finishGame({ won: false, score: totalScore, target: totalStages, gameId: "memory", diff: diff, loseReason: "انتهى الوقت في المرحلة " + (curStage + 1) + "!" });
        }
      }, 100);
    }

    activeGameCleanup = function () { ended = true; if (iv) clearInterval(iv); };
    startStage();
  }

  // =========================================================================
  // GAME 5: 🚚 شاحنة زيت سيناء (3 LANES, FAST TRAFFIC, HIGHER TARGET)
  // =========================================================================
  function playTruckGame(diff, duration, target) {
    var st = createStageShell("شاحنة زيت سيناء", duration, "الهدف: " + target);
    var lives = diff === "hard" ? 2 : 3;
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML =
      '<div class="og-canvas-wrap"><canvas id="og-cv-truck"></canvas></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">' +
        '<button type="button" class="og-btn og-btn-dark" id="og-tr-right">➡️ يمين</button>' +
        '<button type="button" class="og-btn og-btn-dark" id="og-tr-left">⬅️ يسار</button>' +
      '</div>';

    var cv = document.getElementById("og-cv-truck");
    var g = setupHiDpiCanvas(cv, 360, 400);
    var ctx = g.ctx, W = g.w, H = g.h;
    var lanes = [W * 0.22, W * 0.5, W * 0.78];
    var lane = 1, score = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, spawnAcc = 0, dashY = 0;
    var objs = [];
    var spd = diff === "hard" ? 310 : (diff === "medium" ? 245 : 190);
    var spawnMs = diff === "hard" ? 440 : (diff === "medium" ? 560 : 690);
    var obsRate = diff === "hard" ? 0.56 : (diff === "medium" ? 0.46 : 0.36);

    function moveLane(dir) {
      if (!running || gamePaused) return;
      lane = Math.max(0, Math.min(2, lane + dir));
      haptic(8);
    }
    document.getElementById("og-tr-left").onclick = function () { moveLane(-1); };
    document.getElementById("og-tr-right").onclick = function () { moveLane(1); };
    var touchX = 0;
    cv.addEventListener("pointerdown", function (e) { touchX = e.clientX; });
    cv.addEventListener("pointerup", function (e) {
      var dx = e.clientX - touchX;
      if (Math.abs(dx) > 22) moveLane(dx > 0 ? 1 : -1);
      else {
        var r = cv.getBoundingClientRect();
        var rel = (e.clientX - r.left) / r.width;
        lane = rel < 0.33 ? 0 : (rel > 0.66 ? 2 : 1);
      }
    });

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts;
      rem -= dt;
      st.setTime(rem, duration);
      if (rem <= 0) {
        ended = true;
        finishGame({ won: score >= target, score: score, target: target, gameId: "truck", diff: diff });
        return;
      }

      spawnAcc += dt * 1000;
      if (spawnAcc >= spawnMs) {
        spawnAcc = 0;
        var ln = Math.floor(Math.random() * 3);
        var isRock = Math.random() < obsRate;
        objs.push({ lane: ln, y: -30, kind: isRock ? "rock" : (Math.random() > 0.78 ? "gold" : "oil") });
      }

      // Draw Sinai desert + road
      ctx.fillStyle = "#926239"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#1f2937"; ctx.fillRect(W * 0.08, 0, W * 0.84, H);
      ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 3; ctx.setLineDash([18, 16]);
      dashY = (dashY + spd * dt) % 34;
      ctx.lineDashOffset = -dashY;
      ctx.beginPath();
      ctx.moveTo(W * 0.36, 0); ctx.lineTo(W * 0.36, H);
      ctx.moveTo(W * 0.64, 0); ctx.lineTo(W * 0.64, H);
      ctx.stroke(); ctx.setLineDash([]);

      // Draw player truck
      var px = lanes[lane], py = H - 62;
      ctx.fillStyle = "#15803d"; ctx.fillRect(px - 22, py - 28, 44, 56);
      ctx.fillStyle = "#f4cf6d"; ctx.fillRect(px - 16, py - 18, 32, 24);
      ctx.fillStyle = "#0f172a"; ctx.fillRect(px - 14, py - 26, 28, 8);

      for (var i = objs.length - 1; i >= 0; i--) {
        var o = objs[i];
        o.y += spd * dt;
        var ox = lanes[o.lane];
        ctx.font = "26px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(o.kind === "rock" ? "🚧" : (o.kind === "gold" ? "🏆" : "🏺"), ox, o.y);

        if (o.lane === lane && Math.abs(o.y - py) < 34) {
          if (o.kind === "rock") {
            lives--; score = Math.max(0, score - 5);
            st.setExtra("❤️".repeat(Math.max(0, lives)));
            playSfx("bad"); haptic(45); st.shake();
            if (lives <= 0) {
              ended = true;
              finishGame({ won: false, score: score, target: target, gameId: "truck", diff: diff, loseReason: "🚧 اصطدمت الشاحنة بالعقبات!" });
              return;
            }
          } else {
            score += o.kind === "gold" ? 7 : 3;
            playSfx(o.kind === "gold" ? "gold" : "pop"); haptic(12);
          }
          st.setScore("⭐ " + score);
          objs.splice(i, 1);
          if (score >= target) {
            ended = true;
            finishGame({ won: true, score: score, target: target, gameId: "truck", diff: diff });
            return;
          }
        } else if (o.y > H + 35) {
          objs.splice(i, 1);
        }
      }
    }

    activeGameCleanup = function () { ended = true; if (raf) cancelAnimationFrame(raf); };
    runCountdown(st.host, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // GAME 6: 🎯 فرز حبات الزيتون السريع (FAST CONVEYOR BELT)
  // =========================================================================
  function playSorterGame(diff, duration, target) {
    var st = createStageShell("فرز الزيتون", duration, "الهدف: " + target);
    var lives = diff === "hard" ? 2 : 3;
    st.setExtra("❤️".repeat(lives));
    st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-sort"></canvas></div>';
    var cv = document.getElementById("og-cv-sort");
    var g = setupHiDpiCanvas(cv, 360, 360);
    var ctx = g.ctx, W = g.w, H = g.h;

    var items = [], score = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, acc = 0;
    var spd = diff === "hard" ? 215 : (diff === "medium" ? 165 : 125);
    var spawnMs = diff === "hard" ? 390 : (diff === "medium" ? 500 : 620);

    cv.addEventListener("pointerdown", function (e) {
      if (!running || gamePaused || ended) return;
      var r = cv.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width) * W;
      var y = ((e.clientY - r.top) / r.height) * H;
      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        if (Math.hypot(it.x - x, it.y - y) <= 30) {
          if (it.good) {
            score += it.gold ? 5 : 2;
            playSfx(it.gold ? "gold" : "pop"); haptic(12);
          } else {
            lives--; score = Math.max(0, score - 4);
            st.setExtra("❤️".repeat(Math.max(0, lives)));
            playSfx("bad"); haptic(45); st.shake();
            if (lives <= 0) {
              ended = true;
              finishGame({ won: false, score: score, target: target, gameId: "sorter", diff: diff, loseReason: "اخترت حبات تالفة أو أحجار!" });
              return;
            }
          }
          st.setScore("⭐ " + score);
          items.splice(i, 1);
          if (score >= target) {
            ended = true;
            finishGame({ won: true, score: score, target: target, gameId: "sorter", diff: diff });
          }
          break;
        }
      }
    });

    function loop(ts) {
      if (ended) return;
      raf = requestAnimationFrame(loop);
      if (!running || gamePaused) { lastTs = ts; return; }
      var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts; rem -= dt;
      st.setTime(rem, duration);
      if (rem <= 0) {
        ended = true;
        finishGame({ won: score >= target, score: score, target: target, gameId: "sorter", diff: diff });
        return;
      }

      acc += dt * 1000;
      if (acc >= spawnMs) {
        acc = 0;
        var row = Math.floor(Math.random() * 3);
        var good = Math.random() > (diff === "hard" ? 0.42 : 0.34);
        var gold = good && Math.random() > 0.8;
        items.push({ x: -24, y: 75 + row * 100, good: good, gold: gold });
      }

      ctx.fillStyle = "#0b1f14"; ctx.fillRect(0, 0, W, H);
      for (var b = 0; b < 3; b++) {
        ctx.fillStyle = "#1a3827"; ctx.fillRect(0, 42 + b * 100, W, 66);
      }

      for (var i = items.length - 1; i >= 0; i--) {
        var it = items[i];
        it.x += spd * dt;
        ctx.font = "30px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(it.good ? (it.gold ? "✨" : "🫒") : "🪨", it.x, it.y + 10);
        if (it.x > W + 30) items.splice(i, 1);
      }
    }

    activeGameCleanup = function () { ended = true; if (raf) cancelAnimationFrame(raf); };
    runCountdown(st.host, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
  }

  // =========================================================================
  // GAME 7: 🫧 مطابقة قطرات الذهب (6x6 CHAIN POP GRID)
  // =========================================================================
  function playMatchGame(diff, duration, target) {
    var st = createStageShell("مطابقة القطرات", duration, "الهدف: " + target);
    var icons = diff === "hard" ? ["🫒", "💧", "🌿", "🍯", "🏺"] : ["🫒", "💧", "🌿", "🍯"];
    var grid = [], score = 0, rem = duration, ended = false;
    for (var i = 0; i < 36; i++) grid.push(icons[Math.floor(Math.random() * icons.length)]);

    function renderGrid() {
      st.host.innerHTML =
        '<div class="og-card"><div class="og-match-grid">' +
          grid.map(function (ic, idx) {
            return '<button type="button" class="og-match-cell" data-i="' + idx + '">' + ic + '</button>';
          }).join("") +
        '</div><div style="text-align:center;font-size:.75rem;opacity:.8;margin-top:6px;">اضغط على أي مجموعة من ' + (diff === "hard" ? "3" : "2") + ' رموز متجاورة أو أكثر لتفجيرها!</div></div>';

      st.host.querySelectorAll(".og-match-cell").forEach(function (btn) {
        btn.onclick = function () {
          if (ended || gamePaused) return;
          var start = Number(btn.getAttribute("data-i"));
          var sym = grid[start];
          var visited = {}, queue = [start], group = [];
          visited[start] = true;
          while (queue.length) {
            var c = queue.shift();
            group.push(c);
            var r = Math.floor(c / 6), col = c % 6;
            [[r - 1, col], [r + 1, col], [r, col - 1], [r, col + 1]].forEach(function (nb) {
              if (nb[0] >= 0 && nb[0] < 6 && nb[1] >= 0 && nb[1] < 6) {
                var ni = nb[0] * 6 + nb[1];
                if (!visited[ni] && grid[ni] === sym) { visited[ni] = true; queue.push(ni); }
              }
            });
          }
          var minGrp = diff === "hard" ? 3 : 2;
          if (group.length < minGrp) { playSfx("bad"); return; }
          var pts = group.length * group.length * 4;
          score += pts;
          st.setScore("⭐ " + score);
          playSfx(group.length >= 4 ? "gold" : "pop");
          haptic(14);
          group.forEach(function (idx) { grid[idx] = icons[Math.floor(Math.random() * icons.length)]; });
          if (score >= target) {
            ended = true; clearInterval(iv);
            finishGame({ won: true, score: score, target: target, gameId: "match", diff: diff });
            return;
          }
          renderGrid();
        };
      });
    }

    var iv = setInterval(function () {
      if (ended || gamePaused) return;
      rem -= 0.1;
      st.setTime(rem, duration);
      if (rem <= 0) {
        ended = true; clearInterval(iv);
        finishGame({ won: score >= target, score: score, target: target, gameId: "match", diff: diff });
      }
    }, 100);

    activeGameCleanup = function () { ended = true; clearInterval(iv); };
    renderGrid();
  }

  // =========================================================================
  // GAME 8: 🪙 كارت الحظ «اكشط قطرة الذهب» (OUTSIDE DAILY PRIZE CAP!)
  // =========================================================================
  function playScratchCardGame() {
    var body = document.getElementById("og-body");
    var maxSc = Math.max(1, Number(cfg.dailyScratchCap || 1));
    if (pState.dailyScratchesUsed >= maxSc) {
      body.innerHTML =
        '<div class="og-card" style="text-align:center;padding:24px;">' +
          '<div style="font-size:3rem;">🪙</div>' +
          '<h3 style="margin:8px 0;">استخدمت محاولات الكشط اليوم (' + maxSc + '/' + maxSc + ')</h3>' +
          '<p style="font-size:.82rem;opacity:.8;">عد غداً لكارت حظ جديد، وجرّب باقي ألعاب المهارة الآن!</p>' +
          '<button type="button" class="og-btn og-btn-gold" onclick="window.ZaitGamesV96.backToHub()">🏠 رجوع للألعاب</button>' +
        '</div>';
      return;
    }

    var drawn = weightedDraw(cfg.scratchPrizes);
    var revealed = false;

    body.innerHTML =
      '<div class="og-card" style="text-align:center;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
          '<strong>🪙 كارت الحظ اليومي (خارج حد الـ ' + cfg.dailyPrizeCap + ' جوائز)</strong>' +
          '<button type="button" class="og-btn og-btn-ghost" style="padding:5px 10px;font-size:.76rem;" onclick="window.ZaitGamesV96.backToHub()">✕</button>' +
        '</div>' +
        '<p style="font-size:.8rem;opacity:.82;margin-bottom:10px;">امسح البطاقة الذهبية بإصبعك لاكتشاف حظك اليوم!</p>' +
        '<div style="position:relative;width:100%;max-width:340px;height:175px;margin:0 auto 12px;border-radius:18px;overflow:hidden;border:2px solid #d59e2a;background:linear-gradient(135deg,#0f2e1d,#1e5436);display:flex;align-items:center;justify-content:center;color:#fde68a;font-size:1.15rem;font-weight:900;padding:12px;">' +
          '<div>' + esc(drawn.label) + '</div>' +
          '<canvas id="og-scratch-cv" width="340" height="175" style="position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:pointer;"></canvas>' +
        '</div>' +
        '<button type="button" class="og-btn og-btn-gold" id="og-auto-scratch">✨ كشط سريع</button>' +
      '</div>';

    var cv = document.getElementById("og-scratch-cv");
    var ctx = cv.getContext("2d");
    var gr = ctx.createLinearGradient(0, 0, 340, 175);
    gr.addColorStop(0, "#f5d376"); gr.addColorStop(0.5, "#c99220"); gr.addColorStop(1, "#f2cc63");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 340, 175);
    ctx.fillStyle = "#102819"; ctx.font = "900 20px Cairo,sans-serif"; ctx.textAlign = "center";
    ctx.fillText("🪙 امسح هنا لاكتشاف هديتك 🪙", 170, 95);

    var strokes = 0, down = false;
    async function completeScratch() {
      if (revealed) return;
      revealed = true;
      pState.dailyScratchesUsed++;
      var issued = await issuePrize(drawn, "كارت اكشط قطرة الذهب");
      await syncPlayerCapsAndCouponsToCloud();
      finishGame({ won: true, isScratch: true, scratchIssued: issued, score: issued.type === "none" ? 0 : 100, gameId: "scratch", diff: "easy" });
    }

    function scratchAt(ev) {
      if (revealed) return;
      var r = cv.getBoundingClientRect();
      var x = ((ev.clientX - r.left) / r.width) * 340;
      var y = ((ev.clientY - r.top) / r.height) * 175;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
      strokes++;
      if (strokes > 24) completeScratch();
    }
    cv.addEventListener("pointerdown", function (e) { down = true; scratchAt(e); });
    cv.addEventListener("pointermove", function (e) { if (down) scratchAt(e); });
    window.addEventListener("pointerup", function () { down = false; });
    document.getElementById("og-auto-scratch").onclick = function () {
      ctx.clearRect(0, 0, 340, 175);
      completeScratch();
    };
  }

  // =========================================================================
  // COMPLETE ADMIN CONTROL PANEL (EVERY SINGLE PARAMETER + ROI ANALYTICS)
  // =========================================================================
  var adminSubTab = "general";

  function renderAdminControlPanel(hostEl) {
    if (!hostEl) return;
    var tabs = [
      { id: "general", label: "⚙️ عام والكوبونات" },
      { id: "streak",  label: "🔥 سلسلة 7 أيام والصندوق" },
      { id: "prizes",  label: "🎁 الجوائز والكشط" },
      { id: "games",   label: "🎮 الألعاب والصعوبة والنقاط" },
      { id: "roi",     label: "📊 إحصائيات ROI" }
    ];

    var html =
      '<div style="border:2px solid #d59e2a;border-radius:18px;padding:14px;margin:14px 0;background:var(--panel-bg,#fff);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">' +
          '<strong style="font-size:1rem;color:var(--primary,#153422);">🎮 لوحة التحكم الشاملة بمركز الألعاب V96 Pro</strong>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button type="button" class="og-btn og-btn-gold" style="padding:7px 14px;font-size:.8rem;" onclick="window.ZaitGamesV96.adminSaveConfig()">💾 حفظ ونشر التعديلات</button>' +
            '<button type="button" class="og-btn og-btn-ghost" style="padding:7px 10px;font-size:.78rem;" onclick="window.ZaitGamesV96.adminResetMyTries()">🔄 تصفير محاولاتي للتجربة</button>' +
          '</div>' +
        '</div>' +
        '<div class="og-adm-tabs">' + tabs.map(function (t) {
          return '<button type="button" class="og-adm-tab ' + (adminSubTab === t.id ? "active" : "") + '" onclick="window.ZaitGamesV96.adminSetTab(\'' + t.id + '\')">' + t.label + '</button>';
        }).join("") + '</div>';

    if (adminSubTab === "general") {
      html +=
        '<div class="og-adm-row"><label><input type="checkbox" id="og-c-en" ' + (cfg.enabled ? "checked" : "") + '> تشغيل مركز الألعاب بالكامل</label><label><input type="checkbox" id="og-c-flt" ' + (cfg.showFloatBtn ? "checked" : "") + '> زر الصفحة الرئيسية العائم</label><label><input type="checkbox" id="og-c-sb" ' + (cfg.showSidebarBtn ? "checked" : "") + '> زر القائمة الجانبية</label></div>' +
        '<div class="og-adm-row"><span>🎁 الحد اليومي للجوائز لكل عميل:</span><input type="number" class="og-adm-inp" id="og-c-cap" min="1" max="50" value="' + cfg.dailyPrizeCap + '" style="width:76px;"></div>' +
        '<div class="og-adm-row"><span>🪙 محاولات كارت الكشط اليومية (خارج الحد):</span><input type="number" class="og-adm-inp" id="og-c-scap" min="1" max="20" value="' + cfg.dailyScratchCap + '" style="width:76px;"></div>' +
        '<div class="og-adm-row"><span>⏳ مدة صلاحية الكوبون (بالساعات):</span><input type="number" class="og-adm-inp" id="og-c-exp" min="1" max="720" value="' + cfg.couponExpiryHours + '" style="width:80px;"></div>' +
        '<div class="og-adm-row"><span>🛒 الحد الأدنى الافتراضي للطلب (جنيه):</span><input type="number" class="og-adm-inp" id="og-c-min" min="0" max="10000" value="' + cfg.defaultMinOrder + '" style="width:90px;"></div>' +
        '<div class="og-adm-row"><span>🧠 عدد أسئلة مسابقة خبير الزيتون:</span><input type="number" class="og-adm-inp" id="og-c-qcnt" min="3" max="30" value="' + cfg.quizQuestionCount + '" style="width:76px;"></div>' +
        '<div class="og-adm-row"><label><input type="checkbox" id="og-c-lb" ' + (cfg.enableLeaderboard ? "checked" : "") + '> تفعيل لوحة المتصدرين</label><label><input type="checkbox" id="og-c-ms" ' + (cfg.enableDailyMission ? "checked" : "") + '> المهمة اليومية</label><span>مكافأة المهمة:</span><input type="number" class="og-adm-inp" id="og-c-mbon" value="' + cfg.dailyMissionBonus + '" style="width:70px;"></div>';
    } else if (adminSubTab === "streak") {
      var days = (cfg.dailyStreak && cfg.dailyStreak.days) || [5, 10, 15, 20, 25, 30];
      var chest = (cfg.dailyStreak && cfg.dailyStreak.bigChestPrizes) || [];
      var chestSum = chest.reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
      html +=
        '<div class="og-adm-row"><label><input type="checkbox" id="og-st-en" ' + (cfg.dailyStreak.enabled ? "checked" : "") + '> 🔥 تفعيل سلسلة هدايا الدخول اليومي (7 أيام)</label></div>' +
        '<div class="og-adm-row"><strong style="width:100%;">⭐ نقاط الولاء للأيام (1 إلى 6):</strong>' +
          '<div class="og-adm-grid3">' +
            days.map(function (val, idx) {
              return '<label style="font-size:.76rem;">يوم ' + (idx + 1) + ':<input type="number" class="og-adm-inp" id="og-st-d' + idx + '" value="' + val + '" style="width:100%;margin-top:3px;"></label>';
            }).join("") +
          '</div>' +
        '</div>' +
        '<div class="og-adm-row"><strong style="color:#d97706;">🎁 هدايا ونسب الصندوق الكبير (اليوم 7) — مجموع النسب: ' + chestSum + '%</strong>' +
          '<button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.75rem;" onclick="window.ZaitGamesV96.adminAddPrize(\'chest\')">+ إضافة هدية للصندوق</button></div>' +
        renderPrizeListEditor("chest", chest);
    } else if (adminSubTab === "prizes") {
      var pSum = (cfg.prizePool || []).reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
      var sSum = (cfg.scratchPrizes || []).reduce(function (s, x) { return s + Number(x.weight || 0); }, 0);
      html +=
        '<div class="og-adm-row"><strong>🎁 سلة الجوائز العشوائية للفوز — المجموع: ' + pSum + '%</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.75rem;" onclick="window.ZaitGamesV96.adminAddPrize(\'pool\')">+ إضافة جائزة</button></div>' +
        renderPrizeListEditor("pool", cfg.prizePool || []) +
        '<div class="og-adm-row" style="margin-top:12px;"><strong>🪙 عناصر ونسب كارت الكشط — المجموع: ' + sSum + '%</strong><button type="button" class="og-btn og-btn-green" style="padding:5px 10px;font-size:.75rem;" onclick="window.ZaitGamesV96.adminAddPrize(\'scratch\')">+ إضافة عنصر</button></div>' +
        renderPrizeListEditor("scratch", cfg.scratchPrizes || []);
    } else if (adminSubTab === "games") {
      html += '<div style="font-size:.76rem;opacity:.8;margin-bottom:8px;">تحكم في تفعيل كل لعبة + <b>الوقت (ث)</b> + <b>نقاط المكسب المطلوبة (الهدف)</b> لكل مستوى صعوبة:</div>';
      html += getAllGamesMeta().map(function (gm) {
        var gc = getGameConfig(gm.id);
        return (
          '<div class="og-adm-row" style="flex-direction:column;align-items:stretch;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<strong>' + gm.icon + ' ' + esc(gm.name) + '</strong>' +
              '<label><input type="checkbox" class="og-g-en" data-gid="' + gm.id + '" ' + (gc.enabled !== false ? "checked" : "") + '> مفعّلة</label>' +
            '</div>' +
            (gm.id !== "scratch" ? (
              '<div class="og-adm-grid3">' +
                ['easy', 'medium', 'hard'].map(function (df) {
                  var dName = df === 'easy' ? '🟢 سهل' : (df === 'medium' ? '🟡 متوسط' : '🔴 صعب');
                  return (
                    '<div style="background:rgba(0,0,0,.04);padding:6px;border-radius:9px;">' +
                      '<div style="font-weight:800;font-size:.74rem;margin-bottom:4px;">' + dName + '</div>' +
                      '<label style="display:block;font-size:.7rem;">الوقت (ث):<input type="number" class="og-adm-inp og-g-time" data-gid="' + gm.id + '" data-df="' + df + '" value="' + gc.times[df] + '" style="width:100%;"></label>' +
                      '<label style="display:block;font-size:.7rem;margin-top:3px;">نقاط المكسب:<input type="number" class="og-adm-inp og-g-targ" data-gid="' + gm.id + '" data-df="' + df + '" value="' + gc.targets[df] + '" style="width:100%;"></label>' +
                    '</div>'
                  );
                }).join("") +
              '</div>'
            ) : '<div style="font-size:.74rem;opacity:.75;">كارت حظ يومي — يتم تعديل نسبه من تبويب (الجوائز والكشط).</div>') +
          '</div>'
        );
      }).join("");
    } else if (adminSubTab === "roi") {
      var plays = analytics.plays || {};
      var totalPlays = Object.values(plays).reduce(function (s, n) { return s + Number(n || 0); }, 0);
      html +=
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:10px;">' +
          '<div class="og-adm-row" style="flex-direction:column;text-align:center;"><span>🎮 إجمالي مرات اللعب</span><strong style="font-size:1.25rem;color:#15803d;">' + totalPlays + '</strong></div>' +
          '<div class="og-adm-row" style="flex-direction:column;text-align:center;"><span>🎟️ كوبونات صادرة</span><strong style="font-size:1.25rem;color:#d97706;">' + Number(analytics.couponsIssued || 0) + '</strong></div>' +
          '<div class="og-adm-row" style="flex-direction:column;text-align:center;"><span>✅ كوبونات استُخدمت</span><strong style="font-size:1.25rem;color:#0284c7;">' + Number(analytics.couponsRedeemed || 0) + '</strong></div>' +
          '<div class="og-adm-row" style="flex-direction:column;text-align:center;"><span>💰 مبيعات عبر الألعاب</span><strong style="font-size:1.25rem;color:#15803d;">' + Number(analytics.revenueFromGames || 0).toLocaleString("ar-EG") + ' ج</strong></div>' +
        '</div>' +
        '<div class="og-adm-row" style="flex-direction:column;align-items:stretch;"><strong>📈 الأكثر لعباً:</strong>' +
          getAllGamesMeta().map(function (gm) {
            return '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed rgba(0,0,0,.08);"><span>' + gm.icon + ' ' + esc(gm.name) + '</span><strong>' + Number(plays[gm.id] || 0) + ' مرة</strong></div>';
          }).join("") +
        '</div>';
    }

    html += '</div>';
    hostEl.innerHTML = html;
  }

  function renderPrizeListEditor(kind, list) {
    return list.map(function (p, i) {
      return (
        '<div class="og-adm-row" data-pkind="' + kind + '" data-pidx="' + i + '">' +
          '<input type="text" class="og-adm-inp og-p-lbl" value="' + esc(p.label) + '" placeholder="اسم الهدية" style="flex:1;min-width:130px;">' +
          '<select class="og-adm-inp og-p-type">' +
            '<option value="points" ' + (p.type === "points" ? "selected" : "") + '>⭐ نقاط</option>' +
            '<option value="percent" ' + (p.type === "percent" ? "selected" : "") + '>🎟️ خصم %</option>' +
            '<option value="free_shipping" ' + (p.type === "free_shipping" ? "selected" : "") + '>🚚 شحن مجاني</option>' +
            '<option value="none" ' + (p.type === "none" ? "selected" : "") + '>🌿 حظ أوفر</option>' +
          '</select>' +
          '<label style="font-size:.72rem;">القيمة:<input type="number" class="og-adm-inp og-p-val" value="' + Number(p.value || 0) + '" style="width:58px;"></label>' +
          '<label style="font-size:.72rem;">حد طلب:<input type="number" class="og-adm-inp og-p-min" value="' + Number(p.minOrder || 0) + '" style="width:66px;"></label>' +
          '<label style="font-size:.72rem;">النسبة%:<input type="number" class="og-adm-inp og-p-wgt" value="' + Number(p.weight || 0) + '" style="width:56px;"></label>' +
          '<button type="button" class="og-ic-btn red" onclick="window.ZaitGamesV96.adminDelPrize(\'' + kind + '\',' + i + ')">🗑️</button>' +
        '</div>'
      );
    }).join("");
  }

  function readAdminDomIntoConfig() {
    var valNum = function (id, def) { var e = document.getElementById(id); return e ? Number(e.value || def) : def; };
    var valChk = function (id, def) { var e = document.getElementById(id); return e ? !!e.checked : def; };

    if (adminSubTab === "general") {
      cfg.enabled = valChk("og-c-en", cfg.enabled);
      cfg.showFloatBtn = valChk("og-c-flt", cfg.showFloatBtn);
      cfg.showSidebarBtn = valChk("og-c-sb", cfg.showSidebarBtn);
      cfg.dailyPrizeCap = Math.max(1, valNum("og-c-cap", cfg.dailyPrizeCap));
      cfg.dailyScratchCap = Math.max(1, valNum("og-c-scap", cfg.dailyScratchCap));
      cfg.couponExpiryHours = Math.max(1, valNum("og-c-exp", cfg.couponExpiryHours));
      cfg.defaultMinOrder = Math.max(0, valNum("og-c-min", cfg.defaultMinOrder));
      cfg.quizQuestionCount = Math.max(3, valNum("og-c-qcnt", cfg.quizQuestionCount));
      cfg.enableLeaderboard = valChk("og-c-lb", cfg.enableLeaderboard);
      cfg.enableDailyMission = valChk("og-c-ms", cfg.enableDailyMission);
      cfg.dailyMissionBonus = Math.max(0, valNum("og-c-mbon", cfg.dailyMissionBonus));
    } else if (adminSubTab === "streak") {
      cfg.dailyStreak.enabled = valChk("og-st-en", cfg.dailyStreak.enabled);
      for (var i = 0; i < 6; i++) cfg.dailyStreak.days[i] = Math.max(1, valNum("og-st-d" + i, (i + 1) * 5));
      cfg.dailyStreak.bigChestPrizes = readPrizeRows("chest");
    } else if (adminSubTab === "prizes") {
      cfg.prizePool = readPrizeRows("pool");
      cfg.scratchPrizes = readPrizeRows("scratch");
    } else if (adminSubTab === "games") {
      document.querySelectorAll(".og-g-en[data-gid]").forEach(function (el) {
        var gid = el.getAttribute("data-gid");
        cfg.games[gid] = getGameConfig(gid);
        cfg.games[gid].enabled = !!el.checked;
      });
      document.querySelectorAll(".og-g-time[data-gid]").forEach(function (el) {
        var gid = el.getAttribute("data-gid"), df = el.getAttribute("data-df");
        cfg.games[gid] = getGameConfig(gid);
        cfg.games[gid].times[df] = Math.max(5, Number(el.value || 25));
      });
      document.querySelectorAll(".og-g-targ[data-gid]").forEach(function (el) {
        var gid = el.getAttribute("data-gid"), df = el.getAttribute("data-df");
        cfg.games[gid] = getGameConfig(gid);
        cfg.games[gid].targets[df] = Math.max(1, Number(el.value || 20));
      });
    }
  }

  function readPrizeRows(kind) {
    var out = [];
    document.querySelectorAll('.og-adm-row[data-pkind="' + kind + '"]').forEach(function (row, idx) {
      out.push({
        id: kind + "_" + idx + "_" + Date.now(),
        label: (row.querySelector(".og-p-lbl").value || "هدية").trim(),
        type: row.querySelector(".og-p-type").value,
        value: Number(row.querySelector(".og-p-val").value || 0),
        minOrder: Number(row.querySelector(".og-p-min").value || 0),
        weight: Math.max(0, Number(row.querySelector(".og-p-wgt").value || 0))
      });
    });
    return out;
  }

  // =========================================================================
  // PUBLIC API & LIFECYCLE
  // =========================================================================
  function openGames(directGameId) {
    if (!cfg.enabled) return toast("مركز الألعاب متوقف مؤقتاً من الإدارة", "info");
    var ov = ensureOverlay();
    ov.classList.add("open");
    isOpen = true;
    syncFromCloud();
    if (directGameId) openGameEntry(directGameId);
    else renderHub();
  }

  function closeGames() {
    stopActiveGame();
    isOpen = false;
    var ov = document.getElementById("og-overlay");
    if (ov) ov.classList.remove("open");
  }

  window.ZaitGamesV96 = {
    open: openGames,
    close: closeGames,
    backToHub: renderHub,
    openGame: openGameEntry,
    startGame: startGameRun,
    openCoupons: openCouponsView,
    openLeaderboard: openLeaderboardView,
    claimStreak: claimDailyStreakReward,
    setCat: function (c) { currentCategory = c; renderHub(); },
    toggleSound: function () {
      soundOn = !soundOn;
      var b = document.getElementById("og-snd-btn");
      if (b) b.textContent = soundOn ? "🔊" : "🔇";
    },
    getConfig: function () { return cfg; },
    getActiveCoupons: getActiveCoupons,
    applyCouponAndShop: function (code) {
      try {
        navigator.clipboard && navigator.clipboard.writeText(code).catch(function () {});
        localStorage.setItem("zait_v96_active_promo", code);
      } catch (e) {}
      closeGames();
      var inp = document.getElementById("promo-code-input") || document.getElementById("coupon-input") || document.querySelector('input[placeholder*="كوبون"], input[placeholder*="خصم"]');
      if (inp) {
        inp.value = code;
        inp.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (typeof window.applyPromoCode === "function") {
        try { window.applyPromoCode(); } catch (e) {}
      }
      toast("✅ تم نسخ الكود (" + code + ") وتجهيزه في السلة! تسوّق الآن 🛒", "success");
    },
    mountAdminPanel: function (el) {
      window.__V96_ADMIN_HOST__ = el;
      renderAdminControlPanel(el);
    },
    adminSetTab: function (t) {
      readAdminDomIntoConfig();
      adminSubTab = t;
      renderAdminControlPanel(window.__V96_ADMIN_HOST__);
    },
    adminAddPrize: function (kind) {
      readAdminDomIntoConfig();
      var fresh = { id: "nw_" + Date.now(), label: "هدية جديدة 🎁", type: "points", value: 15, minOrder: 0, weight: 10 };
      if (kind === "chest") cfg.dailyStreak.bigChestPrizes.push(fresh);
      else if (kind === "pool") cfg.prizePool.push(fresh);
      else cfg.scratchPrizes.push(fresh);
      renderAdminControlPanel(window.__V96_ADMIN_HOST__);
    },
    adminDelPrize: function (kind, idx) {
      readAdminDomIntoConfig();
      if (kind === "chest") cfg.dailyStreak.bigChestPrizes.splice(idx, 1);
      else if (kind === "pool") cfg.prizePool.splice(idx, 1);
      else cfg.scratchPrizes.splice(idx, 1);
      renderAdminControlPanel(window.__V96_ADMIN_HOST__);
    },
    adminSaveConfig: async function () {
      readAdminDomIntoConfig();
      saveLocalJson(CFG_STORAGE_KEY, cfg);
      var fs = getFsHelpers();
      if (navigator.onLine && fs) {
        try {
          await fs.setDoc(fs.doc(fs.db, CFG_DOC_PATH[0], CFG_DOC_PATH[1]), cfg, { merge: true });
          toast("✅ تم حفظ ونشر إعدادات الألعاب V96 لكل العملاء!", "success");
        } catch (e) {
          toast("✅ تم الحفظ محلياً (تحقق من قواعد Firestore للمزامنة)", "info");
        }
      } else {
        toast("✅ تم حفظ الإعدادات محلياً!", "success");
      }
      if (typeof window.V96_syncButtonsVisibility === "function") window.V96_syncButtonsVisibility();
    },
    adminResetMyTries: async function () {
      pState.dailyPrizesWon = 0;
      pState.dailyScratchesUsed = 0;
      pState.lastStreakClaimDate = "";
      pState.missionDone = false;
      await syncPlayerCapsAndCouponsToCloud();
      toast("🔄 تم تصفير محاولاتك وهدية اليوم للتجربة الفورية!", "success");
    }
  };

  // Compatibility alias with existing V94/V95 buttons across the store
  window.ZaitOliveGames = window.ZaitGamesV96;
  window.openOliveGamesHub = openGames;
  window.openGamesHub = openGames;

  syncFromCloud();
})();
