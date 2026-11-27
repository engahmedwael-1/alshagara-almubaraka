/* ============================================================================
   Zait Store Olive Games Ultra V99 — Pack 5 (6 Brand-New 1,000-Level Games)
   Brings the Complete Offline & Multi-Device Suite to 27 Games x 1,000 Levels!
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_PACK5_V99__) return;
  window.__ZAIT_OLIVE_PACK5_V99__ = true;

  function ensurePack5Css() {
    if (document.getElementById("zait-v99-pack5-css")) return;
    var st = document.createElement("style");
    st.id = "zait-v99-pack5-css";
    st.textContent = [
      ".p5-ttt-grid{display:grid;gap:8px;max-width:340px;margin:8px auto;padding:10px;background:#0a2114;border:2px solid #d59e2a;border-radius:18px}",
      ".p5-ttt-cell{aspect-ratio:1/1;border-radius:14px;border:1.5px solid rgba(213,158,42,.42);background:rgba(255,255,255,.07);color:#fde68a;font-size:2rem;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .12s,background .15s;position:relative}",
      ".p5-ttt-cell:hover:not(:disabled){background:rgba(250,204,21,.16);transform:scale(1.03)}",
      ".p5-ttt-cell.win{background:linear-gradient(135deg,#16a34a,#15803d)!important;border-color:#86efac!important}",
      ".p5-ttt-cell.lose{background:linear-gradient(135deg,#dc2626,#991b1b)!important;border-color:#fca5a5!important}",
      ".p5-dpad{display:grid;grid-template-columns:repeat(3,58px);justify-content:center;gap:6px;margin-top:8px}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function bootPack5() {
    if (typeof window.ZaitRegisterExtraGame !== "function" || !window.ZaitV99) {
      setTimeout(bootPack5, 120);
      return;
    }
    ensurePack5Css();
    var V99 = window.ZaitV99;

    // =========================================================================
    // PACK 5 GAME 1: 🍉 دمج ثمار المزرعة (Suika Olive Drop & Merge — 1,000 Levels!)
    // =========================================================================
    window.ZaitRegisterExtraGame("suika", {
      icon: "🍉",
      grad: "linear-gradient(135deg,#15803d,#b45309)",
      name: "دمج ثمار المزرعة (Suika)",
      desc: "أسقط الثمار المتشابهة لتندمج وتكبر من البذرة 🌱 حتى الجركن الذهبي 🛢️ قبل امتلاء الصندوق!",
      cat: "brain",
      hardTag: "1000 دور 🍉",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage);
        var isBoss = (stage % 10 === 0);
        var TIERS = [
          { r: 14, col: "#86efac", dark: "#166534", ic: "🌱", pts: 4 },
          { r: 19, col: "#4ade80", dark: "#14532d", ic: "🫒", pts: 10 },
          { r: 24, col: "#facc15", dark: "#854d0e", ic: "✨", pts: 22 },
          { r: 30, col: "#fb923c", dark: "#9a3412", ic: "🍊", pts: 45 },
          { r: 36, col: "#f87171", dark: "#991b1b", ic: "🍎", pts: 90 },
          { r: 43, col: "#38bdf8", dark: "#075985", ic: "🏺", pts: 180 },
          { r: 51, col: "#eab308", dark: "#713f12", ic: "🛢️", pts: 360 },
          { r: 59, col: "#c084fc", dark: "#581c87", ic: "👑", pts: 700 }
        ];
        var targetScore = Math.round(140 + diff * 460 + (isBoss ? 140 : 0));
        var duration = Math.round(80 + V99.getExtraTimeBonus() + (isBoss ? 15 : 0));

        var st = api.createStageShell("دمج الثمار (Suika)", stage, duration, "⭐ 0/" + targetScore, "🍉 حرّك بالماوس أو بإصبعك ثم اضغط للإسقاط • ادمج المتشابهين قبل تخطي الخط الأحمر!");
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-suika"></canvas></div>';

        var cv = document.getElementById("og-cv-suika");
        var g = api.setupHiDpiCanvas(cv, 360, 440);
        var ctx = g.ctx, W = g.w, H = g.h;
        var WALL_L = 18, WALL_R = W - 18, FLOOR_Y = H - 14, DANGER_Y = 82;

        var balls = [], pops = [];
        var dropX = W / 2, curTier = 0, nextTier = Math.floor(Math.random() * 3);
        var score = 0, rem = duration, dropCD = 0, overTime = 0, running = false, ended = false, raf = null, lastTs = 0, idSeq = 1;

        function nextDropTier() { return Math.floor(Math.random() * (stage >= 4 ? 4 : 3)); }

        function setDropX(ev) {
          var p = api.getPointerPos(ev, cv, W, H);
          var r = TIERS[curTier].r;
          dropX = Math.max(WALL_L + r + 2, Math.min(WALL_R - r - 2, p.x));
        }
        function doDrop(ev) {
          if (!running || api.isPaused() || ended || dropCD > 0) return;
          if (ev) setDropX(ev);
          var t = TIERS[curTier];
          balls.push({ id: idSeq++, x: dropX, y: 54, vx: (Math.random() - 0.5) * 14, vy: 20, tier: curTier, r: t.r, age: 0 });
          curTier = nextTier; nextTier = nextDropTier();
          dropCD = 0.42;
          api.playSfx("pop"); api.haptic(10);
        }

        var onMove = function (e) { setDropX(e); };
        var onUp = function (e) { doDrop(e); };
        var onKey = function (e) {
          if (e.key === "ArrowLeft" || e.key === "a") dropX = Math.max(WALL_L + 20, dropX - 24);
          else if (e.key === "ArrowRight" || e.key === "d") dropX = Math.min(WALL_R - 20, dropX + 24);
          else if (e.code === "Space" || e.key === "ArrowDown") { e.preventDefault(); doDrop(); }
        };
        cv.addEventListener("pointermove", onMove);
        cv.addEventListener("pointerdown", onMove);
        cv.addEventListener("pointerup", onUp);
        window.addEventListener("keydown", onKey);

        function burst(x, y, col) {
          for (var i = 0; i < 10; i++) pops.push({ x: x, y: y, vx: (Math.random() - 0.5) * 190, vy: (Math.random() - 0.5) * 190, life: 0.45, c: col });
        }

        function drawBall(x, y, tierIdx) {
          var t = TIERS[tierIdx % TIERS.length];
          var gr = ctx.createRadialGradient(x - t.r * 0.3, y - t.r * 0.3, 2, x, y, t.r);
          gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.32, t.col); gr.addColorStop(1, t.dark);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, t.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.6; ctx.stroke();
          ctx.font = Math.round(t.r * 0.95) + "px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(t.ic, x, y + 1);
          ctx.textBaseline = "alphabetic";
        }

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.035, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt;
          if (dropCD > 0) dropCD -= dt;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true;
            api.finish(score >= targetScore, "حققت " + score + " نقطة في دمج الثمار!", "انتهى الوقت عند " + score + "/" + targetScore + " نقطة!");
            return;
          }

          // 4 physics sub-steps for stable stacking & crisp merges
          var subDt = dt / 4;
          for (var step = 0; step < 4; step++) {
            for (var i = 0; i < balls.length; i++) {
              var b = balls[i];
              b.age += subDt;
              b.vy += 860 * subDt;
              b.x += b.vx * subDt;
              b.y += b.vy * subDt;
              b.vx *= 0.992; b.vy *= 0.995;
              if (b.x - b.r < WALL_L) { b.x = WALL_L + b.r; b.vx = Math.abs(b.vx) * 0.35; }
              if (b.x + b.r > WALL_R) { b.x = WALL_R - b.r; b.vx = -Math.abs(b.vx) * 0.35; }
              if (b.y + b.r > FLOOR_Y) { b.y = FLOOR_Y - b.r; b.vy = -Math.abs(b.vy) * 0.22; b.vx *= 0.92; }
            }

            // Pairwise collisions & merges
            var mergedIds = {}, newlyAdded = [];
            for (var a = 0; a < balls.length; a++) {
              if (mergedIds[balls[a].id]) continue;
              for (var c = a + 1; c < balls.length; c++) {
                if (mergedIds[balls[c].id]) continue;
                var b1 = balls[a], b2 = balls[c];
                var dx = b2.x - b1.x, dy = b2.y - b1.y;
                var dist = Math.hypot(dx, dy) || 0.001;
                var minDist = b1.r + b2.r;
                if (dist < minDist) {
                  if (b1.tier === b2.tier && b1.tier < TIERS.length - 1) {
                    // MERGE!
                    mergedIds[b1.id] = true; mergedIds[b2.id] = true;
                    var nt = b1.tier + 1, tDef = TIERS[nt];
                    var mx = (b1.x + b2.x) / 2, my = (b1.y + b2.y) / 2;
                    newlyAdded.push({ id: idSeq++, x: mx, y: my, vx: (b1.vx + b2.vx) * 0.25, vy: -90, tier: nt, r: tDef.r, age: 0.4 });
                    score += tDef.pts;
                    st.setGoal("⭐ " + score + "/" + targetScore);
                    burst(mx, my, tDef.col);
                    api.playSfx(nt >= 4 ? "gold" : "pop");
                    api.haptic(nt >= 4 ? 24 : 12);
                    break;
                  } else {
                    // Elastic separation
                    var overlap = (minDist - dist) * 0.5;
                    var nx = dx / dist, ny = dy / dist;
                    b1.x -= nx * overlap; b1.y -= ny * overlap;
                    b2.x += nx * overlap; b2.y += ny * overlap;
                    var rvx = b2.vx - b1.vx, rvy = b2.vy - b1.vy;
                    var vn = rvx * nx + rvy * ny;
                    if (vn < 0) {
                      var imp = -vn * 0.62;
                      b1.vx -= nx * imp; b1.vy -= ny * imp;
                      b2.vx += nx * imp; b2.vy += ny * imp;
                    }
                  }
                }
              }
            }
            if (newlyAdded.length) {
              balls = balls.filter(function (x) { return !mergedIds[x.id]; }).concat(newlyAdded);
              if (score >= targetScore) {
                ended = true;
                api.finish(true, "أبدعت في دمج ثمار المزرعة وحققت " + score + " نقطة في الدور " + stage + "! 🍉🏆");
                return;
              }
            }
          }

          // Overflow danger check
          var overflowing = balls.some(function (b) { return b.age > 1.2 && (b.y - b.r) < DANGER_Y; });
          if (overflowing) {
            overTime += dt;
            if (overTime >= 1.8) {
              ended = true; api.playSfx("bad"); api.haptic(60); st.shake();
              api.finish(false, "", "امتلأ صندوق الثمار فوق الخط الأحمر (" + score + "/" + targetScore + ")!");
              return;
            }
          } else overTime = Math.max(0, overTime - dt * 2);

          // Draw Box & Scene
          api.OliveArt.drawTreeCanopy(ctx, W, H, stage);
          ctx.fillStyle = "rgba(8, 26, 15, 0.72)";
          ctx.fillRect(WALL_L, DANGER_Y, WALL_R - WALL_L, FLOOR_Y - DANGER_Y);
          ctx.strokeStyle = "#d59e2a"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(WALL_L, DANGER_Y); ctx.lineTo(WALL_L, FLOOR_Y); ctx.lineTo(WALL_R, FLOOR_Y); ctx.lineTo(WALL_R, DANGER_Y); ctx.stroke();

          // Red Danger Line
          ctx.strokeStyle = overflowing ? "#ef4444" : "rgba(239,68,68,0.45)";
          ctx.setLineDash([6, 5]); ctx.lineWidth = overflowing ? 3 : 1.8;
          ctx.beginPath(); ctx.moveTo(WALL_L, DANGER_Y); ctx.lineTo(WALL_R, DANGER_Y); ctx.stroke(); ctx.setLineDash([]);

          // Drop guide line + preview fruit
          ctx.strokeStyle = "rgba(253,230,138,0.3)"; ctx.setLineDash([4, 6]); ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(dropX, 54); ctx.lineTo(dropX, FLOOR_Y); ctx.stroke(); ctx.setLineDash([]);
          drawBall(dropX, 50, curTier);
          ctx.fillStyle = "#fde68a"; ctx.font = "800 11px Cairo,sans-serif"; ctx.textAlign = "right";
          ctx.fillText("القادم:", W - 46, 30);
          drawBall(W - 28, 26, nextTier);

          balls.forEach(function (b) { drawBall(b.x, b.y, b.tier); });
          for (var p = pops.length - 1; p >= 0; p--) {
            var pr = pops[p]; pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
            if (pr.life <= 0) { pops.splice(p, 1); continue; }
            ctx.globalAlpha = Math.max(0, pr.life * 2); ctx.fillStyle = pr.c;
            ctx.beginPath(); ctx.arc(pr.x, pr.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onMove);
          cv.removeEventListener("pointerup", onUp); window.removeEventListener("keydown", onKey);
        });
        api.runCountdown(st.host, "الدور " + stage + " — ادمج الثمار للوصول إلى " + targetScore + " نقطة!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // PACK 5 GAME 2: 🎣 صيد كنوز بحر سيناء (Gold Miner / Hook Swing — 1,000 Maps!)
    // =========================================================================
    window.ZaitRegisterExtraGame("fishing", {
      icon: "🎣",
      grad: "linear-gradient(135deg,#0c4a6e,#0f766e)",
      name: "صيد كنوز بحر سيناء",
      desc: "أطلق الخطاف الذهبي لصيد جراكن الزيت والكنوز واللآلئ وتجنّب الصخور والقنابل — 1,000 خريطة!",
      cat: "speed",
      hardTag: "1000 دور 🎣",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage), rng = V99.seededRng(stage * 9127 + 23);
        var goalGold = Math.round(280 + diff * 460 + (stage % 10 === 0 ? 150 : 0));
        var duration = Math.round(45 + V99.getExtraTimeBonus());

        var st = api.createStageShell("صيد كنوز سيناء", stage, duration, "💰 0/" + goalGold, "🎣 اضغط في أي مكان على الشاشة أو Space لإطلاق الخطاف الذهبي وصيد الكنوز!");
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-fish"></canvas></div>';

        var cv = document.getElementById("og-cv-fish");
        var g = api.setupHiDpiCanvas(cv, 380, 430);
        var ctx = g.ctx, W = g.w, H = g.h;
        var pivot = { x: W / 2, y: 74 };

        // Generate seeded underwater treasures (always enough total value to win!)
        var items = [];
        var specs = [
          { kind: "chest", ic: "🧰", r: 21, val: 160, wt: 2.2, cnt: 2 + Math.floor(diff * 2) },
          { kind: "bottle", ic: "🏺", r: 19, val: 110, wt: 1.5, cnt: 3 + Math.floor(diff * 2) },
          { kind: "pearl", ic: "💎", r: 14, val: 135, wt: 0.9, cnt: 2 + Math.floor(rng() * 2) },
          { kind: "fish", ic: "🐠", r: 16, val: 65, wt: 0.85, cnt: 3, swim: true },
          { kind: "rock", ic: "🪨", r: 22, val: 15, wt: 3.1, cnt: 3 + Math.floor(diff * 3) },
          { kind: "bomb", ic: "💣", r: 16, val: -90, wt: 0.8, cnt: stage >= 3 ? (1 + Math.floor(diff * 2)) : 0 }
        ];
        specs.forEach(function (sp) {
          for (var i = 0; i < sp.cnt; i++) {
            var x, y, tries = 0;
            do {
              x = 34 + rng() * (W - 68);
              y = 148 + rng() * (H - 182);
              tries++;
            } while (tries < 30 && items.some(function (o) { return Math.hypot(o.x - x, o.y - y) < o.r + sp.r + 8; }));
            items.push({ x: x, y: y, r: sp.r, val: sp.val, wt: sp.wt, ic: sp.ic, kind: sp.kind, swim: !!sp.swim, dir: rng() < 0.5 ? 1 : -1 });
          }
        });

        var hook = { ang: 0.4, dir: 1, len: 38, state: "swing", grabbed: null };
        var swingSpd = 1.45 + diff * 0.95;
        var score = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, pops = [];

        function launchHook() {
          if (!running || api.isPaused() || ended || hook.state !== "swing") return;
          hook.state = "extend";
          api.playSfx("pop"); api.haptic(10);
        }
        var onDown = function () { launchHook(); };
        var onKey = function (e) { if (e.code === "Space" || e.key === "ArrowDown") { e.preventDefault(); launchHook(); } };
        cv.addEventListener("pointerdown", onDown);
        window.addEventListener("keydown", onKey);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true;
            api.finish(score >= goalGold, "جمعت " + score + " عملة كنز!", "انتهى الوقت عند " + score + "/" + goalGold + " عملة!");
            return;
          }

          // Swimming fish
          items.forEach(function (it) {
            if (!it.swim || hook.grabbed === it) return;
            it.x += it.dir * (55 + diff * 40) * dt;
            if (it.x < 26) { it.x = 26; it.dir = 1; }
            if (it.x > W - 26) { it.x = W - 26; it.dir = -1; }
          });

          var tipX = pivot.x + Math.cos(hook.ang) * hook.len;
          var tipY = pivot.y + Math.sin(hook.ang) * hook.len;

          if (hook.state === "swing") {
            hook.ang += swingSpd * hook.dir * dt;
            if (hook.ang > Math.PI - 0.22) { hook.ang = Math.PI - 0.22; hook.dir = -1; }
            if (hook.ang < 0.22) { hook.ang = 0.22; hook.dir = 1; }
          } else if (hook.state === "extend") {
            hook.len += 410 * dt;
            tipX = pivot.x + Math.cos(hook.ang) * hook.len;
            tipY = pivot.y + Math.sin(hook.ang) * hook.len;
            if (tipX < 10 || tipX > W - 10 || tipY > H - 10) {
              hook.state = "retract";
            } else {
              for (var i = 0; i < items.length; i++) {
                var it = items[i];
                if (Math.hypot(it.x - tipX, it.y - tipY) <= it.r + 10) {
                  if (it.kind === "bomb") {
                    score = Math.max(0, score + it.val);
                    st.setGoal("💰 " + score + "/" + goalGold);
                    pops.push({ x: it.x, y: it.y, txt: "💥 -90!", col: "#fca5a5", life: 0.8 });
                    items.splice(i, 1);
                    hook.state = "retract";
                    api.playSfx("bad"); api.haptic(60); st.shake();
                  } else {
                    hook.grabbed = it;
                    hook.state = "retract";
                    api.playSfx(it.val >= 110 ? "gold" : "pop"); api.haptic(14);
                  }
                  break;
                }
              }
            }
          } else if (hook.state === "retract") {
            var reelSpd = hook.grabbed ? (340 / hook.grabbed.wt) : 490;
            hook.len -= reelSpd * dt;
            tipX = pivot.x + Math.cos(hook.ang) * hook.len;
            tipY = pivot.y + Math.sin(hook.ang) * hook.len;
            if (hook.grabbed) { hook.grabbed.x = tipX; hook.grabbed.y = tipY + 6; }
            if (hook.len <= 38) {
              hook.len = 38; hook.state = "swing";
              if (hook.grabbed) {
                var gr = hook.grabbed; hook.grabbed = null;
                score += gr.val;
                st.setGoal("💰 " + score + "/" + goalGold);
                pops.push({ x: pivot.x, y: pivot.y + 18, txt: "+" + gr.val + " 💰", col: "#fde047", life: 0.75 });
                var idx = items.indexOf(gr); if (idx > -1) items.splice(idx, 1);
                api.playSfx("gold");
                if (score >= goalGold) {
                  ended = true;
                  api.finish(true, "اصطدت كنوز بحر سيناء وجمعت " + score + " عملة في الدور " + stage + "! 🎣🏆");
                  return;
                }
              }
            }
          }

          // Draw Sinai Sea & Sky
          var sky = ctx.createLinearGradient(0, 0, 0, 92);
          sky.addColorStop(0, "#0c4a6e"); sky.addColorStop(1, "#38bdf8");
          ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 92);
          var sea = ctx.createLinearGradient(0, 92, 0, H);
          sea.addColorStop(0, "#0369a1"); sea.addColorStop(1, "#062030");
          ctx.fillStyle = sea; ctx.fillRect(0, 92, W, H - 92);

          // Wooden Boat
          ctx.fillStyle = "#92400e";
          ctx.beginPath(); ctx.moveTo(pivot.x - 42, 74); ctx.lineTo(pivot.x + 42, 74); ctx.lineTo(pivot.x + 28, 96); ctx.lineTo(pivot.x - 28, 96); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 2; ctx.stroke();
          ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("⛵", pivot.x, 70);

          // Draw Underwater Items
          items.forEach(function (it) {
            if (it.kind === "bottle") api.OliveArt.drawBottle(ctx, it.x, it.y, 24, 36, 0.92);
            else if (it.kind === "rock") api.OliveArt.drawHazard(ctx, it.x, it.y, it.r, "stone");
            else if (it.kind === "bomb") api.OliveArt.drawHazard(ctx, it.x, it.y, it.r, "bomb");
            else {
              ctx.font = Math.round(it.r * 1.45) + "px sans-serif"; ctx.textAlign = "center"; ctx.fillText(it.ic, it.x, it.y + 8);
            }
          });

          // Draw Rope & Golden Hook
          ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(pivot.x, pivot.y); ctx.lineTo(tipX, tipY); ctx.stroke();
          ctx.save(); ctx.translate(tipX, tipY); ctx.rotate(hook.ang - Math.PI / 2);
          ctx.strokeStyle = "#facc15"; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.arc(0, 4, 9, 0.2, Math.PI - 0.2); ctx.stroke();
          ctx.restore();

          for (var p = pops.length - 1; p >= 0; p--) {
            var pp = pops[p]; pp.y -= 42 * dt; pp.life -= dt;
            if (pp.life <= 0) { pops.splice(p, 1); continue; }
            ctx.globalAlpha = Math.max(0, pp.life * 1.6); ctx.fillStyle = pp.col;
            ctx.font = "900 16px Cairo,sans-serif"; ctx.textAlign = "center"; ctx.fillText(pp.txt, pp.x, pp.y); ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, "الدور " + stage + " — اجمع " + goalGold + " عملة كنز!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // PACK 5 GAME 3: ❌ تيك تاك تو العبقري (Smart AI 3x3 & 4x4 — 1,000 Stages!)
    // =========================================================================
    window.ZaitRegisterExtraGame("tictactoe", {
      icon: "❌",
      grad: "linear-gradient(135deg,#312e81,#15803d)",
      name: "تيك تاك تو العبقري",
      desc: "واجه ذكاء اصطناعي متدرّج الصعوبة على لوحات 3×3 و4×4 (الفوز بجولتين يحسم الدور)!",
      cat: "brain",
      hardTag: "ذكاء ❌⭕",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage);
        var N = (stage >= 4 && stage % 2 === 0) ? 4 : 3;
        var winLen = N === 4 ? 3 : 3; // 3-in-a-row on 3x3 and 4x4 fast tactical play!
        var roundsToWin = stage >= 5 ? 2 : 1;
        var duration = Math.round(50 + V99.getExtraTimeBonus());

        var st = api.createStageShell("تيك تاك تو العبقري", stage, duration, "🫒 أنت 0 - 0 الكمبيوتر 👑", "اضغط على المربع (أو الأرقام 1–9) لتكوين 3 زيتونات 🫒 على خط واحد!");
        st.setExtra("لوحة " + N + "×" + N + " • مطلوب " + roundsToWin + " فوز");

        var board = [], pWins = 0, aiWins = 0, turn = "P", locked = false, rem = duration, ended = false;
        function resetBoard() {
          board = []; for (var i = 0; i < N * N; i++) board.push("");
          turn = "P"; locked = false; render();
        }

        // Build all winning lines of length 3 on N x N grid
        var lines = [];
        for (var r = 0; r < N; r++) {
          for (var c = 0; c < N; c++) {
            if (c + winLen <= N) lines.push([r * N + c, r * N + c + 1, r * N + c + 2]);
            if (r + winLen <= N) lines.push([r * N + c, (r + 1) * N + c, (r + 2) * N + c]);
            if (r + winLen <= N && c + winLen <= N) lines.push([r * N + c, (r + 1) * N + c + 1, (r + 2) * N + c + 2]);
            if (r + winLen <= N && c - winLen + 1 >= 0) lines.push([r * N + c, (r + 1) * N + c - 1, (r + 2) * N + c - 2]);
          }
        }

        function checkWinner(b) {
          for (var i = 0; i < lines.length; i++) {
            var ln = lines[i], v = b[ln[0]];
            if (v && b[ln[1]] === v && b[ln[2]] === v) return { who: v, line: ln };
          }
          if (b.every(Boolean)) return { who: "DRAW", line: [] };
          return null;
        }

        function chooseAiMove() {
          var empty = [];
          for (var i = 0; i < board.length; i++) if (!board[i]) empty.push(i);
          if (!empty.length) return -1;
          var smartProb = Math.min(0.92, 0.45 + diff * 0.48);

          // 1. Immediate win
          for (var a = 0; a < empty.length; a++) {
            board[empty[a]] = "AI";
            var w = checkWinner(board);
            board[empty[a]] = "";
            if (w && w.who === "AI") return empty[a];
          }
          // 2. Block player's immediate win (scaled by stage intelligence!)
          if (Math.random() < smartProb) {
            for (var b = 0; b < empty.length; b++) {
              board[empty[b]] = "P";
              var wp = checkWinner(board);
              board[empty[b]] = "";
              if (wp && wp.who === "P") return empty[b];
            }
          }
          // 3. Take center if smart
          var center = Math.floor((N * N) / 2);
          if (Math.random() < smartProb && !board[center]) return center;
          return empty[Math.floor(Math.random() * empty.length)];
        }

        function handleRoundEnd(res) {
          locked = true;
          render(res);
          if (res.who === "P") {
            pWins++; api.playSfx("gold"); api.haptic(20);
          } else if (res.who === "AI") {
            aiWins++; api.playSfx("bad"); st.shake();
          } else {
            api.playSfx("tick");
          }
          st.setGoal("🫒 أنت " + pWins + " - " + aiWins + " الكمبيوتر 👑");

          setTimeout(function () {
            if (ended) return;
            if (pWins >= roundsToWin) {
              ended = true; clearInterval(iv);
              api.finish(true, "تفوقت على الذكاء الاصطناعي (" + pWins + " - " + aiWins + ") في الدور " + stage + "! ❌🏆");
            } else if (aiWins >= roundsToWin) {
              ended = true; clearInterval(iv);
              api.finish(false, "", "تغلّب عليك الذكاء الاصطناعي في الدور " + stage + " — جرب تكتيكاً أذكى!");
            } else {
              resetBoard();
            }
          }, 780);
        }

        function playCell(idx) {
          if (ended || locked || api.isPaused() || turn !== "P" || board[idx]) return;
          board[idx] = "P"; api.playSfx("pop"); api.haptic(10);
          var r1 = checkWinner(board);
          if (r1) { handleRoundEnd(r1); return; }
          turn = "AI"; locked = true; render();
          setTimeout(function () {
            if (ended) return;
            var mv = chooseAiMove();
            if (mv > -1) { board[mv] = "AI"; api.playSfx("tick"); }
            var r2 = checkWinner(board);
            if (r2) { handleRoundEnd(r2); return; }
            turn = "P"; locked = false; render();
          }, 360);
        }

        function render(winRes) {
          var winSet = {};
          if (winRes && winRes.line) winRes.line.forEach(function (i) { winSet[i] = winRes.who; });
          st.host.innerHTML =
            '<div class="og-card"><div class="p5-ttt-grid" style="grid-template-columns:repeat(' + N + ',1fr);">' +
              board.map(function (v, idx) {
                var cls = "p5-ttt-cell" + (winSet[idx] === "P" ? " win" : (winSet[idx] === "AI" ? " lose" : ""));
                return '<button type="button" class="' + cls + '" data-i="' + idx + '" ' + (v ? "disabled" : "") + '>' +
                  (v === "P" ? "🫒" : (v === "AI" ? "👑" : '<span style="font-size:.7rem;opacity:.28;">' + (idx < 9 ? (idx + 1) : "") + '</span>')) +
                '</button>';
              }).join("") +
            '</div></div>';
          st.host.querySelectorAll(".p5-ttt-cell").forEach(function (btn) {
            btn.onclick = function () { playCell(Number(btn.getAttribute("data-i"))); };
          });
        }

        var onKey = function (e) { var n = Number(e.key); if (n >= 1 && n <= 9 && N === 3) playCell(n - 1); };
        window.addEventListener("keydown", onKey);
        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت قبل حسم المواجهة!"); }
        }, 100);

        api.setCleanup(function () { ended = true; clearInterval(iv); window.removeEventListener("keydown", onKey); });
        resetBoard();
      }
    });

    // =========================================================================
    // PACK 5 GAME 4: 🧭 متاهة كنز سيناء (Guaranteed DFS 1,000 Mazes + Boss Torch!)
    // =========================================================================
    window.ZaitRegisterExtraGame("maze", {
      icon: "🧭",
      grad: "linear-gradient(135deg,#065f46,#854d0e)",
      name: "متاهة كنز سيناء",
      desc: "اجمع مفاتيح الزيتون الذهبية وشق طريقك للكنز في 1,000 متاهة مضمونة الحل — مع كشاف ليلي للزعماء!",
      cat: "brain",
      hardTag: "1000 متاهة 🧭",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage), rng = V99.seededRng(stage * 5381 + 31);
        var isBoss = (stage % 10 === 0);
        var size = stage <= 3 ? 9 : (stage <= 10 ? 11 : (stage <= 30 ? 13 : 15)); // Always odd
        var keysNeed = Math.min(4, 1 + Math.floor(diff * 3));
        var duration = Math.round(45 + (size - 9) * 5 + V99.getExtraTimeBonus());

        var st = api.createStageShell("متاهة سيناء", stage, duration, "🔑 0/" + keysNeed + " ⬅️ 🎁", "💻 الأسهم أو WASD • 📱 اسحب في اتجاه المشي أو استخدم أزرار الاتجاه");
        st.setExtra(isBoss ? "🔦 متاهة الزعيم الليلية" : ("🧭 " + size + "×" + size));
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-maze"></canvas></div>' +
          '<div class="p5-dpad">' +
            '<div></div><button type="button" class="og-btn og-btn-dark" id="mz-u" style="padding:9px;">⬆️</button><div></div>' +
            '<button type="button" class="og-btn og-btn-dark" id="mz-r" style="padding:9px;">➡️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="mz-d" style="padding:9px;">⬇️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="mz-l" style="padding:9px;">⬅️</button>' +
          '</div>';

        // Generate guaranteed-solvable maze using seeded DFS
        var maze = [];
        for (var r = 0; r < size; r++) { maze.push([]); for (var c = 0; c < size; c++) maze[r].push(1); } // 1=wall, 0=path
        function carve(r, c) {
          maze[r][c] = 0;
          var dirs = [[-2,0],[2,0],[0,-2],[0,2]].sort(function () { return rng() - 0.5; });
          for (var i = 0; i < dirs.length; i++) {
            var nr = r + dirs[i][0], nc = c + dirs[i][1];
            if (nr > 0 && nr < size - 1 && nc > 0 && nc < size - 1 && maze[nr][nc] === 1) {
              maze[r + dirs[i][0] / 2][c + dirs[i][1] / 2] = 0;
              carve(nr, nc);
            }
          }
        }
        carve(1, 1);

        var player = { r: 1, c: 1 }, goal = { r: size - 2, c: size - 2 };
        var keys = [], collected = 0;
        var openCells = [];
        for (var r0 = 1; r0 < size - 1; r0++) for (var c0 = 1; c0 < size - 1; c0++) {
          if (maze[r0][c0] === 0 && !(r0 === 1 && c0 === 1) && !(r0 === goal.r && c0 === goal.c)) openCells.push([r0, c0]);
        }
        openCells.sort(function () { return rng() - 0.5; });
        for (var ki = 0; ki < Math.min(keysNeed, openCells.length); ki++) {
          keys.push({ r: openCells[ki][0], c: openCells[ki][1], got: false });
        }

        var cv = document.getElementById("og-cv-maze");
        var g = api.setupHiDpiCanvas(cv, 360, 360);
        var ctx = g.ctx, cell = 360 / size, rem = duration, ended = false;

        function draw() {
          ctx.fillStyle = "#06150d"; ctx.fillRect(0, 0, 360, 360);
          for (var r = 0; r < size; r++) {
            for (var c = 0; c < size; c++) {
              if (isBoss && Math.hypot(r - player.r, c - player.c) > 3.6) continue;
              var x = c * cell, y = r * cell;
              if (maze[r][c] === 1) {
                ctx.fillStyle = "#14532d"; ctx.fillRect(x, y, cell, cell);
                ctx.strokeStyle = "rgba(213,158,42,0.22)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
              } else {
                ctx.fillStyle = "#0d2618"; ctx.fillRect(x, y, cell, cell);
              }
            }
          }
          // Keys
          keys.forEach(function (k) {
            if (k.got) return;
            if (isBoss && Math.hypot(k.r - player.r, k.c - player.c) > 3.6) return;
            ctx.font = Math.round(cell * 0.65) + "px sans-serif"; ctx.textAlign = "center";
            ctx.fillText("🔑", k.c * cell + cell / 2, k.r * cell + cell * 0.74);
          });
          // Goal chest
          ctx.font = Math.round(cell * 0.72) + "px sans-serif"; ctx.textAlign = "center";
          ctx.fillText(collected >= keys.length ? "🎁" : "🔒", goal.c * cell + cell / 2, goal.r * cell + cell * 0.76);
          // Player olive explorer
          api.OliveArt.drawOlive(ctx, player.c * cell + cell / 2, player.r * cell + cell / 2, cell * 0.36, "gold");
        }

        function step(dr, dc) {
          if (ended || api.isPaused()) return;
          var nr = player.r + dr, nc = player.c + dc;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size || maze[nr][nc] === 1) { api.playSfx("tick"); return; }
          player.r = nr; player.c = nc;
          api.playSfx("pop"); api.haptic(8);
          keys.forEach(function (k) {
            if (!k.got && k.r === nr && k.c === nc) {
              k.got = true; collected++;
              st.setGoal("🔑 " + collected + "/" + keys.length + (collected >= keys.length ? " • الصندوق مفتوح 🎁!" : " ⬅️ 🎁"));
              api.playSfx("gold"); api.haptic(18);
            }
          });
          draw();
          if (nr === goal.r && nc === goal.c && collected >= keys.length) {
            ended = true; clearInterval(iv);
            api.finish(true, "خرجت من متاهة سيناء وفتحت صندوق الكنز في الدور " + stage + "! 🧭🏆");
          }
        }

        document.getElementById("mz-u").onclick = function () { step(-1, 0); };
        document.getElementById("mz-d").onclick = function () { step(1, 0); };
        document.getElementById("mz-l").onclick = function () { step(0, -1); };
        document.getElementById("mz-r").onclick = function () { step(0, 1); };
        var sp0 = null;
        cv.addEventListener("pointerdown", function (e) { sp0 = api.getPointerPos(e, cv, 360, 360); });
        cv.addEventListener("pointerup", function (e) {
          if (!sp0) return;
          var sp1 = api.getPointerPos(e, cv, 360, 360), dx = sp1.x - sp0.x, dy = sp1.y - sp0.y; sp0 = null;
          if (Math.hypot(dx, dy) < 14) return;
          if (Math.abs(dx) > Math.abs(dy)) step(0, dx > 0 ? 1 : -1); else step(dy > 0 ? 1 : -1, 0);
        });
        var onKey = function (e) {
          if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); step(-1, 0); }
          else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); step(1, 0); }
          else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); step(0, -1); }
          else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); step(0, 1); }
        };
        window.addEventListener("keydown", onKey);

        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت داخل متاهة الدور " + stage + "!"); }
        }, 100);
        draw();
        api.setCleanup(function () { ended = true; clearInterval(iv); window.removeEventListener("keydown", onKey); });
      }
    });

    // =========================================================================
    // PACK 5 GAME 5: 💎 كاسر الزجاج 3D (Smash Hit 3D Crystal Tunnel — 1,000 Levels!)
    // =========================================================================
    window.ZaitRegisterExtraGame("glass", {
      icon: "💎",
      grad: "linear-gradient(135deg,#0284c7,#4c1d95)",
      name: "كاسر الزجاج 3D (Smash Hit)",
      desc: "نفق زجاجي ثلاثي الأبعاد! حطّم الأهرامات والألواح الزجاجية بكرات الزيتون قبل اصطدامك بها!",
      cat: "speed",
      hardTag: "3D 💎",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage);
        var quota = 14 + Math.floor(diff * 20) + (stage % 10 === 0 ? 4 : 0);
        var duration = Math.round(35 + V99.getExtraTimeBonus());
        var lives = 3 + Math.min(2, V99.getExtraLivesBonus());
        var orbs = 18;

        var st = api.createStageShell("كاسر الزجاج 3D", stage, duration, "💎 0/" + quota, "💎 اضغط بدقة على الألواح والأهرامات الزجاجية لتحطيمها • الأهرامات الذهبية تعيد لك +3 كرات!");
        st.setExtra("❤️".repeat(lives) + " • 🫒 " + orbs);
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-glass"></canvas></div>';

        var cv = document.getElementById("og-cv-glass");
        var g = api.setupHiDpiCanvas(cv, 380, 420);
        var ctx = g.ctx, W = g.w, H = g.h, vx = W / 2, vy = H / 2 - 12;

        var panels = [], shots = [], shards = [];
        var broken = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, spawnAcc = 0, tunnelZ = 0;
        var zSpd = 0.36 + diff * 0.28, spawnMs = Math.max(540, 1080 - diff * 460);

        function project(nx, ny, z) {
          var scale = 1 / Math.max(0.12, z);
          return { x: vx + nx * 125 * scale, y: vy + ny * 125 * scale, s: scale };
        }

        function spawnGlass() {
          var isGold = Math.random() < 0.32;
          panels.push({
            nx: (Math.random() - 0.5) * 1.45,
            ny: (Math.random() - 0.5) * 1.15,
            z: 2.3,
            w: isGold ? 28 : 42,
            h: isGold ? 34 : 56,
            gold: isGold
          });
        }

        function shatter(sx, sy, col) {
          for (var i = 0; i < 12; i++) {
            shards.push({ x: sx, y: sy, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, sz: 5 + Math.random() * 8, col: col, life: 0.45 });
          }
        }

        function fireAt(ev) {
          if (!running || api.isPaused() || ended || orbs <= 0) return;
          var p = api.getPointerPos(ev, cv, W, H);
          orbs--;
          st.setExtra("❤️".repeat(Math.max(0, lives)) + " • 🫒 " + orbs);
          shots.push({ sx: vx, sy: H - 16, tx: p.x, ty: p.y, t: 0 });
          api.playSfx("pop"); api.haptic(10);

          // Check hit from nearest to farthest
          panels.sort(function (a, b) { return a.z - b.z; });
          for (var i = 0; i < panels.length; i++) {
            var pn = panels[i], pr = project(pn.nx, pn.ny, pn.z);
            var hw = (pn.w * pr.s) * 0.62, hh = (pn.h * pr.s) * 0.62;
            if (Math.abs(p.x - pr.x) <= hw + 14 && Math.abs(p.y - pr.y) <= hh + 14) {
              broken++;
              if (pn.gold) orbs = Math.min(30, orbs + 3);
              shatter(pr.x, pr.y, pn.gold ? "#fde047" : "#7dd3fc");
              panels.splice(i, 1);
              st.setGoal("💎 " + broken + "/" + quota);
              st.setExtra("❤️".repeat(Math.max(0, lives)) + " • 🫒 " + orbs);
              api.playSfx(pn.gold ? "gold" : "pop"); api.haptic(16);
              if (broken >= quota) {
                ended = true;
                api.finish(true, "حطمت " + broken + " لوح وهرم زجاجي في النفق ثلاثي الأبعاد (الدور " + stage + ")! 💎🏆");
              }
              return;
            }
          }
          if (orbs <= 0) {
            ended = true; api.playSfx("bad");
            api.finish(false, "", "نفدت كرات الزيتون قبل إنهاء النفق الزجاجي!");
          }
        }
        cv.addEventListener("pointerdown", fireAt);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; tunnelZ = (tunnelZ + dt * 1.4) % 1;
          st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت عند " + broken + "/" + quota + " زجاج!"); return; }

          spawnAcc += dt * 1000;
          if (spawnAcc >= spawnMs) { spawnAcc = 0; spawnGlass(); }

          // Draw 3D Corridor Perspective
          var bg = ctx.createRadialGradient(vx, vy, 15, vx, vy, 280);
          bg.addColorStop(0, "#0f2c3f"); bg.addColorStop(1, "#040d14");
          ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
          ctx.strokeStyle = "rgba(56,189,248,0.18)"; ctx.lineWidth = 1.4;
          for (var r = 0; r < 6; r++) {
            var zf = 0.25 + ((r + tunnelZ) % 6) * 0.38;
            var sc = 1 / zf;
            var rw = 160 * sc, rh = 180 * sc;
            ctx.strokeRect(vx - rw / 2, vy - rh / 2, rw, rh);
          }

          // Update & draw glass obstacles (far -> near)
          panels.sort(function (a, b) { return b.z - a.z; });
          for (var i = panels.length - 1; i >= 0; i--) {
            var pn = panels[i];
            pn.z -= zSpd * dt;
            if (pn.z <= 0.16) {
              // Crashed into player!
              if (!pn.gold) {
                lives--; orbs = Math.max(0, orbs - 2);
                st.setExtra("❤️".repeat(Math.max(0, lives)) + " • 🫒 " + orbs);
                api.playSfx("bad"); api.haptic(60); st.shake();
                shatter(vx, vy, "#ef4444");
                if (lives <= 0) { ended = true; api.finish(false, "", "💥 تحطم درعك الزجاجي بسبب الحواجز!"); return; }
              }
              panels.splice(i, 1);
              continue;
            }
            var pr = project(pn.nx, pn.ny, pn.z);
            var pw = pn.w * pr.s, ph = pn.h * pr.s;
            ctx.save(); ctx.translate(pr.x, pr.y);
            if (pn.gold) {
              ctx.fillStyle = "rgba(250, 204, 21, 0.78)";
              ctx.beginPath(); ctx.moveTo(0, -ph / 2); ctx.lineTo(pw / 2, ph / 2); ctx.lineTo(-pw / 2, ph / 2); ctx.closePath(); ctx.fill();
              ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 2; ctx.stroke();
            } else {
              ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
              ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
              ctx.strokeStyle = "#bae6fd"; ctx.lineWidth = 2; ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
            }
            ctx.restore();
          }

          // Flying olive shots
          for (var s = shots.length - 1; s >= 0; s--) {
            var sh = shots[s]; sh.t += dt * 7;
            if (sh.t >= 1) { shots.splice(s, 1); continue; }
            var sx = sh.sx + (sh.tx - sh.sx) * sh.t, sy = sh.sy + (sh.ty - sh.sy) * sh.t;
            api.OliveArt.drawOlive(ctx, sx, sy, 14 * (1 - sh.t * 0.55), "gold");
          }

          // Flying glass shards
          for (var k = shards.length - 1; k >= 0; k--) {
            var sd = shards[k]; sd.x += sd.vx * dt; sd.y += sd.vy * dt; sd.vy += 420 * dt; sd.life -= dt;
            if (sd.life <= 0) { shards.splice(k, 1); continue; }
            ctx.globalAlpha = Math.max(0, sd.life * 2.2); ctx.fillStyle = sd.col;
            ctx.beginPath(); ctx.moveTo(sd.x, sd.y - sd.sz); ctx.lineTo(sd.x + sd.sz, sd.y + sd.sz); ctx.lineTo(sd.x - sd.sz, sd.y); ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", fireAt); });
        api.runCountdown(st.host, "الدور " + stage + " — حطّم " + quota + " حاجز زجاجي!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // PACK 5 GAME 6: 🦘 القفز للسحاب (Sinai Sky Jump / Doodle Jump Pro — 1,000 Levels!)
    // =========================================================================
    window.ZaitRegisterExtraGame("doodle", {
      icon: "🦘",
      grad: "linear-gradient(135deg,#047857,#0284c7)",
      name: "القفز للسحاب (Sky Jump)",
      desc: "اقفز فوق أغصان الزيتون والمنصات المتحركة والنوابض 🚀 للوصول لقمة السحاب — 1,000 دور!",
      cat: "speed",
      hardTag: "1000 دور 🦘",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage), rng = V99.seededRng(stage * 8191 + 5);
        var goalMeters = Math.round(520 + diff * 880 + (stage % 10 === 0 ? 250 : 0));
        var duration = Math.round(48 + V99.getExtraTimeBonus());

        var st = api.createStageShell("القفز للسحاب", stage, duration, "🦘 0م / " + goalMeters + "م", "💻 الأسهم ⬅️ ➡️ أو A/D • 📱 اسحب أو المس يسار/يمين للتحكم بالقفز!");
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-dood"></canvas></div>';

        var cv = document.getElementById("og-cv-dood");
        var g = api.setupHiDpiCanvas(cv, 380, 440);
        var ctx = g.ctx, W = g.w, H = g.h;

        var player = { x: W / 2, y: H - 80, vx: 0, vy: -460, r: 15 };
        var plats = [], maxHeight = 0, keys = { l: false, r: false }, ptrX = null;
        var rem = duration, running = false, ended = false, raf = null, lastTs = 0;

        // Initial solid platforms
        plats.push({ x: W / 2 - 42, y: H - 35, w: 84, kind: "solid", dir: 1 });
        for (var i = 1; i <= 12; i++) {
          var py = H - 35 - i * 44;
          var r = rng();
          var kind = r < (0.12 + diff * 0.22) ? "moving" : (r < (0.2 + diff * 0.34) ? "break" : "solid");
          plats.push({ x: 16 + rng() * (W - 100), y: py, w: Math.max(54, 76 - diff * 18), kind: kind, dir: rng() < 0.5 ? 1 : -1, spring: kind === "solid" && rng() < 0.16, broken: false });
        }

        var onPtr = function (e) { ptrX = api.getPointerPos(e, cv, W, H).x; };
        var onUp = function () { ptrX = null; };
        var onKD = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = true; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = true; };
        var onKU = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = false; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = false; };
        cv.addEventListener("pointerdown", onPtr); cv.addEventListener("pointermove", onPtr);
        window.addEventListener("pointerup", onUp); window.addEventListener("keydown", onKD); window.addEventListener("keyup", onKU);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.038, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت عند ارتفاع " + Math.round(maxHeight) + "م / " + goalMeters + "م!"); return; }

          if (keys.l) player.vx = -290;
          else if (keys.r) player.vx = 290;
          else if (ptrX !== null) player.vx = Math.max(-340, Math.min(340, (ptrX - player.x) * 7.5));
          else player.vx *= 0.88;

          player.x += player.vx * dt;
          if (player.x < -12) player.x = W + 12;
          if (player.x > W + 12) player.x = -12;

          player.vy += 980 * dt;
          player.y += player.vy * dt;

          // Scroll camera upward as player climbs above midpoint
          if (player.y < H * 0.42) {
            var dy = H * 0.42 - player.y;
            player.y = H * 0.42;
            maxHeight += dy * 0.45;
            st.setGoal("🦘 " + Math.round(maxHeight) + "م / " + goalMeters + "م");
            plats.forEach(function (pl) { pl.y += dy; });
            if (maxHeight >= goalMeters) {
              ended = true;
              api.finish(true, "وصلت لقمة السحاب (" + goalMeters + " متر) في الدور " + stage + "! 🦘🏆");
              return;
            }
          }

          // Recycle fallen platforms at the top
          var minY = H;
          plats.forEach(function (pl) { if (pl.y < minY) minY = pl.y; });
          plats.forEach(function (pl) {
            if (pl.kind === "moving") {
              pl.x += pl.dir * (65 + diff * 75) * dt;
              if (pl.x < 8) { pl.x = 8; pl.dir = 1; }
              if (pl.x + pl.w > W - 8) { pl.x = W - 8 - pl.w; pl.dir = -1; }
            }
            if (pl.y > H + 20) {
              var r = Math.random();
              pl.y = minY - (38 + Math.random() * 22);
              minY = pl.y;
              pl.x = 16 + Math.random() * (W - pl.w - 32);
              pl.kind = r < (0.14 + diff * 0.24) ? "moving" : (r < (0.22 + diff * 0.34) ? "break" : "solid");
              pl.spring = pl.kind === "solid" && Math.random() < 0.16;
              pl.broken = false;
            }
          });

          // Bounce on landing
          if (player.vy > 0) {
            for (var i = 0; i < plats.length; i++) {
              var pl = plats[i];
              if (pl.broken) continue;
              if (player.x + 11 > pl.x && player.x - 11 < pl.x + pl.w && player.y + player.r >= pl.y && player.y + player.r <= pl.y + 16) {
                if (pl.kind === "break") {
                  pl.broken = true;
                  player.vy = -380;
                  api.playSfx("tick");
                } else if (pl.spring) {
                  player.vy = -820;
                  api.playSfx("gold"); api.haptic(20);
                } else {
                  player.vy = -510;
                  api.playSfx("pop"); api.haptic(8);
                }
                break;
              }
            }
          }

          if (player.y > H + 32) {
            ended = true; api.playSfx("bad"); api.haptic(55); st.shake();
            api.finish(false, "", "سقطت عند ارتفاع " + Math.round(maxHeight) + "م / " + goalMeters + "م!");
            return;
          }

          // Draw Sky Gradient & Platforms
          var sky = ctx.createLinearGradient(0, 0, 0, H);
          sky.addColorStop(0, "#0a2540"); sky.addColorStop(1, "#134e4a");
          ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

          plats.forEach(function (pl) {
            if (pl.broken) return;
            ctx.fillStyle = pl.kind === "moving" ? "#eab308" : (pl.kind === "break" ? "#92400e" : "#22c55e");
            ctx.fillRect(pl.x, pl.y, pl.w, 11);
            ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 1.2; ctx.strokeRect(pl.x, pl.y, pl.w, 11);
            if (pl.spring) {
              ctx.font = "15px sans-serif"; ctx.textAlign = "center";
              ctx.fillText("🚀", pl.x + pl.w / 2, pl.y - 2);
            }
          });

          // Draw Jumper Olive Hero
          api.OliveArt.drawOlive(ctx, player.x, player.y, player.r, "gold");
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointerdown", onPtr); cv.removeEventListener("pointermove", onPtr);
          window.removeEventListener("pointerup", onUp); window.removeEventListener("keydown", onKD); window.removeEventListener("keyup", onKU);
        });
        api.runCountdown(st.host, "الدور " + stage + " — اقفز إلى ارتفاع " + goalMeters + " متر!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });
  }

  bootPack5();
})();
