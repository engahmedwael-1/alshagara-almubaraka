/* مركز ألعاب الشجرة المباركة V95 Pro — 8 ألعاب عالمية + 10,800 سؤال + جوائز عشوائية بكوبونات فريدة + أوفلاين 100% */
(function () {
  if (window.__OLIVE_GAMES_V95_READY__) return;
  window.__OLIVE_GAMES_V95_READY__ = true;
  window.__OLIVE_GAMES_ENGINE_READY__ = true;

  const DAILY_CAP_KEY = 'zait_v95_daily_rewards_log';
  const SCRATCH_LOG_KEY = 'zait_v95_scratch_daily_log';
  const DIFF_PREF_KEY = 'zait_v95_last_difficulty';

  let muted = localStorage.getItem('zait_v94_games_muted') === '1';
  let activeCleanup = null;
  let audioCtx = null;

  // =========================================================================
  // نظام المؤثرات الصوتية الخفيف (WebAudio API بدون أي ملفات صوتية ثقيلة)
  // =========================================================================
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
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 'triangle', 0.11), i * 95));
  }
  function sfxGood() { playTone(760, 0.08, 'sine', 0.07); }
  function sfxGold() { playTone(980, 0.1, 'triangle', 0.09); setTimeout(() => playTone(1240, 0.12, 'triangle', 0.09), 70); }
  function sfxBad() { playTone(170, 0.2, 'sawtooth', 0.08); }
  function sfxStage() { [587, 740, 880].forEach((f, i) => setTimeout(() => playTone(f, 0.13, 'triangle', 0.09), i * 80)); }

  function esc(s) {
    return String(s || '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getCfg() {
    if (typeof window.V95_getGamesConfig === 'function') return window.V95_getGamesConfig();
    try {
      const raw = localStorage.getItem('zait_v95_olive_games_config');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      enabled: true, showHomeFab: true, showSidebarBtn: true, dailyRewardLimit: 3, quizQuestionCount: 5,
      rewardPool: [
        { id: 'r1', label: 'خصم 5% فوري', type: 'coupon', value: 5, weight: 35 },
        { id: 'r2', label: '25 نقطة ولاء', type: 'points', value: 25, weight: 30 },
        { id: 'r3', label: 'خصم 10% مميز', type: 'coupon', value: 10, weight: 15 },
        { id: 'r4', label: '50 نقطة ولاء', type: 'points', value: 50, weight: 12 },
        { id: 'r5', label: 'توصيل مجاني للطلب', type: 'free_shipping', value: 100, weight: 8 }
      ],
      scratchConfig: {
        enabled: true, dailyLimit: 1,
        outcomes: [
          { id: 's1', label: 'حظ أوفر في المرة القادمة', type: 'none', value: 0, weight: 90 },
          { id: 's2', label: 'خصم 5% فوري', type: 'coupon', value: 5, weight: 5 },
          { id: 's3', label: 'توصيل مجاني', type: 'free_shipping', value: 100, weight: 5 }
        ]
      },
      games: {
        catch: { enabled: true, title: 'قطف الزيتون السيناوي', times: { easy: 30, medium: 25, hard: 20 } },
        press: { enabled: true, title: 'تحدي العصر على البارد', times: { easy: 28, medium: 22, hard: 18 } },
        quiz: { enabled: true, title: 'تحدي خبير زيت الزيتون', times: { easy: 90, medium: 65, hard: 45 }, customQuestions: [] },
        memory: { enabled: true, title: 'ذاكرة مزرعة الشجرة المباركة', times: { easy: 45, medium: 35, hard: 28 } },
        truck: { enabled: true, title: 'سائق شاحنة زيت سيناء', times: { easy: 28, medium: 24, hard: 20 } },
        sorter: { enabled: true, title: 'فرز حبات الزيتون السريع', times: { easy: 30, medium: 24, hard: 18 } },
        drops: { enabled: true, title: 'مطابقة قطرات الذهب', times: { easy: 45, medium: 35, hard: 26 } }
      }
    };
  }

  function getGameTime(gameKey, diff) {
    const cfg = getCfg();
    const g = (cfg.games && cfg.games[gameKey]) || {};
    const t = g.times || {};
    const defaults = { easy: 35, medium: 26, hard: 20 };
    return Math.max(10, Number(t[diff]) || defaults[diff] || 25);
  }

  // إدارة الحد اليومي للجوائز (3 جوائز يومياً أو حسب المدير — باستثناء كارت الكشط!)
  function getDailyCount() {
    try {
      const data = JSON.parse(localStorage.getItem(DAILY_CAP_KEY) || '{}');
      return data.date === todayKey() ? (Number(data.count) || 0) : 0;
    } catch (e) { return 0; }
  }
  function incDailyCount() {
    const next = getDailyCount() + 1;
    try { localStorage.setItem(DAILY_CAP_KEY, JSON.stringify({ date: todayKey(), count: next })); } catch (e) {}
    return next;
  }

  // إدارة محاولات كارت الكشط المستقل
  function getScratchUsedToday() {
    try {
      const data = JSON.parse(localStorage.getItem(SCRATCH_LOG_KEY) || '{}');
      return data.date === todayKey() ? (Number(data.count) || 0) : 0;
    } catch (e) { return 0; }
  }
  function incScratchUsedToday() {
    const next = getScratchUsedToday() + 1;
    try { localStorage.setItem(SCRATCH_LOG_KEY, JSON.stringify({ date: todayKey(), count: next })); } catch (e) {}
    return next;
  }

  // سحب عشوائي مرجّح بدقة حسب النسب المحددة من المدير
  function weightedPick(list) {
    const valid = (Array.isArray(list) ? list : []).filter(x => x && Number(x.weight) > 0);
    if (valid.length === 0) return null;
    const total = valid.reduce((s, x) => s + Number(x.weight), 0);
    let r = Math.random() * total;
    for (const item of valid) {
      r -= Number(item.weight);
      if (r <= 0) return item;
    }
    return valid[valid.length - 1];
  }

  function getSavedDiff(gameKey) {
    try {
      const map = JSON.parse(localStorage.getItem(DIFF_PREF_KEY) || '{}');
      return map[gameKey] || 'medium';
    } catch (e) { return 'medium'; }
  }
  function saveDiff(gameKey, diff) {
    try {
      const map = JSON.parse(localStorage.getItem(DIFF_PREF_KEY) || '{}');
      map[gameKey] = diff;
      localStorage.setItem(DIFF_PREF_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  function stopActiveGame() {
    if (typeof activeCleanup === 'function') {
      try { activeCleanup(); } catch (e) {}
    }
    activeCleanup = null;
  }

  // =========================================================================
  // احتفال Confetti متحرك 60fps
  // =========================================================================
  function launchConfetti(canvasEl) {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    const W = canvasEl.width = canvasEl.offsetWidth || 360;
    const H = canvasEl.height = canvasEl.offsetHeight || 280;
    const colors = ['#c59b27', '#15803d', '#facc15', '#38bdf8', '#f43f5e', '#a855f7'];
    const parts = Array.from({ length: 65 }, () => ({
      x: Math.random() * W,
      y: -10 - Math.random() * 80,
      vx: (Math.random() - 0.5) * 140,
      vy: 90 + Math.random() * 140,
      size: 5 + Math.random() * 6,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 300,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    let alive = true, last = performance.now();
    const stopPrev = activeCleanup;
    activeCleanup = () => { alive = false; if (stopPrev) stopPrev(); };
    function step(ts) {
      if (!alive) return;
      const dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      ctx.clearRect(0, 0, W, H);
      let any = false;
      for (const p of parts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vrot * dt;
        if (p.y < H + 20) any = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      if (any) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // =========================================================================
  // نافذة مركز الألعاب + درج "كوبوناتي"
  // =========================================================================
  function ensureModal() {
    let ov = document.getElementById('og-modal-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'og-modal-overlay';
    ov.innerHTML = `
      <div class="og-shell" role="dialog" aria-modal="true">
        <div class="og-topbar">
          <h3 class="og-topbar-title"><span>🎮</span><span>ألعاب الشجرة المباركة</span></h3>
          <div class="og-topbar-actions">
            <button type="button" class="og-icon-btn" id="og-my-coupons-btn" title="كوبوناتي المكتسبة">🎟️ كوبوناتي</button>
            <button type="button" class="og-icon-btn" id="og-mute-btn" title="الصوت">${muted ? '🔇' : '🔊'}</button>
            <button type="button" class="og-icon-btn close-btn" id="og-close-btn" aria-label="إغلاق">✕</button>
          </div>
        </div>
        <div class="og-body" id="og-body"></div>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) closeHub(); });
    document.getElementById('og-close-btn').addEventListener('click', closeHub);
    document.getElementById('og-my-coupons-btn').addEventListener('click', renderMyCouponsView);
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

  function renderMyCouponsView() {
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    const list = typeof window.V95_getMyPersonalCoupons === 'function' ? window.V95_getMyPersonalCoupons() : [];
    const cards = list.length === 0
      ? '<div style="text-align:center;padding:28px;color:#64748b;font-weight:700;">لا توجد كوبونات مكتسبة بعد — العب واكسب كوبونك الشخصي الفريد! 🎮</div>'
      : list.slice().reverse().map(c => `
        <div style="background:var(--input-bg,#fff);border:1.5px solid ${c.used ? '#cbd5e1' : '#c59b27'};border-radius:14px;padding:12px;margin-bottom:8px;opacity:${c.used ? '0.65' : '1'};">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong style="color:#153422;font-size:1rem;letter-spacing:1.2px;">🎟️ ${esc(c.code)}</strong>
            <span style="padding:2px 9px;border-radius:999px;font-size:0.74rem;font-weight:900;background:${c.used ? '#fee2e2;color:#991b1b' : '#dcfce7;color:#166534'};">${c.used ? 'تم استخدامه ✅' : (c.freeShipping ? '🚚 توصيل مجاني' : `خصم ${c.discount}%`)}</span>
          </div>
          <div style="font-size:0.76rem;color:#64748b;margin-top:4px;">${esc(c.label || '')} • استخدام مرة واحدة على حسابك فقط</div>
          ${!c.used ? `<button type="button" class="og-primary-btn" style="padding:8px;font-size:0.82rem;margin-top:8px;" onclick="window.OliveGames_copyAndApply('${esc(c.code)}')">📋 نسخ وتطبيق الكوبون في السلة 🛒</button>` : ''}
        </div>
      `).join('');

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ رجوع للألعاب</button>
        <strong style="color:#153422;">🎟️ كوبوناتي الخاصة (${list.filter(x => !x.used).length} متاح)</strong>
      </div>
      ${cards}
    `;
  }

  window.OliveGames_copyAndApply = function (code) {
    try { navigator.clipboard.writeText(code); } catch (e) {}
    if (typeof window.V94_applyGameCouponToCart === 'function') window.V94_applyGameCouponToCart(code);
    if (typeof window.showToast === 'function') window.showToast(`✅ تم نسخ الكود (${code}) وتطبيقه في السلة!`, 'success');
    else alert(`✅ تم نسخ الكود (${code}) وتجهيزه في السلة!`);
  };

  // =========================================================================
  // شاشة نهاية اللعبة والاحتفال (مع العب تاني بنفس الصعوبة + تحديد الصعوبة + خروج)
  // =========================================================================
  async function showPostGameScreen(gameKey, diff, won, headline, isScratchCard, forcedOutcome) {
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    const cfg = getCfg();
    const diffNames = { easy: '🟢 سهل', medium: '🟡 متوسط', hard: '🔴 صعب' };

    if (!won) {
      sfxBad();
      body.innerHTML = `
        <div class="og-celebration-wrap" style="background:linear-gradient(135deg,#fff1f2,#fffbeb); border-color:#f87171;">
          <div class="og-celebration-inner">
            <div style="font-size:3rem;">🫒</div>
            <h3 style="margin:6px 0; color:#991b1b; font-size:1.2rem;">انتهت الجولة — حظ أوفر!</h3>
            <p style="margin:0 0 12px; font-size:0.88rem; color:#475569; font-weight:700;">${esc(headline || 'حاول مرة أخرى بسرعة وتركيز أعلى!')}</p>
            <div style="font-size:0.78rem; color:#64748b; margin-bottom:10px;">المستوى الحالي: <b>${diffNames[diff] || ''}</b></div>
            <button type="button" class="og-primary-btn" onclick="window.OliveGames_playDirect('${gameKey}', '${diff}')">🔄 العب تاني (نفس الصعوبة)</button>
            <div class="og-post-actions">
              <button type="button" class="og-secondary-btn" onclick="window.OliveGames_pickDifficulty('${gameKey}')">🎚️ تحديد الصعوبة</button>
              <button type="button" class="og-outline-btn" onclick="window.OliveGames_renderLobby()">🚪 خروج</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // الفوز! هل يستحق جائزة؟
    let prizeHtml = '';
    let celebrationEmoji = '🏆🎉';
    let titleText = 'مبروك! فوز رائع!';

    if (isScratchCard) {
      // كارت الكشط مستقل تماماً عن الجوائز اليومية الـ 3!
      const out = forcedOutcome;
      if (!out || out.type === 'none') {
        sfxBad();
        celebrationEmoji = '🍀';
        titleText = esc((out && out.label) || 'حظ أوفر في المرة القادمة!');
        prizeHtml = `<p style="margin:6px 0;color:#475569;font-size:0.88rem;font-weight:700;">لم يحالفك الحظ هذه المرة — يمكنك كسب جوائز مضمونة من الألعاب الأخرى أو المحاولة غداً! 🌿</p>`;
      } else {
        sfxWin();
        prizeHtml = await issueActualRewardHtml(out, 'كارت قطرة الذهب', 'scratch');
      }
    } else {
      sfxWin();
      const maxDaily = Math.max(0, Number(cfg.dailyRewardLimit) ?? 3);
      const usedToday = getDailyCount();
      if (usedToday < maxDaily) {
        const pickedPrize = weightedPick(cfg.rewardPool);
        if (pickedPrize && pickedPrize.type !== 'none') {
          incDailyCount();
          prizeHtml = await issueActualRewardHtml(pickedPrize, (cfg.games[gameKey] && cfg.games[gameKey].title) || gameKey, gameKey);
        } else {
          prizeHtml = `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:10px;font-weight:800;color:#166534;">أداء بطولي ممتاز! 🌿</div>`;
        }
      } else {
        prizeHtml = `
          <div style="background:#fef3c7;border:1.5px solid #f59e0b;border-radius:12px;padding:10px;font-size:0.84rem;font-weight:800;color:#92400e;margin-top:8px;">
            🎁 وصلت للحد الأقصى لجوائز اليوم (${usedToday} / ${maxDaily})!<br>
            <small>يمكنك الاستمرار في اللعب وتحدي أرقامك القياسية بحرية، وتعود جوائزك غداً 🌿</small>
          </div>`;
      }
    }

    body.innerHTML = `
      <div class="og-celebration-wrap">
        <canvas class="og-confetti-canvas" id="og-confetti-cv"></canvas>
        <div class="og-celebration-inner">
          <div style="font-size:3.1rem;">${celebrationEmoji}</div>
          <h3 style="margin:4px 0; color:#153422; font-size:1.22rem; font-weight:900;">${titleText}</h3>
          <p style="margin:0 0 8px; font-size:0.86rem; color:#475569; font-weight:700;">${esc(headline || '')}</p>
          ${prizeHtml}
          ${isScratchCard ? `
            <div style="margin-top:12px;">
              <button type="button" class="og-secondary-btn" onclick="window.OliveGames_renderLobby()">🚪 خروج لصالة الألعاب</button>
            </div>
          ` : `
            <div style="margin-top:12px;">
              <button type="button" class="og-primary-btn" onclick="window.OliveGames_playDirect('${gameKey}', '${diff}')">🔄 العب تاني (${diffNames[diff] || ''})</button>
              <div class="og-post-actions">
                <button type="button" class="og-secondary-btn" onclick="window.OliveGames_pickDifficulty('${gameKey}')">🎚️ تحديد الصعوبة</button>
                <button type="button" class="og-outline-btn" onclick="window.OliveGames_renderLobby()">🚪 خروج</button>
              </div>
            </div>
          `}
        </div>
      </div>
    `;

    if (!isScratchCard || (forcedOutcome && forcedOutcome.type !== 'none')) {
      setTimeout(() => launchConfetti(document.getElementById('og-confetti-cv')), 30);
    }
  }

  async function issueActualRewardHtml(prize, gameTitle, gameKey) {
    if (prize.type === 'points') {
      const pts = Math.max(1, Number(prize.value) || 25);
      let st = `✅ ربحت +${pts} نقطة ولاء!`;
      if (typeof window.V94_awardLoyaltyPoints === 'function') {
        const res = await window.V94_awardLoyaltyPoints(pts, gameTitle, gameKey);
        if (res && res.synced) st = `✅ تمت إضافة +${pts} نقطة ولاء مباشرةً لرصيدك في المتجر!`;
        else if (res && res.needsLogin) st = `💾 تم حفظ +${pts} نقطة — سجّل الدخول لتُضاف تلقائياً لحسابك!`;
        else st = `📶 أوفلاين: تم حفظ +${pts} نقطة وستُضاف تلقائياً فور عودة الإنترنت!`;
      }
      return `
        <div style="background:#dcfce7;border:1.5px solid #16a34a;border-radius:14px;padding:12px;margin:8px 0;">
          <div style="font-size:1.15rem;font-weight:900;color:#153422;">⭐ جائزتك العشوائية: +${pts} نقطة ولاء</div>
          <div style="font-size:0.8rem;color:#166534;font-weight:800;margin-top:4px;">${esc(st)}</div>
        </div>`;
    }

    // Coupon OR Free Shipping — ALWAYS generates a unique, single-use, account-bound code!
    const isShip = prize.type === 'free_shipping';
    const disc = isShip ? 0 : Math.max(1, Math.min(50, Number(prize.value) || 5));
    let couponObj = null;
    if (typeof window.V95_issueUniquePersonalCoupon === 'function') {
      couponObj = await window.V95_issueUniquePersonalCoupon({
        discount: disc,
        freeShipping: isShip,
        label: prize.label || (isShip ? 'توصيل مجاني' : `خصم ${disc}%`),
        gameKey
      });
    }
    const code = (couponObj && couponObj.code) || ('ZM-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase());
    return `
      <div style="background:#fff;border:1.5px solid #c59b27;border-radius:14px;padding:12px;margin:8px 0;">
        <div style="font-size:0.96rem;font-weight:900;color:#153422;">🎁 جائزتك: ${esc(prize.label || (isShip ? 'توصيل مجاني' : `خصم ${disc}%`))}</div>
        <div class="og-coupon-box">${esc(code)}</div>
        <div style="font-size:0.75rem;color:#15803d;font-weight:800;">🔒 كود فريد خاص بحسابك فقط • صالح لاستخدام مرة واحدة • محفوظ في "🎟️ كوبوناتي"</div>
        <button type="button" class="og-primary-btn" style="margin-top:8px;padding:9px;" onclick="window.OliveGames_copyAndApply('${esc(code)}')">📋 نسخ وتطبيق الكوبون في السلة 🛒</button>
      </div>`;
  }

  // =========================================================================
  // صالة الـ 8 ألعاب الاحترافية
  // =========================================================================
  const SKILL_GAMES = [
    { key: 'catch', icon: '🧺', bg: 'linear-gradient(135deg,#15803d,#166534)', desc: 'اجمع ثمار الزيتون الأخضر والذهبي وتجنب الحجارة بسرعة متصاعدة!' },
    { key: 'press', icon: '❄️', bg: 'linear-gradient(135deg,#0284c7,#0369a1)', desc: 'اعصر الزيتون واملأ الزجاجة 100% مع إبقاء الحرارة تحت 27°م!' },
    { key: 'quiz', icon: '🧠', bg: 'linear-gradient(135deg,#7c3aed,#5b21b6)', desc: 'بنك 10,800+ سؤال متجدد في 3 مستويات بدون تكرار!' },
    { key: 'memory', icon: '🌿', bg: 'linear-gradient(135deg,#0d9488,#0f766e)', desc: 'مراحل متدرجة بكروت وأشكال متنوعة — كل مرحلة أصعب ووقتها أقل!' },
    { key: 'truck', icon: '🚚', bg: 'linear-gradient(135deg,#b45309,#92400e)', desc: 'قد شاحنة زيت سيناء على الطريق السريع وتفادَ العقبات واجمع العبوات!' },
    { key: 'sorter', icon: '🎯', bg: 'linear-gradient(135deg,#ea580c,#c2410c)', desc: 'سير الفرز الذكي: اقبل الزيتون الطازج واستبعد الحجارة والثمار التالفة!' },
    { key: 'drops', icon: '🫧', bg: 'linear-gradient(135deg,#db2777,#9d174d)', desc: 'فجّر مجموعات قطرات الزيت والأعشاب المتشابهة بسلاسل كومبو مبهرة!' }
  ];

  window.OliveGames_renderLobby = function () {
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    const cfg = getCfg();
    if (!cfg.enabled) {
      body.innerHTML = `<div class="og-celebration-wrap"><div style="font-size:2.8rem;">🎮</div><h3>مركز الألعاب متوقف مؤقتاً</h3></div>`;
      return;
    }

    const maxDaily = Math.max(0, Number(cfg.dailyRewardLimit) ?? 3);
    const usedToday = getDailyCount();
    const remRewards = Math.max(0, maxDaily - usedToday);

    const sc = cfg.scratchConfig || {};
    const scMax = Math.max(1, Number(sc.dailyLimit) || 1);
    const scUsed = getScratchUsedToday();
    const scRem = Math.max(0, scMax - scUsed);

    const scratchCardBanner = sc.enabled !== false ? `
      <div class="og-scratch-banner-card" onclick="window.OliveGames_startScratch()">
        <div style="font-size:2.4rem;flex-shrink:0;">🪙</div>
        <div style="flex:1;text-align:right;">
          <div style="font-weight:900;font-size:0.98rem;">كارت «اكشط قطرة الذهب» (خارج حد الجوائز اليومية!)</div>
          <div style="font-size:0.78rem;opacity:0.93;margin-top:2px;">جرّب حظك اليومي بكارت الكشط الذهبي • المتبقي اليوم: <b>${scRem} / ${scMax}</b></div>
        </div>
        <span style="background:rgba(255,255,255,0.22);padding:6px 11px;border-radius:10px;font-weight:900;font-size:0.82rem;white-space:nowrap;">اكشط ✨</span>
      </div>` : '';

    const gameCards = SKILL_GAMES.filter(m => cfg.games && cfg.games[m.key] && cfg.games[m.key].enabled !== false).map(m => {
      const g = cfg.games[m.key];
      return `
        <div class="og-game-card" onclick="window.OliveGames_pickDifficulty('${m.key}')">
          <div class="og-game-emoji" style="background:${m.bg};">${m.icon}</div>
          <div class="og-game-info">
            <h4>${esc(g.title)}</h4>
            <p>${esc(m.desc)}</p>
            <span class="og-tag-mini">🎚️ سهل • متوسط • صعب</span>
          </div>
          <button type="button" class="og-play-arrow">العب ▶</button>
        </div>`;
    }).join('');

    body.innerHTML = `
      <div class="og-hero-banner">
        <h3>🫒 العب واكسب كوبونات فريدة ونقاط ولاء!</h3>
        <p>اربح في أي لعبة لتحصل على جائزة عشوائية بكوبون فريد خاص بحسابك فقط — كل الألعاب تعمل بدون إنترنت 100%!</p>
        <div class="og-status-pills">
          <span class="og-pill gold">🎁 جوائزك اليوم: ${usedToday} / ${maxDaily} (متبقي ${remRewards})</span>
          <span class="og-pill">${navigator.onLine ? '🟢 أونلاين' : '📶 وضع أوفلاين (شغال 100%)'}</span>
        </div>
      </div>
      ${scratchCardBanner}
      <div class="og-games-grid">${gameCards}</div>
    `;
  };

  // =========================================================================
  // شاشة اختيار مستوى الصعوبة (سهل / متوسط / صعب)
  // =========================================================================
  window.OliveGames_pickDifficulty = function (gameKey) {
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    const cfg = getCfg();
    const meta = SKILL_GAMES.find(m => m.key === gameKey) || SKILL_GAMES[0];
    const title = (cfg.games && cfg.games[gameKey] && cfg.games[gameKey].title) || gameKey;
    const tE = getGameTime(gameKey, 'easy'), tM = getGameTime(gameKey, 'medium'), tH = getGameTime(gameKey, 'hard');
    const qCnt = Math.max(1, Number(cfg.quizQuestionCount) || 5);

    const specs = {
      catch: [`سرعة هادئة • هدف 14 ثمرة • ${tE}ث`, `سرعة متوازنة • هدف 22 ثمرة • ${tM}ث`, `سرعة صاروخية • هدف 30 ثمرة • ${tH}ث`],
      press: [`تسخين بطيء وتبريد سريع • ${tE}ث`, `توازن متوسط • ${tM}ث`, `تسخين سريع وتحدي احترافي • ${tH}ث`],
      quiz: [`${qCnt} أسئلة سهلة • ${tE}ث`, `${qCnt} أسئلة متوسطة • ${tM}ث`, `${qCnt} أسئلة خبراء صعبة • ${tH}ث`],
      memory: [`3 مراحل: 8 ⬅️ 12 ⬅️ 16 كارت • ${tE}ث`, `3 مراحل: 12 ⬅️ 16 ⬅️ 20 كارت • ${tM}ث`, `3 مراحل: 16 ⬅️ 20 ⬅️ 24 كارت • ${tH}ث`],
      truck: [`سرعة مريحة وعقبات قليلة • ${tE}ث`, `سرعة سريعة وحركة نشطة • ${tM}ث`, `طريق سيناوي ناري سريع • ${tH}ث`],
      sorter: [`سير هادئ • هدف 15 حبة • ${tE}ث`, `سير سريع • هدف 22 حبة • ${tM}ث`, `سير فائق السرعة • هدف 30 حبة • ${tH}ث`],
      drops: [`هدف 120 نقطة • 4 ألوان • ${tE}ث`, `هدف 220 نقطة • 5 ألوان • ${tM}ث`, `هدف 340 نقطة • 5 ألوان • ${tH}ث`]
    }[gameKey] || [`${tE}ث`, `${tM}ث`, `${tH}ث`];

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ رجوع للألعاب</button>
      </div>
      <div class="og-diff-screen">
        <div class="og-game-emoji" style="background:${meta.bg}; margin:0 auto 10px; width:68px; height:68px; font-size:2.2rem;">${meta.icon}</div>
        <h3 style="margin:0 0 4px; color:#153422; font-size:1.15rem;">${esc(title)}</h3>
        <p style="margin:0; font-size:0.84rem; color:#64748b;">اختر مستوى الصعوبة للبدء فوراً:</p>
        <div class="og-diff-cards">
          <button type="button" class="og-diff-btn easy" onclick="window.OliveGames_playDirect('${gameKey}','easy')">
            <div><strong>🟢 مستوى سهل</strong><small>${esc(specs[0])}</small></div>
            <span style="font-size:1.3rem;">▶</span>
          </button>
          <button type="button" class="og-diff-btn medium" onclick="window.OliveGames_playDirect('${gameKey}','medium')">
            <div><strong>🟡 مستوى متوسط</strong><small>${esc(specs[1])}</small></div>
            <span style="font-size:1.3rem;">▶</span>
          </button>
          <button type="button" class="og-diff-btn hard" onclick="window.OliveGames_playDirect('${gameKey}','hard')">
            <div><strong>🔴 مستوى صعب (للمحترفين)</strong><small>${esc(specs[2])}</small></div>
            <span style="font-size:1.3rem;">▶</span>
          </button>
        </div>
      </div>
    `;
  };

  window.OliveGames_playDirect = function (gameKey, diff) {
    const d = (diff === 'easy' || diff === 'hard') ? diff : (diff === 'medium' ? 'medium' : getSavedDiff(gameKey));
    saveDiff(gameKey, d);
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    if (gameKey === 'catch') runCatchGame(body, d);
    else if (gameKey === 'press') runColdPressGame(body, d);
    else if (gameKey === 'quiz') runQuizGame(body, d);
    else if (gameKey === 'memory') runMemoryStagesGame(body, d);
    else if (gameKey === 'truck') runTruckGame(body, d);
    else if (gameKey === 'sorter') runSorterGame(body, d);
    else if (gameKey === 'drops') runDropsMatchGame(body, d);
    else window.OliveGames_renderLobby();
  };

  // =========================================================================
  // 1. 🧺 قطف الزيتون السيناوي (Canvas 60fps — سهل / متوسط / صعب)
  // =========================================================================
  function runCatchGame(body, diff) {
    const P = {
      easy: { target: 14, speedMin: 110, speedMax: 170, spawnEvery: 0.62, rockRate: 0.16, basketW: 86 },
      medium: { target: 22, speedMin: 165, speedMax: 245, spawnEvery: 0.44, rockRate: 0.24, basketW: 74 },
      hard: { target: 30, speedMin: 230, speedMax: 340, spawnEvery: 0.31, rockRate: 0.33, basketW: 64 }
    }[diff];
    let timeLeft = getGameTime('catch', diff);

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
        <strong style="color:#153422;font-size:0.86rem;">الهدف: ${P.target} نقطة 🫒</strong>
      </div>
      <div class="og-hud">
        <span>🫒 <b id="og-c-score">0</b>/${P.target}</span>
        <span>🔥 كومبو: <b id="og-c-combo">0</b></span>
        <span>⏱️ <b id="og-c-time">${timeLeft}</b>ث</span>
        <span id="og-c-hearts">❤️❤️❤️</span>
      </div>
      <div class="og-canvas-wrap">
        <canvas id="og-catch-cv" class="og-game-canvas" width="380" height="365"></canvas>
      </div>
      <div class="og-touch-hint">👆 اسحب بإصبعك يميناً ويساراً: زيتون أخضر (+1) • ذهبي (+3) • قلب (+❤️) • تجنب الحجارة 🪨</div>
    `;

    const cv = document.getElementById('og-catch-cv');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    let basketX = W / 2, basketW = P.basketW, basketH = 34;
    let score = 0, combo = 0, hearts = 3, running = true;
    const items = [], pops = [];
    let lastTs = performance.now(), spawnAcc = 0, secAcc = 0, rafId = 0;

    function moveTo(cx) {
      const r = cv.getBoundingClientRect();
      basketX = Math.max(basketW / 2, Math.min(W - basketW / 2, ((cx - r.left) / r.width) * W));
    }
    const onPtr = (e) => {
      if (!running) return;
      if (e.touches && e.touches[0]) { e.preventDefault(); moveTo(e.touches[0].clientX); }
      else moveTo(e.clientX);
    };
    const onKey = (e) => {
      if (!running) return;
      if (e.key === 'ArrowLeft') basketX = Math.max(basketW / 2, basketX - 30);
      if (e.key === 'ArrowRight') basketX = Math.min(W - basketW / 2, basketX + 30);
    };
    cv.addEventListener('pointermove', onPtr);
    cv.addEventListener('touchstart', onPtr, { passive: false });
    cv.addEventListener('touchmove', onPtr, { passive: false });
    window.addEventListener('keydown', onKey);
    activeCleanup = () => { running = false; cancelAnimationFrame(rafId); cv.removeEventListener('pointermove', onPtr); cv.removeEventListener('touchstart', onPtr); cv.removeEventListener('touchmove', onPtr); window.removeEventListener('keydown', onKey); };

    function spawn() {
      const r = Math.random();
      let kind = 'olive', pts = 1, vy = P.speedMin + Math.random() * (P.speedMax - P.speedMin);
      if (r < P.rockRate) { kind = 'rock'; pts = 0; }
      else if (r < P.rockRate + 0.05 && hearts < 3) { kind = 'heart'; pts = 0; }
      else if (r > 0.82) { kind = 'gold'; pts = 3; vy *= 1.15; }
      items.push({ x: 24 + Math.random() * (W - 48), y: -20, vy, kind, pts });
    }

    function loop(ts) {
      if (!running) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      spawnAcc += dt; secAcc += dt;
      if (spawnAcc >= P.spawnEvery) { spawnAcc = 0; spawn(); }
      if (secAcc >= 1) {
        secAcc -= 1; timeLeft--;
        const tEl = document.getElementById('og-c-time'); if (tEl) tEl.textContent = Math.max(0, timeLeft);
        if (timeLeft <= 0) {
          running = false;
          showPostGameScreen('catch', diff, score >= P.target, `جمعت ${score} نقطة من أصل ${P.target}!`);
          return;
        }
      }

      // Sinai sunset/day sky + hills + olive canopy
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#bae6fd'); sky.addColorStop(0.68, '#f0fdf4'); sky.addColorStop(1, '#86efac');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // Hills
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath(); ctx.ellipse(90, H, 160, 58, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3f6212';
      ctx.beginPath(); ctx.ellipse(295, H, 175, 65, 0, Math.PI, 0); ctx.fill();
      // Tree canopy
      ctx.fillStyle = '#15803d';
      for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.arc(28 + i * 56, 6, 33, 0, Math.PI * 2); ctx.fill(); }

      const bTop = H - 56;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.vy * dt;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (it.kind === 'gold') {
          ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(it.x, it.y, 16, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.font = '18px sans-serif'; ctx.fillText('🫒', it.x, it.y + 1);
        } else {
          ctx.font = '26px sans-serif';
          ctx.fillText(it.kind === 'rock' ? '🪨' : (it.kind === 'heart' ? '❤️' : '🫒'), it.x, it.y);
        }

        if (it.y + 12 >= bTop && it.y <= bTop + basketH && Math.abs(it.x - basketX) <= basketW / 2 + 10) {
          items.splice(i, 1);
          if (it.kind === 'rock') {
            hearts--; combo = 0; sfxBad();
            pops.push({ x: it.x, y: bTop - 8, txt: '💥 -❤️', c: '#dc2626', l: 0.7 });
            const hEl = document.getElementById('og-c-hearts'); if (hEl) hEl.textContent = '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, 3 - hearts));
            const cbEl = document.getElementById('og-c-combo'); if (cbEl) cbEl.textContent = combo;
            if (hearts <= 0) {
              running = false;
              showPostGameScreen('catch', diff, false, `اصطدمت السلة بالحجارة! جمعت ${score} من ${P.target}.`);
              return;
            }
          } else if (it.kind === 'heart') {
            hearts = Math.min(3, hearts + 1); sfxGold();
            pops.push({ x: it.x, y: bTop - 8, txt: '+❤️', c: '#e11d48', l: 0.7 });
            const hEl = document.getElementById('og-c-hearts'); if (hEl) hEl.textContent = '❤️'.repeat(hearts) + '🖤'.repeat(3 - hearts);
          } else {
            combo++;
            const bonus = combo >= 5 ? 1 : 0;
            score += it.pts + bonus;
            it.kind === 'gold' ? sfxGold() : sfxGood();
            pops.push({ x: it.x, y: bTop - 8, txt: it.kind === 'gold' ? '+3 ذهبي!' : (bonus ? '+2 كومبو!' : '+1'), c: it.kind === 'gold' ? '#b45309' : '#15803d', l: 0.65 });
            const sEl = document.getElementById('og-c-score'); if (sEl) sEl.textContent = score;
            const cbEl = document.getElementById('og-c-combo'); if (cbEl) cbEl.textContent = combo;
            if (score >= P.target) {
              running = false;
              showPostGameScreen('catch', diff, true, `أحسنت! قطفت ${score} ثمرة سيناوية ممتازة وتبقّى ${timeLeft} ثانية! 🫒`);
              return;
            }
          }
          continue;
        }
        if (it.y > H + 25) items.splice(i, 1);
      }

      // Draw basket
      const bx = basketX - basketW / 2;
      ctx.fillStyle = '#92400e'; ctx.strokeStyle = '#c59b27'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, bTop); ctx.lineTo(bx + basketW, bTop); ctx.lineTo(bx + basketW - 8, bTop + basketH); ctx.lineTo(bx + 8, bTop + basketH); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧺', basketX, bTop + 17);

      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i]; p.y -= 45 * dt; p.l -= dt;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.l / 0.7); ctx.fillStyle = p.c; ctx.font = 'bold 15px sans-serif'; ctx.fillText(p.txt, p.x, p.y); ctx.restore();
        if (p.l <= 0) pops.splice(i, 1);
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  // =========================================================================
  // 2. ❄️ تحدي العصر على البارد (سهل / متوسط / صعب)
  // =========================================================================
  function runColdPressGame(body, diff) {
    const P = {
      easy: { fillStep: 4.8, heatStep: 1.25, coolStep: 0.44, lockout: 1000 },
      medium: { fillStep: 4.1, heatStep: 1.65, coolStep: 0.37, lockout: 1350 },
      hard: { fillStep: 3.5, heatStep: 2.05, coolStep: 0.32, lockout: 1650 }
    }[diff];
    let timeLeft = getGameTime('press', diff);

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
        <strong style="color:#0369a1;font-size:0.86rem;">حافظ على الحرارة &lt; 27°م ❄️</strong>
      </div>
      <div class="og-hud">
        <span>🏺 التعبئة: <b id="og-p-pct">0</b>%</span>
        <span>🌡️ الحرارة: <b id="og-p-temp">18.0</b>°م</span>
        <span>⏱️ <b id="og-p-time">${timeLeft}</b>ث</span>
      </div>
      <div class="og-press-arena">
        <div style="font-size:0.82rem;font-weight:800;color:#153422;">املأ زجاجة الزيت السيناوي 100% بإيقاع متزن قبل انتهاء الوقت بدون أن تتخطى الحرارة 27°م!</div>
        <div class="og-press-visual">
          <div class="og-bottle-shell">
            <div class="og-bottle-fill" id="og-bottle-fill"></div>
            <div class="og-bottle-label" id="og-bottle-lbl">0%</div>
          </div>
          <div class="og-thermo-wrap">
            <div class="og-thermo-bar">
              <div class="og-thermo-fill" id="og-thermo-fill"></div>
              <div class="og-thermo-limit"></div>
            </div>
            <span style="font-size:0.74rem;font-weight:900;color:#dc2626;">حد 27°م</span>
          </div>
        </div>
        <button type="button" class="og-press-btn" id="og-press-tap-btn">🫒 اضغط للعصر على البارد!</button>
      </div>
    `;

    let fill = 0, temp = 18, cooledUntil = 0, running = true;
    const btn = document.getElementById('og-press-tap-btn');
    function updateUI() {
      const f = Math.min(100, Math.round(fill));
      const fe = document.getElementById('og-bottle-fill'); if (fe) fe.style.height = f + '%';
      const le = document.getElementById('og-bottle-lbl'); if (le) le.textContent = f + '%';
      const pe = document.getElementById('og-p-pct'); if (pe) pe.textContent = f;
      const te = document.getElementById('og-p-temp'); if (te) te.textContent = temp.toFixed(1);
      const th = document.getElementById('og-thermo-fill');
      if (th) {
        th.style.height = Math.max(8, Math.min(100, ((temp - 14) / 18) * 100)) + '%';
        th.style.background = temp >= 26.5 ? '#dc2626' : (temp >= 23.5 ? '#f59e0b' : '#16a34a');
      }
      const hot = Date.now() < cooledUntil;
      if (btn) {
        btn.classList.toggle('overheat', hot);
        btn.textContent = hot ? '🔥 ساخن! استنى لحظة تبرد المعصرة...' : '🫒 اضغط للعصر على البارد!';
      }
    }

    btn.addEventListener('click', () => {
      if (!running) return;
      if (Date.now() < cooledUntil) { sfxBad(); return; }
      const sweetBonus = (temp >= 20 && temp <= 25) ? 1.18 : 1;
      fill = Math.min(100, fill + P.fillStep * sweetBonus);
      temp = Math.min(31, temp + P.heatStep);
      sfxGood();
      if (temp >= 27) { cooledUntil = Date.now() + P.lockout; sfxBad(); }
      updateUI();
      if (fill >= 100) {
        running = false;
        showPostGameScreen('press', diff, true, `عصرت زجاجة زيت بكر ممتاز 100% على البارد وتبقّى ${timeLeft} ثانية! ❄️`);
      }
    });

    const tick = setInterval(() => { if (!running) return; temp = Math.max(18, temp - P.coolStep); updateUI(); }, 100);
    const secT = setInterval(() => {
      if (!running) return;
      timeLeft--;
      const tEl = document.getElementById('og-p-time'); if (tEl) tEl.textContent = Math.max(0, timeLeft);
      if (timeLeft <= 0) {
        running = false;
        showPostGameScreen('press', diff, false, `انتهى الوقت عند ${Math.round(fill)}% فقط — جرّب إيقاع أسرع بدون تخطي 27°م!`);
      }
    }, 1000);
    activeCleanup = () => { running = false; clearInterval(tick); clearInterval(secT); };
    updateUI();
  }

  // =========================================================================
  // 3. 🧠 تحدي خبير زيت الزيتون (10,800 سؤال فريد • عدد أسئلة ثابت حسب المدير • مؤقت)
  // =========================================================================
  function runQuizGame(body, diff) {
    const cfg = getCfg();
    const count = Math.max(1, Math.min(25, Number(cfg.quizQuestionCount) || 5));
    const customQs = (cfg.games && cfg.games.quiz && cfg.games.quiz.customQuestions) || [];
    const questions = window.OliveQuizBank
      ? window.OliveQuizBank.getRoundQuestions(diff, count, customQs)
      : [{ q: 'ما أقصى درجة حرارة للعصر على البارد؟', options: ['أقل من 27°م', '60°م', '100°م'], correct: 0, fact: 'أقل من 27°م يحفظ الفوائد 🌿' }];

    let idx = 0, rightCount = 0, timeLeft = getGameTime('quiz', diff), running = true;
    const passNeed = Math.max(1, Math.ceil(questions.length * 0.7));

    const timer = setInterval(() => {
      if (!running) return;
      timeLeft--;
      const tEl = document.getElementById('og-q-time'); if (tEl) tEl.textContent = Math.max(0, timeLeft);
      if (timeLeft <= 0) {
        running = false;
        showPostGameScreen('quiz', diff, false, `انتهى الوقت! أجبت ${rightCount} من ${questions.length}.`);
      }
    }, 1000);
    activeCleanup = () => { running = false; clearInterval(timer); };

    function renderQ() {
      const qObj = questions[idx];
      body.innerHTML = `
        <div class="og-stage-header">
          <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
          <strong style="color:#6d28d9;font-size:0.86rem;">سؤال ${idx + 1} من ${questions.length} (للفوز: ${passNeed})</strong>
        </div>
        <div class="og-hud">
          <span>✅ صحيحة: <b>${rightCount}</b></span>
          <span>⏱️ <b id="og-q-time">${timeLeft}</b>ث</span>
          <span>📚 بنك 10,800+</span>
        </div>
        <div class="og-quiz-card">
          <div class="og-quiz-q">${esc(qObj.q)}</div>
          <div>${(qObj.options || []).map((o, i) => `<button type="button" class="og-quiz-opt" data-i="${i}">${esc(o)}</button>`).join('')}</div>
          <div id="og-quiz-fb"></div>
        </div>
      `;
      let answered = false;
      body.querySelectorAll('.og-quiz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!running || answered) return;
          answered = true;
          const pick = Number(btn.getAttribute('data-i'));
          const corr = Number(qObj.correct) || 0;
          body.querySelectorAll('.og-quiz-opt').forEach((b, bi) => {
            if (bi === corr) b.classList.add('correct');
            else if (bi === pick) b.classList.add('wrong');
          });
          if (pick === corr) { rightCount++; sfxGood(); } else sfxBad();
          const fb = document.getElementById('og-quiz-fb');
          if (fb) {
            fb.innerHTML = `
              <div class="og-quiz-fact">${pick === corr ? '✅ ممتاز! ' : '❌ معلومة: '}${esc(qObj.fact || '')}</div>
              <button type="button" class="og-primary-btn" style="margin-top:8px;" id="og-q-next">${idx + 1 < questions.length ? 'السؤال التالي ◀' : 'عرض النتيجة 🏆'}</button>
            `;
            document.getElementById('og-q-next').addEventListener('click', () => {
              idx++;
              if (idx < questions.length) renderQ();
              else {
                running = false;
                const won = rightCount >= passNeed;
                showPostGameScreen('quiz', diff, won, `أجبت ${rightCount} من ${questions.length} إجابات صحيحة! (المطلوب ${passNeed})`);
              }
            });
          }
        });
      });
    }
    renderQ();
  }

  // =========================================================================
  // 4. 🌿 ذاكرة مزرعة الشجرة المباركة (3 مراحل تصاعدية: كروت أكثر + وقت أقل + أشكال مختلفة!)
  // =========================================================================
  function runMemoryStagesGame(body, diff) {
    const ALL_ICONS = [
      { id: 'olive', ic: '🫒', lb: 'زيتون' }, { id: 'bottle', ic: '🏺', lb: 'عصرة أولى' },
      { id: 'herb', ic: '🌿', lb: 'زعتر' }, { id: 'cert', ic: '🏅', lb: 'جودة' },
      { id: 'sun', ic: '☀️', lb: 'سيناء' }, { id: 'honey', ic: '🍯', lb: 'عسل' },
      { id: 'truck', ic: '🚚', lb: 'توصيل' }, { id: 'gift', ic: '🎁', lb: 'هدية' },
      { id: 'drop', ic: '💧', lb: 'قطرة' }, { id: 'basket', ic: '🧺', lb: 'قطف' },
      { id: 'cold', ic: '❄️', lb: 'ع البارد' }, { id: 'heart', ic: '💚', lb: 'صحة' }
    ];
    const baseTime = getGameTime('memory', diff);
    const STAGES = {
      easy: [
        { pairs: 4, cols: 4, time: baseTime, shape: '' },
        { pairs: 6, cols: 4, time: Math.max(18, baseTime - 6), shape: 'shape-arch' },
        { pairs: 8, cols: 4, time: Math.max(20, baseTime - 10), shape: 'shape-diamond' }
      ],
      medium: [
        { pairs: 6, cols: 4, time: baseTime, shape: 'shape-arch' },
        { pairs: 8, cols: 4, time: Math.max(20, baseTime - 5), shape: 'shape-circle' },
        { pairs: 10, cols: 4, time: Math.max(24, baseTime - 7), shape: 'shape-diamond' }
      ],
      hard: [
        { pairs: 8, cols: 4, time: baseTime, shape: 'shape-diamond' },
        { pairs: 10, cols: 5, time: Math.max(22, baseTime - 4), shape: 'shape-circle' },
        { pairs: 12, cols: 4, time: Math.max(25, baseTime - 6), shape: 'shape-arch' }
      ]
    }[diff];

    let stageIdx = 0, totalMoves = 0, timerId = null, running = true;

    function startStage() {
      if (timerId) clearInterval(timerId);
      const st = STAGES[stageIdx];
      let timeLeft = st.time, matched = 0, locked = false, flipped = [];
      const chosen = ALL_ICONS.slice(0, st.pairs);
      const deck = [...chosen, ...chosen].sort(() => Math.random() - 0.5);

      body.innerHTML = `
        <div class="og-stage-header">
          <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
          <strong style="color:#0f766e;font-size:0.86rem;">المرحلة ${stageIdx + 1} من ${STAGES.length} (${st.pairs * 2} كارت)</strong>
        </div>
        <div class="og-hud">
          <span>✅ متطابقة: <b id="og-m-mat">0</b>/${st.pairs}</span>
          <span>🔄 حركات: <b id="og-m-mv">${totalMoves}</b></span>
          <span>⏱️ <b id="og-m-tm">${timeLeft}</b>ث</span>
        </div>
        <div class="og-mem-grid" style="grid-template-columns:repeat(${st.cols}, 1fr);">
          ${deck.map((c, i) => `
            <div class="og-mem-card ${st.shape}" data-id="${c.id}" data-i="${i}">
              <div class="og-mem-inner">
                <div class="og-mem-face og-mem-front">🫒</div>
                <div class="og-mem-face og-mem-back">
                  <div style="font-size:${st.pairs >= 10 ? '1.3rem' : '1.65rem'};">${c.ic}</div>
                  <div style="font-size:0.62rem;">${c.lb}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      timerId = setInterval(() => {
        if (!running) return;
        timeLeft--;
        const tEl = document.getElementById('og-m-tm'); if (tEl) tEl.textContent = Math.max(0, timeLeft);
        if (timeLeft <= 0) {
          running = false; clearInterval(timerId);
          showPostGameScreen('memory', diff, false, `انتهى الوقت في المرحلة ${stageIdx + 1}! (تطابق ${matched} من ${st.pairs})`);
        }
      }, 1000);
      activeCleanup = () => { running = false; clearInterval(timerId); };

      body.querySelectorAll('.og-mem-card').forEach(card => {
        card.addEventListener('click', () => {
          if (!running || locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
          card.classList.add('flipped');
          playTone(540, 0.05, 'sine', 0.05);
          flipped.push(card);
          if (flipped.length === 2) {
            totalMoves++;
            const mv = document.getElementById('og-m-mv'); if (mv) mv.textContent = totalMoves;
            const [a, b] = flipped;
            if (a.getAttribute('data-id') === b.getAttribute('data-id')) {
              a.classList.add('matched'); b.classList.add('matched');
              flipped = []; matched++; sfxGood();
              const mt = document.getElementById('og-m-mat'); if (mt) mt.textContent = matched;
              if (matched === st.pairs) {
                clearInterval(timerId);
                if (stageIdx + 1 < STAGES.length) {
                  sfxStage();
                  stageIdx++;
                  setTimeout(() => { if (running) startStage(); }, 550);
                } else {
                  running = false;
                  showPostGameScreen('memory', diff, true, `بطل الذاكرة! أنهيت المراحل الثلاث بالكامل في ${totalMoves} حركة! 🌿🏆`);
                }
              }
            } else {
              locked = true;
              setTimeout(() => {
                a.classList.remove('flipped'); b.classList.remove('flipped');
                flipped = []; locked = false;
              }, 520);
            }
          }
        });
      });
    }
    startStage();
  }

  // =========================================================================
  // 5. 🚚 سائق شاحنة زيت سيناء (لعبة جديدة — 3 حارات سريعة 60fps!)
  // =========================================================================
  function runTruckGame(body, diff) {
    const P = {
      easy: { speed: 210, spawnEvery: 0.82, obsRate: 0.45, targetCans: 10 },
      medium: { speed: 285, spawnEvery: 0.62, obsRate: 0.55, targetCans: 14 },
      hard: { speed: 365, spawnEvery: 0.48, obsRate: 0.62, targetCans: 18 }
    }[diff];
    let timeLeft = getGameTime('truck', diff);

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
        <strong style="color:#92400e;font-size:0.86rem;">اجمع ${P.targetCans} عبوة زيت أو صِل لنهاية الطريق! 🚚</strong>
      </div>
      <div class="og-hud">
        <span>🏺 العبوات: <b id="og-t-cans">0</b>/${P.targetCans}</span>
        <span>⏱️ <b id="og-t-time">${timeLeft}</b>ث</span>
        <span id="og-t-hearts">❤️❤️❤️</span>
      </div>
      <div class="og-canvas-wrap">
        <canvas id="og-truck-cv" class="og-game-canvas" width="360" height="340"></canvas>
      </div>
      <div class="og-lane-controls">
        <button type="button" class="og-ctrl-btn" id="og-t-right">يمين ➡️</button>
        <button type="button" class="og-ctrl-btn" id="og-t-left">⬅️ يسار</button>
      </div>
    `;

    const cv = document.getElementById('og-truck-cv');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const laneXs = [W * 0.22, W * 0.5, W * 0.78];
    let lane = 1, truckX = laneXs[1], cans = 0, hearts = 3, running = true;
    const objs = [];
    let lastTs = performance.now(), spawnAcc = 0, secAcc = 0, stripeY = 0, rafId = 0;

    function goLeft() { if (lane > 0) { lane--; playTone(420, 0.05, 'sine', 0.05); } }
    function goRight() { if (lane < 2) { lane++; playTone(480, 0.05, 'sine', 0.05); } }

    document.getElementById('og-t-left').addEventListener('click', goLeft);
    document.getElementById('og-t-right').addEventListener('click', goRight);
    const onKey = (e) => { if (e.key === 'ArrowLeft') goLeft(); if (e.key === 'ArrowRight') goRight(); };
    let touchStartX = null;
    const onTS = (e) => { if (e.touches[0]) touchStartX = e.touches[0].clientX; };
    const onTE = (e) => {
      if (touchStartX === null || !e.changedTouches[0]) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx > 22) goRight(); else if (dx < -22) goLeft();
      touchStartX = null;
    };
    window.addEventListener('keydown', onKey);
    cv.addEventListener('touchstart', onTS, { passive: true });
    cv.addEventListener('touchend', onTE, { passive: true });
    activeCleanup = () => { running = false; cancelAnimationFrame(rafId); window.removeEventListener('keydown', onKey); };

    function loop(ts) {
      if (!running) return;
      const dt = Math.min(0.05, (ts - lastTs) / 1000);
      lastTs = ts;
      spawnAcc += dt; secAcc += dt;
      stripeY = (stripeY + P.speed * dt) % 44;

      if (spawnAcc >= P.spawnEvery) {
        spawnAcc = 0;
        const ln = Math.floor(Math.random() * 3);
        const isObs = Math.random() < P.obsRate;
        objs.push({ lane: ln, x: laneXs[ln], y: -25, isObs, ic: isObs ? (Math.random() < 0.5 ? '🚧' : '🪨') : '🏺' });
      }
      if (secAcc >= 1) {
        secAcc -= 1; timeLeft--;
        const tEl = document.getElementById('og-t-time'); if (tEl) tEl.textContent = Math.max(0, timeLeft);
        if (timeLeft <= 0) {
          running = false;
          showPostGameScreen('truck', diff, cans >= Math.ceil(P.targetCans * 0.7), `أوصلت الشحنة وجمعت ${cans} عبوة زيت زيتون! 🚚`);
          return;
        }
      }

      // Draw Sinai desert borders + asphalt road
      ctx.fillStyle = '#d9b97e'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#334155'; ctx.fillRect(W * 0.08, 0, W * 0.84, H);
      ctx.fillStyle = '#c59b27'; ctx.fillRect(W * 0.08, 0, 5, H); ctx.fillRect(W * 0.92 - 5, 0, 5, H);
      // Dashed lane dividers
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      for (let y = -44 + stripeY; y < H; y += 44) {
        ctx.fillRect(W * 0.36 - 2, y, 4, 22);
        ctx.fillRect(W * 0.64 - 2, y, 4, 22);
      }

      // Smooth truck slide
      truckX += (laneXs[lane] - truckX) * Math.min(1, dt * 16);
      const ty = H - 62;

      // Update objects
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        o.y += P.speed * dt;
        ctx.font = '28px sans-serif';
        ctx.fillText(o.ic, o.x, o.y);

        if (Math.abs(o.y - ty) < 30 && Math.abs(o.x - truckX) < 34) {
          objs.splice(i, 1);
          if (o.isObs) {
            hearts--; sfxBad();
            const hEl = document.getElementById('og-t-hearts'); if (hEl) hEl.textContent = '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, 3 - hearts));
            if (hearts <= 0) {
              running = false;
              showPostGameScreen('truck', diff, false, `تعطلت الشاحنة بعد اصطدامات متكررة! جمعت ${cans} عبوة.`);
              return;
            }
          } else {
            cans++; sfxGood();
            const cEl = document.getElementById('og-t-cans'); if (cEl) cEl.textContent = cans;
            if (cans >= P.targetCans) {
              running = false;
              showPostGameScreen('truck', diff, true, `سائق محترف! وصلت شحنة ${cans} عبوة زيت سيناوي بأمان تام! 🚚🫒`);
              return;
            }
          }
          continue;
        }
        if (o.y > H + 30) objs.splice(i, 1);
      }

      // Draw Blessed Tree Truck
      ctx.fillStyle = '#153422'; ctx.strokeStyle = '#c59b27'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(truckX - 24, ty - 28, 48, 56, 10); ctx.fill(); ctx.stroke();
      ctx.font = '28px sans-serif'; ctx.fillText('🚚', truckX, ty);

      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  // =========================================================================
  // 6. 🎯 فرز حبات الزيتون السريع (لعبة جديدة — سير الفرز الاحترافي!)
  // =========================================================================
  function runSorterGame(body, diff) {
    const P = { easy: { target: 15 }, medium: { target: 22 }, hard: { target: 30 } }[diff];
    let timeLeft = getGameTime('sorter', diff);
    let score = 0, hearts = 3, running = true;

    const GOOD_ITEMS = [
      { ic: '🫒', name: 'زيتون سيناوي طازج', good: true },
      { ic: '✨🫒', name: 'زيتون ذهبي ممتاز', good: true },
      { ic: '🌿', name: 'ورق زيتون أخضر نقي', good: true }
    ];
    const BAD_ITEMS = [
      { ic: '🪨', name: 'حجر صغير (استبعده!)', good: false },
      { ic: '🍂', name: 'ورقة جافة تالفة', good: false },
      { ic: '🐛', name: 'ثمرة تالفة (استبعدها!)', good: false }
    ];
    let cur = null;

    function nextItem() {
      const pool = Math.random() < 0.56 ? GOOD_ITEMS : BAD_ITEMS;
      cur = pool[Math.floor(Math.random() * pool.length)];
      const icEl = document.getElementById('og-s-ic');
      const nmEl = document.getElementById('og-s-nm');
      if (icEl) icEl.textContent = cur.ic;
      if (nmEl) nmEl.textContent = cur.name;
    }

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
        <strong style="color:#c2410c;font-size:0.86rem;">افرز ${P.target} قطعة بدقة وسرعة! 🎯</strong>
      </div>
      <div class="og-hud">
        <span>✅ صحيح: <b id="og-s-sc">0</b>/${P.target}</span>
        <span>⏱️ <b id="og-s-tm">${timeLeft}</b>ث</span>
        <span id="og-s-ht">❤️❤️❤️</span>
      </div>
      <div style="background:linear-gradient(135deg,#f7f4ec,#fef3c7);border:2px solid #c59b27;border-radius:20px;padding:24px 16px;text-align:center;min-height:175px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div id="og-s-ic" style="font-size:4.2rem;line-height:1.1;">🫒</div>
        <div id="og-s-nm" style="font-size:1.05rem;font-weight:900;color:#153422;margin-top:8px;">...</div>
      </div>
      <div class="og-lane-controls">
        <button type="button" class="og-ctrl-btn accept" id="og-s-good">✅ عصرة أولى (اقبل)</button>
        <button type="button" class="og-ctrl-btn reject" id="og-s-bad">❌ استبعاد (ارفض)</button>
      </div>
    `;

    function answer(choseGood) {
      if (!running || !cur) return;
      if (choseGood === cur.good) {
        score++; sfxGood();
        const sc = document.getElementById('og-s-sc'); if (sc) sc.textContent = score;
        if (score >= P.target) {
          running = false;
          showPostGameScreen('sorter', diff, true, `خبير فرز المعصرة! فرزت ${score} حبة بدقة عالية وتبقّى ${timeLeft}ث! 🎯`);
          return;
        }
      } else {
        hearts--; sfxBad();
        const ht = document.getElementById('og-s-ht'); if (ht) ht.textContent = '❤️'.repeat(Math.max(0, hearts)) + '🖤'.repeat(Math.max(0, 3 - hearts));
        if (hearts <= 0) {
          running = false;
          showPostGameScreen('sorter', diff, false, `حدثت 3 أخطاء في الفرز! وصلت لـ ${score} من ${P.target}.`);
          return;
        }
      }
      nextItem();
    }

    document.getElementById('og-s-good').addEventListener('click', () => answer(true));
    document.getElementById('og-s-bad').addEventListener('click', () => answer(false));
    const timer = setInterval(() => {
      if (!running) return;
      timeLeft--;
      const tm = document.getElementById('og-s-tm'); if (tm) tm.textContent = Math.max(0, timeLeft);
      if (timeLeft <= 0) {
        running = false;
        showPostGameScreen('sorter', diff, false, `انتهى الوقت عند ${score} من ${P.target} — أسرع قليلاً في الجولة القادمة!`);
      }
    }, 1000);
    activeCleanup = () => { running = false; clearInterval(timer); };
    nextItem();
  }

  // =========================================================================
  // 7. 🫧 مطابقة قطرات الذهب (لعبة جديدة — Match/Burst Puzzle 6×6!)
  // =========================================================================
  function runDropsMatchGame(body, diff) {
    const P = {
      easy: { target: 120, colors: 4 },
      medium: { target: 220, colors: 5 },
      hard: { target: 340, colors: 5 }
    }[diff];
    const ICONS = ['🫒', '✨', '💧', '🌺', '🌿'];
    const R = 6, C = 6;
    let grid = Array.from({ length: R }, () => Array.from({ length: C }, () => Math.floor(Math.random() * P.colors)));
    let score = 0, timeLeft = getGameTime('drops', diff), running = true;

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
        <strong style="color:#9d174d;font-size:0.86rem;">اضغط أي 2+ متشابهين متجاورين! الهدف: ${P.target}</strong>
      </div>
      <div class="og-hud">
        <span>🫧 النقاط: <b id="og-d-sc">0</b>/${P.target}</span>
        <span>⏱️ <b id="og-d-tm">${timeLeft}</b>ث</span>
      </div>
      <div class="og-drops-grid" id="og-drops-grid"></div>
      <div class="og-touch-hint">💡 كلما كانت المجموعة أكبر زادت نقاط الكومبو أضعافاً!</div>
    `;

    function findCluster(r0, c0) {
      const color = grid[r0][c0];
      const visited = new Set(), q = [[r0, c0]], res = [];
      visited.add(r0 + ',' + c0);
      while (q.length) {
        const [r, c] = q.shift();
        res.push([r, c]);
        for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nr = r + dr, nc = c + dc, key = nr + ',' + nc;
          if (nr >= 0 && nr < R && nc >= 0 && nc < C && !visited.has(key) && grid[nr][nc] === color) {
            visited.add(key); q.push([nr, nc]);
          }
        }
      }
      return res;
    }

    function renderGrid() {
      const box = document.getElementById('og-drops-grid');
      if (!box) return;
      let html = '';
      for (let r = 0; r < R; r++) {
        for (let c = 0; c < C; c++) {
          const v = grid[r][c];
          html += `<button type="button" class="og-drop-cell og-drop-${v}" data-r="${r}" data-c="${c}">${ICONS[v]}</button>`;
        }
      }
      box.innerHTML = html;
      box.querySelectorAll('.og-drop-cell').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!running) return;
          const r = Number(btn.getAttribute('data-r')), c = Number(btn.getAttribute('data-c'));
          const cluster = findCluster(r, c);
          if (cluster.length < 2) { sfxBad(); return; }
          const gained = cluster.length * cluster.length * 3;
          score += gained;
          cluster.length >= 4 ? sfxGold() : sfxGood();
          for (const [cr, cc] of cluster) grid[cr][cc] = -1;
          // Gravity refill
          for (let col = 0; col < C; col++) {
            const vals = [];
            for (let row = R - 1; row >= 0; row--) if (grid[row][col] !== -1) vals.push(grid[row][col]);
            while (vals.length < R) vals.push(Math.floor(Math.random() * P.colors));
            for (let row = R - 1, idx = 0; row >= 0; row--, idx++) grid[row][col] = vals[idx];
          }
          const scEl = document.getElementById('og-d-sc'); if (scEl) scEl.textContent = score;
          if (score >= P.target) {
            running = false;
            showPostGameScreen('drops', diff, true, `انفجار كومبو رائع! حققت ${score} نقطة وتبقّى ${timeLeft}ث! 🫧✨`);
            return;
          }
          renderGrid();
        });
      });
    }

    const timer = setInterval(() => {
      if (!running) return;
      timeLeft--;
      const tm = document.getElementById('og-d-tm'); if (tm) tm.textContent = Math.max(0, timeLeft);
      if (timeLeft <= 0) {
        running = false;
        showPostGameScreen('drops', diff, false, `انتهى الوقت عند ${score} من ${P.target} — ابحث عن المجموعات الكبيرة!`);
      }
    }, 1000);
    activeCleanup = () => { running = false; clearInterval(timer); };
    renderGrid();
  }

  // =========================================================================
  // 8. 🪙 كارت «اكشط قطرة الذهب» (خارج حد الـ 3 جوائز • نسب حظ محددة 100% من المدير!)
  // =========================================================================
  window.OliveGames_startScratch = function () {
    stopActiveGame();
    const body = document.getElementById('og-body');
    if (!body) return;
    const cfg = getCfg();
    const sc = cfg.scratchConfig || {};
    const maxTries = Math.max(1, Number(sc.dailyLimit) || 1);
    const used = getScratchUsedToday();

    if (used >= maxTries) {
      body.innerHTML = `
        <div class="og-celebration-wrap">
          <div style="font-size:2.8rem;">🪙</div>
          <h3 style="margin:6px 0;color:#92400e;">استخدمت كارت الكشط اليومي (${used}/${maxTries})</h3>
          <p style="font-size:0.86rem;color:#475569;">ارجع بكرة لكارت حظ جديد! ويمكنك الآن اللعب والفوز في باقي الـ 7 ألعاب 🎮</p>
          <button type="button" class="og-secondary-btn" onclick="window.OliveGames_renderLobby()">◀ العودة للألعاب</button>
        </div>`;
      return;
    }

    const outcome = weightedPick(sc.outcomes) || { label: 'حظ أوفر في المرة القادمة', type: 'none', value: 0 };
    const underEmoji = outcome.type === 'none' ? '🍀' : '🎁✨';
    const underText = outcome.label || (outcome.type === 'free_shipping' ? '🚚 توصيل مجاني!' : outcome.type === 'coupon' ? `خصم ${outcome.value}%` : outcome.type === 'points' ? `+${outcome.value} نقطة` : 'حظ أوفر في المرة القادمة');

    body.innerHTML = `
      <div class="og-stage-header">
        <button type="button" class="og-back-btn" onclick="window.OliveGames_renderLobby()">◀ خروج</button>
        <strong style="color:#b45309;font-size:0.88rem;">🪙 كارت قطرة الذهب (خارج الحد اليومي)</strong>
      </div>
      <div style="text-align:center;font-size:0.86rem;font-weight:800;color:#475569;margin-bottom:6px;">امسح الطبقة الذهبية بإصبعك لتكشف حظك اليوم!</div>
      <div class="og-scratch-card-wrap">
        <div class="og-scratch-under">
          <div style="font-size:2.4rem;">${underEmoji}</div>
          <div style="font-size:1.12rem;font-weight:900;color:#153422;margin-top:4px;">${esc(underText)}</div>
        </div>
        <canvas id="og-scratch-canvas" width="340" height="200"></canvas>
      </div>
      <button type="button" class="og-secondary-btn" id="og-sc-auto" style="max-width:340px;margin:8px auto 0;display:block;">✨ اكشط الكارت تلقائياً</button>
    `;

    const cv = document.getElementById('og-scratch-canvas');
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    let drawing = false, done = false, strokes = 0;
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#d4af37'); grd.addColorStop(0.5, '#fde68a'); grd.addColorStop(1, '#b45309');
    ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#153422'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🪙 امسح هنا بإصبعك', W / 2, H / 2 - 8);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('كارت حظ الشجرة المباركة ✨', W / 2, H / 2 + 22);

    function reveal() {
      if (done) return;
      done = true;
      incScratchUsedToday();
      ctx.clearRect(0, 0, W, H);
      setTimeout(() => showPostGameScreen('scratch', 'medium', true, '', true, outcome), 450);
    }
    function scratch(cx, cy) {
      if (done) return;
      const r = cv.getBoundingClientRect();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(((cx - r.left) / r.width) * W, ((cy - r.top) / r.height) * H, 26, 0, Math.PI * 2); ctx.fill();
      strokes++;
      if (strokes % 9 === 0) {
        const d = ctx.getImageData(0, 0, W, H).data;
        let cleared = 0, tot = 0;
        for (let i = 3; i < d.length; i += 32) { tot++; if (d[i] < 40) cleared++; }
        if (cleared / tot > 0.4) reveal();
      }
    }
    cv.addEventListener('pointerdown', (e) => { drawing = true; scratch(e.clientX, e.clientY); });
    cv.addEventListener('pointermove', (e) => { if (drawing) scratch(e.clientX, e.clientY); });
    window.addEventListener('pointerup', () => { drawing = false; });
    cv.addEventListener('touchstart', (e) => { e.preventDefault(); drawing = true; if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    cv.addEventListener('touchmove', (e) => { e.preventDefault(); if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    document.getElementById('og-sc-auto').addEventListener('click', reveal);
  };

  // =========================================================================
  // لوحة تحكم المدير الشاملة (جوائز عشوائية + حد يومي + كارت حظ بالنسب + أوقات كل لعبة + عدد الأسئلة)
  // =========================================================================
  window.OliveGames_renderAdminEditor = function () {
    const mount = document.getElementById('admin-olive-games-editor-mount');
    if (!mount) return;
    const cfg = getCfg();
    let pool = JSON.parse(JSON.stringify(cfg.rewardPool || []));
    let scOutcomes = JSON.parse(JSON.stringify((cfg.scratchConfig && cfg.scratchConfig.outcomes) || []));

    function renderPoolRows(targetId, arr, allowNone, sumId) {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.innerHTML = arr.map((item, idx) => `
        <div class="og-pool-row">
          <input type="text" placeholder="اسم الجائزة / النص" value="${esc(item.label || '')}" data-k="label" data-i="${idx}">
          <select data-k="type" data-i="${idx}">
            ${allowNone ? `<option value="none" ${item.type === 'none' ? 'selected' : ''}>🍀 حظ أوفر (بدون جائزة)</option>` : ''}
            <option value="coupon" ${item.type === 'coupon' ? 'selected' : ''}>🎟️ كوبون خصم (%)</option>
            <option value="free_shipping" ${item.type === 'free_shipping' ? 'selected' : ''}>🚚 كوبون توصيل مجاني</option>
            <option value="points" ${item.type === 'points' ? 'selected' : ''}>⭐ نقاط ولاء</option>
          </select>
          <input type="number" placeholder="القيمة" title="نسبة الخصم أو النقاط" value="${Number(item.value) || 0}" min="0" max="500" data-k="value" data-i="${idx}">
          <input type="number" placeholder="النسبة %" title="نسبة الظهور %" value="${Number(item.weight) || 0}" min="0" max="1000" data-k="weight" data-i="${idx}">
          <button type="button" class="btn btn-danger" style="padding:5px 9px;font-size:0.78rem;" data-del="${idx}">🗑️</button>
        </div>
      `).join('');

      const updateSum = () => {
        const s = arr.reduce((acc, x) => acc + (Number(x.weight) || 0), 0);
        const sEl = document.getElementById(sumId);
        if (sEl) sEl.innerHTML = `إجمالي النسب الحالية: <b style="color:${s === 100 ? '#15803d' : '#b45309'};">${s}%</b> ${s === 100 ? '✅ مثالي' : '(يُحسب نسبياً تلقائياً)'}`;
      };
      updateSum();

      el.querySelectorAll('input, select').forEach(inp => {
        inp.addEventListener('change', () => {
          const i = Number(inp.getAttribute('data-i')), k = inp.getAttribute('data-k');
          arr[i][k] = (k === 'value' || k === 'weight') ? Number(inp.value) || 0 : inp.value;
          updateSum();
        });
      });
      el.querySelectorAll('[data-del]').forEach(btn => {
        btn.addEventListener('click', () => {
          arr.splice(Number(btn.getAttribute('data-del')), 1);
          renderPoolRows(targetId, arr, allowNone, sumId);
        });
      });
    }

    const gamesRows = SKILL_GAMES.map(m => {
      const g = (cfg.games && cfg.games[m.key]) || { enabled: true, title: m.key, times: { easy: 30, medium: 24, hard: 18 } };
      const t = g.times || { easy: 30, medium: 24, hard: 18 };
      return `
        <div class="og-adm-box">
          <label style="display:flex;align-items:center;gap:8px;font-weight:900;color:#153422;cursor:pointer;margin:0;">
            <input type="checkbox" id="og95-en-${m.key}" ${g.enabled !== false ? 'checked' : ''} style="width:18px;height:18px;margin:0;accent-color:#15803d;">
            <span>${m.icon} ${esc(g.title)}</span>
          </label>
          <div class="og-adm-grid">
            <div class="og-adm-field"><label>⏱️ وقت السهل (ثانية)</label><input type="number" id="og95-te-${m.key}" value="${Number(t.easy) || 30}" min="10" max="300"></div>
            <div class="og-adm-field"><label>⏱️ وقت المتوسط (ثانية)</label><input type="number" id="og95-tm-${m.key}" value="${Number(t.medium) || 24}" min="10" max="300"></div>
            <div class="og-adm-field"><label>⏱️ وقت الصعب (ثانية)</label><input type="number" id="og95-th-${m.key}" value="${Number(t.hard) || 18}" min="10" max="300"></div>
          </div>
        </div>`;
    }).join('');

    const customQsText = ((cfg.games && cfg.games.quiz && cfg.games.quiz.customQuestions) || []).map(q => {
      const opts = q.options || [];
      return [q.q, opts[0] || '', opts[1] || '', opts[2] || '', q.fact || ''].join(' | ');
    }).join('\n');

    mount.innerHTML = `
      <div class="og-adm-box" style="border-color:#c59b27;background:rgba(197,155,39,0.08);">
        <h4>⚙️ الإعدادات العامة وحد الجوائز اليومية</h4>
        <label style="display:flex;align-items:center;gap:8px;font-weight:900;cursor:pointer;margin:0 0 8px;">
          <input type="checkbox" id="og95-master" ${cfg.enabled !== false ? 'checked' : ''} style="width:18px;height:18px;margin:0;accent-color:#15803d;">
          <span>✅ تشغيل مركز الألعاب بالكامل في المتجر</span>
        </label>
        <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;">
          <label style="display:flex;align-items:center;gap:6px;font-weight:700;margin:0;"><input type="checkbox" id="og95-fab" ${cfg.showHomeFab !== false ? 'checked' : ''} style="width:16px;height:16px;margin:0;"> زر الرئيسية فوق خدمة العملاء</label>
          <label style="display:flex;align-items:center;gap:6px;font-weight:700;margin:0;"><input type="checkbox" id="og95-sb" ${cfg.showSidebarBtn !== false ? 'checked' : ''} style="width:16px;height:16px;margin:0;"> زر القائمة الجانبية</label>
        </div>
        <div class="og-adm-grid">
          <div class="og-adm-field"><label>🎁 الحد الأقصى للجوائز يومياً للعميل</label><input type="number" id="og95-daily-cap" value="${Number(cfg.dailyRewardLimit) ?? 3}" min="0" max="50"></div>
          <div class="og-adm-field"><label>🧠 عدد أسئلة مسابقة الخبير (ثابت بكل المستويات)</label><input type="number" id="og95-quiz-cnt" value="${Number(cfg.quizQuestionCount) || 5}" min="1" max="25"></div>
        </div>
      </div>

      <div class="og-adm-box" style="border-color:#15803d;">
        <h4>🎲 سلة الجوائز العشوائية للألعاب (كوبون فريد مختلف لكل فوز وحساب!)</h4>
        <div style="font-size:0.76rem;color:#475569;margin-bottom:8px;">عند فوز العميل في أي لعبة، يسحب النظام عشوائياً من هذه القائمة حسب النسبة % (الكوبونات تصدر فريدة لمرة واحدة وعلى حساب الفائز فقط):</div>
        <div id="og95-pool-wrap"></div>
        <div id="og95-pool-sum" style="font-size:0.8rem;margin:4px 0 8px;"></div>
        <button type="button" class="btn btn-outline" style="width:100%;font-size:0.82rem;border-color:#15803d;color:#15803d;" id="og95-add-pool">➕ إضافة جائزة عشوائية جديدة</button>
      </div>

      <div class="og-adm-box" style="border-color:#d97706;background:rgba(217,119,6,0.06);">
        <h4>🪙 كارت الحظ «اكشط قطرة الذهب» (مستقل تماماً عن حد الـ 3 جوائز اليومية!)</h4>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">
          <label style="display:flex;align-items:center;gap:6px;font-weight:800;margin:0;"><input type="checkbox" id="og95-sc-en" ${(cfg.scratchConfig && cfg.scratchConfig.enabled !== false) ? 'checked' : ''} style="width:17px;height:17px;margin:0;"> تفعيل كارت الكشط</label>
          <div class="og-adm-field" style="width:160px;"><label>محاولات الكشط يومياً</label><input type="number" id="og95-sc-lim" value="${Number(cfg.scratchConfig && cfg.scratchConfig.dailyLimit) || 1}" min="1" max="20"></div>
        </div>
        <div style="font-size:0.76rem;color:#92400e;margin-bottom:6px;">حدد العناصر ونسبة ظهور كل عنصر (مثلاً: حظ أوفر 90% • خصم 5% بنسبة 5% • توصيل مجاني 5%):</div>
        <div id="og95-sc-wrap"></div>
        <div id="og95-sc-sum" style="font-size:0.8rem;margin:4px 0 8px;"></div>
        <button type="button" class="btn btn-outline" style="width:100%;font-size:0.82rem;border-color:#d97706;color:#b45309;" id="og95-add-sc">➕ إضافة عنصر حظ جديد لكارت الكشط</button>
      </div>

      <div class="og-adm-box">
        <h4>🧠 أسئلة إضافية مخصصة للمدير (بجانب بنك الـ 10,800+ سؤال الجاهز)</h4>
        <div class="og-adm-field">
          <label>اختياري — كل سطر: السؤال | الإجابة الصحيحة | خطأ 1 | خطأ 2 | المعلومة</label>
          <textarea id="og95-custom-qs" rows="3">${esc(customQsText)}</textarea>
        </div>
      </div>

      <h4 style="margin:12px 0 8px;color:#153422;">🎮 تشغيل/إيقاف والتحكم في وقت كل لعبة (سهل / متوسط / صعب):</h4>
      ${gamesRows}

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
        <button type="button" class="btn" style="flex:2;min-width:190px;background:#15803d;color:#fff;font-weight:900;" id="og95-save-btn">💾 حفظ كل إعدادات الألعاب والجوائز</button>
        <button type="button" class="btn btn-outline" style="flex:1;min-width:140px;border-color:#c59b27;color:#926d0b;" id="og95-open-btn">🎮 تجربة الألعاب الآن</button>
        <button type="button" class="btn btn-outline" style="flex:1;min-width:140px;border-color:#028090;color:#028090;" id="og95-reset-btn">🔄 تصفير جوائز اليوم للتجربة</button>
      </div>
    `;

    renderPoolRows('og95-pool-wrap', pool, false, 'og95-pool-sum');
    renderPoolRows('og95-sc-wrap', scOutcomes, true, 'og95-sc-sum');

    document.getElementById('og95-add-pool').addEventListener('click', () => {
      pool.push({ id: 'r_' + Date.now(), label: 'خصم 7% هدية', type: 'coupon', value: 7, weight: 10 });
      renderPoolRows('og95-pool-wrap', pool, false, 'og95-pool-sum');
    });
    document.getElementById('og95-add-sc').addEventListener('click', () => {
      scOutcomes.push({ id: 's_' + Date.now(), label: 'خصم 5% فوري', type: 'coupon', value: 5, weight: 5 });
      renderPoolRows('og95-sc-wrap', scOutcomes, true, 'og95-sc-sum');
    });
    document.getElementById('og95-open-btn').addEventListener('click', () => window.OliveGames_open());
    document.getElementById('og95-reset-btn').addEventListener('click', () => {
      localStorage.removeItem(DAILY_CAP_KEY);
      localStorage.removeItem(SCRATCH_LOG_KEY);
      if (typeof window.showToast === 'function') window.showToast('✅ تم تصفير عداد الجوائز اليومي وكارت الكشط للتجربة!', 'success');
    });

    document.getElementById('og95-save-btn').addEventListener('click', async () => {
      const next = getCfg();
      next.enabled = !!document.getElementById('og95-master').checked;
      next.showHomeFab = !!document.getElementById('og95-fab').checked;
      next.showSidebarBtn = !!document.getElementById('og95-sb').checked;
      next.dailyRewardLimit = Math.max(0, Number(document.getElementById('og95-daily-cap').value) || 0);
      next.quizQuestionCount = Math.max(1, Math.min(25, Number(document.getElementById('og95-quiz-cnt').value) || 5));
      next.rewardPool = pool;
      next.scratchConfig = {
        enabled: !!document.getElementById('og95-sc-en').checked,
        dailyLimit: Math.max(1, Number(document.getElementById('og95-sc-lim').value) || 1),
        outcomes: scOutcomes
      };
      SKILL_GAMES.forEach(m => {
        if (!next.games[m.key]) next.games[m.key] = { title: m.key };
        next.games[m.key].enabled = !!document.getElementById('og95-en-' + m.key).checked;
        next.games[m.key].times = {
          easy: Math.max(10, Number(document.getElementById('og95-te-' + m.key).value) || 30),
          medium: Math.max(10, Number(document.getElementById('og95-tm-' + m.key).value) || 24),
          hard: Math.max(10, Number(document.getElementById('og95-th-' + m.key).value) || 18)
        };
      });
      const cText = (document.getElementById('og95-custom-qs') || {}).value || '';
      next.games.quiz.customQuestions = cText.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
        const p = l.split('|').map(x => x.trim());
        return p.length >= 3 ? { q: p[0], options: [p[1], p[2], p[3] || 'خيار آخر'], correct: 0, fact: p[4] || '' } : null;
      }).filter(Boolean);

      const btn = document.getElementById('og95-save-btn');
      btn.disabled = true; btn.textContent = '⏳ جاري الحفظ...';
      const ok = typeof window.V95_saveGamesConfig === 'function' ? await window.V95_saveGamesConfig(next) : false;
      btn.disabled = false; btn.textContent = '💾 حفظ كل إعدادات الألعاب والجوائز';
      if (typeof window.showToast === 'function') {
        window.showToast(ok ? '✅ تم حفظ إعدادات الـ 8 ألعاب والجوائز العشوائية بنجاح!' : '⚠️ تم الحفظ محلياً — اتصل بالإنترنت للمزامنة', ok ? 'success' : 'info');
      }
    });
  };

  window.OliveGames_open = function (initialKey) {
    const ov = ensureModal();
    ov.classList.add('open');
    if (initialKey === 'scratch') window.OliveGames_startScratch();
    else if (initialKey) window.OliveGames_pickDifficulty(initialKey);
    else window.OliveGames_renderLobby();
  };
})();
