/* ============================================================================
   Zait Store Olive Games Ultra V98 — Pack 2 (5 Google-Play-Grade Action Games)
   100% 1:1 Precision Pointer + Mobile/Tablet/Desktop Keyboard + Offline Ready
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_PACK2_V98__) return;
  window.__ZAIT_OLIVE_PACK2_V98__ = true;

  function registerPack2() {
    if (typeof window.ZaitRegisterExtraGame !== "function") {
      setTimeout(registerPack2, 120);
      return;
    }

    // =========================================================================
    // ACTION GAME 1: ⚔️ نينجا تقطيع الزيتون برو (Olive Ninja Slice Pro)
    // =========================================================================
    window.ZaitRegisterExtraGame("slice", {
      icon: "⚔️",
      grad: "linear-gradient(135deg,#7c2d12,#b91c1c)",
      name: "نينجا تقطيع الزيتون",
      desc: "اسحب بسيفك الذهبي لتقطيع ثمار الزيتون الحقيقية وكسب الكومبو وتجميد الوقت ❄️!",
      cat: "speed",
      hardTag: "نينجا ⚔️",
      launch: function (api) {
        var stage = api.stage;
        var quota = 16 + stage * 6;
        var duration = Math.max(25, (api.baseTime || 30) + Math.min(8, stage));
        var lives = stage >= 6 ? 2 : 3;

        var st = api.createStageShell(
          "نينجا الزيتون",
          stage,
          duration,
          "⚔️ 0/" + quota,
          "⚔️ اسحب بالماوس أو بإصبعك لتقطيع الزيتون • ❄️ تجميد الوقت • 💣 تجنب القنابل!"
        );
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-slice2"></canvas></div>';

        var cv = document.getElementById("og-cv-slice2");
        var g = api.setupHiDpiCanvas(cv, 380, 430);
        var ctx = g.ctx, W = g.w, H = g.h;

        var fruits = [], halves = [], splashes = [], trail = [], popups = [];
        var sliced = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, waveAcc = 0;
        var down = false, swipeHits = 0, swipeTimer = 0, freezeUntil = 0;
        var waveMs = Math.max(600, 1120 - stage * 52);
        var bombRate = Math.min(0.32, 0.14 + stage * 0.022);

        function spawnSplash(x, y, col) {
          for (var i = 0; i < 10; i++) {
            splashes.push({
              x: x, y: y,
              vx: (Math.random() - 0.5) * 220, vy: (Math.random() - 0.5) * 220,
              r: 2.5 + Math.random() * 3.5, col: col, life: 0.48
            });
          }
        }

        function sliceCheck(ev) {
          if (!down || !running || api.isPaused() || ended) return;
          var p = api.getPointerPos(ev, cv, W, H);
          trail.push({ x: p.x, y: p.y, life: 0.17 });
          if (trail.length > 18) trail.shift();

          for (var i = fruits.length - 1; i >= 0; i--) {
            var f = fruits[i];
            if (Math.hypot(f.x - p.x, f.y - p.y) <= f.r + 13) {
              if (f.kind === "bomb") {
                lives--; swipeHits = 0;
                st.setExtra("❤️".repeat(Math.max(0, lives)));
                api.playSfx("bad"); api.haptic(65); st.shake();
                spawnSplash(f.x, f.y, "#ef4444");
                popups.push({ x: f.x, y: f.y, txt: "💥 قنبلة!", col: "#fca5a5", life: 0.8 });
                fruits.splice(i, 1);
                if (lives <= 0) {
                  ended = true;
                  api.finish(false, "", "💥 قطّعت القنابل ونفدت محاولاتك في الدور " + stage + "!");
                  return;
                }
              } else if (f.kind === "freeze") {
                freezeUntil = Date.now() + 4500;
                sliced += 2;
                st.setGoal("⚔️ " + sliced + "/" + quota);
                api.playSfx("gold"); api.haptic(25);
                spawnSplash(f.x, f.y, "#38bdf8");
                popups.push({ x: f.x, y: f.y, txt: "❄️ تجميد بطيء!", col: "#7dd3fc", life: 0.9 });
                fruits.splice(i, 1);
              } else {
                swipeHits++; swipeTimer = 0.22;
                var basePts = f.kind === "gold" ? 3 : 1;
                var comboBonus = swipeHits >= 3 ? 2 : 0;
                var add = basePts + comboBonus;
                sliced += add;
                st.setGoal("⚔️ " + sliced + "/" + quota);
                api.playSfx(f.kind === "gold" || comboBonus > 0 ? "gold" : "pop");
                api.haptic(comboBonus > 0 ? 22 : 12);
                var juice = f.kind === "gold" ? "#facc15" : (f.kind === "black" ? "#7e22ce" : "#84cc16");
                spawnSplash(f.x, f.y, juice);
                popups.push({
                  x: f.x, y: f.y - 8,
                  txt: comboBonus > 0 ? ("🔥 كومبو +" + add) : ("+" + add),
                  col: f.kind === "gold" ? "#fef08a" : "#bbf7d0", life: 0.7
                });
                halves.push({ x: f.x - 6, y: f.y, vx: f.vx - 85, vy: f.vy - 35, col: juice, r: f.r * 0.72, rot: -0.4, life: 0.65 });
                halves.push({ x: f.x + 6, y: f.y, vx: f.vx + 85, vy: f.vy - 35, col: juice, r: f.r * 0.72, rot: 0.4, life: 0.65 });
                fruits.splice(i, 1);
              }
              if (sliced >= quota) {
                ended = true;
                api.finish(true, "قطّعت " + sliced + " ثمرة زيتون سيناوي باحتراف في الدور " + stage + "! ⚔️🫒");
                return;
              }
            }
          }
        }

        var onDown = function (e) { down = true; swipeHits = 0; sliceCheck(e); };
        var onUp = function () { down = false; swipeHits = 0; };
        cv.addEventListener("pointerdown", onDown);
        cv.addEventListener("pointermove", sliceCheck);
        window.addEventListener("pointerup", onUp);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var rawDt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts;
          var frozen = Date.now() < freezeUntil;
          var dt = frozen ? rawDt * 0.45 : rawDt;

          if (swipeTimer > 0) { swipeTimer -= rawDt; if (swipeTimer <= 0) swipeHits = 0; }
          rem -= rawDt;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true;
            api.finish(false, "", "انتهى الوقت عند " + sliced + "/" + quota + " ثمرة!");
            return;
          }

          waveAcc += rawDt * 1000;
          if (waveAcc >= waveMs) {
            waveAcc = 0;
            var cnt = 2 + Math.floor(Math.random() * Math.min(4, 1 + Math.ceil(stage / 2)));
            for (var k = 0; k < cnt; k++) {
              var r = Math.random();
              var kind = r < 0.05 ? "freeze" : (r < 0.05 + bombRate ? "bomb" : (r > 0.84 ? "gold" : (r > 0.62 ? "black" : "green")));
              var sx = 46 + Math.random() * (W - 92);
              fruits.push({
                x: sx, y: H + 24,
                vx: (W / 2 - sx) * (0.42 + Math.random() * 0.62),
                vy: -(560 + Math.random() * 145),
                kind: kind, r: kind === "gold" ? 20 : 18, rot: Math.random() * 6
              });
            }
          }

          api.OliveArt.drawTreeCanopy(ctx, W, H, stage);
          if (frozen) {
            ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
            ctx.fillRect(0, 0, W, H);
          }

          // Update & draw flying olives
          for (var i = fruits.length - 1; i >= 0; i--) {
            var f = fruits[i];
            f.vy += 680 * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += 2.6 * dt;
            ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
            if (f.kind === "bomb") api.OliveArt.drawHazard(ctx, 0, 0, f.r, "bomb");
            else if (f.kind === "freeze") {
              ctx.fillStyle = "#0ea5e9"; ctx.beginPath(); ctx.arc(0, 0, f.r, 0, Math.PI * 2); ctx.fill();
              ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 2; ctx.stroke();
              ctx.font = "18px sans-serif"; ctx.textAlign = "center"; ctx.fillText("❄️", 0, 6);
            } else api.OliveArt.drawOlive(ctx, 0, 0, f.r, f.kind);
            ctx.restore();
            if (f.y > H + 52) fruits.splice(i, 1);
          }

          // Sliced halves
          for (var h = halves.length - 1; h >= 0; h--) {
            var hv = halves[h];
            hv.vy += 650 * dt; hv.x += hv.vx * dt; hv.y += hv.vy * dt; hv.rot += 4 * dt; hv.life -= rawDt;
            if (hv.life <= 0) { halves.splice(h, 1); continue; }
            ctx.save(); ctx.globalAlpha = Math.max(0, hv.life * 1.6);
            ctx.translate(hv.x, hv.y); ctx.rotate(hv.rot);
            ctx.fillStyle = hv.col; ctx.beginPath(); ctx.arc(0, 0, hv.r, 0, Math.PI); ctx.fill();
            ctx.restore();
          }

          // Oil splash droplets
          for (var sp = splashes.length - 1; sp >= 0; sp--) {
            var spt = splashes[sp];
            spt.x += spt.vx * dt; spt.y += spt.vy * dt; spt.vy += 260 * dt; spt.life -= rawDt;
            if (spt.life <= 0) { splashes.splice(sp, 1); continue; }
            ctx.globalAlpha = Math.max(0, spt.life * 2);
            ctx.fillStyle = spt.col; ctx.beginPath(); ctx.arc(spt.x, spt.y, spt.r, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Glowing golden ninja blade trail
          for (var t = trail.length - 1; t >= 0; t--) { trail[t].life -= rawDt; if (trail[t].life <= 0) trail.splice(t, 1); }
          if (trail.length > 1) {
            ctx.lineCap = "round";
            for (var q = 1; q < trail.length; q++) {
              ctx.strokeStyle = frozen ? "#7dd3fc" : "#fde047";
              ctx.lineWidth = (q / trail.length) * 8;
              ctx.beginPath(); ctx.moveTo(trail[q - 1].x, trail[q - 1].y); ctx.lineTo(trail[q].x, trail[q].y); ctx.stroke();
            }
          }

          // Floating combo & score popups
          for (var po = popups.length - 1; po >= 0; po--) {
            var pp = popups[po]; pp.y -= 54 * rawDt; pp.life -= rawDt;
            if (pp.life <= 0) { popups.splice(po, 1); continue; }
            ctx.globalAlpha = Math.max(0, pp.life * 1.5);
            ctx.fillStyle = pp.col; ctx.font = "900 16px Cairo,sans-serif"; ctx.textAlign = "center";
            ctx.fillText(pp.txt, pp.x, pp.y); ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", sliceCheck); window.removeEventListener("pointerup", onUp);
        });
        api.runCountdown(st.host, "الدور " + stage + " — قطّع " + quota + " ثمرة زيتون!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // ACTION GAME 2: 🚚 طريق شاحنة زيت سيناء برو (Highway Racer with Nitro & Shield)
    // =========================================================================
    window.ZaitRegisterExtraGame("truck", {
      icon: "🚚",
      grad: "linear-gradient(135deg,#92400e,#15803d)",
      name: "طريق شاحنة سيناء",
      desc: "وصّل شحنة زيت الشجرة المباركة عبر 10 مدن مصرية مع نيترو ⚡ ودرع حماية 🛡️!",
      cat: "speed",
      hardTag: "10 مدن 🚚",
      launch: function (api) {
        var stage = api.stage;
        var cities = ["العريش", "بئر العبد", "الإسماعيلية", "الزقازيق", "القاهرة", "الجيزة", "الإسكندرية", "المنصورة", "أسيوط", "أسوان"];
        var dest = cities[(stage - 1) % cities.length];
        var laneCount = stage >= 5 ? 4 : 3;
        var distGoal = 115 + stage * 34;
        var lives = stage >= 6 ? 2 : 3;

        var st = api.createStageShell(
          "شاحنة سيناء",
          stage,
          Math.max(26, api.baseTime || 32),
          "📍 " + dest + " (0%)",
          "💻 الأسهم ⬅️ ➡️ أو A/D • 📱 اسحب أو المس الحارة • التقط ⚡ نيترو و🛡️ درع!"
        );
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-truck2"></canvas></div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">' +
            '<button type="button" class="og-btn og-btn-dark" id="og-t2-r">➡️ يمين</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="og-t2-l">⬅️ يسار</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-truck2");
        var g = api.setupHiDpiCanvas(cv, 380, 420);
        var ctx = g.ctx, W = g.w, H = g.h;

        var roadL = W * 0.08, roadW = W * 0.84, laneW = roadW / laneCount;
        function laneCenter(idx) { return roadL + laneW * (idx + 0.5); }

        var lane = Math.floor(laneCount / 2), truckX = laneCenter(lane);
        var distDone = 0, running = false, ended = false, raf = null, lastTs = 0, acc = 0, dashY = 0;
        var nitroUntil = 0, shieldUntil = 0, objs = [], dust = [];
        var baseSpd = 215 + stage * 24, spawnMs = Math.max(300, 650 - stage * 38);
        var obsRate = Math.min(0.66, 0.42 + stage * 0.028);

        function shiftLane(d) {
          if (!running || api.isPaused() || ended) return;
          lane = Math.max(0, Math.min(laneCount - 1, lane + d));
          api.haptic(8);
        }
        document.getElementById("og-t2-l").onclick = function () { shiftLane(-1); };
        document.getElementById("og-t2-r").onclick = function () { shiftLane(1); };

        var onKey = function (e) {
          if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); shiftLane(-1); }
          if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); shiftLane(1); }
        };
        window.addEventListener("keydown", onKey);

        var startPt = null;
        var onDown = function (e) { startPt = api.getPointerPos(e, cv, W, H); };
        var onUp = function (e) {
          if (!startPt || !running || api.isPaused() || ended) return;
          var endPt = api.getPointerPos(e, cv, W, H);
          var dx = endPt.x - startPt.x;
          if (Math.abs(dx) > 22) shiftLane(dx > 0 ? 1 : -1);
          else {
            var pickedLane = Math.floor((endPt.x - roadL) / laneW);
            if (pickedLane >= 0 && pickedLane < laneCount) { lane = pickedLane; api.haptic(8); }
          }
          startPt = null;
        };
        cv.addEventListener("pointerdown", onDown);
        cv.addEventListener("pointerup", onUp);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.045, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts;

          var now = Date.now(), isNitro = now < nitroUntil, isShield = now < shieldUntil;
          var spd = isNitro ? baseSpd * 1.55 : baseSpd;

          // Smooth truck interpolation toward target lane!
          var targetX = laneCenter(lane);
          truckX += (targetX - truckX) * Math.min(1, dt * 16);

          distDone += (isNitro ? 14 : 7.2) * dt;
          var pct = Math.min(100, Math.round((distDone / distGoal) * 100));
          st.setGoal("📍 " + dest + " (" + pct + "%)");
          st.setTime(Math.max(0, distGoal - distDone), distGoal);

          if (distDone >= distGoal) {
            ended = true;
            api.finish(true, "وصلت شحنة زيت الشجرة المباركة إلى " + dest + " بسلامة تامة! 🚚🏆");
            return;
          }

          acc += dt * 1000;
          if (acc >= (isNitro ? spawnMs * 0.72 : spawnMs)) {
            acc = 0;
            var ln = Math.floor(Math.random() * laneCount);
            var r = Math.random();
            var kind = r < 0.06 ? "nitro" : (r < 0.11 ? "shield" : (r < 0.11 + obsRate ? (Math.random() < 0.5 ? "stone" : "cone") : "bottle"));
            objs.push({ lane: ln, x: laneCenter(ln), y: -32, kind: kind });
          }

          // Background desert & asphalt highway
          ctx.fillStyle = stage % 2 === 0 ? "#855834" : "#a17242"; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#1f2937"; ctx.fillRect(roadL, 0, roadW, H);
          ctx.fillStyle = "#d59e2a"; ctx.fillRect(roadL, 0, 4, H); ctx.fillRect(roadL + roadW - 4, 0, 4, H);

          ctx.strokeStyle = isNitro ? "#38bdf8" : "#fde68a";
          ctx.lineWidth = 2.5; ctx.setLineDash([18, 16]);
          dashY = (dashY + spd * dt) % 34; ctx.lineDashOffset = -dashY;
          for (var l = 1; l < laneCount; l++) {
            var lx = roadL + l * laneW;
            ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
          }
          ctx.setLineDash([]);

          // Exhaust / Nitro particles
          dust.push({ x: truckX + (Math.random() - 0.5) * 14, y: H - 34, vy: 80, life: 0.3, col: isNitro ? "#38bdf8" : "rgba(255,255,255,0.35)" });
          for (var d = dust.length - 1; d >= 0; d--) {
            var ds = dust[d]; ds.y += ds.vy * dt; ds.life -= dt;
            if (ds.life <= 0) { dust.splice(d, 1); continue; }
            ctx.globalAlpha = Math.max(0, ds.life * 2.5);
            ctx.fillStyle = ds.col; ctx.beginPath(); ctx.arc(ds.x, ds.y, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          }

          for (var i = objs.length - 1; i >= 0; i--) {
            var o = objs[i]; o.y += spd * dt;
            if (o.kind === "stone") api.OliveArt.drawHazard(ctx, o.x, o.y, 16, "stone");
            else if (o.kind === "cone") {
              ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.moveTo(o.x, o.y - 14); ctx.lineTo(o.x + 14, o.y + 12); ctx.lineTo(o.x - 14, o.y + 12); ctx.closePath(); ctx.fill();
              ctx.fillStyle = "#fff"; ctx.fillRect(o.x - 7, o.y - 2, 14, 4);
            } else if (o.kind === "nitro" || o.kind === "shield") {
              ctx.font = "24px sans-serif"; ctx.textAlign = "center";
              ctx.fillText(o.kind === "nitro" ? "⚡" : "🛡️", o.x, o.y + 8);
            } else {
              api.OliveArt.drawBottle(ctx, o.x, o.y, 24, 38, 0.92);
            }

            if (Math.abs(o.x - truckX) < laneW * 0.44 && Math.abs(o.y - (H - 68)) < 36) {
              if (o.kind === "nitro") { nitroUntil = Date.now() + 4000; api.playSfx("gold"); api.haptic(20); }
              else if (o.kind === "shield") { shieldUntil = Date.now() + 6000; api.playSfx("gold"); api.haptic(20); }
              else if (o.kind === "bottle") { distDone += 9; api.playSfx("pop"); api.haptic(10); }
              else {
                if (!isShield && !isNitro) {
                  lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
                  api.playSfx("bad"); api.haptic(55); st.shake();
                  if (lives <= 0) { ended = true; api.finish(false, "", "🚧 تعطلت الشاحنة قبل الوصول إلى " + dest + "!"); return; }
                } else api.playSfx("pop");
              }
              objs.splice(i, 1);
            } else if (o.y > H + 40) objs.splice(i, 1);
          }

          if (isShield || isNitro) {
            ctx.strokeStyle = isNitro ? "#facc15" : "#38bdf8";
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(truckX, H - 68, 34, 0, Math.PI * 2); ctx.stroke();
          }
          api.OliveArt.drawTruck(ctx, truckX, H - 68);
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          window.removeEventListener("keydown", onKey); cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointerup", onUp);
        });
        api.runCountdown(st.host, "الدور " + stage + " — الوجهة: " + dest, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // ACTION GAME 3: 🐍 ثعبان متاهات سيناء برو (5 Mazes + Input Queue + Timed Gold)
    // =========================================================================
    window.ZaitRegisterExtraGame("snake", {
      icon: "🐍",
      grad: "linear-gradient(135deg,#065f46,#15803d)",
      name: "ثعبان متاهات سيناء",
      desc: "5 متاهات صخرية متدرجة مع طابور حركة ذكي وزيتون ذهبي مؤقت!",
      cat: "speed",
      hardTag: "5 متاهات 🐍",
      launch: function (api) {
        var stage = api.stage, mazeIdx = (stage - 1) % 5;
        var mazeNames = ["المزرعة المفتوحة", "صخور الزوايا", "بوابة المعصرة", "الممر المزدوج", "المتاهة السيناوية"];
        var quota = 10 + stage * 3;
        var duration = Math.max(42, (api.baseTime || 55) + stage * 3);

        var st = api.createStageShell("ثعبان سيناء", stage, duration, "🫒 0/" + quota, "💻 الأسهم أو WASD • 📱 اسحب على الشاشة أو اضغط أزرار الاتجاه");
        st.setExtra("🗺️ " + mazeNames[mazeIdx]);
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-snake2"></canvas></div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,64px);justify-content:center;gap:6px;margin-top:8px;">' +
            '<div></div><button type="button" class="og-btn og-btn-dark" id="sn2-u" style="padding:9px;">⬆️</button><div></div>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn2-r" style="padding:9px;">➡️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn2-d" style="padding:9px;">⬇️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn2-l" style="padding:9px;">⬅️</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-snake2");
        var g = api.setupHiDpiCanvas(cv, 360, 360);
        var ctx = g.ctx, COLS = 18, CELL = 20;
        var snake = [{ x: 4, y: 9 }, { x: 3, y: 9 }, { x: 2, y: 9 }];
        var dir = { x: 1, y: 0 }, dirQueue = [], rocks = [];

        if (mazeIdx === 1) {
          [[3,3],[4,3],[3,4],[14,3],[13,3],[14,4],[3,14],[4,14],[3,13],[14,14],[13,14],[14,13]].forEach(function (p) { rocks.push({ x: p[0], y: p[1] }); });
        } else if (mazeIdx === 2) {
          for (var y2 = 3; y2 <= 14; y2++) if (y2 < 7 || y2 > 10) rocks.push({ x: 9, y: y2 });
        } else if (mazeIdx === 3) {
          for (var x3 = 4; x3 <= 13; x3++) { rocks.push({ x: x3, y: 5 }); rocks.push({ x: x3, y: 12 }); }
        } else if (mazeIdx === 4) {
          for (var x4 = 3; x4 <= 14; x4++) if (x4 !== 8 && x4 !== 9) { rocks.push({ x: x4, y: 4 }); rocks.push({ x: x4, y: 13 }); }
          for (var y4 = 6; y4 <= 11; y4++) if (y4 !== 9) { rocks.push({ x: 6, y: y4 }); rocks.push({ x: 12, y: y4 }); }
        }

        function blocked(x, y) {
          return snake.some(function (s) { return s.x === x && s.y === y; }) || rocks.some(function (r) { return r.x === x && r.y === y; });
        }
        function freeCell() {
          var fx, fy, t = 0;
          do { fx = Math.floor(Math.random() * COLS); fy = Math.floor(Math.random() * COLS); t++; } while (blocked(fx, fy) && t < 150);
          return { x: fx, y: fy };
        }

        var food = freeCell(), bonusGold = null, eaten = 0, rem = duration, running = false, ended = false;
        var tickMs = Math.max(78, 146 - stage * 7);

        function queueDir(nx, ny) {
          var ref = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
          if ((nx === -ref.x && ny === -ref.y) || (nx === ref.x && ny === ref.y)) return;
          if (dirQueue.length < 2) dirQueue.push({ x: nx, y: ny });
        }

        document.getElementById("sn2-u").onclick = function () { queueDir(0, -1); };
        document.getElementById("sn2-d").onclick = function () { queueDir(0, 1); };
        document.getElementById("sn2-l").onclick = function () { queueDir(-1, 0); };
        document.getElementById("sn2-r").onclick = function () { queueDir(1, 0); };

        var sp0 = null;
        cv.addEventListener("pointerdown", function (e) { sp0 = api.getPointerPos(e, cv, 360, 360); });
        cv.addEventListener("pointerup", function (e) {
          if (!sp0) return;
          var sp1 = api.getPointerPos(e, cv, 360, 360);
          var dx = sp1.x - sp0.x, dy = sp1.y - sp0.y; sp0 = null;
          if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
          if (Math.abs(dx) > Math.abs(dy)) queueDir(dx > 0 ? 1 : -1, 0); else queueDir(0, dy > 0 ? 1 : -1);
        });
        var onKey = function (e) {
          if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); queueDir(0, -1); }
          else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); queueDir(0, 1); }
          else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); queueDir(-1, 0); }
          else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); queueDir(1, 0); }
        };
        window.addEventListener("keydown", onKey);

        function draw() {
          ctx.fillStyle = "#081c11"; ctx.fillRect(0, 0, 360, 360);
          ctx.strokeStyle = "rgba(255,255,255,0.035)";
          for (var i = 0; i <= COLS; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 360); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(360, i * CELL); ctx.stroke();
          }
          rocks.forEach(function (rk) { api.OliveArt.drawHazard(ctx, rk.x * CELL + 10, rk.y * CELL + 10, 9, "stone"); });
          api.OliveArt.drawOlive(ctx, food.x * CELL + 10, food.y * CELL + 10, 9, "green");
          if (bonusGold) {
            api.OliveArt.drawOlive(ctx, bonusGold.x * CELL + 10, bonusGold.y * CELL + 10, 10, "gold");
            var ratio = Math.max(0, (bonusGold.exp - Date.now()) / 6000);
            ctx.strokeStyle = "#fde047"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(bonusGold.x * CELL + 10, bonusGold.y * CELL + 10, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio); ctx.stroke();
          }
          // Tapered glossy snake with animated eyes
          snake.forEach(function (sg, idx) {
            var cx = sg.x * CELL + 10, cy = sg.y * CELL + 10;
            var rad = idx === 0 ? 9.5 : Math.max(5.5, 9 - (idx / (snake.length + 2)) * 3.5);
            ctx.fillStyle = idx === 0 ? "#f4cf6d" : (idx % 2 === 0 ? "#22c55e" : "#15803d");
            ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
            if (idx === 0) {
              ctx.fillStyle = "#111";
              ctx.beginPath();
              ctx.arc(cx + dir.x * 3 - dir.y * 3, cy + dir.y * 3 + dir.x * 3, 2, 0, Math.PI * 2);
              ctx.arc(cx + dir.x * 3 + dir.y * 3, cy + dir.y * 3 - dir.x * 3, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        }

        var mIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          if (dirQueue.length) dir = dirQueue.shift();
          var hd = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          if (hd.x < 0 || hd.x >= COLS || hd.y < 0 || hd.y >= COLS || blocked(hd.x, hd.y)) {
            ended = true; clearInterval(mIv); clearInterval(sIv);
            api.playSfx("bad"); api.haptic(60); st.shake();
            api.finish(false, "", "💥 اصطدم الثعبان بالجدار أو الصخور في " + mazeNames[mazeIdx] + "!");
            return;
          }
          snake.unshift(hd);
          var grew = false;
          if (hd.x === food.x && hd.y === food.y) {
            eaten += 1; grew = true;
            api.playSfx("pop"); api.haptic(12);
            food = freeCell();
            if (!bonusGold && Math.random() < 0.35) {
              var bg = freeCell();
              bonusGold = { x: bg.x, y: bg.y, exp: Date.now() + 6000 };
            }
          } else if (bonusGold && hd.x === bonusGold.x && hd.y === bonusGold.y) {
            eaten += 3; grew = true; bonusGold = null;
            api.playSfx("gold"); api.haptic(22);
          }
          if (!grew) snake.pop();
          if (bonusGold && Date.now() > bonusGold.exp) bonusGold = null;
          st.setGoal("🫒 " + eaten + "/" + quota);
          if (eaten >= quota) {
            ended = true; clearInterval(mIv); clearInterval(sIv);
            api.finish(true, "جمعت محصول " + mazeNames[mazeIdx] + " (" + eaten + " ثمرة سيناوية)! 🐍🏆");
            return;
          }
          draw();
        }, tickMs);

        var sIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(mIv); clearInterval(sIv); api.finish(false, "", "انتهى الوقت عند " + eaten + "/" + quota + " زيتونة!"); }
        }, 100);

        draw();
        api.setCleanup(function () { ended = true; clearInterval(mIv); clearInterval(sIv); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, "الدور " + stage + " — " + mazeNames[mazeIdx], function () { running = true; });
      }
    });

    // =========================================================================
    // ACTION GAME 4: ❄️ معصرة العصر عالبارد برو (Cold-Press Tycoon + Cool Mist!)
    // =========================================================================
    window.ZaitRegisterExtraGame("press", {
      icon: "❄️",
      grad: "linear-gradient(135deg,#0369a1,#15803d)",
      name: "معصرة العصر عالبارد",
      desc: "املأ عبوات 500مل ⬅️ برميل 10لتر تحت 27°م مع المنطقة الذهبية وزر التبريد الفوري 🧊!",
      cat: "speed",
      hardTag: "معصرة ❄️",
      launch: function (api) {
        var stage = api.stage;
        var bottles = ["عبوة 500 مل", "زجاجة 1 لتر بكر", "جركن 2 لتر سيناوي", "جركن 3 لتر عائلي", "جركن 5 لتر ملكي", "برميل معصرة 10 لتر"];
        var bName = bottles[(stage - 1) % bottles.length];
        var targetFill = 95 + stage * 24;
        var duration = Math.max(18, (api.baseTime || 24) - Math.floor(stage / 3));

        var st = api.createStageShell("العصر عالبارد", stage, duration, bName + " (0%)", "💻 Space للعصر و C للتبريد • 📱 اضغط الأزرار وحافظ على الحرارة في المنطقة الذهبية 22-26°م!");
        st.setExtra("🌡️ 18.0°م");
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-press2"></canvas></div>' +
          '<div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-top:8px;">' +
            '<button type="button" id="og-p2-tap" class="og-btn og-btn-gold" style="padding:13px;font-size:.96rem;">🫒 اعصر عالبارد (Space)</button>' +
            '<button type="button" id="og-p2-cool" class="og-btn og-btn-dark" style="padding:13px;font-size:.86rem;">🧊 تبريد (C)</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-press2");
        var g = api.setupHiDpiCanvas(cv, 380, 270);
        var ctx = g.ctx, W = g.w, H = g.h;
        var fill = 0, temp = 18, lockUntil = 0, coolCD = 0, rem = duration, running = false, ended = false, drops = [], mist = [];
        var heatGain = 1.48 + stage * 0.2, coolRate = Math.max(5.0, 7.5 - stage * 0.24), fillGain = Math.max(2.1, 3.3 - stage * 0.11);

        function doPress() {
          if (!running || api.isPaused() || ended) return;
          if (Date.now() < lockUntil) { api.playSfx("bad"); return; }
          temp += heatGain;
          var sweet = (temp >= 22 && temp <= 26.2) ? 1.5 : 1;
          fill = Math.min(targetFill, fill + fillGain * sweet);
          drops.push({ x: W * 0.42 + (Math.random() - 0.5) * 16, y: 46, vy: 200, gold: sweet > 1 });
          api.playSfx(sweet > 1 ? "gold" : "pop"); api.haptic(10);
          if (temp > 27) {
            lockUntil = Date.now() + 1350 + stage * 130;
            fill = Math.max(0, fill - (7 + stage * 2));
            api.playSfx("bad"); api.haptic(50); st.shake();
          }
          if (fill >= targetFill) {
            ended = true; clearInterval(iv);
            api.finish(true, "تمت تعبئة (" + bName + ") بنسبة 100% عصرة أولى على البارد! ❄️🏆");
          }
        }

        function doCoolMist() {
          if (!running || api.isPaused() || ended || coolCD > 0) return;
          temp = Math.max(17.5, temp - 6.5);
          lockUntil = 0;
          coolCD = 5.0;
          for (var i = 0; i < 14; i++) mist.push({ x: W * 0.42 + (Math.random() - 0.5) * 80, y: 80 + Math.random() * 120, life: 0.55 });
          api.playSfx("gold"); api.haptic(18);
        }

        document.getElementById("og-p2-tap").onclick = doPress;
        document.getElementById("og-p2-cool").onclick = doCoolMist;
        var onKey = function (e) {
          if (e.code === "Space") { e.preventDefault(); doPress(); }
          if (e.key === "c" || e.key === "C") doCoolMist();
        };
        window.addEventListener("keydown", onKey);

        function draw() {
          ctx.fillStyle = "#0a2114"; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#334155"; ctx.fillRect(W * 0.28, 8, W * 0.28, 34);
          api.OliveArt.drawOlive(ctx, W * 0.36, 22, 10, "green");
          api.OliveArt.drawOlive(ctx, W * 0.46, 22, 10, "gold");

          drops.forEach(function (d) {
            ctx.fillStyle = d.gold ? "#fde047" : "#eab308";
            ctx.beginPath(); ctx.arc(d.x, d.y, d.gold ? 5.5 : 4.2, 0, Math.PI * 2); ctx.fill();
          });

          api.OliveArt.drawBottle(ctx, W * 0.42, 158, 90, 158, fill / targetFill);

          mist.forEach(function (m) {
            ctx.globalAlpha = Math.max(0, m.life * 1.6);
            ctx.fillStyle = "#7dd3fc"; ctx.beginPath(); ctx.arc(m.x, m.y, 12, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          });

          // Thermometer with Sweet-Spot Gold Zone (22-26.2°C)
          var tx = W * 0.8, ty = 36, th = 186;
          ctx.fillStyle = "#1e293b"; ctx.fillRect(tx - 13, ty, 26, th);
          // Gold sweet spot band
          var y26 = ty + th * (1 - (26.2 - 15) / 16), y22 = ty + th * (1 - (22 - 15) / 16);
          ctx.fillStyle = "rgba(250, 204, 21, 0.28)"; ctx.fillRect(tx - 18, y26, 36, y22 - y26);

          var tRat = Math.max(0.05, Math.min(1, (temp - 15) / 16));
          ctx.fillStyle = temp >= 26.5 ? "#ef4444" : (temp >= 22 ? "#facc15" : "#22c55e");
          ctx.fillRect(tx - 10, ty + th * (1 - tRat), 20, th * tRat);

          var line27 = ty + th * (1 - (27 - 15) / 16);
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(tx - 22, line27); ctx.lineTo(tx + 22, line27); ctx.stroke();
          ctx.fillStyle = "#fde68a"; ctx.font = "900 11px Cairo,sans-serif"; ctx.textAlign = "center";
          ctx.fillText("27°م حد أقصى", tx, line27 - 6);
          ctx.fillStyle = "#fff"; ctx.fillText(Math.round((fill / targetFill) * 100) + "%", W * 0.42, 255);
        }

        var iv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          rem -= 0.05;
          if (coolCD > 0) coolCD = Math.max(0, coolCD - 0.05);
          var cBtn = document.getElementById("og-p2-cool");
          if (cBtn) { cBtn.disabled = coolCD > 0; cBtn.textContent = coolCD > 0 ? ("🧊 " + Math.ceil(coolCD) + "ث") : "🧊 تبريد (C)"; }

          temp = Math.max(17.5, temp - coolRate * 0.05);
          for (var i = drops.length - 1; i >= 0; i--) { drops[i].y += drops[i].vy * 0.05; if (drops[i].y > 142) drops.splice(i, 1); }
          for (var m = mist.length - 1; m >= 0; m--) { mist[m].y -= 28 * 0.05; mist[m].life -= 0.05; if (mist[m].life <= 0) mist.splice(m, 1); }

          st.setTime(rem, duration);
          st.setGoal(bName + " (" + Math.round((fill / targetFill) * 100) + "%)");
          st.setExtra(temp >= 22 && temp <= 26.2 ? ("⚡ " + temp.toFixed(1) + "°م") : ("🌡️ " + temp.toFixed(1) + "°م"));
          draw();
          if (rem <= 0) {
            ended = true; clearInterval(iv);
            api.finish(false, "", "انتهى الوقت عند " + Math.round((fill / targetFill) * 100) + "% من تعبئة " + bName + "!");
          }
        }, 50);

        draw();
        api.setCleanup(function () { ended = true; clearInterval(iv); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, "الدور " + stage + " — تعبئة " + bName, function () { running = true; });
      }
    });

    // =========================================================================
    // ACTION GAME 5: 🎯 فرز المعصرة السريع برو (3 Alternating Belts + Combo Meter!)
    // =========================================================================
    window.ZaitRegisterExtraGame("sorter", {
      icon: "🎯",
      grad: "linear-gradient(135deg,#1e3a8a,#15803d)",
      name: "فرز المعصرة السريع",
      desc: "3 سيور متحركة متعاكسة الاتجاه — افرز ثمار الزيتون النقية واكسب مضاعف الكومبو!",
      cat: "speed",
      hardTag: "3 سيور 🎯",
      launch: function (api) {
        var stage = api.stage;
        var batchGoal = 16 + stage * 5;
        var duration = Math.max(20, api.baseTime || 26);
        var lives = stage >= 5 ? 2 : 3;

        var st = api.createStageShell("فرز المعصرة", stage, duration, "🫒 0/" + batchGoal, "🎯 المس أو اضغط على ثمار الزيتون الخضراء والذهبية فقط — تجنب الأحجار والتالف!");
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-sort2"></canvas></div>';

        var cv = document.getElementById("og-cv-sort2");
        var g = api.setupHiDpiCanvas(cv, 380, 360);
        var ctx = g.ctx, W = g.w, H = g.h;

        var items = [], pops = [], done = 0, combo = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, acc = 0, beltOff = 0;
        var spd = 135 + stage * 24, spawnMs = Math.max(270, 600 - stage * 38);

        function onTap(ev) {
          if (!running || api.isPaused() || ended) return;
          var p = api.getPointerPos(ev, cv, W, H);
          for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            if (Math.hypot(it.x - p.x, it.y - p.y) <= 28) {
              if (it.kind === "green" || it.kind === "gold") {
                combo++;
                var gain = (it.kind === "gold" ? 2 : 1) + (combo >= 5 ? 1 : 0);
                done += gain;
                st.setGoal("🫒 " + done + "/" + batchGoal);
                api.playSfx(it.kind === "gold" || combo >= 5 ? "gold" : "pop"); api.haptic(12);
                pops.push({ x: it.x, y: it.y - 6, txt: combo >= 5 ? ("🔥 +" + gain) : ("+" + gain), col: "#fde047", life: 0.55 });
              } else {
                lives--; combo = 0;
                st.setExtra("❤️".repeat(Math.max(0, lives)));
                api.playSfx("bad"); api.haptic(50); st.shake();
                pops.push({ x: it.x, y: it.y - 6, txt: "❌ خطأ!", col: "#fca5a5", life: 0.65 });
                if (lives <= 0) { ended = true; api.finish(false, "", "اخترت حبات تالفة أو أحجار!"); return; }
              }
              items.splice(i, 1);
              if (done >= batchGoal) {
                ended = true;
                api.finish(true, "أنهيت فرز الدفعة رقم " + stage + " (" + done + " ثمرة صافية)! 🎯🫒");
              }
              break;
            }
          }
        }
        cv.addEventListener("pointerdown", onTap);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.045, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت عند " + done + "/" + batchGoal + " ثمرة!"); return; }

          acc += dt * 1000;
          if (acc >= spawnMs) {
            acc = 0;
            var row = Math.floor(Math.random() * 3);
            var dirSign = (stage >= 2 && row === 1) ? -1 : 1; // السير الأوسط يتحرك بالعكس بدءاً من الدور 2!
            var r = Math.random();
            var k = r < 0.22 ? "stone" : (r < 0.42 ? "rotten" : (r > 0.84 ? "gold" : "green"));
            items.push({ x: dirSign > 0 ? -24 : W + 24, y: 74 + row * 102, dir: dirSign, kind: k });
          }

          beltOff = (beltOff + spd * dt) % 32;
          ctx.fillStyle = "#081c11"; ctx.fillRect(0, 0, W, H);
          for (var b = 0; b < 3; b++) {
            var by = 42 + b * 102;
            ctx.fillStyle = "#163624"; ctx.fillRect(0, by, W, 64);
            ctx.strokeStyle = "rgba(213, 158, 42, 0.22)"; ctx.lineWidth = 2;
            var dirB = (stage >= 2 && b === 1) ? -1 : 1;
            for (var sx = -32; sx < W + 32; sx += 32) {
              var lx = sx + (dirB > 0 ? beltOff : -beltOff);
              ctx.beginPath(); ctx.moveTo(lx, by + 6); ctx.lineTo(lx, by + 58); ctx.stroke();
            }
          }

          for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i]; it.x += spd * it.dir * dt;
            if (it.kind === "stone") api.OliveArt.drawHazard(ctx, it.x, it.y, 15, "stone");
            else api.OliveArt.drawOlive(ctx, it.x, it.y, 16, it.kind);
            if ((it.dir > 0 && it.x > W + 32) || (it.dir < 0 && it.x < -32)) items.splice(i, 1);
          }

          for (var p = pops.length - 1; p >= 0; p--) {
            var pp = pops[p]; pp.y -= 44 * dt; pp.life -= dt;
            if (pp.life <= 0) { pops.splice(p, 1); continue; }
            ctx.globalAlpha = Math.max(0, pp.life * 1.8); ctx.fillStyle = pp.col;
            ctx.font = "900 15px Cairo,sans-serif"; ctx.textAlign = "center"; ctx.fillText(pp.txt, pp.x, pp.y);
            ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () { ended = true; if (raf) cancelAnimationFrame(raf); cv.removeEventListener("pointerdown", onTap); });
        api.runCountdown(st.host, "الدور " + stage + " — افرز " + batchGoal + " ثمرة زيتون صافية!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });
  }

  registerPack2();
})();
