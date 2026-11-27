/* ============================================================================
   Zait Store Olive Games Ultra V99 — Pack 4 (6 Brand-New 1,000-Level Pro Games)
   Total Suite: 21 Standalone-Feel Offline Games x 1,000 Levels!
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_PACK4_V99__) return;
  window.__ZAIT_OLIVE_PACK4_V99__ = true;

  function bootPack4() {
    if (typeof window.ZaitRegisterExtraGame !== "function" || !window.ZaitV99) {
      setTimeout(bootPack4, 120);
      return;
    }

    var V99 = window.ZaitV99;

    // =========================================================================
    // NEW GAME 1: 🫧 فقاعات الزيتون برو (Bubble Shooter — 1,000 Seeded Levels!)
    // =========================================================================
    window.ZaitRegisterExtraGame("bubbles", {
      icon: "🫧",
      grad: "linear-gradient(135deg,#0369a1,#7c3aed)",
      name: "فقاعات الزيتون برو",
      desc: "صوّب وارتدّ من الجدران لتفجير 3+ فقاعات متشابهة وإسقاط العناقيد المعلقة — 1,000 دور!",
      cat: "brain",
      hardTag: "1000 دور 🫧",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage), rng = V99.seededRng(stage * 7919 + 11);
        var isBoss = (stage % 10 === 0);
        var duration = Math.round(65 + V99.getExtraTimeBonus() + (isBoss ? 15 : 0));
        var st = api.createStageShell("فقاعات الزيتون", stage, duration, "صفِّ الفقاعات 🫧", "🎯 المس واسحب لتصويب الليزر المرتد من الجدران ثم ارفع إصبعك للإطلاق!");
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-bub"></canvas></div>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
            '<span style="font-size:.74rem;font-weight:800;opacity:.85;">💡 يمكنك الارتداد من الجدارين للوصول للأعلى!</span>' +
            '<button type="button" id="p4-bub-swap" class="og-btn og-btn-dark" style="padding:7px 12px;font-size:.77rem;">🔄 تبديل (Space)</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-bub");
        var g = api.setupHiDpiCanvas(cv, 380, 440);
        var ctx = g.ctx, W = g.w, H = g.h;
        var COLS = 9, R = 19, ROW_H = R * 1.78, MAX_ROWS = 11;
        var PAL = stage >= 5 ? ["#22c55e", "#facc15", "#ef4444", "#38bdf8", "#c084fc"] : ["#22c55e", "#facc15", "#ef4444", "#38bdf8"];
        var nCols = PAL.length;
        var startRows = Math.min(7, 4 + Math.floor(diff * 3.5) + (isBoss ? 1 : 0));

        var grid = [];
        for (var r = 0; r < MAX_ROWS; r++) {
          grid.push([]);
          for (var c = 0; c < COLS; c++) grid[r].push(-1);
        }
        // Seeded symmetric pattern per stage (1..1000)
        for (var r0 = 0; r0 < startRows; r0++) {
          for (var c0 = 0; c0 < COLS; c0++) {
            var mirrorC = Math.min(c0, COLS - 1 - c0);
            if (r0 > 1 && rng() < 0.14) continue;
            grid[r0][c0] = (c0 > 0 && rng() < 0.35 && grid[r0][c0 - 1] >= 0) ? grid[r0][c0 - 1] : Math.floor(rng() * nCols);
            if (stage % 3 === 0 && mirrorC < c0 && grid[r0][mirrorC] >= 0) grid[r0][c0] = grid[r0][mirrorC];
          }
        }

        function cellPos(r, c) {
          var offX = (r % 2 === 1) ? R : 0;
          return { x: 24 + c * (R * 2) + offX, y: 24 + r * ROW_H };
        }
        function countBubbles() {
          var n = 0; for (var r = 0; r < MAX_ROWS; r++) for (var c = 0; c < COLS; c++) if (grid[r][c] >= 0) n++;
          return n;
        }
        function pickAvailColor() {
          var s = {}; for (var r = 0; r < MAX_ROWS; r++) for (var c = 0; c < COLS; c++) if (grid[r][c] >= 0) s[grid[r][c]] = true;
          var ks = Object.keys(s);
          return ks.length ? Number(ks[Math.floor(Math.random() * ks.length)]) : 0;
        }

        var shooter = { x: W / 2, y: H - 30 };
        var curC = pickAvailColor(), nextC = pickAvailColor(), aimAng = -Math.PI / 2, dragging = false;
        var shot = null, falling = [], shotsFired = 0, shotsBeforeDrop = Math.max(5, 9 - Math.floor(diff * 4));
        var rem = duration, running = false, ended = false, raf = null, lastTs = 0;
        st.setGoal("🫧 متبقي: " + countBubbles());

        function swap() { if (ended || api.isPaused()) return; var t = curC; curC = nextC; nextC = t; api.playSfx("pop"); }
        document.getElementById("p4-bub-swap").onclick = swap;

        function aimEv(ev) {
          var p = api.getPointerPos(ev, cv, W, H);
          var ang = Math.atan2(p.y - shooter.y, p.x - shooter.x);
          if (ang > -0.18) ang = -0.18;
          if (ang < -Math.PI + 0.18) ang = -Math.PI + 0.18;
          aimAng = ang;
        }
        function fire() {
          if (!running || api.isPaused() || ended || shot) return;
          shot = { x: shooter.x, y: shooter.y, vx: Math.cos(aimAng) * 620, vy: Math.sin(aimAng) * 620, c: curC };
          curC = nextC; nextC = pickAvailColor();
          api.playSfx("pop"); api.haptic(10);
        }

        var onD = function (e) { dragging = true; aimEv(e); };
        var onM = function (e) { aimEv(e); };
        var onU = function (e) { if (!dragging) return; dragging = false; aimEv(e); fire(); };
        var onK = function (e) { if (e.code === "Space") { e.preventDefault(); swap(); } };
        cv.addEventListener("pointerdown", onD); cv.addEventListener("pointermove", onM); window.addEventListener("pointerup", onU); window.addEventListener("keydown", onK);

        function neighbors(r, c) {
          var odd = r % 2 === 1;
          var deltas = odd ? [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]] : [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]];
          var res = [];
          deltas.forEach(function (d) {
            var nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < MAX_ROWS && nc >= 0 && nc < COLS) res.push([nr, nc]);
          });
          return res;
        }

        function snapShot() {
          // Find closest empty grid cell
          var bestR = 0, bestC = 0, bestD = 1e9;
          for (var r = 0; r < MAX_ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
              if (grid[r][c] >= 0) continue;
              var cp = cellPos(r, c);
              var d = Math.hypot(cp.x - shot.x, cp.y - shot.y);
              if (d < bestD) { bestD = d; bestR = r; bestC = c; }
            }
          }
          var col = shot.c;
          shot = null;
          grid[bestR][bestC] = col;

          // BFS matching color cluster
          var vis = {}, q = [[bestR, bestC]], grp = [];
          vis[bestR + "," + bestC] = true;
          while (q.length) {
            var cur = q.shift(); grp.push(cur);
            neighbors(cur[0], cur[1]).forEach(function (nb) {
              var k = nb[0] + "," + nb[1];
              if (!vis[k] && grid[nb[0]][nb[1]] === col) { vis[k] = true; q.push(nb); }
            });
          }

          if (grp.length >= 3) {
            grp.forEach(function (pt) {
              var p = cellPos(pt[0], pt[1]);
              falling.push({ x: p.x, y: p.y, vy: -80, c: grid[pt[0]][pt[1]] });
              grid[pt[0]][pt[1]] = -1;
            });
            // Drop floating disconnected clusters!
            var anchored = {}, aq = [];
            for (var c0 = 0; c0 < COLS; c0++) if (grid[0][c0] >= 0) { anchored["0," + c0] = true; aq.push([0, c0]); }
            while (aq.length) {
              var ac = aq.shift();
              neighbors(ac[0], ac[1]).forEach(function (nb) {
                var k = nb[0] + "," + nb[1];
                if (!anchored[k] && grid[nb[0]][nb[1]] >= 0) { anchored[k] = true; aq.push(nb); }
              });
            }
            var dropped = 0;
            for (var rr = 0; rr < MAX_ROWS; rr++) {
              for (var cc = 0; cc < COLS; cc++) {
                if (grid[rr][cc] >= 0 && !anchored[rr + "," + cc]) {
                  var fp = cellPos(rr, cc);
                  falling.push({ x: fp.x, y: fp.y, vy: 60, c: grid[rr][cc] });
                  grid[rr][cc] = -1; dropped++;
                }
              }
            }
            api.playSfx(dropped > 0 || grp.length >= 4 ? "gold" : "pop");
            api.haptic(dropped > 0 ? 22 : 12);
          } else {
            shotsFired++;
            if (shotsFired >= shotsBeforeDrop) {
              shotsFired = 0;
              // Shift ceiling down 1 row
              for (var r2 = MAX_ROWS - 1; r2 > 0; r2--) grid[r2] = grid[r2 - 1].slice();
              grid[0] = [];
              for (var c2 = 0; c2 < COLS; c2++) grid[0].push(Math.floor(Math.random() * nCols));
            }
          }

          var left = countBubbles();
          st.setGoal("🫧 متبقي: " + left);
          if (left === 0) {
            ended = true;
            api.finish(true, "صفّيت كامل لوحة الفقاعات في الدور " + stage + "! 🫧🏆");
            return;
          }
          // Check lose if bottom row occupied
          for (var lc = 0; lc < COLS; lc++) {
            if (grid[MAX_ROWS - 1][lc] >= 0) {
              ended = true; api.playSfx("bad"); st.shake();
              api.finish(false, "", "وصلت الفقاعات إلى خط الخطر في الدور " + stage + "!");
              return;
            }
          }
          if (curC !== -1 && left > 0) curC = pickAvailColor();
        }

        function drawBubble(x, y, cIdx, r) {
          var col = PAL[cIdx % PAL.length];
          var gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 2, x, y, r);
          gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.32, col); gr.addColorStop(1, "#0b1a10");
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.lineWidth = 1.2; ctx.stroke();
        }

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت وتبقّى " + countBubbles() + " فقاعة!"); return; }

          if (shot) {
            var steps = 3;
            for (var s = 0; s < steps && shot; s++) {
              shot.x += (shot.vx * dt) / steps; shot.y += (shot.vy * dt) / steps;
              if (shot.x < R) { shot.x = R; shot.vx = Math.abs(shot.vx); api.playSfx("tick"); }
              if (shot.x > W - R) { shot.x = W - R; shot.vx = -Math.abs(shot.vx); api.playSfx("tick"); }
              if (shot.y <= R + 4) { snapShot(); break; }
              var hit = false;
              for (var r = 0; r < MAX_ROWS && !hit; r++) {
                for (var c = 0; c < COLS; c++) {
                  if (grid[r][c] < 0) continue;
                  var cp = cellPos(r, c);
                  if (Math.hypot(cp.x - shot.x, cp.y - shot.y) <= R * 1.88) { hit = true; snapShot(); break; }
                }
              }
            }
          }

          api.OliveArt.drawTreeCanopy(ctx, W, H, stage);
          // Danger line
          ctx.strokeStyle = "rgba(239,68,68,0.5)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, H - 72); ctx.lineTo(W, H - 72); ctx.stroke(); ctx.setLineDash([]);

          // Aiming Ricochet Laser Guide!
          ctx.save();
          ctx.strokeStyle = PAL[curC % PAL.length]; ctx.setLineDash([6, 6]); ctx.lineWidth = 2.4;
          var ax = shooter.x, ay = shooter.y, dx = Math.cos(aimAng), dy = Math.sin(aimAng);
          ctx.beginPath(); ctx.moveTo(ax, ay);
          for (var seg = 0; seg < 2; seg++) {
            var distWall = dx > 0 ? ((W - R - ax) / dx) : ((R - ax) / dx);
            var stepLen = Math.min(260, Math.max(10, distWall));
            ax += dx * stepLen; ay += dy * stepLen;
            ctx.lineTo(ax, ay);
            if (stepLen >= 259 || ay < 30) break;
            dx = -dx;
          }
          ctx.stroke(); ctx.restore();

          for (var r = 0; r < MAX_ROWS; r++) for (var c = 0; c < COLS; c++) if (grid[r][c] >= 0) { var cp = cellPos(r, c); drawBubble(cp.x, cp.y, grid[r][c], R); }
          if (shot) drawBubble(shot.x, shot.y, shot.c, R);

          for (var f = falling.length - 1; f >= 0; f--) {
            var fl = falling[f]; fl.vy += 600 * dt; fl.y += fl.vy * dt;
            drawBubble(fl.x, fl.y, fl.c, R * 0.85);
            if (fl.y > H + 30) falling.splice(f, 1);
          }

          drawBubble(shooter.x, shooter.y, curC, R);
          drawBubble(shooter.x + 36, shooter.y + 8, nextC, 11);
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointerdown", onD); cv.removeEventListener("pointermove", onM);
          window.removeEventListener("pointerup", onU); window.removeEventListener("keydown", onK);
        });
        api.runCountdown(st.host, "الدور " + stage + (isBoss ? " 👑 زعيم الفقاعات!" : " — صفِّ كل الفقاعات!"), function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // NEW GAME 2: 🎯 سهام الشجرة (Knife Hit Pro — 1,000 Rotating Boss Logs!)
    // =========================================================================
    window.ZaitRegisterExtraGame("knifehit", {
      icon: "🎯",
      grad: "linear-gradient(135deg,#78350f,#b91c1c)",
      name: "سهام الشجرة (Knife Hit)",
      desc: "ارمِ جميع السهام الذهبية في جذع الزيتون الدوّار دون أن تصطدم بسهم آخر — 1,000 دور!",
      cat: "speed",
      hardTag: "1000 دور 🎯",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage), rng = V99.seededRng(stage * 3571 + 7);
        var isBoss = (stage % 5 === 0);
        var dartsNeed = Math.min(14, 6 + Math.floor(diff * 6) + (isBoss ? 2 : 0));
        var prePinned = Math.min(5, Math.floor(diff * 4) + (isBoss ? 1 : 0));
        var duration = Math.round(35 + V99.getExtraTimeBonus());

        var st = api.createStageShell("سهام الشجرة", stage, duration, "🎯 متبقي: " + dartsNeed, "🎯 اضغط في أي مكان على الشاشة أو Space لرمي السهم الذهبي في جذع الزيتون!");
        st.setExtra(isBoss ? "👑 جذع الزعيم" : ("🪵 الدور " + stage));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-knife"></canvas></div>';

        var cv = document.getElementById("og-cv-knife");
        var g = api.setupHiDpiCanvas(cv, 380, 440);
        var ctx = g.ctx, W = g.w, H = g.h;
        var cx = W / 2, cy = 158, LOG_R = 66;

        var pinned = []; // angles in radians relative to log
        for (var p = 0; p < prePinned; p++) pinned.push((p / Math.max(1, prePinned)) * Math.PI * 2 + rng() * 0.35);
        var olivesOnLog = [];
        var oCount = 2 + Math.floor(rng() * 3);
        for (var oi = 0; oi < oCount; oi++) olivesOnLog.push({ ang: rng() * Math.PI * 2, alive: true });

        var logAngle = 0, rotTime = 0, dartsLeft = dartsNeed, flying = null;
        var baseRot = 1.6 + diff * 1.9;
        var rem = duration, running = false, ended = false, raf = null, lastTs = 0, woodHitShake = 0, splinters = [];

        function throwDart() {
          if (!running || api.isPaused() || ended || flying || dartsLeft <= 0) return;
          flying = { y: H - 56, vy: -1150 };
          api.playSfx("pop"); api.haptic(10);
        }
        var onDown = function () { throwDart(); };
        var onKey = function (e) { if (e.code === "Space" || e.key === "ArrowUp") { e.preventDefault(); throwDart(); } };
        cv.addEventListener("pointerdown", onDown);
        window.addEventListener("keydown", onKey);

        function normAng(a) { var x = a % (Math.PI * 2); return x < 0 ? x + Math.PI * 2 : x; }
        function angDist(a, b) { var d = Math.abs(normAng(a) - normAng(b)); return Math.min(d, Math.PI * 2 - d); }

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; rotTime += dt;
          if (woodHitShake > 0) woodHitShake = Math.max(0, woodHitShake - dt * 25);
          st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت وتبقّى " + dartsLeft + " سهم!"); return; }

          // Variable rotation pattern (reverses or pulses on higher/boss stages!)
          var rotSpd = baseRot;
          if (isBoss) rotSpd = baseRot * Math.sin(rotTime * 1.45) * 1.5;
          else if (stage % 3 === 0) rotSpd = baseRot * (0.65 + 0.65 * Math.sin(rotTime * 2.1));
          else if (stage % 2 === 0) rotSpd = -baseRot;
          logAngle = normAng(logAngle + rotSpd * dt);

          if (flying) {
            flying.y += flying.vy * dt;
            if (flying.y <= cy + LOG_R + 6) {
              var hitRelAng = normAng(Math.PI / 2 - logAngle);
              // Check collision with any pinned dart!
              var clash = pinned.some(function (pa) { return angDist(pa, hitRelAng) < 0.21; });
              if (clash) {
                ended = true; flying = null;
                api.playSfx("bad"); api.haptic(65); st.shake();
                api.finish(false, "", "💥 اصطدم السهم بسهم آخر مغروس في الجذع!");
                return;
              }
              pinned.push(hitRelAng);
              dartsLeft--; flying = null; woodHitShake = 7;
              st.setGoal("🎯 متبقي: " + dartsLeft);
              // Slice olives on log rim!
              olivesOnLog.forEach(function (ol) {
                if (ol.alive && angDist(ol.ang, hitRelAng) < 0.28) { ol.alive = false; api.playSfx("gold"); }
              });
              for (var sp = 0; sp < 8; sp++) splinters.push({ x: cx, y: cy + LOG_R, vx: (Math.random() - 0.5) * 200, vy: 60 + Math.random() * 140, life: 0.4 });
              api.playSfx("gold"); api.haptic(16);
              if (dartsLeft <= 0) {
                ended = true;
                api.finish(true, "شققت جذع الزيتون وأنهيت الدور " + stage + (isBoss ? " (👑 الزعيم!)" : "") + "! 🎯🏆");
                return;
              }
            }
          }

          api.OliveArt.drawTreeCanopy(ctx, W, H, stage);
          var logY = cy - woodHitShake;

          // Draw pinned darts & rim olives
          pinned.forEach(function (pa) {
            var a = logAngle + pa;
            ctx.save(); ctx.translate(cx + Math.cos(a) * LOG_R, logY + Math.sin(a) * LOG_R); ctx.rotate(a - Math.PI / 2);
            ctx.fillStyle = "#e2e8f0"; ctx.fillRect(-2.5, 0, 5, 34);
            ctx.fillStyle = "#f59e0b"; ctx.fillRect(-5, 28, 10, 14);
            ctx.restore();
          });
          olivesOnLog.forEach(function (ol) {
            if (!ol.alive) return;
            var a = logAngle + ol.ang;
            api.OliveArt.drawOlive(ctx, cx + Math.cos(a) * (LOG_R + 14), logY + Math.sin(a) * (LOG_R + 14), 10, "gold");
          });

          // Draw rotating olive-wood log cross-section
          ctx.save(); ctx.translate(cx, logY); ctx.rotate(logAngle);
          ctx.fillStyle = isBoss ? "#7f1d1d" : "#78350f";
          ctx.beginPath(); ctx.arc(0, 0, LOG_R, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = isBoss ? "#fde047" : "#451a03"; ctx.lineWidth = 6; ctx.stroke();
          ctx.fillStyle = "#d97706"; ctx.beginPath(); ctx.arc(0, 0, LOG_R - 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#fef3c7"; ctx.beginPath(); ctx.arc(0, 0, LOG_R - 22, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#b45309"; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
          api.OliveArt.drawOlive(ctx, 0, 0, 14, isBoss ? "gold" : "green");
          ctx.restore();

          // Splinters
          for (var s = splinters.length - 1; s >= 0; s--) {
            var sm = splinters[s]; sm.x += sm.vx * dt; sm.y += sm.vy * dt; sm.life -= dt;
            if (sm.life <= 0) { splinters.splice(s, 1); continue; }
            ctx.fillStyle = "#fde68a"; ctx.fillRect(sm.x, sm.y, 4, 4);
          }

          // Ready or flying golden dart
          var dy = flying ? flying.y : (H - 56);
          ctx.fillStyle = "#f8fafc"; ctx.beginPath(); ctx.moveTo(cx, dy - 26); ctx.lineTo(cx + 4, dy + 8); ctx.lineTo(cx - 4, dy + 8); ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#f59e0b"; ctx.fillRect(cx - 6, dy + 8, 12, 18);

          // Remaining darts indicator on left
          for (var d = 0; d < dartsLeft; d++) {
            ctx.fillStyle = "#fde047"; ctx.fillRect(16, H - 24 - d * 11, 18, 5);
          }
        }

        api.setCleanup(function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, "الدور " + stage + (isBoss ? " 👑 جذع الزعيم!" : " — اغرس " + dartsNeed + " سهم ذهبي!"), function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // NEW GAME 3: 🗼 برج الزيتون (Stack Tower Pro — Precision Slicing + Perfect Combo!)
    // =========================================================================
    window.ZaitRegisterExtraGame("stack", {
      icon: "🗼",
      grad: "linear-gradient(135deg,#b45309,#15803d)",
      name: "برج صناديق الزيتون",
      desc: "أسقط صناديق زيت الزيتون الذهبية فوق بعضها بدقة لبناء البرج — الضربة المثالية توسّع البرج!",
      cat: "speed",
      hardTag: "1000 دور 🗼",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage);
        var targetFloors = Math.min(24, 10 + Math.floor(diff * 12) + (stage % 10 === 0 ? 3 : 0));
        var duration = Math.round(45 + V99.getExtraTimeBonus());

        var st = api.createStageShell("برج الزيتون", stage, duration, "🗼 الطابق 0/" + targetFloors, "🗼 اضغط في اللحظة المثالية (أو Space) لتثبيت الصندوق بدقة!");
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-stack"></canvas></div>';

        var cv = document.getElementById("og-cv-stack");
        var g = api.setupHiDpiCanvas(cv, 380, 440);
        var ctx = g.ctx, W = g.w, H = g.h, BLOCK_H = 26;

        var stack = [{ x: W / 2 - 90, w: 180, col: "#15803d" }];
        var curW = 180, curX = 20, curDir = 1, curSpd = 175 + diff * 195;
        var perfectStreak = 0, fallen = [], camY = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, bannerTxt = "", bannerLife = 0;
        var cols = ["#22c55e", "#65a30d", "#eab308", "#f59e0b", "#d97706", "#10b981", "#0ea5e9"];

        function dropBlock() {
          if (!running || api.isPaused() || ended) return;
          var prev = stack[stack.length - 1];
          var left = Math.max(curX, prev.x), right = Math.min(curX + curW, prev.x + prev.w);
          var overlap = right - left;

          if (overlap <= 4) {
            ended = true; api.playSfx("bad"); api.haptic(60); st.shake();
            api.finish(false, "", "سقط الصندوق خارج البرج عند الطابق " + (stack.length - 1) + "/" + targetFloors + "!");
            return;
          }

          var isPerfect = Math.abs(curX - prev.x) <= 7;
          if (isPerfect) {
            perfectStreak++;
            left = prev.x;
            overlap = Math.min(185, prev.w + (perfectStreak >= 3 ? 8 : 0));
            bannerTxt = perfectStreak >= 3 ? ("🔥 مثالي ×" + perfectStreak + " (+توسيع!)") : "✨ ضربة مثالية!";
            bannerLife = 0.85;
            api.playSfx("gold"); api.haptic(18);
          } else {
            perfectStreak = 0;
            // Sliced overhang falls off!
            var cutW = curW - overlap;
            var cutX = curX < prev.x ? curX : right;
            fallen.push({ x: cutX, y: H - 50 - stack.length * BLOCK_H + camY, w: cutW, vy: 40, col: cols[stack.length % cols.length] });
            api.playSfx("pop"); api.haptic(10);
          }

          stack.push({ x: left, w: overlap, col: cols[stack.length % cols.length] });
          var floorsBuilt = stack.length - 1;
          st.setGoal("🗼 الطابق " + floorsBuilt + "/" + targetFloors);
          st.setExtra(perfectStreak > 0 ? ("✨ مثالي ×" + perfectStreak) : "");

          if (floorsBuilt >= targetFloors) {
            ended = true;
            api.finish(true, "بنيت برج زيت الشجرة المباركة بارتفاع " + floorsBuilt + " طابقاً في الدور " + stage + "! 🗼🏆");
            return;
          }

          curW = overlap;
          curDir = (stack.length % 2 === 0) ? 1 : -1;
          curX = curDir > 0 ? 10 : (W - curW - 10);
          curSpd = Math.min(430, curSpd + 6);
        }

        var onDown = function () { dropBlock(); };
        var onKey = function (e) { if (e.code === "Space" || e.key === "ArrowDown") { e.preventDefault(); dropBlock(); } };
        cv.addEventListener("pointerdown", onDown);
        window.addEventListener("keydown", onKey);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت عند الطابق " + (stack.length - 1) + "/" + targetFloors + "!"); return; }

          curX += curSpd * curDir * dt;
          if (curX < 6) { curX = 6; curDir = 1; }
          if (curX + curW > W - 6) { curX = W - 6 - curW; curDir = -1; }

          var targetCam = Math.max(0, (stack.length - 7) * BLOCK_H);
          camY += (targetCam - camY) * Math.min(1, dt * 8);
          if (bannerLife > 0) bannerLife -= dt;

          api.OliveArt.drawTreeCanopy(ctx, W, H, stage);

          // Draw stacked blocks
          stack.forEach(function (bk, i) {
            var y = H - 48 - i * BLOCK_H + camY;
            ctx.fillStyle = bk.col; ctx.fillRect(bk.x, y, bk.w, BLOCK_H - 2);
            ctx.strokeStyle = "rgba(254,240,138,0.5)"; ctx.lineWidth = 1.4; ctx.strokeRect(bk.x, y, bk.w, BLOCK_H - 2);
          });

          // Swinging current block
          var curY = H - 48 - stack.length * BLOCK_H + camY;
          ctx.fillStyle = cols[stack.length % cols.length];
          ctx.fillRect(curX, curY, curW, BLOCK_H - 2);
          ctx.strokeStyle = "#fde047"; ctx.lineWidth = 2; ctx.strokeRect(curX, curY, curW, BLOCK_H - 2);

          // Falling sliced pieces
          for (var f = fallen.length - 1; f >= 0; f--) {
            var fl = fallen[f]; fl.vy += 650 * dt; fl.y += fl.vy * dt;
            ctx.fillStyle = fl.col; ctx.fillRect(fl.x, fl.y, fl.w, BLOCK_H - 2);
            if (fl.y > H + 40) fallen.splice(f, 1);
          }

          if (bannerLife > 0) {
            ctx.globalAlpha = Math.min(1, bannerLife * 1.5);
            ctx.fillStyle = "#fde047"; ctx.font = "900 18px Cairo,sans-serif"; ctx.textAlign = "center";
            ctx.fillText(bannerTxt, W / 2, 72);
            ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, "الدور " + stage + " — ابنِ " + targetFloors + " طابقاً!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // NEW GAME 4: 🐦 طائر سيناء الطائر (Flappy Olive Pro — 1,000 Levels!)
    // =========================================================================
    window.ZaitRegisterExtraGame("flappy", {
      icon: "🐦",
      grad: "linear-gradient(135deg,#0284c7,#15803d)",
      name: "طائر مزرعة سيناء",
      desc: "حلق بين بوابات أشجار الزيتون واجمع قطرات الذهب للوصول لنهاية الدور — 1,000 دور!",
      cat: "speed",
      hardTag: "1000 دور 🐦",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage), rng = V99.seededRng(stage * 4127 + 3);
        var gateGoal = Math.min(22, 7 + Math.floor(diff * 12) + (stage % 10 === 0 ? 3 : 0));
        var duration = Math.round(45 + V99.getExtraTimeBonus());

        var st = api.createStageShell("طائر سيناء", stage, duration, "🐦 0/" + gateGoal + " بوابة", "🐦 اضغط على الشاشة أو Space للطيران وتجاوز بوابات الزيتون!");
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-flap"></canvas></div>';

        var cv = document.getElementById("og-cv-flap");
        var g = api.setupHiDpiCanvas(cv, 380, 420);
        var ctx = g.ctx, W = g.w, H = g.h;

        var bird = { x: 96, y: H / 2, vy: 0, r: 14 };
        var gapSize = Math.max(108, 152 - diff * 36);
        var scrollSpd = 155 + diff * 105;
        var pipes = [], passed = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, nextPipeX = W + 60;

        function spawnPipe(xPos) {
          var gapY = 85 + rng() * (H - 170 - gapSize);
          pipes.push({ x: xPos, gapY: gapY, gapH: gapSize, scored: false, oliveAlive: true, moving: stage >= 4 && rng() < 0.35, dir: rng() < 0.5 ? 1 : -1 });
        }
        spawnPipe(W + 40); spawnPipe(W + 250);

        function flap() {
          if (!running || api.isPaused() || ended) return;
          bird.vy = -315;
          api.playSfx("pop"); api.haptic(8);
        }
        var onDown = function () { flap(); };
        var onKey = function (e) { if (e.code === "Space" || e.key === "ArrowUp") { e.preventDefault(); flap(); } };
        cv.addEventListener("pointerdown", onDown);
        window.addEventListener("keydown", onKey);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت عند " + passed + "/" + gateGoal + " بوابة!"); return; }

          bird.vy += 860 * dt;
          bird.y += bird.vy * dt;
          if (bird.y < bird.r || bird.y > H - bird.r) {
            ended = true; api.playSfx("bad"); api.haptic(55); st.shake();
            api.finish(false, "", "اصطدم الطائر عند البوابة " + passed + "/" + gateGoal + "!");
            return;
          }

          api.OliveArt.drawTreeCanopy(ctx, W, H, stage);

          var lastX = 0;
          for (var i = pipes.length - 1; i >= 0; i--) {
            var p = pipes[i];
            p.x -= scrollSpd * dt;
            if (p.moving) {
              p.gapY += p.dir * 38 * dt;
              if (p.gapY < 55 || p.gapY + p.gapH > H - 55) p.dir *= -1;
            }
            if (p.x > lastX) lastX = p.x;

            // Draw olive-trunk pillars
            ctx.fillStyle = "#15803d"; ctx.strokeStyle = "#fde047"; ctx.lineWidth = 2;
            ctx.fillRect(p.x, 0, 50, p.gapY); ctx.strokeRect(p.x, 0, 50, p.gapY);
            ctx.fillRect(p.x, p.gapY + p.gapH, 50, H - (p.gapY + p.gapH)); ctx.strokeRect(p.x, p.gapY + p.gapH, 50, H - (p.gapY + p.gapH));

            if (p.oliveAlive) {
              var oy = p.gapY + p.gapH / 2;
              api.OliveArt.drawOlive(ctx, p.x + 25, oy, 11, "gold");
              if (Math.hypot(bird.x - (p.x + 25), bird.y - oy) < 24) { p.oliveAlive = false; api.playSfx("gold"); }
            }

            // Collision with pipes
            if (bird.x + bird.r - 3 > p.x && bird.x - bird.r + 3 < p.x + 50) {
              if (bird.y - bird.r + 3 < p.gapY || bird.y + bird.r - 3 > p.gapY + p.gapH) {
                ended = true; api.playSfx("bad"); api.haptic(60); st.shake();
                api.finish(false, "", "اصطدم الطائر ببوابة الزيتون عند " + passed + "/" + gateGoal + "!");
                return;
              }
            }
            if (!p.scored && p.x + 50 < bird.x) {
              p.scored = true; passed++;
              st.setGoal("🐦 " + passed + "/" + gateGoal);
              api.playSfx("pop");
              if (passed >= gateGoal) {
                ended = true;
                api.finish(true, "حلّقت بنجاح وتجاوزت " + passed + " بوابة زيتون في الدور " + stage + "! 🐦🏆");
                return;
              }
            }
            if (p.x < -60) pipes.splice(i, 1);
          }
          if (lastX < W - 185) spawnPipe(W + 30);

          // Draw Sinai Golden Bird
          ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(Math.max(-0.5, Math.min(0.7, bird.vy / 450)));
          ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.ellipse(0, 0, 16, 13, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#153422"; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = "#15803d"; ctx.beginPath(); ctx.ellipse(-4, 2, 8, 5, -0.3, 0, Math.PI * 2); ctx.fill(); // green wing
          ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(6, -4, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(7, -4, 2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#ea580c"; ctx.beginPath(); ctx.moveTo(14, -1); ctx.lineTo(22, 2); ctx.lineTo(14, 5); ctx.closePath(); ctx.fill();
          ctx.restore();
        }

        api.setCleanup(function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, "الدور " + stage + " — تجاوز " + gateGoal + " بوابة زيتون!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // NEW GAME 5: 🧩 بلوك بلاست الزيتون (8x8 Block Blast Puzzle — 1,000 Levels!)
    // =========================================================================
    window.ZaitRegisterExtraGame("blockblast", {
      icon: "🧩",
      grad: "linear-gradient(135deg,#4c1d95,#15803d)",
      name: "بلوك بلاست الشجرة (8×8)",
      desc: "اختر قطع الزيتون وضعها في شبكة 8×8 لإكمال الصفوف والأعمدة وتفجيرها — 1,000 دور!",
      cat: "brain",
      hardTag: "1000 دور 🧩",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage), rng = V99.seededRng(stage * 6131 + 19);
        var linesGoal = Math.min(18, 4 + Math.floor(diff * 10) + (stage % 10 === 0 ? 2 : 0));
        var duration = Math.round(75 + V99.getExtraTimeBonus());

        var st = api.createStageShell("بلوك بلاست 8×8", stage, duration, "🧩 خطوط 0/" + linesGoal, "🧩 اختر قطعة من الأسفل ثم اضغط على مكانها في الشبكة لإكمال صف أو عمود كامل!");
        var SHAPES = [
          [[0,0]], [[0,0],[0,1]], [[0,0],[1,0]], [[0,0],[0,1],[0,2]], [[0,0],[1,0],[2,0]],
          [[0,0],[0,1],[1,0],[1,1]], [[0,0],[1,0],[1,1]], [[0,0],[0,1],[1,0]],
          [[0,0],[0,1],[0,2],[0,3]], [[0,0],[1,0],[2,0],[3,0]], [[0,0],[0,1],[0,2],[1,1]]
        ];
        var COLS = ["#22c55e", "#facc15", "#38bdf8", "#f97316", "#a855f7"];

        var board = [];
        for (var r = 0; r < 8; r++) { board.push([]); for (var c = 0; c < 8; c++) board[r].push(null); }
        // Seeded starter obstacle blocks on higher stages
        var preBlocks = Math.min(12, Math.floor(diff * 10));
        for (var pb = 0; pb < preBlocks; pb++) {
          board[Math.floor(rng() * 8)][Math.floor(rng() * 8)] = "#64748b";
        }

        function dealTray() {
          var t = [];
          for (var i = 0; i < 3; i++) t.push({ cells: SHAPES[Math.floor(Math.random() * SHAPES.length)], col: COLS[Math.floor(Math.random() * COLS.length)], used: false });
          return t;
        }
        var tray = dealTray(), selIdx = 0, linesDone = 0, rem = duration, ended = false;

        function canPlace(shape, r0, c0) {
          return shape.cells.every(function (d) {
            var nr = r0 + d[0], nc = c0 + d[1];
            return nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && !board[nr][nc];
          });
        }
        function anyMovePossible() {
          for (var i = 0; i < tray.length; i++) {
            if (tray[i].used) continue;
            for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) if (canPlace(tray[i], r, c)) return true;
          }
          return false;
        }

        function render() {
          var bHtml = '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;max-width:340px;margin:0 auto;padding:7px;background:#0a2013;border:2px solid #d59e2a;border-radius:16px;">';
          for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 8; c++) {
              var col = board[r][c];
              bHtml += '<button type="button" class="p4-bb-c" data-r="' + r + '" data-c="' + c + '" style="aspect-ratio:1/1;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:' + (col || 'rgba(255,255,255,.06)') + ';cursor:pointer;"></button>';
            }
          }
          bHtml += '</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:340px;margin:10px auto 0;">';
          tray.forEach(function (sh, idx) {
            var mini = '<div style="display:grid;grid-template-columns:repeat(4,12px);gap:2px;justify-content:center;">';
            for (var mr = 0; mr < 4; mr++) for (var mc = 0; mc < 4; mc++) {
              var on = !sh.used && sh.cells.some(function (d) { return d[0] === mr && d[1] === mc; });
              mini += '<div style="width:12px;height:12px;border-radius:3px;background:' + (on ? sh.col : 'transparent') + ';"></div>';
            }
            mini += '</div>';
            bHtml += '<button type="button" class="p4-bb-sh" data-i="' + idx + '" style="padding:8px;border-radius:12px;border:2px solid ' + (selIdx === idx && !sh.used ? '#fde047' : 'rgba(213,158,42,.35)') + ';background:' + (selIdx === idx && !sh.used ? 'rgba(250,204,21,.2)' : '#102c1c') + ';opacity:' + (sh.used ? '.25' : '1') + ';cursor:pointer;">' + mini + '</button>';
          });
          st.host.innerHTML = bHtml + '</div>';

          st.host.querySelectorAll(".p4-bb-sh").forEach(function (b) {
            b.onclick = function () {
              var i = Number(b.getAttribute("data-i"));
              if (!tray[i].used) { selIdx = i; api.playSfx("tick"); render(); }
            };
          });
          st.host.querySelectorAll(".p4-bb-c").forEach(function (cell) {
            cell.onclick = function () {
              if (ended || api.isPaused()) return;
              var sh = tray[selIdx];
              if (!sh || sh.used) return;
              var r = Number(cell.getAttribute("data-r")), c = Number(cell.getAttribute("data-c"));
              if (!canPlace(sh, r, c)) { api.playSfx("bad"); st.shake(); return; }
              sh.cells.forEach(function (d) { board[r + d[0]][c + d[1]] = sh.col; });
              sh.used = true;
              api.playSfx("pop"); api.haptic(10);

              // Clear full rows & columns
              var fullRows = [], fullCols = [];
              for (var rr = 0; rr < 8; rr++) if (board[rr].every(Boolean)) fullRows.push(rr);
              for (var cc = 0; cc < 8; cc++) {
                var okC = true; for (var r2 = 0; r2 < 8; r2++) if (!board[r2][cc]) okC = false;
                if (okC) fullCols.push(cc);
              }
              fullRows.forEach(function (rr) { for (var x = 0; x < 8; x++) board[rr][x] = null; });
              fullCols.forEach(function (cc) { for (var y = 0; y < 8; y++) board[y][cc] = null; });
              var cleared = fullRows.length + fullCols.length;
              if (cleared > 0) {
                linesDone += cleared;
                st.setGoal("🧩 خطوط " + linesDone + "/" + linesGoal);
                api.playSfx("gold"); api.haptic(22);
                if (linesDone >= linesGoal) {
                  ended = true; clearInterval(iv);
                  api.finish(true, "فجّرت " + linesDone + " صف وعمود في بلوك بلاست الدور " + stage + "! 🧩🏆");
                  return;
                }
              }

              if (tray.every(function (x) { return x.used; })) tray = dealTray();
              selIdx = tray.findIndex(function (x) { return !x.used; });
              render();
              if (!anyMovePossible()) {
                ended = true; clearInterval(iv); api.playSfx("bad"); st.shake();
                api.finish(false, "", "لا توجد مساحة متبقية للقطع الحالية (" + linesDone + "/" + linesGoal + ")!");
              }
            };
          });
        }

        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت عند " + linesDone + "/" + linesGoal + " خطوط!"); }
        }, 100);
        api.setCleanup(function () { ended = true; clearInterval(iv); });
        render();
      }
    });

    // =========================================================================
    // NEW GAME 6: 🎈 قناص فوانيس سيناء (Sky Lantern Sniper — 1,000 Levels + Boss Blimp!)
    // =========================================================================
    window.ZaitRegisterExtraGame("sniper", {
      icon: "🎈",
      grad: "linear-gradient(135deg,#0f172a,#b45309)",
      name: "قناص فوانيس سيناء",
      desc: "صوّب بالمنظار الدقيق 1:1 على فوانيس الزيت الذهبية الصاعدة ومنطاد الزعيم — 1,000 دور!",
      cat: "speed",
      hardTag: "1000 دور 🎈",
      supports1000: true,
      launch: function (api) {
        var stage = api.stage, diff = V99.levelDifficulty(stage);
        var isBoss = (stage % 10 === 0);
        var quota = 15 + Math.floor(diff * 22);
        var duration = Math.round(28 + V99.getExtraTimeBonus());
        var lives = stage >= 6 ? 2 : 3;

        var st = api.createStageShell("قناص الفوانيس", stage, duration, isBoss ? "👑 منطاد الزعيم" : ("🎈 0/" + quota), "🎯 المس أو اضغط على الفوانيس الذهبية والزيتون — احذر ضرب فوانيس الخطر الحمراء!");
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-snip"></canvas></div>';

        var cv = document.getElementById("og-cv-snip");
        var g = api.setupHiDpiCanvas(cv, 380, 420);
        var ctx = g.ctx, W = g.w, H = g.h;

        var targets = [], bursts = [], hits = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, acc = 0;
        var boss = isBoss ? { x: W / 2, y: 120, vx: 95 + diff * 80, hp: 16 + Math.floor(stage / 10) * 2, maxHp: 16 + Math.floor(stage / 10) * 2 } : null;
        var aim = { x: W / 2, y: H / 2 };
        var spd = 95 + diff * 135, spawnMs = Math.max(320, 660 - diff * 300);

        var onMove = function (e) { aim = api.getPointerPos(e, cv, W, H); };
        var onShoot = function (e) {
          if (!running || api.isPaused() || ended) return;
          var p = api.getPointerPos(e, cv, W, H); aim = p;
          bursts.push({ x: p.x, y: p.y, r: 6, life: 0.22, col: "#fde047" });

          // Check Boss Blimp first
          if (boss && Math.hypot(boss.x - p.x, boss.y - p.y) <= 44) {
            boss.hp--; api.playSfx("gold"); api.haptic(18);
            st.setGoal("👑 صحة الزعيم: " + boss.hp + "/" + boss.maxHp);
            if (boss.hp <= 0) {
              ended = true;
              api.finish(true, "أسقطت منطاد الزعيم في الدور " + stage + " ببراعة! 🎈👑");
            }
            return;
          }

          for (var i = targets.length - 1; i >= 0; i--) {
            var t = targets[i];
            if (Math.hypot(t.x - p.x, t.y - p.y) <= t.r + 12) {
              if (t.bad) {
                lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
                api.playSfx("bad"); api.haptic(55); st.shake(); targets.splice(i, 1);
                if (lives <= 0) { ended = true; api.finish(false, "", "💥 أصبت فوانيس الخطر ونفدت محاولاتك!"); return; }
              } else {
                hits += t.gold ? 2 : 1;
                if (!boss) st.setGoal("🎈 " + hits + "/" + quota);
                api.playSfx(t.gold ? "gold" : "pop"); api.haptic(12);
                bursts.push({ x: t.x, y: t.y, r: 16, life: 0.3, col: t.gold ? "#facc15" : "#4ade80" });
                targets.splice(i, 1);
                if (!boss && hits >= quota) {
                  ended = true;
                  api.finish(true, "قنصت " + hits + " هدفاً بدقة عالية في الدور " + stage + "! 🎈🏆");
                  return;
                }
              }
              break;
            }
          }
        };
        cv.addEventListener("pointermove", onMove);
        cv.addEventListener("pointerdown", onShoot);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", isBoss ? "هرب منطاد الزعيم قبل إسقاطه!" : ("انتهى الوقت عند " + hits + "/" + quota + "!")); return; }

          acc += dt * 1000;
          if (acc >= spawnMs) {
            acc = 0;
            var r = Math.random();
            targets.push({
              x: 34 + Math.random() * (W - 68), y: H + 26,
              vy: spd + Math.random() * 75, sway: (Math.random() - 0.5) * 65,
              bad: r < (0.18 + diff * 0.14), gold: r > 0.82, r: 19
            });
          }

          api.OliveArt.drawTreeCanopy(ctx, W, H, stage + 2);

          if (boss) {
            boss.x += boss.vx * dt;
            if (boss.x < 56 || boss.x > W - 56) boss.vx *= -1;
            ctx.fillStyle = "#b45309"; ctx.beginPath(); ctx.ellipse(boss.x, boss.y, 44, 28, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#fde047"; ctx.lineWidth = 3; ctx.stroke();
            ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.fillText("👑", boss.x, boss.y + 8);
            // Boss HP bar
            ctx.fillStyle = "#111"; ctx.fillRect(boss.x - 36, boss.y - 42, 72, 8);
            ctx.fillStyle = "#ef4444"; ctx.fillRect(boss.x - 35, boss.y - 41, 70 * (boss.hp / boss.maxHp), 6);
          }

          for (var i = targets.length - 1; i >= 0; i--) {
            var t = targets[i]; t.y -= t.vy * dt; t.x += Math.sin(t.y * 0.03) * t.sway * dt;
            if (t.bad) api.OliveArt.drawHazard(ctx, t.x, t.y, t.r - 2, "bomb");
            else {
              ctx.fillStyle = t.gold ? "#eab308" : "#16a34a";
              ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * 0.85, t.r, 0, 0, Math.PI * 2); ctx.fill();
              ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 1.6; ctx.stroke();
              ctx.font = "17px sans-serif"; ctx.textAlign = "center"; ctx.fillText(t.gold ? "✨" : "🫒", t.x, t.y + 6);
            }
            if (t.y < -35) targets.splice(i, 1);
          }

          for (var b = bursts.length - 1; b >= 0; b--) {
            var br = bursts[b]; br.r += 90 * dt; br.life -= dt;
            if (br.life <= 0) { bursts.splice(b, 1); continue; }
            ctx.globalAlpha = Math.max(0, br.life * 3); ctx.strokeStyle = br.col; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.arc(br.x, br.y, br.r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
          }

          // Precision Sniper Reticle
          ctx.strokeStyle = "rgba(253,224,71,0.72)"; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.arc(aim.x, aim.y, 16, 0, Math.PI * 2);
          ctx.moveTo(aim.x - 22, aim.y); ctx.lineTo(aim.x + 22, aim.y);
          ctx.moveTo(aim.x, aim.y - 22); ctx.lineTo(aim.x, aim.y + 22); ctx.stroke();
        }

        api.setCleanup(function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onShoot); });
        api.runCountdown(st.host, "الدور " + stage + (isBoss ? " 👑 أسقط منطاد الزعيم!" : " — اقنص " + quota + " هدفاً!"), function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });
  }

  bootPack4();
})();
