/* مركز ألعاب الشجرة المباركة V94 — 5 ألعاب احترافية (أوفلاين وأونلاين) + لوحة تحكم كاملة للمدير */
(function () {
  if (window.__OLIVE_GAMES_ENGINE_READY__) return;
  window.__OLIVE_GAMES_ENGINE_READY__ = true;

  const PLAYED_KEY = 'zait_v94_games_played_log';
  let muted = localStorage.getItem('zait_v94_games_muted') === '1';
  let activeCleanup = null;
  let audioCtx = null;

  function playTone(freq, dur, type, vol) {
    if (muted) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (dur || 0.14));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + (dur || 0.14));
    } catch (e) {}
  }
  function sfxWin() {
    playTone(523, 0.12, 'triangle', 0.1);
    setTimeout(() => playTone(659, 0.12, 'triangle', 0.1), 110);
    setTimeout(() => playTone(784, 0.22, 'triangle', 0.11), 220);
  }
  function sfxGood() { playTone(740, 0.09, 'sine', 0.07); }
  function sfxBad() { playTone(190, 0.18, 'sawtooth', 0.07); }

  function esc(s) {
    return String(s || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function getCfg() {
    if (typeof window.V94_getGamesConfig === 'function') return window.V94_getGamesConfig();
    try {
      const raw = localStorage.getItem('zait_v94_olive_games_config');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      enabled: true,
      showHomeFab: true,
      showSidebarBtn: true,
      games: {
        catch: { enabled: true, title: 'قطف الزيتون السيناوي', rewardType: 'points', points: 25, couponCode: 'OLIVE5', couponDiscount: 5, cooldown: 'daily', targetScore: 15 },
        press: { enabled: true, title: 'تحدي العصر على البارد', rewardType: 'coupon', points: 30, couponCode: 'COLD7', couponDiscount: 7, cooldown: 'daily' },
        scratch: { enabled: true, title: 'كارت اكشط قطرة الذهب', rewardType: 'coupon', points: 20, couponCode: 'GOLD5', couponDiscount: 5, cooldown: 'daily', prizesText: 'خصم 5% فوري (GOLD5) | 25 نقطة ولاء | خصم 7% (GOLD7) | 40 نقطة ولاء' },
        quiz: {
          enabled: true, title: 'تحدي خبير زيت الزيتون', rewardType: 'points', points: 35, couponCode: 'EXPERT5', couponDiscount: 5, cooldown: 'weekly',
          questions: [
            { q: 'ما هي أقصى درجة حرارة مسموحة في العصر على البارد للحفاظ على فوائد زيت الزيتون؟', options: ['أقل من 27 درجة مئوية', '60 درجة مئوية', '100 درجة مئوية'], correct: 0, fact: 'العصر على البارد تحت 27°م يحفظ مضادات الأكسدة والفيتامينات 🌿' },
            { q: 'ما هي نسبة الحموضة العالمية التي تثبت أن زيت الزيتون "بكر ممتاز"؟', options: ['أقل من 0.8%', 'أكثر من 3%', 'أكثر من 5%'], correct: 0, fact: 'كلما قلت الحموضة عن 0.8% زاد نقاء الزيت البكر الممتاز 🏅' },
            { q: 'ما هي أفضل طريقة لحفظ زيت الزيتون البكر الممتاز في المنزل؟', options: ['في عبوة داكنة بعيداً عن الحرارة والضوء', 'في زجاجة شفافة تحت الشمس', 'بجانب البوتاجاز مباشرة'], correct: 0, fact: 'الحرارة والضوء يأكسدان الزيت — نحفظه في عبوات داكنة محكمة الإغلاق 🫒' }
          ]
        },
        memory: { enabled: true, title: 'ذاكرة مزرعة الشجرة المباركة', rewardType: 'points', points: 30, couponCode: 'FARM5', couponDiscount: 5, cooldown: 'daily' }
      }
    };
  }

  function getPlayedLog() {
    try { return JSON.parse(localStorage.getItem(PLAYED_KEY) || '{}'); } catch (e) { return {}; }
  }
  function savePlayedLog(log) {
    try { localStorage.setItem(PLAYED_KEY, JSON.stringify(log)); } catch (e) {}
  }

  function getCooldownStatus(gameKey, cooldown) {
    if (!cooldown || cooldown === 'unlimited') return { canClaim: true, text: '' };
    const log = getPlayedLog();
    const last = Number(log[gameKey] || 0);
    if (!last) return { canClaim: true, text: '' };
    const now = Date.now();
    if (cooldown === 'once') {
      return { canClaim: false, text: 'تم استلام الجائزة مسبقاً ✅ (يمكنك اللعب للمتعة)' };
    }
    const msLimit = cooldown === 'weekly' ? (7 * 24 * 3600 * 1000) : (24 * 3600 * 1000);
    const rem = msLimit - (now - last);
    if (rem <= 0) return { canClaim: true, text: '' };
    const hrs = Math.ceil(rem / (3600 * 1000));
    const txt = hrs >= 24 ? `الجائزة القادمة بعد ${Math.ceil(hrs / 24)} يوم` : `الجائزة القادمة بعد ${hrs} ساعة`;
    return { canClaim: false, text: txt + ' (يمكنك اللعب للمتعة)' };
  }

  function markRewardClaimed(gameKey) {
    const log = getPlayedLog();
    log[gameKey] = Date.now();
    savePlayedLog(log);
  }

  function stopActiveGame() {
    if (typeof activeCleanup === 'function') {
      try { activeCleanup(); } catch (e) {}
    }
    activeCleanup = null;
  }

  // =========================================================================
  // هيكل نافذة مركز الألعاب
  // =========================================================================
  function ensureModal() {
    let ov = document.getElementById('og-modal-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'og-modal-overlay';
    ov.innerHTML = `
      <div class="og-shell" role="dialog" aria-modal="true">
        <div class="og-topbar">
          <h3 class="og-topbar-title"><span>🎮</span><span>مركز ألعاب الشجرة المباركة</span></h3>
          <div class="og-topbar-actions">
            <button type="button" class="og-icon-btn" id="og-mute-btn" title="الصوت">${muted ? '🔇' : '🔊'}</button>
            <button type="button" class="og-icon-btn close-btn" id="og-close-btn" aria-label="إغلاق">✕</button>
          </div>
        </div>
        <div class="og-body" id="og-body"></div>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeHub();
    });
    document.getElementById('og-close-btn').addEventListener('click', closeHub);
    document.getElementById('og-mute-btn').addEventListener('click', () => {
      muted = !muted;
      localStorage.setItem('zait_v94_games_muted', muted ? '1' : '0');
      const mb = document.getElementById('og-mute-btn');
      if (mb) mb.textContent = muted ? '🔇' : '🔊';
    });
    return ov;
  }

  function closeHub() {
    stopActiveGame();
    const ov = document.getElementById('og-modal-overlay');
    if (ov) ov.classList.remove('open');
  }

  // =========================================================================
  // شاشة تسليم الجائزة (أونلاين وأوفلاين + منع الغش + تطبيق فوري للكوبون)
  // =========================================================================
  async function showRewardResult(container, gameKey, won, customHeadline, overridePrize) {
    const cfg = getCfg();
    const g = (cfg.games && cfg.games[gameKey]) || {};
    if (!won) {
      sfxBad();
      container.innerHTML = `
        <div class="og-result-box">
          <div style="font-size:2.6rem;">🫒</div>
          <h3 style="margin:6px 0; color:#991b1b;">حاول مرة أخرى!</h3>
          <p style="margin:0 0 10px; font-size:0.88rem; color:#475569;">${esc(customHeadline || 'اقتربت جداً من الفوز — جرب تاني واكسب جائزتك!')}</p>
          <button type="button" class="og-primary-btn" onclick="window.OliveGames_start('${gameKey}')">🔄 إعادة المحاولة الآن</button>
          <button type="button" class="og-secondary-btn" onclick="window.OliveGames_renderLobby()">🎮 اختيار لعبة أخرى</button>
        </div>
      `;
      return;
    }

    sfxWin();
    const cd = getCooldownStatus(gameKey, g.cooldown);
    if (!cd.canClaim) {
      container.innerHTML = `
        <div class="og-result-box">
          <div style="font-size:2.8rem;">🏆</div>
          <h3 style="margin:6px 0; color:#15803d;">أحسنت! فوز رائع!</h3>
          <p style="margin:0 0 8px; font-size:0.88rem; color:#334155;">${esc(customHeadline || 'أداء ممتاز!')}</p>
          <div style="background:#fef3c7; border:1px solid #f59e0b; border-radius:10px; padding:8px; font-size:0.82rem; font-weight:800; color:#92400e;">⏳ ${esc(cd.text)}</div>
          <button type="button" class="og-secondary-btn" onclick="window.OliveGames_renderLobby()">🎮 العودة لصالة الألعاب</button>
        </div>
      `;
      return;
    }

    markRewardClaimed(gameKey);

    let rType = (overridePrize && overridePrize.type) || g.rewardType || 'points';
    let ptsVal = (overridePrize && overridePrize.points) || Number(g.points) || 25;
    let cCode = String((overridePrize && overridePrize.couponCode) || g.couponCode || 'OLIVE5').trim().toUpperCase();
    let cDisc = (overridePrize && overridePrize.couponDiscount) || Number(g.couponDiscount) || 5;

    if (rType === 'coupon') {
      container.innerHTML = `
        <div class="og-result-box">
          <div style="font-size:2.9rem;">🎉</div>
          <h3 style="margin:4px 0; color:#153422;">مبروك! كسبت كود خصم ${cDisc}%!</h3>
          <p style="margin:0 0 6px; font-size:0.86rem; color:#475569;">${esc(customHeadline || 'استخدم الكود في السلة لتحصل على خصمك الفوري على زيت الشجرة المباركة 🌿')}</p>
          <div class="og-coupon-box" id="og-won-code">${esc(cCode)}</div>
          <div style="font-size:0.78rem; color:#15803d; font-weight:800;">${navigator.onLine ? '✅ الكود مفعل الآن على المتجر!' : '📶 الكود محفوظ — يمكنك نسخه واستخدامه فور عودة الإنترنت'}</div>
          <button type="button" class="og-primary-btn" onclick="(function(){try{navigator.clipboard.writeText('${esc(cCode)}');}catch(e){} if(window.V94_applyGameCouponToCart){window.V94_applyGameCouponToCart('${esc(cCode)}');} alert('✅ تم نسخ الكود (${esc(cCode)}) وتجهيزه في السلة!');})()">📋 نسخ الكود وتطبيقه في السلة 🛒</button>
          <button type="button" class="og-secondary-btn" onclick="window.OliveGames_renderLobby()">🎮 العب لعبة أخرى</button>
        </div>
      `;
    } else {
      let statusMsg = '⏳ جاري إضافة النقاط لحسابك...';
      if (typeof window.V94_awardLoyaltyPoints === 'function') {
        const res = await window.V94_awardLoyaltyPoints(ptsVal, g.title || gameKey, gameKey);
        if (res && res.synced) {
          statusMsg = `✅ تمت إضافة ${ptsVal} نقطة ولاء مباشرةً لرصيدك في المتجر!`;
        } else if (res && res.needsLogin) {
          statusMsg = `💾 تم حفظ ${ptsVal} نقطة على جهازك — سجّل الدخول في المتجر لتُضاف تلقائياً لحسابك!`;
        } else {
          statusMsg = `📶 أنت أوفلاين — تم حفظ ${ptsVal} نقطة بأمان وستُضاف تلقائياً لحسابك فور عودة الإنترنت!`;
        }
      } else {
        statusMsg = `✅ مبروك ${ptsVal} نقطة ولاء!`;
      }
      container.innerHTML = `
        <div class="og-result-box">
          <div style="font-size:2.9rem;">🏆</div>
          <h3 style="margin:4px 0; color:#153422;">مبروك! ربحت +${ptsVal} نقطة ولاء!</h3>
          <p style="margin:0 0 8px; font-size:0.86rem; color:#475569;">${esc(customHeadline || 'يمكنك استبدال نقاطك بخصم مباشر من صفحة السلة 🫒')}</p>
          <div style="background:#dcfce7; border:1px solid #16a34a; color:#166534; border-radius:10px; padding:9px 10px; font-size:0.82rem; font-weight:800;">${esc(statusMsg)}</div>
          <button type="button" class="og-secondary-btn" onclick="window.OliveGames_renderLobby()">🎮 العب لعبة أخرى</button>
        </div>
      `;
    }
  }

  // =========================================================================
  // صالة الـ 5 ألعاب (Lobby)
  // =========================================================================
  const GAME_META = [
    { key: 'catch', icon: '🧺', bg: 'linear-gradient(135deg,#15803d,#166534)', desc: 'حرّك السلة واجمع ثمار الزيتون السيناوي الأخضر والذهبي وتجنّب الحجارة!' },
    { key: 'press', icon: '❄️', bg: 'linear-gradient(135deg,#0284c7,#0369a1)', desc: 'اعصر الزيتون واملأ الزجاجة مع الحفاظ على الحرارة تحت 27°م!' },
    { key: 'scratch', icon: '🪙', bg: 'linear-gradient(135deg,#d97706,#b45309)', desc: 'امسح قطرة الذهب بإصبعك واكشف جائزتك الفورية — مناسبة لكل الأعمار!' },
    { key: 'quiz', icon: '🧠', bg: 'linear-gradient(135deg,#7c3aed,#5b21b6)', desc: 'أجب على 3 أسئلة سريعة عن زيت الزيتون الأصلي واثبت أنك خبير!' },
    { key: 'memory', icon: '🌿', bg: 'linear-gradient(135deg,#0d9488,#0f766e)', desc: 'طابق كروت مزرعة الشجرة المباركة قبل انتهاء الوقت!' }
  ];

  window.OliveGames_renderLobby = function () {
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    const cfg = getCfg();
    const pendingQ = (() => { try { return JSON.parse(localStorage.getItem('zait_v94_pending_game_rewards') || '[]'); } catch (e) { return []; } })();
    const pendingPts = pendingQ.reduce((s, r) => s + (Number(r.amount) || 0), 0);

    const enabledGames = GAME_META.filter(m => cfg.games && cfg.games[m.key] && cfg.games[m.key].enabled !== false);

    if (!cfg.enabled || enabledGames.length === 0) {
      body.innerHTML = `<div class="og-result-box"><div style="font-size:2.6rem;">🎮</div><h3>مركز الألعاب متوقف مؤقتاً</h3><p>ترقبوا العودة قريباً بجوائز وعروض جديدة!</p></div>`;
      return;
    }

    const cardsHtml = enabledGames.map(m => {
      const g = cfg.games[m.key];
      const cd = getCooldownStatus(m.key, g.cooldown);
      const rewardLabel = g.rewardType === 'coupon'
        ? `🎁 خصم ${g.couponDiscount || 5}%`
        : `⭐ +${g.points || 25} نقطة ولاء`;
      return `
        <div class="og-game-card ${cd.canClaim ? '' : 'locked'}" onclick="window.OliveGames_start('${m.key}')">
          <div class="og-game-emoji" style="background:${m.bg};">${m.icon}</div>
          <div class="og-game-info">
            <h4>${esc(g.title)}</h4>
            <p>${esc(m.desc)}</p>
            <span class="og-reward-tag ${cd.canClaim ? '' : 'done'}">${cd.canClaim ? rewardLabel : '✅ ' + esc(cd.text)}</span>
          </div>
          <button type="button" class="og-play-arrow">العب ▶</button>
        </div>
      `;
    }).join('');

    body.innerHTML = `
      <div class="og-hero-banner">
        <h3>🫒 العب واكسب مع زيت الشجرة المباركة!</h3>
        <p>5 ألعاب خفيفة وممتعة مستوحاة من مزارع سيناء — تعمل بإنترنت وبدون إنترنت!</p>
        <div class="og-status-pills">
          <span class="og-pill">${navigator.onLine ? '🟢 متصل (جوائز فورية)' : '📶 وضع الأوفلاين (تُحفظ جوائزك تلقائياً)'}</span>
          ${pendingPts > 0 ? `<span class="og-pill">⏳ ${pendingPts} نقطة بانتظار المزامنة</span>` : ''}
        </div>
      </div>
      <div class="og-games-grid">${cardsHtml}</div>
    `;
  };

  window.OliveGames_start = function (key) {
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    if (key === 'catch') runCatchGame(body);
    else if (key === 'press') runColdPressGame(body);
    else if (key === 'scratch') runScratchGame(body);
    else if (key === 'quiz') runQuizGame(body);
    else if (key === 'memory') runMemoryGame(body);
    else window.OliveGames_renderLobby();
  };

  // =========================================================================
  // اللعبة 1: 🧺 قطف الزيتون السيناوي (60fps Canvas)
  // =========================================================================
  function runCatchGame(body) {
    const g = getCfg().games.catch;
    const target = Math.max(8, Number(g.targetScore) || 15);
    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ رجوع للألعاب</button>
        <strong style="color:#153422;font-size:0.9rem;">الهدف: ${target} ثمرة 🫒</strong>
      </div>
      <div class="og-hud">
        <span>🫒 النقاط: <b id="og-c-score">0</b>/${target}</span>
        <span>⏱️ <b id="og-c-time">25</b>ث</span>
        <span id="og-c-hearts">❤️❤️❤️</span>
      </div>
      <div class="og-canvas-wrap">
        <canvas id="og-catch-canvas" width="380" height="360"></canvas>
      </div>
      <div class="og-touch-hint">👆 حرّك إصبعك يميناً ويساراً (أو الأسهم) لجمع الزيتون الأخضر (+1) والذهبي (+3) وتجنّب الحجارة 🪨</div>
      <div id="og-game-result"></div>
    `;

    const canvas = document.getElementById('og-catch-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let basketX = W / 2, basketW = 74, basketH = 34;
    let score = 0, hearts = 3, timeLeft = 25, running = true;
    const items = [], pops = [];
    let lastTs = performance.now(), spawnAcc = 0, secAcc = 0, rafId = 0;

    function pointerToX(clientX) {
      const rect = canvas.getBoundingClientRect();
      const nx = ((clientX - rect.left) / rect.width) * W;
      basketX = Math.max(basketW / 2, Math.min(W - basketW / 2, nx));
    }
    const onMove = (e) => {
      if (!running) return;
      if (e.touches && e.touches[0]) { e.preventDefault(); pointerToX(e.touches[0].clientX); }
      else pointerToX(e.clientX);
    };
    const onKey = (e) => {
      if (!running) return;
      if (e.key === 'ArrowLeft') basketX = Math.max(basketW / 2, basketX - 28);
      if (e.key === 'ArrowRight') basketX = Math.min(W - basketW / 2, basketX + 28);
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchstart', onMove, { passive: false });
    window.addEventListener('keydown', onKey);

    activeCleanup = () => {
      running = false;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchstart', onMove);
      window.removeEventListener('keydown', onKey);
    };

    function spawnItem() {
      const r = Math.random();
      let kind = 'olive', speed = 135 + Math.random() * 85, pts = 1, emoji = '🫒';
      if (r < 0.16) { kind = 'gold'; pts = 3; speed = 175 + Math.random() * 80; emoji = '✨'; }
      else if (r > 0.76) { kind = 'rock'; pts = 0; speed = 150 + Math.random() * 90; emoji = '🪨'; }
      items.push({ x: 24 + Math.random() * (W - 48), y: -20, vy: speed, kind, pts, emoji, r: 16 });
    }

    function finish(won, msg) {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
      const resBox = document.getElementById('og-game-result');
      if (resBox) showRewardResult(resBox, 'catch', won, msg);
    }

    function loop(ts) {
      if (!running) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      spawnAcc += dt;
      secAcc += dt;
      if (spawnAcc >= 0.48) { spawnAcc = 0; spawnItem(); }
      if (secAcc >= 1) {
        secAcc -= 1;
        timeLeft--;
        const tEl = document.getElementById('og-c-time');
        if (tEl) tEl.textContent = Math.max(0, timeLeft);
        if (timeLeft <= 0) {
          finish(score >= target, `جمعت ${score} نقطة من ثمار الزيتون السيناوي!`);
          return;
        }
      }

      // Draw sky + tree canopy + ground
      ctx.clearRect(0, 0, W, H);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#e0f2fe');
      sky.addColorStop(0.75, '#f0fdf4');
      sky.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Olive tree leaves at top
      ctx.fillStyle = '#15803d';
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(30 + i * 56, 8, 34, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#166534';
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(58 + i * 56, 0, 28, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & draw falling items
      const bTop = H - 56;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;

        // Draw item
        if (it.kind === 'gold') {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath(); ctx.arc(it.x, it.y, 15, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('🫒', it.x, it.y + 1);
        } else {
          ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(it.emoji, it.x, it.y);
        }

        // Catch check
        if (it.y + 12 >= bTop && it.y <= bTop + basketH && Math.abs(it.x - basketX) <= basketW / 2 + 10) {
          items.splice(i, 1);
          if (it.kind === 'rock') {
            hearts--;
            sfxBad();
            pops.push({ x: it.x, y: bTop - 8, txt: '💥 -1', color: '#dc2626', life: 0.7 });
            const hEl = document.getElementById('og-c-hearts');
            if (hEl) hEl.textContent = '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, 3 - hearts));
            if (hearts <= 0) {
              finish(false, `اصطدمت السلة بالحجارة! جمعت ${score} نقطة.`);
              return;
            }
          } else {
            score += it.pts;
            sfxGood();
            pops.push({ x: it.x, y: bTop - 8, txt: it.kind === 'gold' ? '+3 ذهبي!' : '+1', color: it.kind === 'gold' ? '#b45309' : '#15803d', life: 0.65 });
            const sEl = document.getElementById('og-c-score');
            if (sEl) sEl.textContent = score;
            if (score >= target) {
              finish(true, `جمعت ${score} ثمرة زيتون سيناوي ممتازة في ${25 - timeLeft} ثانية!`);
              return;
            }
          }
          continue;
        }
        if (it.y > H + 25) items.splice(i, 1);
      }

      // Draw wicker basket
      ctx.save();
      ctx.fillStyle = '#92400e';
      ctx.strokeStyle = '#c59b27';
      ctx.lineWidth = 3;
      const bx = basketX - basketW / 2;
      ctx.beginPath();
      ctx.moveTo(bx, bTop);
      ctx.lineTo(bx + basketW, bTop);
      ctx.lineTo(bx + basketW - 9, bTop + basketH);
      ctx.lineTo(bx + 9, bTop + basketH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧺', basketX, bTop + 17);
      ctx.restore();

      // Floating popups
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.y -= 42 * dt;
        p.life -= dt;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life / 0.7);
        ctx.fillStyle = p.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.txt, p.x, p.y);
        ctx.restore();
        if (p.life <= 0) pops.splice(i, 1);
      }

      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  // =========================================================================
  // اللعبة 2: ❄️ تحدي العصر على البارد (تحت 27°م)
  // =========================================================================
  function runColdPressGame(body) {
    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ رجوع للألعاب</button>
        <strong style="color:#0369a1;font-size:0.88rem;">حافظ على الحرارة &lt; 27°م ❄️</strong>
      </div>
      <div class="og-hud">
        <span>🏺 التعبئة: <b id="og-p-pct">0</b>%</span>
        <span>🌡️ الحرارة: <b id="og-p-temp">18</b>°م</span>
        <span>⏱️ <b id="og-p-time">22</b>ث</span>
      </div>
      <div class="og-press-arena">
        <div style="font-size:0.82rem; font-weight:800; color:#153422;">اضغط باستمرار وبإيقاع متوازن لتعبئة زجاجة الزيت 100% قبل انتهاء الوقت بدون أن تتخطى الحرارة 27°م!</div>
        <div class="og-press-visual">
          <div class="og-bottle-shell">
            <div class="og-bottle-fill" id="og-bottle-fill"></div>
            <div class="og-bottle-label" id="og-bottle-lbl">0%</div>
          </div>
          <div class="og-thermo-wrap">
            <div class="og-thermo-bar">
              <div class="og-thermo-fill" id="og-thermo-fill"></div>
              <div class="og-thermo-limit" title="الحد الأقصى 27°م"></div>
            </div>
            <span style="font-size:0.74rem;font-weight:900;color:#dc2626;">حد 27°م</span>
          </div>
        </div>
        <button type="button" class="og-press-btn" id="og-press-tap-btn">🫒 اضغط للعصر على البارد!</button>
      </div>
      <div id="og-game-result"></div>
    `;

    let fill = 0, temp = 18, timeLeft = 22, cooledUntil = 0, running = true;
    const btn = document.getElementById('og-press-tap-btn');
    const fillEl = document.getElementById('og-bottle-fill');
    const lblEl = document.getElementById('og-bottle-lbl');
    const thEl = document.getElementById('og-thermo-fill');
    const pctEl = document.getElementById('og-p-pct');
    const tmpEl = document.getElementById('og-p-temp');
    const timeEl = document.getElementById('og-p-time');

    function updateUI() {
      const f = Math.min(100, Math.round(fill));
      if (fillEl) fillEl.style.height = f + '%';
      if (lblEl) lblEl.textContent = f + '%';
      if (pctEl) pctEl.textContent = f;
      if (tmpEl) tmpEl.textContent = temp.toFixed(1);
      const tPct = Math.max(8, Math.min(100, ((temp - 14) / 18) * 100));
      if (thEl) {
        thEl.style.height = tPct + '%';
        thEl.style.background = temp >= 26.5 ? '#dc2626' : (temp >= 23.5 ? '#f59e0b' : '#16a34a');
      }
      const isHot = Date.now() < cooledUntil;
      if (btn) {
        btn.classList.toggle('overheat', isHot);
        btn.textContent = isHot ? '🔥 ساخن! استنى لحظة تبرد المعصرة...' : '🫒 اضغط للعصر على البارد!';
      }
    }

    function finish(won, msg) {
      if (!running) return;
      running = false;
      clearInterval(tick);
      clearInterval(secTimer);
      const resBox = document.getElementById('og-game-result');
      if (resBox) showRewardResult(resBox, 'press', won, msg);
    }

    btn.addEventListener('click', () => {
      if (!running) return;
      if (Date.now() < cooledUntil) { sfxBad(); return; }
      fill = Math.min(100, fill + 4.2);
      temp = Math.min(31, temp + 1.55);
      sfxGood();
      if (temp >= 27) {
        cooledUntil = Date.now() + 1350;
        sfxBad();
      }
      updateUI();
      if (fill >= 100) {
        finish(true, 'عصرت زجاجة زيت سيناوي بكر ممتاز 100% على البارد بنجاح! ❄️🫒');
      }
    });

    const tick = setInterval(() => {
      if (!running) return;
      temp = Math.max(18, temp - 0.36);
      updateUI();
    }, 100);

    const secTimer = setInterval(() => {
      if (!running) return;
      timeLeft--;
      if (timeEl) timeEl.textContent = Math.max(0, timeLeft);
      if (timeLeft <= 0) {
        finish(fill >= 100, `وصلت لتعبئة ${Math.round(fill)}% فقط — جرّب إيقاع أسرع قليلاً بدون تخطي 27°م!`);
      }
    }, 1000);

    activeCleanup = () => { running = false; clearInterval(tick); clearInterval(secTimer); };
    updateUI();
  }

  // =========================================================================
  // اللعبة 3: 🪙 كارت «اكشط قطرة الذهب» (Canvas Scratch Card)
  // =========================================================================
  function runScratchGame(body) {
    const g = getCfg().games.scratch;
    const rawPrizes = String(g.prizesText || '').split('|').map(x => x.trim()).filter(Boolean);
    const chosenText = rawPrizes.length > 0 ? rawPrizes[Math.floor(Math.random() * rawPrizes.length)] : '';

    // Parse chosen prize smartly
    let overridePrize = { type: g.rewardType || 'coupon', points: Number(g.points) || 25, couponCode: g.couponCode || 'GOLD5', couponDiscount: Number(g.couponDiscount) || 5 };
    if (chosenText) {
      const ptsM = chosenText.match(/(\d+)\s*نقط/);
      const codeM = chosenText.match(/\(([A-Z0-9]{3,16})\)/i);
      const discM = chosenText.match(/(\d+)\s*%/);
      if (ptsM) {
        overridePrize = { type: 'points', points: Number(ptsM[1]) };
      } else if (codeM || discM) {
        overridePrize = {
          type: 'coupon',
          couponCode: codeM ? codeM[1].toUpperCase() : (g.couponCode || 'GOLD5'),
          couponDiscount: discM ? Number(discM[1]) : (Number(g.couponDiscount) || 5)
        };
      }
    }

    const displayPrize = overridePrize.type === 'points'
      ? `⭐ +${overridePrize.points} نقطة ولاء`
      : `🎁 خصم ${overridePrize.couponDiscount}% بكود (${overridePrize.couponCode})`;

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ رجوع للألعاب</button>
        <strong style="color:#b45309;font-size:0.9rem;">🪙 كارت قطرة الذهب</strong>
      </div>
      <div style="text-align:center; font-size:0.86rem; font-weight:700; color:#475569; margin-bottom:6px;">
        امسح الطبقة الذهبية بإصبعك لتظهر جائزتك الفورية!
      </div>
      <div class="og-scratch-card-wrap">
        <div class="og-scratch-under">
          <div style="font-size:2.3rem;">🫒✨</div>
          <div style="font-size:1.15rem; font-weight:900; color:#153422; margin-top:4px;">${esc(displayPrize)}</div>
          <div style="font-size:0.78rem; color:#64748b; margin-top:4px;">مقدّمة من متجر زيت الشجرة المباركة</div>
        </div>
        <canvas id="og-scratch-canvas" width="340" height="195"></canvas>
      </div>
      <button type="button" class="og-secondary-btn" id="og-scratch-auto-btn" style="max-width:340px;margin:6px auto 0;display:block;">✨ اكشط الكارت تلقائياً</button>
      <div id="og-game-result"></div>
    `;

    const canvas = document.getElementById('og-scratch-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    let isDrawing = false, revealed = false, strokes = 0;

    // Paint golden foil layer
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#d4af37');
    grd.addColorStop(0.5, '#f6e08a');
    grd.addColorStop(1, '#b8860b');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#153422';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪙 امسح هنا بإصبعك', W / 2, H / 2 - 8);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('اكشف قطرة الذهب وجائزتك الفورية ✨', W / 2, H / 2 + 22);

    function revealNow() {
      if (revealed) return;
      revealed = true;
      ctx.clearRect(0, 0, W, H);
      const ab = document.getElementById('og-scratch-auto-btn');
      if (ab) ab.style.display = 'none';
      const resBox = document.getElementById('og-game-result');
      if (resBox) showRewardResult(resBox, 'scratch', true, 'كشفت قطرة الذهب بنجاح!', overridePrize);
    }

    function scratchAt(clientX, clientY) {
      if (revealed) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * W;
      const y = ((clientY - rect.top) / rect.height) * H;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 26, 0, Math.PI * 2);
      ctx.fill();
      strokes++;
      if (strokes % 10 === 0) {
        const imgData = ctx.getImageData(0, 0, W, H).data;
        let cleared = 0, total = 0;
        for (let i = 3; i < imgData.length; i += 32) {
          total++;
          if (imgData[i] < 40) cleared++;
        }
        if (cleared / total > 0.42) revealNow();
      }
    }

    canvas.addEventListener('pointerdown', (e) => { isDrawing = true; scratchAt(e.clientX, e.clientY); });
    canvas.addEventListener('pointermove', (e) => { if (isDrawing) scratchAt(e.clientX, e.clientY); });
    window.addEventListener('pointerup', () => { isDrawing = false; });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; if (e.touches[0]) scratchAt(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (e.touches[0]) scratchAt(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.getElementById('og-scratch-auto-btn').addEventListener('click', revealNow);
  }

  // =========================================================================
  // اللعبة 4: 🧠 تحدي خبير زيت الزيتون (3 أسئلة قابلة للتعديل من المدير)
  // =========================================================================
  function runQuizGame(body) {
    const g = getCfg().games.quiz;
    const questions = (Array.isArray(g.questions) && g.questions.length > 0) ? g.questions : getCfg().games.quiz.questions;
    let idx = 0, rightCount = 0;

    function renderQ() {
      const qObj = questions[idx];
      body.innerHTML = `
        <div class="og-stage-header">
          <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ رجوع للألعاب</button>
          <strong style="color:#6d28d9;font-size:0.88rem;">سؤال ${idx + 1} من ${questions.length}</strong>
        </div>
        <div class="og-hud">
          <span>🧠 مسابقة خبير الزيت</span>
          <span>✅ إجابات صحيحة: <b>${rightCount}</b></span>
        </div>
        <div class="og-quiz-card">
          <div class="og-quiz-q">${esc(qObj.q)}</div>
          <div id="og-quiz-opts">
            ${(qObj.options || []).map((opt, i) => `<button type="button" class="og-quiz-opt" data-idx="${i}">${esc(opt)}</button>`).join('')}
          </div>
          <div id="og-quiz-feedback"></div>
        </div>
        <div id="og-game-result"></div>
      `;

      let answered = false;
      body.querySelectorAll('.og-quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const pick = Number(btn.getAttribute('data-idx'));
          const correct = Number(qObj.correct) || 0;
          body.querySelectorAll('.og-quiz-opt').forEach((b, bi) => {
            if (bi === correct) b.classList.add('correct');
            else if (bi === pick) b.classList.add('wrong');
          });
          const isOk = pick === correct;
          if (isOk) { rightCount++; sfxGood(); } else sfxBad();

          const fb = document.getElementById('og-quiz-feedback');
          if (fb) {
            fb.innerHTML = `
              <div class="og-quiz-fact">${isOk ? '✅ إجابة صحيحة! ' : '❌ معلومة مفيدة: '}${esc(qObj.fact || '')}</div>
              <button type="button" class="og-primary-btn" id="og-quiz-next">${idx + 1 < questions.length ? 'السؤال التالي ◀' : 'عرض النتيجة والجائزة 🏆'}</button>
            `;
            document.getElementById('og-quiz-next').addEventListener('click', () => {
              idx++;
              if (idx < questions.length) renderQ();
              else {
                const need = Math.max(1, Math.ceil(questions.length * 0.66));
                const won = rightCount >= need;
                const resBox = document.getElementById('og-game-result');
                if (resBox) showRewardResult(resBox, 'quiz', won, `أجبت ${rightCount} من ${questions.length} إجابات صحيحة!`);
              }
            });
          }
        });
      });
    }
    renderQ();
  }

  // =========================================================================
  // اللعبة 5: 🌿 ذاكرة مزرعة الشجرة المباركة (8 كروت 3D)
  // =========================================================================
  function runMemoryGame(body) {
    const pairs = [
      { id: 'oil', icon: '🫒', label: 'زيتون سيناوي' },
      { id: 'bottle', icon: '🏺', label: 'عصرة أولى' },
      { id: 'herb', icon: '🌿', label: 'زعتر بري' },
      { id: 'cert', icon: '🏅', label: 'شهادة نقاء' }
    ];
    const deck = [...pairs, ...pairs].sort(() => Math.random() - 0.5);
    let flipped = [], matchedCount = 0, moves = 0, timeLeft = 35, locked = false, running = true;

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ رجوع للألعاب</button>
        <strong style="color:#0f766e;font-size:0.88rem;">طابق الكروت الـ 8 🌿</strong>
      </div>
      <div class="og-hud">
        <span>✅ المتطابقة: <b id="og-m-match">0</b>/4</span>
        <span>🔄 الحركات: <b id="og-m-moves">0</b></span>
        <span>⏱️ <b id="og-m-time">35</b>ث</span>
      </div>
      <div class="og-mem-grid" id="og-mem-grid">
        ${deck.map((c, i) => `
          <div class="og-mem-card" data-i="${i}" data-id="${c.id}">
            <div class="og-mem-inner">
              <div class="og-mem-face og-mem-front">🫒</div>
              <div class="og-mem-face og-mem-back">
                <div style="font-size:1.75rem;">${c.icon}</div>
                <div style="font-size:0.65rem; margin-top:2px;">${c.label}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div id="og-game-result"></div>
    `;

    function finish(won, msg) {
      if (!running) return;
      running = false;
      clearInterval(timer);
      const resBox = document.getElementById('og-game-result');
      if (resBox) showRewardResult(resBox, 'memory', won, msg);
    }

    const timer = setInterval(() => {
      if (!running) return;
      timeLeft--;
      const tEl = document.getElementById('og-m-time');
      if (tEl) tEl.textContent = Math.max(0, timeLeft);
      if (timeLeft <= 0) finish(false, 'انتهى الوقت! جرّب مرة أخرى بتركيز أسرع.');
    }, 1000);
    activeCleanup = () => { running = false; clearInterval(timer); };

    body.querySelectorAll('.og-mem-card').forEach(card => {
      card.addEventListener('click', () => {
        if (!running || locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        playTone(520, 0.06, 'sine', 0.05);
        flipped.push(card);
        if (flipped.length === 2) {
          moves++;
          const mvEl = document.getElementById('og-m-moves');
          if (mvEl) mvEl.textContent = moves;
          const [a, b] = flipped;
          if (a.getAttribute('data-id') === b.getAttribute('data-id')) {
            a.classList.add('matched');
            b.classList.add('matched');
            flipped = [];
            matchedCount++;
            sfxGood();
            const mEl = document.getElementById('og-m-match');
            if (mEl) mEl.textContent = matchedCount;
            if (matchedCount === 4) {
              setTimeout(() => finish(true, `أتممت مطابقة كل كروت المزرعة في ${moves} حركة فقط! 🌿`), 300);
            }
          } else {
            locked = true;
            setTimeout(() => {
              a.classList.remove('flipped');
              b.classList.remove('flipped');
              flipped = [];
              locked = false;
            }, 620);
          }
        }
      });
    });
  }

  // =========================================================================
  // لوحة تحكم المدير الكاملة في الـ 5 ألعاب (تشغيل/إيقاف/تعديل جوائز وأسئلة)
  // =========================================================================
  window.OliveGames_renderAdminEditor = function () {
    const mount = document.getElementById('admin-olive-games-editor-mount');
    if (!mount) return;
    const cfg = getCfg();
    const gOrder = [
      ['catch', '🧺 قطف الزيتون السيناوي'],
      ['press', '❄️ تحدي العصر على البارد'],
      ['scratch', '🪙 كارت اكشط قطرة الذهب'],
      ['quiz', '🧠 تحدي خبير زيت الزيتون'],
      ['memory', '🌿 ذاكرة المزرعة']
    ];

    const gamesRows = gOrder.map(([k, label]) => {
      const g = (cfg.games && cfg.games[k]) || {};
      return `
        <div class="og-adm-game-row">
          <label style="display:flex; align-items:center; gap:8px; font-weight:900; color:#153422; cursor:pointer; margin:0;">
            <input type="checkbox" id="og-adm-en-${k}" ${g.enabled !== false ? 'checked' : ''} style="width:18px;height:18px;margin:0;accent-color:#15803d;">
            <span>${label}</span>
          </label>
          <div class="og-adm-grid2">
            <div class="og-adm-field">
              <label>نوع الجائزة</label>
              <select id="og-adm-rtype-${k}">
                <option value="points" ${g.rewardType === 'points' ? 'selected' : ''}>⭐ نقاط ولاء</option>
                <option value="coupon" ${g.rewardType === 'coupon' ? 'selected' : ''}>🎁 كود خصم (%)</option>
              </select>
            </div>
            <div class="og-adm-field">
              <label>عدد النقاط (لو نقاط ولاء)</label>
              <input type="number" id="og-adm-pts-${k}" value="${Number(g.points) || 25}" min="1" max="500">
            </div>
            <div class="og-adm-field">
              <label>كود الخصم (لو كوبون)</label>
              <input type="text" id="og-adm-code-${k}" value="${esc(g.couponCode || 'OLIVE5')}">
            </div>
            <div class="og-adm-field">
              <label>نسبة الخصم (%)</label>
              <input type="number" id="og-adm-disc-${k}" value="${Number(g.couponDiscount) || 5}" min="1" max="50">
            </div>
            <div class="og-adm-field">
              <label>حد المحاولات</label>
              <select id="og-adm-cd-${k}">
                <option value="daily" ${g.cooldown === 'daily' ? 'selected' : ''}>مرة يومياً</option>
                <option value="weekly" ${g.cooldown === 'weekly' ? 'selected' : ''}>مرة أسبوعياً</option>
                <option value="once" ${g.cooldown === 'once' ? 'selected' : ''}>مرة واحدة فقط</option>
                <option value="unlimited" ${g.cooldown === 'unlimited' ? 'selected' : ''}>مفتوح بدون حد</option>
              </select>
            </div>
            ${k === 'catch' ? `
              <div class="og-adm-field">
                <label>الهدف للفوز (عدد الثمار)</label>
                <input type="number" id="og-adm-target-catch" value="${Number(g.targetScore) || 15}" min="5" max="60">
              </div>` : ''}
          </div>
          ${k === 'scratch' ? `
            <div class="og-adm-field" style="margin-top:8px;">
              <label>جوائز كارت الكشط (افصل بينها بـ | )</label>
              <input type="text" id="og-adm-scratch-prizes" value="${esc(g.prizesText || '')}">
            </div>` : ''}
          ${k === 'quiz' ? `
            <div class="og-adm-field" style="margin-top:8px;">
              <label>أسئلة مسابقة خبير الزيت (كل سطر: السؤال | الإجابة الصحيحة | خيار 2 | خيار 3 | المعلومة)</label>
              <textarea id="og-adm-quiz-lines" rows="4">${esc((g.questions || []).map(q => {
                const opts = q.options || [];
                const corrIdx = Number(q.correct) || 0;
                const corrTxt = opts[corrIdx] || opts[0] || '';
                const others = opts.filter((_, i) => i !== corrIdx);
                return [q.q, corrTxt, others[0] || '', others[1] || '', q.fact || ''].join(' | ');
              }).join('\n'))}</textarea>
            </div>` : ''}
        </div>
      `;
    }).join('');

    mount.innerHTML = `
      <div class="og-adm-game-row" style="border-color:#c59b27; background:rgba(197,155,39,0.08);">
        <label style="display:flex; align-items:center; gap:8px; font-weight:900; color:#153422; cursor:pointer; margin:0 0 8px;">
          <input type="checkbox" id="og-adm-master-en" ${cfg.enabled !== false ? 'checked' : ''} style="width:19px;height:19px;margin:0;accent-color:#15803d;">
          <span>✅ تشغيل مركز الألعاب بالكامل في المتجر</span>
        </label>
        <div style="display:flex; gap:14px; flex-wrap:wrap;">
          <label style="display:flex; align-items:center; gap:6px; font-weight:700; cursor:pointer; margin:0;">
            <input type="checkbox" id="og-adm-show-fab" ${cfg.showHomeFab !== false ? 'checked' : ''} style="width:16px;height:16px;margin:0;">
            <span>إظهار الزر الصغير فوق خدمة العملاء بالرئيسية</span>
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-weight:700; cursor:pointer; margin:0;">
            <input type="checkbox" id="og-adm-show-sb" ${cfg.showSidebarBtn !== false ? 'checked' : ''} style="width:16px;height:16px;margin:0;">
            <span>إظهار القسم في القائمة الجانبية</span>
          </label>
        </div>
      </div>
      ${gamesRows}
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;">
        <button type="button" class="btn" style="flex:2; min-width:190px; background:#15803d; color:#fff; font-weight:900;" id="og-adm-save-btn">💾 حفظ إعدادات الألعاب الآن</button>
        <button type="button" class="btn btn-outline" style="flex:1; min-width:150px; border-color:#c59b27; color:#926d0b;" id="og-adm-test-btn">🎮 معاينة وتجربة الألعاب</button>
        <button type="button" class="btn btn-outline" style="flex:1; min-width:150px; border-color:#028090; color:#028090;" id="og-adm-reset-me-btn">🔄 تصفير محاولاتي للتجربة</button>
      </div>
    `;

    document.getElementById('og-adm-test-btn').addEventListener('click', () => window.OliveGames_open());
    document.getElementById('og-adm-reset-me-btn').addEventListener('click', () => {
      localStorage.removeItem(PLAYED_KEY);
      if (typeof window.showToast === 'function') window.showToast('✅ تم تصفير محاولاتك على هذا الجهاز لتجربة كل الألعاب بحرية!', 'success');
    });

    document.getElementById('og-adm-save-btn').addEventListener('click', async () => {
      const nextCfg = getCfg();
      nextCfg.enabled = !!document.getElementById('og-adm-master-en').checked;
      nextCfg.showHomeFab = !!document.getElementById('og-adm-show-fab').checked;
      nextCfg.showSidebarBtn = !!document.getElementById('og-adm-show-sb').checked;

      gOrder.forEach(([k]) => {
        const g = nextCfg.games[k];
        g.enabled = !!document.getElementById('og-adm-en-' + k).checked;
        g.rewardType = document.getElementById('og-adm-rtype-' + k).value;
        g.points = Math.max(1, Number(document.getElementById('og-adm-pts-' + k).value) || 25);
        g.couponCode = String(document.getElementById('og-adm-code-' + k).value || 'OLIVE5').trim().toUpperCase();
        g.couponDiscount = Math.max(1, Math.min(50, Number(document.getElementById('og-adm-disc-' + k).value) || 5));
        g.cooldown = document.getElementById('og-adm-cd-' + k).value;
      });

      const tCatch = document.getElementById('og-adm-target-catch');
      if (tCatch) nextCfg.games.catch.targetScore = Math.max(5, Number(tCatch.value) || 15);
      const sPrizes = document.getElementById('og-adm-scratch-prizes');
      if (sPrizes) nextCfg.games.scratch.prizesText = sPrizes.value.trim();

      const qText = (document.getElementById('og-adm-quiz-lines') || {}).value || '';
      const parsedQs = qText.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
        const parts = line.split('|').map(x => x.trim());
        if (parts.length < 3) return null;
        return {
          q: parts[0],
          options: [parts[1], parts[2], parts[3] || 'خيار آخر'],
          correct: 0,
          fact: parts[4] || ''
        };
      }).filter(Boolean);
      if (parsedQs.length > 0) nextCfg.games.quiz.questions = parsedQs;

      const btn = document.getElementById('og-adm-save-btn');
      btn.disabled = true;
      btn.textContent = '⏳ جاري الحفظ...';
      const ok = typeof window.V94_saveGamesConfig === 'function' ? await window.V94_saveGamesConfig(nextCfg) : false;
      btn.disabled = false;
      btn.textContent = '💾 حفظ إعدادات الألعاب الآن';
      if (typeof window.showToast === 'function') {
        window.showToast(ok ? '✅ تم حفظ إعدادات الـ 5 ألعاب وتحديثها في المتجر فوراً!' : '⚠️ تم الحفظ محلياً — تأكد من الاتصال بالإنترنت للمزامنة', ok ? 'success' : 'info');
      }
    });
  };

  window.OliveGames_open = function (initialKey) {
    const ov = ensureModal();
    ov.classList.add('open');
    if (initialKey) window.OliveGames_start(initialKey);
    else window.OliveGames_renderLobby();
  };
})();
