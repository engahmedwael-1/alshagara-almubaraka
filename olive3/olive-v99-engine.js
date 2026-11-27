/* ============================================================================
   Zait Store Olive Games V99 Pro Upgrade Layer — 1,000 Levels + 50 Worlds +
   3-Star System + Boss Stages + Olive Coins Upgrade Shop
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_V99_1000_ENGINE__) return;
  window.__ZAIT_V99_1000_ENGINE__ = true;

  var V99_STORE_KEY = "zait_v99_meta_progress";
  var WORLDS = [
    { name: "واحة العريش الخضراء", grad: "linear-gradient(135deg,#0d3b22,#1f6e3f)" },
    { name: "سهول سيناء الذهبية", grad: "linear-gradient(135deg,#78350f,#b45309)" },
    { name: "معصرة النقاء الملكية", grad: "linear-gradient(135deg,#134e4a,#0f766e)" },
    { name: "ليالي جبال الطور", grad: "linear-gradient(135deg,#1e1b4b,#3730a3)" },
    { name: "قلعة الشجرة المباركة", grad: "linear-gradient(135deg,#581c87,#9d174d)" },
    { name: "ساحل المتوسط السيناوي", grad: "linear-gradient(135deg,#0c4a6e,#0284c7)" },
    { name: "وادي البكر الممتاز", grad: "linear-gradient(135deg,#365314,#65a30d)" },
    { name: "قمة الأبطال الأسطورية", grad: "linear-gradient(135deg,#7f1d1d,#ca8a04)" }
  ];

  var UPGRADE_DEFS = [
    { id: "time",   icon: "⏱️", name: "تمديد الوقت", desc: "+4 ثوانٍ إضافية في كل دور لكل مستوى ترقية", baseCost: 60, maxLv: 5 },
    { id: "life",   icon: "❤️", name: "قلب الحماية", desc: "فرص ومقاومة أعلى في أدوار الزعماء الصعبة", baseCost: 90, maxLv: 3 },
    { id: "coins",  icon: "🪙", name: "مضاعف عملات الزيتون", desc: "+25% عملات زيتون إضافية عند الفوز بأي دور", baseCost: 75, maxLv: 5 },
    { id: "shield", icon: "🛡️", name: "درع البداية الذهبي", desc: "بداية أقوى وتسهيل ذكي في الأدوار المتقدمة", baseCost: 110, maxLv: 3 }
  ];

  function loadMeta() {
    var def = { coins: 100, stars: {}, upgrades: { time: 0, life: 0, coins: 0, shield: 0 }, chapterPage: {} };
    try {
      var raw = localStorage.getItem(V99_STORE_KEY);
      if (raw) {
        var p = JSON.parse(raw);
        return Object.assign(def, p, { upgrades: Object.assign(def.upgrades, p.upgrades || {}) });
      }
    } catch (e) {}
    return def;
  }
  var v99Meta = loadMeta();
  function saveMeta() { try { localStorage.setItem(V99_STORE_KEY, JSON.stringify(v99Meta)); } catch (e) {} }

  // Deterministic PRNG (Mulberry32) so every Stage 1..1000 has a unique repeatable layout!
  function seededRng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Smooth asymptotic difficulty curve (0.0 at Stage 1 -> approaches 1.0 smoothly at Stage 1000, NEVER breaks physics!)
  function levelDifficulty(stage) {
    var s = Math.max(1, Number(stage || 1));
    var isBoss = (s % 10 === 0);
    var base = 1 - Math.exp(-((s - 1) / 95)); // Smooth 0..1 curve across 1,000 stages
    var wave = ((s - 1) % 10) * 0.025; // Gentle micro-climb inside every 10-stage chapter
    return Math.min(1.15, base * 0.78 + wave + (isBoss ? 0.14 : 0));
  }

  function getWorldForStage(stage) {
    var wNum = Math.ceil(Math.max(1, stage) / 20);
    var wDef = WORLDS[(wNum - 1) % WORLDS.length];
    return { num: wNum, name: wDef.name, grad: wDef.grad };
  }

  function injectV99Css() {
    if (document.getElementById("zait-v99-pro-css")) return;
    var st = document.createElement("style");
    st.id = "zait-v99-pro-css";
    st.textContent = [
      ".v99-world-bar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;padding:10px 12px;border-radius:14px;color:#fff;border:1.5px solid #f4cf6d}",
      ".v99-stage-map{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin:10px 0}",
      "@media(max-width:420px){.v99-stage-map{grid-template-columns:repeat(4,minmax(0,1fr))}}",
      ".v99-st-tile{padding:8px 4px;border-radius:13px;border:1.5px solid rgba(213,158,42,.42);background:rgba(22,163,74,.11);color:inherit;text-align:center;cursor:pointer;font-family:inherit;transition:transform .13s;position:relative}",
      ".v99-st-tile:active{transform:scale(.95)}",
      ".v99-st-tile.cur{background:linear-gradient(135deg,#fef08a,#f59e0b);border-color:#d97706;color:#111;font-weight:900;box-shadow:0 4px 14px rgba(245,158,11,.4)}",
      ".v99-st-tile.boss{border-color:#ef4444;background:rgba(220,38,38,.16)}",
      ".v99-st-tile.boss.cur{background:linear-gradient(135deg,#fca5a5,#dc2626);color:#fff;border-color:#fde047}",
      ".v99-st-tile.locked{opacity:.38;cursor:not-allowed;background:rgba(148,163,184,.12);border-color:rgba(148,163,184,.28)}",
      ".v99-st-stars{font-size:.6rem;letter-spacing:-1px;line-height:1;margin-top:2px}",
      ".v99-pager{display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-top:10px}",
      ".v99-shop-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px;border-radius:14px;background:rgba(213,158,42,.08);border:1.5px solid rgba(213,158,42,.35);margin-bottom:8px;flex-wrap:wrap}",
      ".v99-coins-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:99px;background:linear-gradient(135deg,#f59e0b,#b45309);color:#fff;font-weight:900;font-size:.78rem;cursor:pointer;border:1px solid #fde68a}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function getMaxStagesFor(gid) {
    if (gid === "scratch") return 1;
    try {
      var c = JSON.parse(localStorage.getItem("zait_v96_games_config") || "{}");
      if (c && c.games && c.games[gid] && Number(c.games[gid].maxStages) >= 50) return Math.min(1000, Number(c.games[gid].maxStages));
    } catch (e) {}
    return 1000; // Default: 1,000 Levels per game!
  }

  function getUnlockedStage(gid) {
    try {
      var st = JSON.parse(localStorage.getItem("zait_v96_player_state") || "{}");
      return Math.max(1, Number((st.unlockedStage && st.unlockedStage[gid]) || 1));
    } catch (e) { return 1; }
  }

  function unlockNextStageIfWon(gid, stageNum) {
    var maxSt = getMaxStagesFor(gid);
    try {
      var st = JSON.parse(localStorage.getItem("zait_v96_player_state") || "{}");
      st.unlockedStage = st.unlockedStage || {};
      var cur = Math.max(1, Number(st.unlockedStage[gid] || 1));
      if (stageNum >= cur && stageNum < maxSt) {
        st.unlockedStage[gid] = stageNum + 1;
        localStorage.setItem("zait_v96_player_state", JSON.stringify(st));
      }
    } catch (e) {}
    // Award 3 stars & Olive Coins!
    var key = gid + ":" + stageNum;
    var isBoss = (stageNum % 10 === 0);
    var earnedStars = isBoss ? 3 : (2 + Math.floor(Math.random() * 2));
    v99Meta.stars[key] = Math.max(Number(v99Meta.stars[key] || 0), earnedStars);
    var coinMult = 1 + (v99Meta.upgrades.coins || 0) * 0.25;
    var baseCoins = isBoss ? 45 : (12 + Math.min(25, Math.floor(stageNum / 15)));
    v99Meta.coins += Math.round(baseCoins * coinMult);
    saveMeta();
  }

  function renderUpgradeShopView() {
    var body = document.getElementById("og-body");
    if (!body) return;
    body.innerHTML =
      '<div class="og-arena-wrap">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">' +
          '<strong style="font-size:1.02rem;">🛒 متجر ترقيات الألعاب (عملاتك: ' + v99Meta.coins + ' 🪙)</strong>' +
          '<button type="button" class="og-btn og-btn-dark" style="padding:6px 12px;" onclick="window.ZaitGamesV98.backToHub()">← رجوع للصالة</button>' +
        '</div>' +
        '<div class="og-card">' +
          '<p style="font-size:.78rem;opacity:.85;margin:0 0 10px;">اربح عملات الزيتون 🪙 مع كل دور تفوز به واستخدمها لترقية قدراتك الدائمة في جميع الألعاب الـ 21!</p>' +
          UPGRADE_DEFS.map(function (u) {
            var lv = Number(v99Meta.upgrades[u.id] || 0);
            var maxed = lv >= u.maxLv;
            var cost = Math.round(u.baseCost * Math.pow(1.65, lv));
            var canBuy = !maxed && v99Meta.coins >= cost;
            return (
              '<div class="v99-shop-row">' +
                '<div style="flex:1;min-width:170px;">' +
                  '<div style="font-weight:900;font-size:.9rem;">' + u.icon + ' ' + u.name + ' <span style="color:#d97706;">(المستوى ' + lv + '/' + u.maxLv + ')</span></div>' +
                  '<div style="font-size:.74rem;opacity:.82;margin-top:2px;">' + u.desc + '</div>' +
                '</div>' +
                '<button type="button" class="og-btn ' + (maxed ? 'og-btn-ghost' : (canBuy ? 'og-btn-gold' : 'og-btn-ghost')) + '" style="padding:8px 13px;font-size:.78rem;" ' + (canBuy ? ('onclick="window.ZaitV99.buyUpgrade(\'' + u.id + '\')"') : 'disabled') + '>' +
                  (maxed ? '✅ أقصى ترقية' : ('ترقية (' + cost + ' 🪙)')) +
                '</button>' +
              '</div>'
            );
          }).join("") +
        '</div>' +
      '</div>';
  }

  function render1000StageMap(gid, metaInfo) {
    var body = document.getElementById("og-body");
    if (!body) return;
    var maxSt = getMaxStagesFor(gid);
    var unlocked = Math.min(maxSt, getUnlockedStage(gid));
    var totalWorlds = Math.ceil(maxSt / 20);
    var curWorld = v99Meta.chapterPage[gid] || Math.ceil(unlocked / 20);
    curWorld = Math.max(1, Math.min(totalWorlds, curWorld));
    v99Meta.chapterPage[gid] = curWorld;
    saveMeta();

    var startS = (curWorld - 1) * 20 + 1;
    var endS = Math.min(maxSt, curWorld * 20);
    var wInfo = getWorldForStage(startS);

    var tilesHtml = "";
    for (var s = startS; s <= endS; s++) {
      var locked = s > unlocked;
      var isCur = s === unlocked;
      var isBoss = (s % 10 === 0);
      var stCount = Number(v99Meta.stars[gid + ":" + s] || 0);
      var starsStr = stCount > 0 ? "⭐".repeat(stCount) : (isBoss ? "👑 زعيم" : (locked ? "🔒" : "▶"));
      tilesHtml +=
        '<button type="button" class="v99-st-tile' + (isCur ? " cur" : "") + (isBoss ? " boss" : "") + (locked ? " locked" : "") + '" ' +
          (locked ? "disabled" : ('onclick="window.ZaitGamesV98.startStage(\'' + gid + '\',' + s + ')"')) + '>' +
          '<div style="font-size:.86rem;font-weight:900;">' + (isBoss ? "👑 " : "") + s + '</div>' +
          '<div class="v99-st-stars">' + starsStr + '</div>' +
        '</button>';
    }

    var totalGameStars = 0;
    Object.keys(v99Meta.stars).forEach(function (k) { if (k.indexOf(gid + ":") === 0) totalGameStars += Number(v99Meta.stars[k] || 0); });

    body.innerHTML =
      '<div class="og-arena-wrap">' +
        '<div class="og-app-splash" style="background:' + (metaInfo.grad || wInfo.grad) + ';">' +
          '<button type="button" class="og-ic-btn" style="position:absolute;top:10px;left:10px;" onclick="window.ZaitGamesV98.backToHub()">← الصالة</button>' +
          '<button type="button" class="v99-coins-pill" style="position:absolute;top:10px;right:10px;" onclick="window.ZaitV99.openShop()">🛒 ' + v99Meta.coins + ' 🪙</button>' +
          '<div style="font-size:3rem;margin-top:16px;">' + metaInfo.icon + '</div>' +
          '<h2 style="margin:2px 0;font-size:1.22rem;font-weight:900;color:#fde68a;">' + esc(metaInfo.name) + '</h2>' +
          '<p style="font-size:.78rem;color:#e2f5e9;margin:4px auto 10px;max-width:380px;">' + esc(metaInfo.desc) + '</p>' +
          '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;font-size:.74rem;font-weight:800;">' +
            '<span style="background:rgba(0,0,0,.28);padding:3px 10px;border-radius:99px;">🏁 واصل للدور ' + unlocked + ' / ' + maxSt + '</span>' +
            '<span style="background:rgba(0,0,0,.28);padding:3px 10px;border-radius:99px;">⭐ نجومك: ' + totalGameStars + '</span>' +
          '</div>' +
          '<button type="button" class="og-btn og-btn-gold" style="width:100%;max-width:290px;padding:12px;font-size:.94rem;" onclick="window.ZaitGamesV98.startStage(\'' + gid + '\',' + unlocked + ')">🚀 العب الدور ' + unlocked + (unlocked % 10 === 0 ? ' (👑 زعيم!)' : '') + ' الآن</button>' +
        '</div>' +
        '<div class="og-card">' +
          '<div class="v99-world-bar" style="background:' + wInfo.grad + ';">' +
            '<div><strong style="font-size:.88rem;color:#fde68a;">🌍 العالم ' + curWorld + ' من ' + totalWorlds + ': ' + esc(wInfo.name) + '</strong><div style="font-size:.72rem;opacity:.9;">الأدوار ' + startS + ' إلى ' + endS + ' (كل دور 10 هو دور زعيم 👑!)</div></div>' +
          '</div>' +
          '<div class="v99-stage-map">' + tilesHtml + '</div>' +
          '<div class="v99-pager">' +
            '<button type="button" class="og-btn og-btn-dark" style="padding:7px 12px;font-size:.78rem;" ' + (curWorld <= 1 ? "disabled style='opacity:.4;padding:7px 12px;font-size:.78rem;'" : ('onclick="window.ZaitV99.setWorld(\'' + gid + '\',' + (curWorld - 1) + ')"')) + '>◀ العالم السابق</button>' +
            '<div style="display:flex;align-items:center;gap:5px;">' +
              '<span style="font-size:.74rem;font-weight:800;">الانتقال لدور:</span>' +
              '<input type="number" id="v99-jump-inp" min="1" max="' + unlocked + '" value="' + unlocked + '" class="og-adm-inp" style="width:66px;text-align:center;">' +
              '<button type="button" class="og-btn og-btn-gold" style="padding:6px 10px;font-size:.76rem;" onclick="window.ZaitV99.jumpToStage(\'' + gid + '\')">اذهب</button>' +
            '</div>' +
            '<button type="button" class="og-btn og-btn-dark" style="padding:7px 12px;font-size:.78rem;" ' + (curWorld >= totalWorlds ? "disabled style='opacity:.4;padding:7px 12px;font-size:.78rem;'" : ('onclick="window.ZaitV99.setWorld(\'' + gid + '\',' + (curWorld + 1) + ')"')) + '>العالم التالي ▶</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Expose V99 Public Helper API
  window.ZaitV99 = {
    seededRng: seededRng,
    levelDifficulty: levelDifficulty,
    getWorldForStage: getWorldForStage,
    getMeta: function () { return v99Meta; },
    getExtraTimeBonus: function () { return Number(v99Meta.upgrades.time || 0) * 4; },
    getExtraLivesBonus: function () { return Number(v99Meta.upgrades.life || 0); },
    openShop: renderUpgradeShopView,
    buyUpgrade: function (id) {
      var u = UPGRADE_DEFS.find(function (x) { return x.id === id; });
      if (!u) return;
      var lv = Number(v99Meta.upgrades[id] || 0);
      if (lv >= u.maxLv) return;
      var cost = Math.round(u.baseCost * Math.pow(1.65, lv));
      if (v99Meta.coins < cost) return;
      v99Meta.coins -= cost;
      v99Meta.upgrades[id] = lv + 1;
      saveMeta();
      renderUpgradeShopView();
      if (typeof window.showToast === "function") window.showToast("✨ تمت ترقية (" + u.name + ") للمستوى " + (lv + 1) + "!", "success");
    },
    setWorld: function (gid, wNum) {
      v99Meta.chapterPage[gid] = wNum;
      saveMeta();
      window.ZaitGamesV98.openGame(gid);
    },
    jumpToStage: function (gid) {
      var inp = document.getElementById("v99-jump-inp");
      var unl = getUnlockedStage(gid);
      var target = Math.max(1, Math.min(unl, Number(inp ? inp.value : 1) || 1));
      window.ZaitGamesV98.startStage(gid, target);
    },
    onStageWon: unlockNextStageIfWon
  };

  // Hook smoothly onto V98 Core once loaded!
  function attachToV98() {
    if (!window.ZaitGamesV98) { setTimeout(attachToV98, 80); return; }
    injectV99Css();

    var api = window.ZaitGamesV98;
    var origOpenGame = api.openGame;
    var origStartStage = api.startStage;
    var origBackToHub = api.backToHub;

    // 1. Add Shop button cleanly into Hub HUD bar whenever Hub renders
    function injectShopChip() {
      var headBtns = document.querySelector("#og-overlay .og-head-btns");
      if (headBtns && !document.getElementById("v99-shop-head-btn")) {
        var b = document.createElement("button");
        b.type = "button";
        b.id = "v99-shop-head-btn";
        b.className = "v99-coins-pill";
        b.onclick = function () { window.ZaitV99.openShop(); };
        headBtns.insertBefore(b, headBtns.firstChild);
      }
      var sb = document.getElementById("v99-shop-head-btn");
      if (sb) sb.textContent = "🛒 " + v99Meta.coins + " 🪙";
    }

    api.backToHub = function () {
      var r = origBackToHub.apply(this, arguments);
      setTimeout(injectShopChip, 20);
      return r;
    };

    // 2. Replace 10-stage selector with the 1,000-Level 50-World Interactive Map!
    api.openGame = function (gid) {
      injectShopChip();
      if (gid === "scratch") return origOpenGame.call(this, gid);
      var allReg = window.ZaitGamesExtraRegistry || {};
      var coreMetaMap = {
        zuma: { icon: "🔮", grad: "linear-gradient(135deg,#3b0764,#15803d)", name: "زوما الزيتون ديلوكس", desc: "1,000 دور عبر 50 عالماً! صوّب بالليزر وفجّر السلسلة بالكامل!" },
        breakout: { icon: "🧱", grad: "linear-gradient(135deg,#9a3412,#b45309)", name: "كاسر البراميل برو", desc: "1,000 دور بتشكيلات متجددة وهدايا ليزر وتعدد كرات!" },
        catch: { icon: "🧺", grad: "linear-gradient(135deg,#14532d,#65a30d)", name: "قطف الزيتون السيناوي", desc: "1,000 دور بمحصول متزايد ومغناطيس ودرع حماية!" }
      };
      var metaInfo = allReg[gid] || coreMetaMap[gid] || { icon: "🎮", grad: "linear-gradient(135deg,#14532d,#0f766e)", name: gid, desc: "1,000 دور متدرّج وتحديات زعماء!" };
      render1000StageMap(gid, metaInfo);
    };

    // 3. Wrap startStage so legacy games get safe bounded physics while true stage (1..1000) is tracked & unlocked!
    api.startStage = function (gid, realStageNum) {
      injectShopChip();
      var trueStage = Math.max(1, Math.min(1000, Number(realStageNum || 1)));
      window.__V99_ACTIVE_REAL_STAGE__ = trueStage;
      window.__V99_ACTIVE_GAME_ID__ = gid;

      var regDef = window.ZaitGamesExtraRegistry && window.ZaitGamesExtraRegistry[gid];
      // Native V99 1000-level games receive the true stage 1..1000; legacy Pack 1/2/3 games receive smooth bounded difficulty (1..12)
      var physicsStage = (regDef && regDef.supports1000)
        ? trueStage
        : (1 + ((trueStage - 1) % 10) + Math.min(3, Math.floor((trueStage - 1) / 40)));

      var res = origStartStage.call(this, gid, physicsStage);

      // Update visible stage chip to display TRUE 1..1000 stage + Boss Crown!
      setTimeout(function () {
        var stChip = document.querySelector("#og-overlay .og-stage-bar .og-stat-chip");
        if (stChip && stChip.textContent.indexOf("الدور") > -1) {
          stChip.textContent = (trueStage % 10 === 0 ? "👑 زعيم • الدور " : "🏁 الدور ") + trueStage;
        }
      }, 25);

      return res;
    };

    // 4. Observe Result Screen to unlock the true next stage (up to 1,000!) & award Olive Coins + fix Next Stage button!
    var bodyObs = new MutationObserver(function () {
      var resBox = document.querySelector("#og-body .og-result-box");
      if (!resBox || resBox.dataset.v99Synced) return;
      resBox.dataset.v99Synced = "1";
      var trueStage = Number(window.__V99_ACTIVE_REAL_STAGE__ || 1);
      var gid = window.__V99_ACTIVE_GAME_ID__;
      if (!gid || gid === "scratch" || gid === "chest") return;
      var h2 = resBox.querySelector("h2");
      var isWin = h2 && (h2.textContent || "").indexOf("بنجاح") > -1;
      if (isWin) {
        unlockNextStageIfWon(gid, trueStage);
        injectShopChip();
        if (h2) h2.textContent = (trueStage % 10 === 0 ? "👑 هزمت الزعيم وأنهيت الدور " : "أنهيت الدور ") + trueStage + " بنجاح! ⭐⭐⭐";
        var nextBtn = resBox.querySelector(".og-btn-gold");
        if (nextBtn && nextBtn.textContent.indexOf("التالي") > -1 && trueStage < 1000) {
          var nextS = trueStage + 1;
          nextBtn.textContent = "🚀 الدور التالي (الدور " + nextS + (nextS % 10 === 0 ? " 👑" : "") + ")";
          nextBtn.onclick = function () { window.ZaitGamesV98.startStage(gid, nextS); };
        }
      } else {
        var retryBtn = resBox.querySelector(".og-btn-gold");
        if (retryBtn && retryBtn.textContent.indexOf("إعادة") > -1) {
          retryBtn.textContent = "🔄 إعادة الدور " + trueStage;
          retryBtn.onclick = function () { window.ZaitGamesV98.startStage(gid, trueStage); };
        }
      }
    });
    var attachObs = setInterval(function () {
      var b = document.getElementById("og-body");
      if (b) { bodyObs.observe(b, { childList: true }); clearInterval(attachObs); }
    }, 300);

    // 5. Allow Admin Panel to set maxStages up to 1,000!
    var origMountAdm = api.mountAdminPanel;
    api.mountAdminPanel = function (el) {
      var r = origMountAdm.apply(this, arguments);
      setTimeout(function () {
        if (!el) return;
        el.querySelectorAll(".ag98-st").forEach(function (inp) {
          inp.max = "1000";
          if (Number(inp.value) <= 20) inp.value = String(getMaxStagesFor(inp.getAttribute("data-g")));
        });
      }, 40);
      return r;
    };

    // Upgrade existing config defaults in localStorage to 1000 stages if still at 10
    try {
      var cObj = JSON.parse(localStorage.getItem("zait_v96_games_config") || "{}");
      if (cObj && cObj.games) {
        Object.keys(cObj.games).forEach(function (k) {
          if (k !== "scratch" && Number(cObj.games[k].maxStages || 10) <= 20) cObj.games[k].maxStages = 1000;
        });
        localStorage.setItem("zait_v96_games_config", JSON.stringify(cObj));
      }
    } catch (e) {}
  }

  attachToV98();
})();
