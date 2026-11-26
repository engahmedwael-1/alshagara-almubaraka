/* ============================================================================
   Zait Store Olive Games Pro — Part 2 Extra Games Pack (olive-games-extra.js)
   Adds 5 Challenging 60fps Retina Games -> Total 13 Offline/Online Games!
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_EXTRA_V96__) return;
  window.__ZAIT_OLIVE_EXTRA_V96__ = true;

  function registerAll() {
    if (typeof window.ZaitRegisterExtraGame !== "function") {
      setTimeout(registerAll, 150);
      return;
    }

    // =========================================================================
    // EXTRA GAME 1: 🔮 زوما الزيتون السيناوي (Sinai Olive Zuma — Spiral Track!)
    // =========================================================================
    window.ZaitRegisterExtraGame("zuma", {
      icon: "🔮",
      name: "زوما الزيتون السيناوي",
      desc: "أطلق كرات الزيتون الملونة على المسار الحلزوني وفجّر 3+ متشابهة قبل وصولها للحفرة!",
      cat: "brain",
      hardTag: "زوما 🔮",
      launch: function (api) {
        var diff = api.diff;
        var duration = api.duration;
        var target = api.target;
        var st = api.createStageShell("زوما الزيتون", duration, "الهدف: " + target);

        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-zuma"></canvas></div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;">' +
            '<span style="font-size:.75rem;font-weight:800;opacity:.85;">🎯 صوّب باللمس وأطلق لتطابق 3 كرات بنفس اللون</span>' +
            '<button type="button" id="og-zuma-swap" class="og-btn og-btn-dark" style="padding:7px 12px;font-size:.78rem;">🔄 تبديل الكرة</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-zuma");
        var g = api.setupHiDpiCanvas(cv, 360, 400);
        var ctx = g.ctx, W = g.w, H = g.h;
        var cx = W / 2, cy = H / 2 + 8;

        // Build uniform arc-length spiral path from outer edge inward to center pit
        var rawPts = [];
        var maxTheta = Math.PI * 5.2;
        for (var k = 0; k <= 900; k++) {
          var u = k / 900;
          var theta = u * maxTheta;
          var rad = 166 - u * 124; // 166px -> 42px
          rawPts.push({ x: cx + Math.cos(theta) * rad, y: cy + Math.sin(theta) * rad });
        }
        var pathPts = [rawPts[0]];
        var cumDist = [0];
        var totalLen = 0;
        for (var j = 1; j < rawPts.length; j++) {
          var dSeg = Math.hypot(rawPts[j].x - rawPts[j - 1].x, rawPts[j].y - rawPts[j - 1].y);
          totalLen += dSeg;
          pathPts.push(rawPts[j]);
          cumDist.push(totalLen);
        }

        function sampleAt(dist) {
          if (dist <= 0) return pathPts[0];
          if (dist >= totalLen) return pathPts[pathPts.length - 1];
          var lo = 0, hi = cumDist.length - 1;
          while (lo < hi - 1) {
            var mid = (lo + hi) >> 1;
            if (cumDist[mid] <= dist) lo = mid; else hi = mid;
          }
          var span = cumDist[hi] - cumDist[lo] || 1;
          var t = (dist - cumDist[lo]) / span;
          return {
            x: pathPts[lo].x + (pathPts[hi].x - pathPts[lo].x) * t,
            y: pathPts[lo].y + (pathPts[hi].y - pathPts[lo].y) * t
          };
        }

        var PALETTE = diff === "hard"
          ? ["#22c55e", "#facc15", "#ef4444", "#38bdf8", "#a855f7"]
          : ["#22c55e", "#facc15", "#ef4444", "#38bdf8"];

        var ORB_R = 12;
        var SPACING = ORB_R * 2.02;
        var marchSpeed = diff === "hard" ? 44 : (diff === "medium" ? 34 : 26);
        var initialBalls = diff === "hard" ? 26 : (diff === "medium" ? 22 : 18);
        var reserveSpawn = diff === "hard" ? 30 : (diff === "medium" ? 22 : 14);

        var chain = []; // index 0 = back (near start), last = front (closest to pit)
        function randColor() { return Math.floor(Math.random() * PALETTE.length); }
        for (var i = 0; i < initialBalls; i++) {
          // Slight grouping for natural Zuma feel
          var col = (i > 0 && Math.random() < 0.35) ? chain[i - 1].c : randColor();
          chain.push({ dist: i * SPACING + 12, c: col });
        }

        var curColor = randColor(), nextColor = randColor();
        var aimAngle = -Math.PI / 2;
        var shots = [], pops = [];
        var score = 0, comboCount = 0, rem = duration;
        var running = false, ended = false, raf = null, lastTs = 0, shootCooldown = 0;

        function pickActiveColor() {
          if (!chain.length) return randColor();
          var present = {};
          chain.forEach(function (b) { present[b.c] = true; });
          var keys = Object.keys(present);
          return Number(keys[Math.floor(Math.random() * keys.length)]);
        }

        function swapBalls() {
          var tmp = curColor; curColor = nextColor; nextColor = tmp;
          api.playSfx("pop"); api.haptic(10);
        }
        document.getElementById("og-zuma-swap").onclick = swapBalls;

        function getCanvasCoords(ev) {
          var r = cv.getBoundingClientRect();
          var cxPos = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
          var cyPos = (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;
          return { x: ((cxPos - r.left) / r.width) * W, y: ((cyPos - r.top) / r.height) * H };
        }

        function updateAim(ev) {
          var pt = getCanvasCoords(ev);
          aimAngle = Math.atan2(pt.y - cy, pt.x - cx);
        }

        function fireOrb(ev) {
          if (!running || api.isPaused() || ended || shootCooldown > 0) return;
          var pt = getCanvasCoords(ev);
          if (Math.hypot(pt.x - cx, pt.y - cy) < 26) { swapBalls(); return; }
          aimAngle = Math.atan2(pt.y - cy, pt.x - cx);
          shots.push({
            x: cx + Math.cos(aimAngle) * 20,
            y: cy + Math.sin(aimAngle) * 20,
            vx: Math.cos(aimAngle) * 470,
            vy: Math.sin(aimAngle) * 470,
            c: curColor
          });
          curColor = nextColor;
          nextColor = pickActiveColor();
          shootCooldown = 0.22;
          api.playSfx("pop");
          api.haptic(10);
        }

        cv.addEventListener("pointermove", updateAim);
        cv.addEventListener("pointerdown", fireOrb);

        function burstPop(x, y, colorHex) {
          for (var p = 0; p < 8; p++) {
            pops.push({ x: x, y: y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, life: 0.42, c: colorHex });
          }
        }

        function checkMatchesAt(idx, chainDepth) {
          if (idx < 0 || idx >= chain.length) return;
          var targetC = chain[idx].c;
          var left = idx, right = idx;
          while (left > 0 && chain[left - 1].c === targetC && (chain[left].dist - chain[left - 1].dist) <= SPACING * 1.45) left--;
          while (right < chain.length - 1 && chain[right + 1].c === targetC && (chain[right + 1].dist - chain[right].dist) <= SPACING * 1.45) right++;
          var runLen = right - left + 1;
          if (runLen >= 3) {
            comboCount = chainDepth;
            var pts = runLen * 15 * chainDepth;
            score += pts;
            st.setScore("⭐ " + score);
            st.setExtra(chainDepth > 1 ? ("🔥 كومبو ×" + chainDepth) : ("🔮 " + chain.length + " كرة"));
            for (var m = left; m <= right; m++) {
              var pos = sampleAt(chain[m].dist);
              burstPop(pos.x, pos.y, PALETTE[targetC]);
            }
            chain.splice(left, runLen);
            api.playSfx(chainDepth > 1 ? "gold" : "pop");
            api.haptic(chainDepth > 1 ? 28 : 16);

            // Pull front segment back slightly & check cascading match
            if (left > 0 && left < chain.length && chain[left - 1].c === chain[left].c) {
              var gap = chain[left].dist - chain[left - 1].dist;
              if (gap < SPACING * 4) {
                for (var f = left; f < chain.length; f++) chain[f].dist -= (gap - SPACING);
                setTimeout(function () { if (!ended) checkMatchesAt(left, chainDepth + 1); }, 110);
              }
            }

            if (score >= target || (chain.length === 0 && reserveSpawn <= 0)) {
              ended = true;
              api.finish(true, score);
            }
          }
        }

        function enforceSpacing() {
          for (var i = 1; i < chain.length; i++) {
            var minD = chain[i - 1].dist + SPACING;
            if (chain[i].dist < minD) chain[i].dist = minD;
          }
        }

        function drawOrb(x, y, colorIdx, radius) {
          var col = PALETTE[colorIdx % PALETTE.length];
          ctx.save();
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = "rgba(255,255,255,0.48)";
          ctx.beginPath(); ctx.arc(x - radius * 0.32, y - radius * 0.32, radius * 0.28, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts;

          rem -= dt;
          if (shootCooldown > 0) shootCooldown -= dt;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true;
            api.finish(score >= target, score, "انتهى الوقت ولم تصل لـ " + target + " نقطة!");
            return;
          }

          // Advance chain along spiral
          if (chain.length > 0) {
            chain[0].dist += marchSpeed * dt;
            for (var i = 1; i < chain.length; i++) {
              var gap = chain[i].dist - chain[i - 1].dist;
              if (gap <= SPACING + 1.5) chain[i].dist = chain[i - 1].dist + SPACING;
              else chain[i].dist += (marchSpeed * 0.25) * dt; // slower front when separated
            }
            // Spawn reserve marbles at back when room opens
            if (reserveSpawn > 0 && chain[0].dist > SPACING + 6) {
              chain.unshift({ dist: chain[0].dist - SPACING, c: randColor() });
              reserveSpawn--;
            }
            // Check lose condition (front reached center pit!)
            if (chain[chain.length - 1].dist >= totalLen - 6) {
              ended = true;
              api.playSfx("bad"); api.haptic(60); st.shake();
              api.finish(false, score, "🕳️ وصلت سلسلة الزيتون إلى الحفرة!");
              return;
            }
          } else if (reserveSpawn > 0) {
            chain.push({ dist: 12, c: randColor() });
            reserveSpawn--;
          } else {
            ended = true;
            api.finish(true, score + Math.round(rem * 5));
            return;
          }

          // Update shots & detect insertion collision
          for (var s = shots.length - 1; s >= 0; s--) {
            var sh = shots[s];
            sh.x += sh.vx * dt;
            sh.y += sh.vy * dt;
            if (sh.x < -20 || sh.x > W + 20 || sh.y < -20 || sh.y > H + 20) {
              shots.splice(s, 1);
              continue;
            }
            var hitIdx = -1;
            for (var c = 0; c < chain.length; c++) {
              var pos = sampleAt(chain[c].dist);
              if (Math.hypot(pos.x - sh.x, pos.y - sh.y) <= ORB_R * 1.95) {
                hitIdx = c;
                break;
              }
            }
            if (hitIdx !== -1) {
              var beforePos = sampleAt(Math.max(0, chain[hitIdx].dist - SPACING));
              var afterPos = sampleAt(Math.min(totalLen, chain[hitIdx].dist + SPACING));
              var dBef = Math.hypot(beforePos.x - sh.x, beforePos.y - sh.y);
              var dAft = Math.hypot(afterPos.x - sh.x, afterPos.y - sh.y);
              var insertAt = dAft < dBef ? hitIdx + 1 : hitIdx;
              var newDist = insertAt === hitIdx ? chain[hitIdx].dist : chain[hitIdx].dist + SPACING;
              chain.splice(insertAt, 0, { dist: newDist, c: sh.c });
              enforceSpacing();
              shots.splice(s, 1);
              checkMatchesAt(insertAt, 1);
            }
          }

          // Background & spiral track groove
          var bg = ctx.createRadialGradient(cx, cy, 20, cx, cy, 240);
          bg.addColorStop(0, "#153d26"); bg.addColorStop(1, "#06150d");
          ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

          ctx.strokeStyle = "rgba(213, 158, 42, 0.25)";
          ctx.lineWidth = 22;
          ctx.lineCap = "round";
          ctx.beginPath();
          for (var p = 0; p < pathPts.length; p += 4) {
            if (p === 0) ctx.moveTo(pathPts[p].x, pathPts[p].y);
            else ctx.lineTo(pathPts[p].x, pathPts[p].y);
          }
          ctx.stroke();

          // End pit danger marker
          var pit = pathPts[pathPts.length - 1];
          ctx.fillStyle = "#000";
          ctx.beginPath(); ctx.arc(pit.x, pit.y, 17, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5; ctx.stroke();
          ctx.font = "15px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🕳️", pit.x, pit.y + 5);

          // Aiming dotted guide line
          ctx.save();
          ctx.strokeStyle = "rgba(253, 230, 138, 0.35)";
          ctx.setLineDash([5, 6]);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(aimAngle) * 155, cy + Math.sin(aimAngle) * 155);
          ctx.stroke();
          ctx.restore();

          // Draw marble chain
          for (var b = 0; b < chain.length; b++) {
            var bp = sampleAt(chain[b].dist);
            drawOrb(bp.x, bp.y, chain[b].c, ORB_R);
          }

          // Draw flying shots
          shots.forEach(function (sh) { drawOrb(sh.x, sh.y, sh.c, ORB_R); });

          // Draw rotating central golden turret
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(aimAngle);
          ctx.fillStyle = "#123421";
          ctx.strokeStyle = "#f4cf6d";
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#d59e2a";
          ctx.fillRect(10, -7, 17, 14);
          ctx.restore();
          // Current orb inside cannon mouth + tiny next orb indicator
          drawOrb(cx + Math.cos(aimAngle) * 15, cy + Math.sin(aimAngle) * 15, curColor, 10);
          drawOrb(cx - Math.cos(aimAngle) * 11, cy - Math.sin(aimAngle) * 11, nextColor, 6);

          // Pop particles
          for (var q = pops.length - 1; q >= 0; q--) {
            var pr = pops[q];
            pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
            if (pr.life <= 0) { pops.splice(q, 1); continue; }
            ctx.globalAlpha = Math.max(0, pr.life * 2.3);
            ctx.fillStyle = pr.c; ctx.beginPath(); ctx.arc(pr.x, pr.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () {
          ended = true;
          if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointermove", updateAim);
          cv.removeEventListener("pointerdown", fireOrb);
        });
        api.runCountdown(st.host, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // EXTRA GAME 2: ⚔️ تقطيع الزيتون الطائر (Olive Ninja Slice — Fruit Ninja!)
    // =========================================================================
    window.ZaitRegisterExtraGame("slice", {
      icon: "⚔️",
      name: "تقطيع الزيتون الطائر",
      desc: "اسحب إصبعك لتقطيع الزيتون الأخضر والذهبي في الهواء وتفادَ القنابل الحمراء!",
      cat: "speed",
      hardTag: "نينجا ⚔️",
      launch: function (api) {
        var diff = api.diff, duration = api.duration, target = api.target;
        var lives = diff === "hard" ? 2 : 3;
        var st = api.createStageShell("تقطيع الزيتون", duration, "الهدف: " + target);
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-slice"></canvas></div>';

        var cv = document.getElementById("og-cv-slice");
        var g = api.setupHiDpiCanvas(cv, 360, 420);
        var ctx = g.ctx, W = g.w, H = g.h;

        var fruits = [], halves = [], trail = [], floats = [];
        var score = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, waveAcc = 0;
        var slicing = false, swipeCombo = 0;
        var waveMs = diff === "hard" ? 780 : (diff === "medium" ? 960 : 1150);
        var bombChance = diff === "hard" ? 0.28 : (diff === "medium" ? 0.22 : 0.14);

        function ptFromEvent(ev) {
          var r = cv.getBoundingClientRect();
          var cx = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
          var cy = (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;
          return { x: ((cx - r.left) / r.width) * W, y: ((cy - r.top) / r.height) * H };
        }

        function handleSliceMove(ev) {
          if (!slicing || !running || api.isPaused() || ended) return;
          var p = ptFromEvent(ev);
          trail.push({ x: p.x, y: p.y, life: 0.16 });
          if (trail.length > 18) trail.shift();

          for (var i = fruits.length - 1; i >= 0; i--) {
            var f = fruits[i];
            if (Math.hypot(f.x - p.x, f.y - p.y) <= f.r + 12) {
              if (f.kind === "bomb") {
                lives--; score = Math.max(0, score - 8);
                st.setExtra("❤️".repeat(Math.max(0, lives)));
                st.setScore("⭐ " + score);
                api.playSfx("bad"); api.haptic(60); st.shake();
                floats.push({ x: f.x, y: f.y, txt: "💥 قنبلة!", col: "#ef4444", life: 0.7 });
                fruits.splice(i, 1);
                if (lives <= 0) {
                  ended = true;
                  api.finish(false, score, "💥 قطّعت القنابل ونفدت محاولاتك!");
                  return;
                }
              } else {
                swipeCombo++;
                var pts = (f.kind === "gold" ? 6 : 2) + (swipeCombo >= 3 ? 3 : 0);
                score += pts;
                st.setScore("⭐ " + score);
                api.playSfx(f.kind === "gold" || swipeCombo >= 3 ? "gold" : "pop");
                api.haptic(14);
                floats.push({ x: f.x, y: f.y, txt: swipeCombo >= 3 ? ("🔥 +" + pts) : ("+" + pts), col: f.kind === "gold" ? "#facc15" : "#4ade80", life: 0.6 });
                // Two sliced halves flying apart
                halves.push({ x: f.x - 6, y: f.y, vx: f.vx - 70, vy: f.vy - 40, col: f.col, r: f.r * 0.7, life: 0.65 });
                halves.push({ x: f.x + 6, y: f.y, vx: f.vx + 70, vy: f.vy - 40, col: f.col, r: f.r * 0.7, life: 0.65 });
                fruits.splice(i, 1);
                if (score >= target) {
                  ended = true;
                  api.finish(true, score);
                  return;
                }
              }
            }
          }
        }

        var onDown = function (e) { slicing = true; swipeCombo = 0; handleSliceMove(e); };
        var onUp = function () { slicing = false; swipeCombo = 0; };
        cv.addEventListener("pointerdown", onDown);
        cv.addEventListener("pointermove", handleSliceMove);
        window.addEventListener("pointerup", onUp);

        function spawnWave() {
          var cnt = diff === "hard" ? (2 + Math.floor(Math.random() * 3)) : (1 + Math.floor(Math.random() * 3));
          for (var i = 0; i < cnt; i++) {
            var r = Math.random();
            var kind = r < bombChance ? "bomb" : (r > 0.8 ? "gold" : "olive");
            var sx = 45 + Math.random() * (W - 90);
            fruits.push({
              x: sx, y: H + 22,
              vx: (W / 2 - sx) * (0.45 + Math.random() * 0.65),
              vy: -(520 + Math.random() * 140),
              kind: kind,
              col: kind === "gold" ? "#facc15" : (kind === "bomb" ? "#dc2626" : "#4ade80"),
              r: kind === "gold" ? 20 : 18,
              rot: Math.random() * 6
            });
          }
        }

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts;
          rem -= dt;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true;
            api.finish(score >= target, score);
            return;
          }

          waveAcc += dt * 1000;
          if (waveAcc >= waveMs) { waveAcc = 0; spawnWave(); }

          var bg = ctx.createLinearGradient(0, 0, 0, H);
          bg.addColorStop(0, "#0b2215"); bg.addColorStop(1, "#183e28");
          ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

          // Update fruits
          for (var i = fruits.length - 1; i >= 0; i--) {
            var f = fruits[i];
            f.vy += 680 * dt;
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.rot += 3.2 * dt;

            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rot);
            ctx.fillStyle = f.col;
            if (f.kind === "bomb") {
              ctx.beginPath(); ctx.arc(0, 0, f.r, 0, Math.PI * 2); ctx.fill();
              ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 2; ctx.stroke();
              ctx.font = "18px sans-serif"; ctx.textAlign = "center"; ctx.fillText("💣", 0, 6);
            } else {
              ctx.beginPath(); ctx.ellipse(0, 0, f.r * 0.82, f.r, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = "rgba(255,255,255,0.45)";
              ctx.beginPath(); ctx.arc(-4, -5, 4, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();

            if (f.y > H + 50) fruits.splice(i, 1);
          }

          // Halves
          for (var h = halves.length - 1; h >= 0; h--) {
            var hv = halves[h];
            hv.vy += 650 * dt; hv.x += hv.vx * dt; hv.y += hv.vy * dt; hv.life -= dt;
            if (hv.life <= 0) { halves.splice(h, 1); continue; }
            ctx.globalAlpha = Math.max(0, hv.life * 1.5);
            ctx.fillStyle = hv.col;
            ctx.beginPath(); ctx.arc(hv.x, hv.y, hv.r, 0, Math.PI); ctx.fill();
            ctx.globalAlpha = 1;
          }

          // Golden blade trail
          for (var t = trail.length - 1; t >= 0; t--) {
            trail[t].life -= dt;
            if (trail[t].life <= 0) trail.splice(t, 1);
          }
          if (trail.length > 1) {
            ctx.strokeStyle = "#fde68a";
            ctx.lineCap = "round";
            for (var k = 1; k < trail.length; k++) {
              ctx.lineWidth = (k / trail.length) * 7;
              ctx.beginPath();
              ctx.moveTo(trail[k - 1].x, trail[k - 1].y);
              ctx.lineTo(trail[k].x, trail[k].y);
              ctx.stroke();
            }
          }

          // Floating texts
          for (var fl = floats.length - 1; fl >= 0; fl--) {
            var ft = floats[fl];
            ft.y -= 55 * dt; ft.life -= dt;
            if (ft.life <= 0) { floats.splice(fl, 1); continue; }
            ctx.globalAlpha = Math.max(0, ft.life * 1.6);
            ctx.fillStyle = ft.col; ctx.font = "900 16px Cairo,sans-serif"; ctx.textAlign = "center";
            ctx.fillText(ft.txt, ft.x, ft.y);
            ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () {
          ended = true;
          if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointerdown", onDown);
          cv.removeEventListener("pointermove", handleSliceMove);
          window.removeEventListener("pointerup", onUp);
        });
        api.runCountdown(st.host, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // EXTRA GAME 3: 🐍 ثعبان مزرعة سيناء (Sinai Farm Snake — Rocks & Gold Olives)
    // =========================================================================
    window.ZaitRegisterExtraGame("snake", {
      icon: "🐍",
      name: "ثعبان مزرعة سيناء",
      desc: "اجمع ثمار الزيتون الأخضر والذهبي وتفادَ الجدران والصخور — بالسحب أو الأسهم!",
      cat: "speed",
      hardTag: "كلاسيكي 🐍",
      launch: function (api) {
        var diff = api.diff, duration = api.duration, target = api.target;
        var st = api.createStageShell("ثعبان سيناء", duration, "الهدف: " + target);
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-snake"></canvas></div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,64px);justify-content:center;gap:6px;margin-top:8px;">' +
            '<div></div><button type="button" class="og-btn og-btn-dark" id="sn-up" style="padding:10px;">⬆️</button><div></div>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn-rt" style="padding:10px;">➡️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn-dn" style="padding:10px;">⬇️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn-lt" style="padding:10px;">⬅️</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-snake");
        var g = api.setupHiDpiCanvas(cv, 360, 360);
        var ctx = g.ctx, COLS = 18, CELL = 20;

        var snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }];
        var dir = { x: 1, y: 0 }, nextDir = { x: 1, y: 0 };
        var rocks = [];
        var rockCount = diff === "hard" ? 8 : (diff === "medium" ? 4 : 0);

        function cellBlocked(x, y) {
          return snake.some(function (s) { return s.x === x && s.y === y; }) ||
            rocks.some(function (r) { return r.x === x && r.y === y; });
        }
        for (var r = 0; r < rockCount; r++) {
          var rx, ry, tries = 0;
          do {
            rx = 1 + Math.floor(Math.random() * (COLS - 2));
            ry = 1 + Math.floor(Math.random() * (COLS - 2));
            tries++;
          } while ((Math.abs(rx - 9) < 3 && Math.abs(ry - 9) < 2) || (cellBlocked(rx, ry) && tries < 40));
          rocks.push({ x: rx, y: ry });
        }

        function placeFood() {
          var fx, fy, guard = 0;
          do {
            fx = Math.floor(Math.random() * COLS);
            fy = Math.floor(Math.random() * COLS);
            guard++;
          } while (cellBlocked(fx, fy) && guard < 120);
          return { x: fx, y: fy, gold: Math.random() > 0.75 };
        }
        var food = placeFood();
        var score = 0, rem = duration, running = false, ended = false;
        var tickMs = diff === "hard" ? 88 : (diff === "medium" ? 115 : 148);

        function setDir(nx, ny) {
          if (nx === -dir.x && ny === -dir.y) return;
          nextDir = { x: nx, y: ny };
        }
        document.getElementById("sn-up").onclick = function () { setDir(0, -1); };
        document.getElementById("sn-dn").onclick = function () { setDir(0, 1); };
        document.getElementById("sn-lt").onclick = function () { setDir(-1, 0); };
        document.getElementById("sn-rt").onclick = function () { setDir(1, 0); };

        var sx = 0, sy = 0;
        cv.addEventListener("pointerdown", function (e) { sx = e.clientX; sy = e.clientY; });
        cv.addEventListener("pointerup", function (e) {
          var dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
          if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : -1, 0);
          else setDir(0, dy > 0 ? 1 : -1);
        });
        var onKey = function (e) {
          if (e.key === "ArrowUp") setDir(0, -1);
          else if (e.key === "ArrowDown") setDir(0, 1);
          else if (e.key === "ArrowLeft") setDir(-1, 0);
          else if (e.key === "ArrowRight") setDir(1, 0);
        };
        window.addEventListener("keydown", onKey);

        function draw() {
          ctx.fillStyle = "#0a1f13"; ctx.fillRect(0, 0, 360, 360);
          ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
          for (var i = 0; i <= COLS; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 360); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(360, i * CELL); ctx.stroke();
          }
          // Rocks
          rocks.forEach(function (rk) {
            ctx.fillStyle = "#57534e";
            ctx.fillRect(rk.x * CELL + 2, rk.y * CELL + 2, CELL - 4, CELL - 4);
            ctx.font = "14px sans-serif"; ctx.textAlign = "center";
            ctx.fillText("🪨", rk.x * CELL + 10, rk.y * CELL + 15);
          });
          // Food
          ctx.fillStyle = food.gold ? "#facc15" : "#4ade80";
          ctx.beginPath(); ctx.arc(food.x * CELL + 10, food.y * CELL + 10, 8, 0, Math.PI * 2); ctx.fill();
          // Snake
          snake.forEach(function (seg, idx) {
            ctx.fillStyle = idx === 0 ? "#f4cf6d" : (idx % 2 === 0 ? "#22c55e" : "#15803d");
            ctx.beginPath();
            ctx.roundRect ? ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 5) : ctx.rect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
            ctx.fill();
          });
        }

        var moveIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          dir = nextDir;
          var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= COLS || cellBlocked(head.x, head.y)) {
            ended = true; clearInterval(moveIv); clearInterval(secIv);
            api.playSfx("bad"); api.haptic(60); st.shake();
            api.finish(false, score, "💥 اصطدم الثعبان بالجدار أو الصخور!");
            return;
          }
          snake.unshift(head);
          if (head.x === food.x && head.y === food.y) {
            score += food.gold ? 3 : 1;
            st.setScore("⭐ " + score);
            api.playSfx(food.gold ? "gold" : "pop"); api.haptic(14);
            if (score >= target) {
              ended = true; clearInterval(moveIv); clearInterval(secIv);
              api.finish(true, score);
              return;
            }
            food = placeFood();
          } else {
            snake.pop();
          }
          draw();
        }, tickMs);

        var secIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          rem -= 0.1;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true; clearInterval(moveIv); clearInterval(secIv);
            api.finish(score >= target, score);
          }
        }, 100);

        draw();
        api.setCleanup(function () { ended = true; clearInterval(moveIv); clearInterval(secIv); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, function () { running = true; });
      }
    });

    // =========================================================================
    // EXTRA GAME 4: 🧱 كاسر براميل المعصرة (Olive Press Breaker — Arkanoid!)
    // =========================================================================
    window.ZaitRegisterExtraGame("breakout", {
      icon: "🧱",
      name: "كاسر براميل المعصرة",
      desc: "كسّر براميل الزيتون المدرّعة بقطرة الذهب والتقط هدايا توسيع المضرب!",
      cat: "speed",
      hardTag: "تحدي 🧱",
      launch: function (api) {
        var diff = api.diff, duration = api.duration, target = api.target;
        var lives = diff === "hard" ? 2 : 3;
        var st = api.createStageShell("كاسر البراميل", duration, "الهدف: " + target);
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-brk"></canvas></div>';

        var cv = document.getElementById("og-cv-brk");
        var g = api.setupHiDpiCanvas(cv, 360, 420);
        var ctx = g.ctx, W = g.w, H = g.h;

        var padW = diff === "hard" ? 68 : (diff === "medium" ? 78 : 90);
        var padX = W / 2, padY = H - 30;
        var baseSpd = diff === "hard" ? 315 : (diff === "medium" ? 265 : 225);
        var ball = { x: W / 2, y: padY - 14, vx: baseSpd * 0.65, vy: -baseSpd * 0.85, r: 8 };
        var bricks = [], powerups = [];
        var rows = diff === "hard" ? 7 : (diff === "medium" ? 6 : 5);
        var cols = 6;
        var bw = (W - 28) / cols, bh = 22;
        var rowColors = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#10b981", "#38bdf8", "#a855f7"];

        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var armored = (diff === "hard" && r < 3) || (diff === "medium" && r < 2);
            bricks.push({ x: 14 + c * bw + 2, y: 34 + r * (bh + 5), w: bw - 4, h: bh, hp: armored ? 2 : 1, col: rowColors[r % rowColors.length] });
          }
        }

        var score = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0;

        function movePad(ev) {
          var rect = cv.getBoundingClientRect();
          var cx = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
          padX = Math.max(padW / 2, Math.min(W - padW / 2, ((cx - rect.left) / rect.width) * W));
        }
        cv.addEventListener("pointermove", movePad);
        cv.addEventListener("pointerdown", movePad);
        cv.addEventListener("touchmove", movePad, { passive: true });

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts;
          rem -= dt;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true;
            api.finish(score >= target, score);
            return;
          }

          ball.x += ball.vx * dt;
          ball.y += ball.vy * dt;
          if (ball.x < ball.r) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.playSfx("tick"); }
          if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); api.playSfx("tick"); }
          if (ball.y < ball.r) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); api.playSfx("tick"); }

          // Paddle bounce
          if (ball.vy > 0 && ball.y + ball.r >= padY && ball.y - ball.r <= padY + 14 && Math.abs(ball.x - padX) <= padW / 2 + ball.r) {
            var hitRel = (ball.x - padX) / (padW / 2);
            var spd = Math.hypot(ball.vx, ball.vy);
            var ang = hitRel * 1.15;
            ball.vx = Math.sin(ang) * spd;
            ball.vy = -Math.cos(ang) * spd;
            ball.y = padY - ball.r - 1;
            api.playSfx("pop"); api.haptic(10);
          }

          // Missed ball
          if (ball.y > H + 18) {
            lives--;
            st.setExtra("❤️".repeat(Math.max(0, lives)));
            api.playSfx("bad"); api.haptic(50); st.shake();
            if (lives <= 0) {
              ended = true;
              api.finish(false, score, "سقطت الكرة ونفدت محاولاتك!");
              return;
            }
            ball.x = padX; ball.y = padY - 16; ball.vx = baseSpd * 0.6; ball.vy = -baseSpd * 0.85;
          }

          // Brick collisions
          for (var i = bricks.length - 1; i >= 0; i--) {
            var bk = bricks[i];
            if (ball.x + ball.r > bk.x && ball.x - ball.r < bk.x + bk.w && ball.y + ball.r > bk.y && ball.y - ball.r < bk.y + bk.h) {
              ball.vy *= -1;
              bk.hp--;
              if (bk.hp <= 0) {
                score++;
                st.setScore("⭐ " + score);
                api.playSfx("gold"); api.haptic(12);
                if (Math.random() < 0.16) powerups.push({ x: bk.x + bk.w / 2, y: bk.y, kind: Math.random() < 0.5 ? "wide" : "pts" });
                bricks.splice(i, 1);
                if (score >= target || bricks.length === 0) {
                  ended = true;
                  api.finish(true, score);
                  return;
                }
              } else {
                api.playSfx("pop");
              }
              break;
            }
          }

          // Draw scene
          ctx.fillStyle = "#081c11"; ctx.fillRect(0, 0, W, H);
          bricks.forEach(function (bk) {
            ctx.fillStyle = bk.col;
            ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
            if (bk.hp > 1) {
              ctx.strokeStyle = "#fde68a"; ctx.lineWidth = 2; ctx.strokeRect(bk.x + 1, bk.y + 1, bk.w - 2, bk.h - 2);
            }
          });

          // Power-ups
          for (var p = powerups.length - 1; p >= 0; p--) {
            var pw = powerups[p];
            pw.y += 140 * dt;
            ctx.font = "18px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(pw.kind === "wide" ? "⚡" : "⭐", pw.x, pw.y);
            if (pw.y >= padY - 6 && pw.y <= padY + 18 && Math.abs(pw.x - padX) <= padW / 2 + 12) {
              if (pw.kind === "wide") padW = Math.min(130, padW + 20);
              else { score += 3; st.setScore("⭐ " + score); }
              api.playSfx("gold");
              powerups.splice(p, 1);
            } else if (pw.y > H + 20) powerups.splice(p, 1);
          }

          // Paddle & Glowing Ball
          var pg = ctx.createLinearGradient(padX - padW / 2, padY, padX + padW / 2, padY);
          pg.addColorStop(0, "#d59e2a"); pg.addColorStop(0.5, "#fde68a"); pg.addColorStop(1, "#d59e2a");
          ctx.fillStyle = pg;
          ctx.fillRect(padX - padW / 2, padY, padW, 12);

          ctx.fillStyle = "#facc15";
          ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
        }

        api.setCleanup(function () {
          ended = true;
          if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointermove", movePad);
          cv.removeEventListener("pointerdown", movePad);
          cv.removeEventListener("touchmove", movePad);
        });
        api.runCountdown(st.host, function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // EXTRA GAME 5: ⚡ حارس الشجرة السريع (Rapid 3x3 Reflex Defense!)
    // =========================================================================
    window.ZaitRegisterExtraGame("reflex", {
      icon: "⚡",
      name: "حارس الشجرة السريع",
      desc: "اختبر سرعة بديهتك! اضغط الزيتون الطازج والذهبي قبل اختفائه وتجنب النيران والقنابل!",
      cat: "speed",
      hardTag: "ردة فعل ⚡",
      launch: function (api) {
        var diff = api.diff, duration = api.duration, target = api.target;
        var lives = diff === "hard" ? 2 : 3;
        var st = api.createStageShell("حارس الشجرة", duration, "الهدف: " + target);
        st.setExtra("❤️".repeat(lives));

        st.host.innerHTML =
          '<div class="og-card"><div id="og-rfx-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:340px;margin:6px auto;">' +
            [0,1,2,3,4,5,6,7,8].map(function (i) {
              return '<button type="button" class="og-rfx-hole" data-i="' + i + '" style="aspect-ratio:1/1;border-radius:18px;border:2px solid rgba(213,158,42,.45);background:linear-gradient(145deg,#0f2d1d,#1a482f);color:#fff;font-size:2.2rem;cursor:pointer;transition:transform .1s;">🌿</button>';
            }).join("") +
          '</div><div style="text-align:center;font-size:.76rem;opacity:.8;margin-top:8px;">🫒 +2 • ✨ +5 • 💣/🔥 تفادَ الضغط عليها!</div></div>';

        var holes = Array.prototype.slice.call(st.host.querySelectorAll(".og-rfx-hole"));
        var stateArr = holes.map(function () { return null; });
        var score = 0, combo = 0, rem = duration, running = false, ended = false;
        var popMs = diff === "hard" ? 440 : (diff === "medium" ? 590 : 760);
        var stayMs = diff === "hard" ? 760 : (diff === "medium" ? 980 : 1280);
        var hazardRate = diff === "hard" ? 0.34 : (diff === "medium" ? 0.25 : 0.17);

        function paintHole(i) {
          var b = holes[i], s = stateArr[i];
          if (!s) { b.textContent = "🌿"; b.style.borderColor = "rgba(213,158,42,.4)"; b.style.background = "linear-gradient(145deg,#0f2d1d,#1a482f)"; }
          else if (s === "olive") { b.textContent = "🫒"; b.style.borderColor = "#4ade80"; b.style.background = "linear-gradient(145deg,#15803d,#166534)"; }
          else if (s === "gold") { b.textContent = "✨"; b.style.borderColor = "#facc15"; b.style.background = "linear-gradient(145deg,#d97706,#92400e)"; }
          else { b.textContent = "🔥"; b.style.borderColor = "#ef4444"; b.style.background = "linear-gradient(145deg,#991b1b,#dc2626)"; }
        }

        holes.forEach(function (btn, idx) {
          btn.onclick = function () {
            if (!running || api.isPaused() || ended) return;
            var s = stateArr[idx];
            if (!s) return;
            stateArr[idx] = null;
            paintHole(idx);
            if (s === "fire") {
              lives--; combo = 0; score = Math.max(0, score - 5);
              st.setExtra("❤️".repeat(Math.max(0, lives)));
              st.setScore("⭐ " + score);
              api.playSfx("bad"); api.haptic(55); st.shake();
              if (lives <= 0) {
                ended = true;
                api.finish(false, score, "🔥 لمست النيران ونفدت محاولاتك!");
              }
            } else {
              combo++;
              var pts = (s === "gold" ? 5 : 2) + (combo >= 5 ? 2 : 0);
              score += pts;
              st.setScore("⭐ " + score);
              api.playSfx(s === "gold" ? "gold" : "pop"); api.haptic(12);
              if (score >= target) {
                ended = true;
                api.finish(true, score);
              }
            }
          };
        });

        var popIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          var empty = [];
          for (var i = 0; i < 9; i++) if (!stateArr[i]) empty.push(i);
          if (!empty.length) return;
          var pick = empty[Math.floor(Math.random() * empty.length)];
          var r = Math.random();
          stateArr[pick] = r < hazardRate ? "fire" : (r > 0.8 ? "gold" : "olive");
          paintHole(pick);
          setTimeout(function () {
            if (ended) return;
            if (stateArr[pick]) { stateArr[pick] = null; paintHole(pick); }
          }, stayMs);
        }, popMs);

        var secIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          rem -= 0.1;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true; clearInterval(popIv); clearInterval(secIv);
            api.finish(score >= target, score);
          }
        }, 100);

        api.setCleanup(function () { ended = true; clearInterval(popIv); clearInterval(secIv); });
        api.runCountdown(st.host, function () { running = true; });
      }
    });
  }

  registerAll();
})();
