/* ============================================================================
   Zait Store Olive Games Pro V97 — Part 2 Extra 7 Stage-Based Games Pack
   100% Compatible with Mobile, Tablet, Laptop & Desktop (Touch + Mouse + Keyboard)
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_EXTRA_V97__) return;
  window.__ZAIT_OLIVE_EXTRA_V97__ = true;

  function bootExtraGames() {
    if (typeof window.ZaitRegisterExtraGame !== "function") {
      setTimeout(bootExtraGames, 140);
      return;
    }

    // =========================================================================
    // 1. 🔮 زوما الزيتون السيناوي — 5 خرائط تتغير كل دور + تكسب عند تصفية كل الكور!
    // =========================================================================
    window.ZaitRegisterExtraGame("zuma", {
      icon: "🔮",
      name: "زوما الزيتون السيناوي",
      desc: "صفِّ جميع كرات الزيتون قبل وصولها للحفرة! 5 مسارات وخرائط تتغير كل دور!",
      cat: "brain",
      hardTag: "5 خرائط 🔮",
      launch: function (api) {
        var stage = api.stage;
        var mapIdx = (stage - 1) % 5;
        var mapNames = ["المسار الحلزوني السيناوي", "طريق الثعبان المتعرج", "قلعة المعصرة المربعة", "مسار الأفق المزدوج", "موجة سيناء السريعة"];
        var duration = Math.max(55, (api.baseTime || 65) + stage * 5);

        var st = api.createStageShell(
          "زوما الزيتون",
          stage,
          duration,
          mapNames[mapIdx],
          "💻 الماوس للتصويب والإطلاق • كليك يمين أو Space لتبديل الكرة • 📱 المس للتصويب"
        );
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-zuma"></canvas></div>' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;flex-wrap:wrap;">' +
            '<span style="font-size:.75rem;font-weight:800;opacity:.88;">🗺️ ' + mapNames[mapIdx] + ' — صفِّ كل الكور للفوز بالدور!</span>' +
            '<button type="button" id="og-zuma-swap" class="og-btn og-btn-dark" style="padding:7px 12px;font-size:.78rem;">🔄 تبديل الكرة (Space)</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-zuma");
        var g = api.setupHiDpiCanvas(cv, 380, 420);
        var ctx = g.ctx, W = g.w, H = g.h;

        // بناء 5 مسارات هندسية مختلفة تماماً وموضع المدفع الأمثل لكل خريطة
        var turret = { x: W / 2, y: H / 2 + 6 };
        var rawPts = [];

        if (mapIdx === 0) {
          // خريطة 1: المسار الحلزوني الكلاسيكي من الخارج للداخل
          turret = { x: W / 2, y: H / 2 + 6 };
          for (var i0 = 0; i0 <= 900; i0++) {
            var u0 = i0 / 900, th0 = u0 * Math.PI * 5.0, rad0 = 172 - u0 * 124;
            rawPts.push({ x: W / 2 + Math.cos(th0) * rad0, y: H / 2 + 6 + Math.sin(th0) * rad0 });
          }
        } else if (mapIdx === 1) {
          // خريطة 2: المسار الثعباني المتعرج (S-Curve) والمدفع بالأسفل
          turret = { x: W / 2, y: H - 52 };
          var ctrl1 = [
            { x: 24, y: 36 }, { x: 348, y: 36 }, { x: 356, y: 112 },
            { x: 34, y: 112 }, { x: 26, y: 192 }, { x: 346, y: 192 },
            { x: 346, y: 274 }, { x: 56, y: 274 }
          ];
          rawPts = buildSmoothPolyline(ctrl1, 70);
        } else if (mapIdx === 2) {
          // خريطة 3: قلعة المعصرة المربعة الملتفة للداخل
          turret = { x: W / 2, y: H / 2 + 8 };
          var ctrl2 = [
            { x: 26, y: 30 }, { x: 354, y: 30 }, { x: 354, y: 386 }, { x: 26, y: 386 },
            { x: 26, y: 84 }, { x: 302, y: 84 }, { x: 302, y: 332 }, { x: 82, y: 332 },
            { x: 82, y: 138 }, { x: 254, y: 138 }
          ];
          rawPts = buildSmoothPolyline(ctrl2, 55);
        } else if (mapIdx === 3) {
          // خريطة 4: مسار القوس المزدوج (Double Arch) والمدفع بالمنتصف السفلي
          turret = { x: W / 2, y: H - 60 };
          for (var i3 = 0; i3 <= 820; i3++) {
            var u3 = i3 / 820;
            var x3 = W / 2 + Math.sin(u3 * Math.PI * 3.1) * (158 - u3 * 45);
            var y3 = 34 + u3 * 265 + Math.cos(u3 * Math.PI * 6.2) * 18;
            rawPts.push({ x: x3, y: y3 });
          }
        } else {
          // خريطة 5: موجة سيناء البيضاوية الحلزونية
          turret = { x: W / 2, y: H / 2 };
          for (var i4 = 0; i4 <= 900; i4++) {
            var u4 = i4 / 900, th4 = -u4 * Math.PI * 4.8;
            var rx4 = 172 - u4 * 116, ry4 = 192 - u4 * 128;
            rawPts.push({ x: W / 2 + Math.cos(th4) * rx4, y: H / 2 + Math.sin(th4) * ry4 });
          }
        }

        function buildSmoothPolyline(ctrl, segsPerEdge) {
          var pts = [];
          for (var a = 0; a < ctrl.length - 1; a++) {
            var p1 = ctrl[a], p2 = ctrl[a + 1];
            for (var s = 0; s < segsPerEdge; s++) {
              var t = s / segsPerEdge;
              pts.push({ x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t });
            }
          }
          pts.push(ctrl[ctrl.length - 1]);
          return pts;
        }

        // حساب جدول الأطوال التراكمية لضمان سرعة ثابتة 100% على كل المسار
        var pathPts = [rawPts[0]], cumDist = [0], totalLen = 0;
        for (var j = 1; j < rawPts.length; j++) {
          var ds = Math.hypot(rawPts[j].x - rawPts[j - 1].x, rawPts[j].y - rawPts[j - 1].y);
          if (ds < 0.01) continue;
          totalLen += ds;
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
          return { x: pathPts[lo].x + (pathPts[hi].x - pathPts[lo].x) * t, y: pathPts[lo].y + (pathPts[hi].y - pathPts[lo].y) * t };
        }

        // ألوان زيتونية مميزة وواضحة (4 ألوان في الأدوار 1–3، ثم 5 ألوان في الأدوار 4+)
        var ORB_TYPES = [
          { fill: "#4ade80", dark: "#166534", label: "🫒", ring: "#bbf7d0" },
          { fill: "#facc15", dark: "#854d0e", label: "✨", ring: "#fef08a" },
          { fill: "#ef4444", dark: "#7f1d1d", label: "🍒", ring: "#fecaca" },
          { fill: "#38bdf8", dark: "#075985", label: "💧", ring: "#bae6fd" },
          { fill: "#a855f7", dark: "#4c1d95", label: "🍇", ring: "#e9d5ff" }
        ];
        var numColors = stage >= 4 ? 5 : 4;
        var ORB_R = 12, SPACING = ORB_R * 2.04;
        var marchSpeed = 24 + stage * 3.8;
        var initCount = Math.min(24, 13 + stage * 2);
        var reserveCount = 10 + stage * 4; // ينتهي الدور بالفوز فقط عند تصفية الكل (chain + reserve = 0)!

        var chain = [];
        function randC() { return Math.floor(Math.random() * numColors); }
        for (var b = 0; b < initCount; b++) {
          var col = (b > 0 && Math.random() < 0.36) ? chain[b - 1].c : randC();
          chain.push({ dist: b * SPACING + 12, c: col });
        }

        var curC = randC(), nextC = randC(), aimAngle = -Math.PI / 2;
        var shots = [], pops = [], running = false, ended = false, raf = null, lastTs = 0, shootCD = 0, rem = duration;

        function totalLeft() { return chain.length + reserveCount; }
        st.setGoal("🔮 متبقي: " + totalLeft() + " كرة");

        function pickPresentColor() {
          if (!chain.length) return randC();
          var set = {};
          chain.forEach(function (it) { set[it.c] = true; });
          var ks = Object.keys(set);
          return Number(ks[Math.floor(Math.random() * ks.length)]);
        }

        function swapBall() {
          if (!running || api.isPaused() || ended) return;
          var t = curC; curC = nextC; nextC = t;
          api.playSfx("pop"); api.haptic(10);
        }
        document.getElementById("og-zuma-swap").onclick = swapBall;

        function getPt(ev) {
          var r = cv.getBoundingClientRect();
          var x = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
          var y = (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;
          return { x: ((x - r.left) / r.width) * W, y: ((y - r.top) / r.height) * H };
        }
        var onAim = function (ev) { var p = getPt(ev); aimAngle = Math.atan2(p.y - turret.y, p.x - turret.x); };
        var onFire = function (ev) {
          if (ev.button === 2) { ev.preventDefault(); swapBall(); return; }
          if (!running || api.isPaused() || ended || shootCD > 0) return;
          var p = getPt(ev);
          if (Math.hypot(p.x - turret.x, p.y - turret.y) < 25) { swapBall(); return; }
          aimAngle = Math.atan2(p.y - turret.y, p.x - turret.x);
          shots.push({
            x: turret.x + Math.cos(aimAngle) * 20,
            y: turret.y + Math.sin(aimAngle) * 20,
            vx: Math.cos(aimAngle) * 510,
            vy: Math.sin(aimAngle) * 510,
            c: curC
          });
          curC = nextC;
          nextC = pickPresentColor();
          shootCD = 0.2;
          api.playSfx("pop"); api.haptic(10);
        };
        var onCtx = function (e) { e.preventDefault(); swapBall(); };
        var onKey = function (e) { if (e.code === "Space") { e.preventDefault(); swapBall(); } };

        cv.addEventListener("pointermove", onAim);
        cv.addEventListener("pointerdown", onFire);
        cv.addEventListener("contextmenu", onCtx);
        window.addEventListener("keydown", onKey);

        function burst(x, y, colHex) {
          for (var i = 0; i < 9; i++) pops.push({ x: x, y: y, vx: (Math.random() - 0.5) * 180, vy: (Math.random() - 0.5) * 180, life: 0.42, c: colHex });
        }

        function enforceSpacing() {
          for (var i = 1; i < chain.length; i++) {
            var minD = chain[i - 1].dist + SPACING;
            if (chain[i].dist < minD) chain[i].dist = minD;
          }
        }

        function checkMatches(idx, depth) {
          if (idx < 0 || idx >= chain.length) return;
          var tc = chain[idx].c, L = idx, R = idx;
          while (L > 0 && chain[L - 1].c === tc && (chain[L].dist - chain[L - 1].dist) <= SPACING * 1.45) L--;
          while (R < chain.length - 1 && chain[R + 1].c === tc && (chain[R + 1].dist - chain[R].dist) <= SPACING * 1.45) R++;
          var run = R - L + 1;
          if (run >= 3) {
            for (var m = L; m <= R; m++) {
              var mp = sampleAt(chain[m].dist);
              burst(mp.x, mp.y, ORB_TYPES[tc].fill);
            }
            chain.splice(L, run);
            api.playSfx(depth > 1 ? "gold" : "pop");
            api.haptic(depth > 1 ? 26 : 15);
            st.setGoal("🔮 متبقي: " + totalLeft() + " كرة");
            if (depth > 1) st.setExtra("🔥 كومبو ×" + depth);

            // تراجع السلسلة وتفجير السلاسل المتتابعة!
            if (L > 0 && L < chain.length && chain[L - 1].c === chain[L].c) {
              var gap = chain[L].dist - chain[L - 1].dist;
              if (gap < SPACING * 4.5) {
                for (var f = L; f < chain.length; f++) chain[f].dist -= (gap - SPACING);
                setTimeout(function () { if (!ended) checkMatches(L, depth + 1); }, 110);
              }
            }

            // شرط الفوز الحقيقي: تصفية كل الكرات في الدور!
            if (chain.length === 0 && reserveCount <= 0) {
              ended = true;
              api.finish(true, "صفّيت كامل سلسلة الكور في " + mapNames[mapIdx] + " (الدور " + stage + ")! 🔮🏆");
            }
          }
        }

        function drawOliveOrb(x, y, cIdx, r) {
          var t = ORB_TYPES[cIdx % ORB_TYPES.length];
          var gr = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.15, x, y, r);
          gr.addColorStop(0, t.ring); gr.addColorStop(0.45, t.fill); gr.addColorStop(1, t.dark);
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 1.4; ctx.stroke();
          // ورقة زيتون صغيرة فوق الكرة لتعزيز الهوية
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.32, r * 0.22, r * 0.34, -0.4, 0, Math.PI * 2); ctx.fill();
        }

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts;
          rem -= dt;
          if (shootCD > 0) shootCD -= dt;
          st.setTime(rem, duration);
          if (rem <= 0) {
            ended = true;
            api.finish(false, "", "انتهى الوقت وتبقّى " + totalLeft() + " كرة على المسار!");
            return;
          }

          if (chain.length > 0) {
            chain[0].dist += marchSpeed * dt;
            for (var i = 1; i < chain.length; i++) {
              if (chain[i].dist - chain[i - 1].dist <= SPACING + 1.5) chain[i].dist = chain[i - 1].dist + SPACING;
              else chain[i].dist += marchSpeed * 0.22 * dt;
            }
            if (reserveCount > 0 && chain[0].dist > SPACING + 6) {
              chain.unshift({ dist: chain[0].dist - SPACING, c: (Math.random() < 0.3 ? chain[0].c : randC()) });
              reserveCount--;
              st.setGoal("🔮 متبقي: " + totalLeft() + " كرة");
            }
            if (chain[chain.length - 1].dist >= totalLen - 6) {
              ended = true;
              api.playSfx("bad"); api.haptic(60); st.shake();
              api.finish(false, "", "🕳️ وصلت سلسلة الزيتون إلى الحفرة في " + mapNames[mapIdx] + "!");
              return;
            }
          } else if (reserveCount > 0) {
            chain.push({ dist: 12, c: randC() });
            reserveCount--;
          } else {
            ended = true;
            api.finish(true, "صفّيت جميع الكور في الدور " + stage + " بنجاح! 🔮🏆");
            return;
          }

          // تصادم الكرات المطلقة مع السلسلة
          for (var s = shots.length - 1; s >= 0; s--) {
            var sh = shots[s];
            sh.x += sh.vx * dt; sh.y += sh.vy * dt;
            if (sh.x < -20 || sh.x > W + 20 || sh.y < -20 || sh.y > H + 20) { shots.splice(s, 1); continue; }
            var hit = -1;
            for (var c = 0; c < chain.length; c++) {
              var cp = sampleAt(chain[c].dist);
              if (Math.hypot(cp.x - sh.x, cp.y - sh.y) <= ORB_R * 1.96) { hit = c; break; }
            }
            if (hit !== -1) {
              var pBef = sampleAt(Math.max(0, chain[hit].dist - SPACING));
              var pAft = sampleAt(Math.min(totalLen, chain[hit].dist + SPACING));
              var ins = Math.hypot(pAft.x - sh.x, pAft.y - sh.y) < Math.hypot(pBef.x - sh.x, pBef.y - sh.y) ? hit + 1 : hit;
              var nd = ins === hit ? chain[hit].dist : chain[hit].dist + SPACING;
              chain.splice(ins, 0, { dist: nd, c: sh.c });
              enforceSpacing();
              shots.splice(s, 1);
              st.setGoal("🔮 متبقي: " + totalLeft() + " كرة");
              checkMatches(ins, 1);
            }
          }

          // خلفية مميزة لكل خريطة
          api.OliveArt.drawTreeCanopy(ctx, W, H, mapIdx);

          // رسم أخدود المسار
          ctx.strokeStyle = "rgba(213, 158, 42, 0.28)";
          ctx.lineWidth = 23; ctx.lineCap = "round"; ctx.lineJoin = "round";
          ctx.beginPath();
          for (var p = 0; p < pathPts.length; p += 3) {
            if (p === 0) ctx.moveTo(pathPts[p].x, pathPts[p].y);
            else ctx.lineTo(pathPts[p].x, pathPts[p].y);
          }
          ctx.stroke();

          // الحفرة (نقطة النهاية)
          var pit = pathPts[pathPts.length - 1];
          ctx.fillStyle = "#050505"; ctx.beginPath(); ctx.arc(pit.x, pit.y, 17, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5; ctx.stroke();

          // شعاع التصويب المنقط
          ctx.save();
          ctx.strokeStyle = "rgba(253, 230, 138, 0.4)"; ctx.setLineDash([5, 6]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(turret.x, turret.y);
          ctx.lineTo(turret.x + Math.cos(aimAngle) * 165, turret.y + Math.sin(aimAngle) * 165);
          ctx.stroke(); ctx.restore();

          // رسم السلسلة والطلقات
          for (var k = 0; k < chain.length; k++) {
            var sp = sampleAt(chain[k].dist);
            drawOliveOrb(sp.x, sp.y, chain[k].c, ORB_R);
          }
          shots.forEach(function (sh) { drawOliveOrb(sh.x, sh.y, sh.c, ORB_R); });

          // رسم مدفع الزيتون الذهبي
          ctx.save();
          ctx.translate(turret.x, turret.y); ctx.rotate(aimAngle);
          ctx.fillStyle = "#102e1d"; ctx.strokeStyle = "#f4cf6d"; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = "#d59e2a"; ctx.fillRect(10, -7, 17, 14);
          ctx.restore();
          drawOliveOrb(turret.x + Math.cos(aimAngle) * 15, turret.y + Math.sin(aimAngle) * 15, curC, 10);
          drawOliveOrb(turret.x - Math.cos(aimAngle) * 11, turret.y - Math.sin(aimAngle) * 11, nextC, 6);

          // شرارات التفجير
          for (var q = pops.length - 1; q >= 0; q--) {
            var pr = pops[q]; pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
            if (pr.life <= 0) { pops.splice(q, 1); continue; }
            ctx.globalAlpha = Math.max(0, pr.life * 2.3);
            ctx.fillStyle = pr.c; ctx.beginPath(); ctx.arc(pr.x, pr.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          }
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointermove", onAim); cv.removeEventListener("pointerdown", onFire);
          cv.removeEventListener("contextmenu", onCtx); window.removeEventListener("keydown", onKey);
        });
        api.runCountdown(st.host, "الدور " + stage + " — " + mapNames[mapIdx], function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // 2. 🧱 كاسر براميل المعصرة — 5 تشكيلات تتغير كل دور + تكسب بتكسير كل البراميل!
    // =========================================================================
    window.ZaitRegisterExtraGame("breakout", {
      icon: "🧱",
      name: "كاسر براميل المعصرة",
      desc: "كسّر جميع براميل الزيتون في كل دور عبر 5 تشكيلات مختلفة وهدايا توسيع المضرب!",
      cat: "speed",
      hardTag: "5 تشكيلات 🧱",
      launch: function (api) {
        var stage = api.stage, formIdx = (stage - 1) % 5;
        var formNames = ["صفوف المعصرة", "هرم سيناء", "الماسة الذهبية", "البوابتين", "القلعة المدرّعة"];
        var duration = Math.max(55, (api.baseTime || 70) + stage * 4);
        var lives = stage >= 5 ? 2 : 3;

        var st = api.createStageShell("كاسر البراميل", stage, duration, formNames[formIdx], "💻 الماوس أو الأسهم (⬅️ ➡️ / A-D) • 📱 اسحب المضرب بإصبعك");
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-brk"></canvas></div>';

        var cv = document.getElementById("og-cv-brk");
        var g = api.setupHiDpiCanvas(cv, 380, 420);
        var ctx = g.ctx, W = g.w, H = g.h;

        var padW = Math.max(60, 94 - stage * 3), padX = W / 2, padY = H - 30;
        var baseSpd = 235 + stage * 22;
        var balls = [{ x: W / 2, y: padY - 14, vx: baseSpd * 0.58, vy: -baseSpd * 0.82, r: 8 }];
        var bricks = [], powerups = [], keys = { l: false, r: false };
        var cols = 7, rows = Math.min(7, 4 + Math.floor(stage / 2));
        var bw = (W - 28) / cols, bh = 22;
        var rowCols = ["#dc2626", "#ea580c", "#d97706", "#65a30d", "#16a34a", "#0284c7", "#7c3aed"];

        // توليد 5 تشكيلات براميل مختلفة حسب الدور
        for (var r = 0; r < rows; r++) {
          for (var c = 0; c < cols; c++) {
            var keep = true;
            if (formIdx === 1) keep = Math.abs(c - 3) <= r + 1; // هرم
            else if (formIdx === 2) keep = Math.abs(c - 3) + Math.abs(r - Math.floor(rows / 2)) <= 3; // ماسة
            else if (formIdx === 3) keep = c !== 3; // بوابتين
            else if (formIdx === 4) keep = (r + c) % 2 === 0 || r === 0 || r === rows - 1; // قلعة
            if (!keep) continue;
            var hp = (stage >= 3 && r < 2) ? (stage >= 6 && r === 0 ? 3 : 2) : 1;
            bricks.push({ x: 14 + c * bw + 2, y: 36 + r * (bh + 5), w: bw - 4, h: bh, hp: hp, maxHp: hp, col: rowCols[r % rowCols.length] });
          }
        }
        st.setGoal("🧱 متبقي: " + bricks.length + " برميل");

        var rem = duration, running = false, ended = false, raf = null, lastTs = 0;
        var movePad = function (ev) {
          var rect = cv.getBoundingClientRect();
          var cx = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
          padX = Math.max(padW / 2, Math.min(W - padW / 2, ((cx - rect.left) / rect.width) * W));
        };
        var onKD = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = true; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = true; };
        var onKU = function (e) { if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.l = false; if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.r = false; };
        cv.addEventListener("pointermove", movePad); cv.addEventListener("pointerdown", movePad); cv.addEventListener("touchmove", movePad, { passive: true });
        window.addEventListener("keydown", onKD); window.addEventListener("keyup", onKU);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts;
          if (keys.l) padX = Math.max(padW / 2, padX - 330 * dt);
          if (keys.r) padX = Math.min(W - padW / 2, padX + 330 * dt);

          rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت وتبقّى " + bricks.length + " برميل!"); return; }

          for (var bi = balls.length - 1; bi >= 0; bi--) {
            var b = balls[bi];
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx); api.playSfx("tick"); }
            if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx); api.playSfx("tick"); }
            if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy); api.playSfx("tick"); }

            if (b.vy > 0 && b.y + b.r >= padY && b.y - b.r <= padY + 14 && Math.abs(b.x - padX) <= padW / 2 + b.r) {
              var rel = (b.x - padX) / (padW / 2), spd = Math.hypot(b.vx, b.vy), ang = rel * 1.15;
              b.vx = Math.sin(ang) * spd; b.vy = -Math.cos(ang) * spd; b.y = padY - b.r - 1;
              api.playSfx("pop"); api.haptic(10);
            }

            if (b.y > H + 18) {
              balls.splice(bi, 1);
              if (balls.length === 0) {
                lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
                api.playSfx("bad"); api.haptic(50); st.shake();
                if (lives <= 0) { ended = true; api.finish(false, "", "سقطت قطرة الذهب ونفدت محاولاتك!"); return; }
                balls.push({ x: padX, y: padY - 16, vx: baseSpd * 0.55, vy: -baseSpd * 0.84, r: 8 });
              }
              continue;
            }

            for (var i = bricks.length - 1; i >= 0; i--) {
              var bk = bricks[i];
              if (b.x + b.r > bk.x && b.x - b.r < bk.x + bk.w && b.y + b.r > bk.y && b.y - b.r < bk.y + bk.h) {
                b.vy *= -1; bk.hp--;
                if (bk.hp <= 0) {
                  api.playSfx("gold"); api.haptic(12);
                  if (Math.random() < 0.2) {
                    var rk = Math.random();
                    powerups.push({ x: bk.x + bk.w / 2, y: bk.y, kind: rk < 0.45 ? "wide" : (rk < 0.8 ? "multi" : "heart") });
                  }
                  bricks.splice(i, 1);
                  st.setGoal("🧱 متبقي: " + bricks.length + " برميل");
                  if (bricks.length === 0) {
                    ended = true;
                    api.finish(true, "كسّرت جميع براميل (" + formNames[formIdx] + ") في الدور " + stage + "! 🧱🏆");
                    return;
                  }
                } else api.playSfx("pop");
                break;
              }
            }
          }

          // الرسم
          api.OliveArt.drawTreeCanopy(ctx, W, H, formIdx);
          bricks.forEach(function (bk) {
            ctx.fillStyle = bk.col; ctx.fillRect(bk.x, bk.y, bk.w, bk.h);
            ctx.strokeStyle = bk.hp > 1 ? "#fde68a" : "rgba(0,0,0,0.35)";
            ctx.lineWidth = bk.hp > 1 ? 2.2 : 1;
            ctx.strokeRect(bk.x + 1, bk.y + 1, bk.w - 2, bk.h - 2);
            if (bk.hp > 1) {
              ctx.fillStyle = "#fff"; ctx.font = "900 11px Cairo,sans-serif"; ctx.textAlign = "center";
              ctx.fillText(String(bk.hp), bk.x + bk.w / 2, bk.y + 15);
            }
          });

          for (var p = powerups.length - 1; p >= 0; p--) {
            var pw = powerups[p]; pw.y += 145 * dt;
            ctx.font = "18px sans-serif"; ctx.textAlign = "center";
            ctx.fillText(pw.kind === "wide" ? "⚡" : (pw.kind === "multi" ? "🔥" : "❤️"), pw.x, pw.y);
            if (pw.y >= padY - 6 && pw.y <= padY + 18 && Math.abs(pw.x - padX) <= padW / 2 + 14) {
              if (pw.kind === "wide") padW = Math.min(138, padW + 22);
              else if (pw.kind === "heart") { lives = Math.min(4, lives + 1); st.setExtra("❤️".repeat(lives)); }
              else if (balls.length < 3) balls.push({ x: padX, y: padY - 14, vx: -baseSpd * 0.6, vy: -baseSpd * 0.8, r: 8 });
              api.playSfx("gold"); powerups.splice(p, 1);
            } else if (pw.y > H + 20) powerups.splice(p, 1);
          }

          var pg = ctx.createLinearGradient(padX - padW / 2, padY, padX + padW / 2, padY);
          pg.addColorStop(0, "#b45309"); pg.addColorStop(0.5, "#fde68a"); pg.addColorStop(1, "#b45309");
          ctx.fillStyle = pg; ctx.fillRect(padX - padW / 2, padY, padW, 12);
          balls.forEach(function (b) {
            ctx.fillStyle = "#facc15"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
          });
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointermove", movePad); cv.removeEventListener("pointerdown", movePad); cv.removeEventListener("touchmove", movePad);
          window.removeEventListener("keydown", onKD); window.removeEventListener("keyup", onKU);
        });
        api.runCountdown(st.host, "الدور " + stage + " — " + formNames[formIdx], function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // 3. 🔧 توصيل أنابيب المعصرة (لعبة ألغاز جديدة 100% — مضمونة الحل لكل دور!)
    // =========================================================================
    window.ZaitRegisterExtraGame("pipes", {
      icon: "🔧",
      name: "توصيل أنابيب المعصرة",
      desc: "دوّر الأنابيب لتوصيل زيت الزيتون البكر من المعصرة إلى الزجاجة قبل نفاد الوقت!",
      cat: "brain",
      hardTag: "جديد 🔧",
      launch: function (api) {
        var stage = api.stage;
        var N = stage <= 2 ? 4 : (stage <= 6 ? 5 : 6); // 4x4 -> 5x5 -> 6x6
        var duration = Math.max(32, (api.baseTime || 50) + (N - 4) * 14 - stage * 2);
        var st = api.createStageShell("أنابيب المعصرة", stage, duration, "وصّل الزيت للزجاجة 🏺", "اضغط على أي أنبوب لتدويره 90° وتوصيل خط الزيت من 🫒 إلى 🏺");
        st.setExtra("الشبكة " + N + "×" + N);

        // اتجاهات: 0=أعلى، 1=يمين، 2=أسفل، 3=يسار
        var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1], OPP = [2, 3, 0, 1];

        // 1. توليد مسار صحيح مضمون 100% من (0,0) إلى (N-1,N-1)
        function buildGuaranteedPath() {
          var vis = [], path = [];
          for (var r = 0; r < N; r++) { vis.push([]); for (var c = 0; c < N; c++) vis[r].push(false); }
          function dfs(r, c) {
            vis[r][c] = true; path.push([r, c]);
            if (r === N - 1 && c === N - 1) return true;
            var dirs = [0, 1, 2, 3].sort(function () { return Math.random() - 0.5; });
            // تفضيل التقدم نحو الأسفل واليمين
            dirs.sort(function (a, b) { return ((a === 1 || a === 2) ? -0.35 : 0.35) + (Math.random() - 0.5); });
            for (var i = 0; i < dirs.length; i++) {
              var nr = r + DR[dirs[i]], nc = c + DC[dirs[i]];
              if (nr >= 0 && nr < N && nc >= 0 && nc < N && !vis[nr][nc]) {
                if (dfs(nr, nc)) return true;
              }
            }
            path.pop();
            return false;
          }
          dfs(0, 0);
          return path;
        }

        var solPath = buildGuaranteedPath();
        var grid = [];
        for (var r = 0; r < N; r++) {
          grid.push([]);
          for (var c = 0; c < N; c++) {
            // قطع عشوائية مضللة خارج المسار: مستقيم [0,2] أو زاوية [0,1] أو ثلاثي [0,1,2]
            var kind = Math.random() < 0.4 ? "straight" : (Math.random() < 0.85 ? "corner" : "tee");
            var baseCon = kind === "straight" ? [0, 2] : (kind === "corner" ? [0, 1] : [0, 1, 2]);
            grid[r].push({ base: baseCon, rot: Math.floor(Math.random() * 4), wet: false });
          }
        }

        // وضع القطع الدقيقة على طول المسار المضمون ثم تدويرها عشوائياً
        for (var p = 0; p < solPath.length; p++) {
          var cr = solPath[p][0], cc = solPath[p][1];
          var needed = [];
          if (p === 0) needed.push(3); // مدخل من اليسار (المعصرة)
          else {
            var pr = solPath[p - 1][0], pc = solPath[p - 1][1];
            for (var d1 = 0; d1 < 4; d1++) if (cr + DR[d1] === pr && cc + DC[d1] === pc) needed.push(d1);
          }
          if (p === solPath.length - 1) needed.push(1); // مخرج لليمين (الزجاجة)
          else {
            var nr = solPath[p + 1][0], nc = solPath[p + 1][1];
            for (var d2 = 0; d2 < 4; d2++) if (cr + DR[d2] === nr && cc + DC[d2] === nc) needed.push(d2);
          }
          grid[cr][cc] = { base: needed, rot: 1 + Math.floor(Math.random() * 3), wet: false };
        }

        function getCellDirs(cell) {
          return cell.base.map(function (d) { return (d + cell.rot) % 4; });
        }

        function checkFlow() {
          for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) grid[r][c].wet = false;
          var startDirs = getCellDirs(grid[0][0]);
          if (startDirs.indexOf(3) === -1) return false;
          var q = [[0, 0]];
          grid[0][0].wet = true;
          while (q.length) {
            var cur = q.shift(), cr = cur[0], cc = cur[1];
            var dirs = getCellDirs(grid[cr][cc]);
            for (var i = 0; i < dirs.length; i++) {
              var d = dirs[i], nr = cr + DR[d], nc = cc + DC[d];
              if (nr >= 0 && nr < N && nc >= 0 && nc < N && !grid[nr][nc].wet) {
                if (getCellDirs(grid[nr][nc]).indexOf(OPP[d]) > -1) {
                  grid[nr][nc].wet = true;
                  q.push([nr, nc]);
                }
              }
            }
          }
          return grid[N - 1][N - 1].wet && getCellDirs(grid[N - 1][N - 1]).indexOf(1) > -1;
        }

        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-pipes"></canvas></div>';
        var cv = document.getElementById("og-cv-pipes");
        var g = api.setupHiDpiCanvas(cv, 380, 380);
        var ctx = g.ctx, W = g.w, H = g.h;
        var pad = 28, cellSz = (W - pad * 2) / N;
        var rem = duration, ended = false;

        function drawPipes() {
          ctx.fillStyle = "#0a1f13"; ctx.fillRect(0, 0, W, H);
          // مؤشرا البداية (المعصرة) والنهاية (الزجاجة)
          ctx.font = "20px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("🫒", 14, pad + cellSz / 2 + 7);
          ctx.fillText("🏺", W - 14, pad + (N - 0.5) * cellSz + 7);

          for (var r = 0; r < N; r++) {
            for (var c = 0; c < N; c++) {
              var x = pad + c * cellSz, y = pad + r * cellSz;
              var cx = x + cellSz / 2, cy = y + cellSz / 2;
              var cell = grid[r][c];
              ctx.fillStyle = cell.wet ? "rgba(213,158,42,0.16)" : "rgba(255,255,255,0.05)";
              ctx.fillRect(x + 2, y + 2, cellSz - 4, cellSz - 4);
              ctx.strokeStyle = cell.wet ? "#facc15" : "rgba(255,255,255,0.12)";
              ctx.lineWidth = 1.4;
              ctx.strokeRect(x + 2, y + 2, cellSz - 4, cellSz - 4);

              var dirs = getCellDirs(cell);
              ctx.strokeStyle = cell.wet ? "#facc15" : "#64748b";
              ctx.lineWidth = Math.max(9, cellSz * 0.22);
              ctx.lineCap = "round";
              dirs.forEach(function (d) {
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + DC[d] * (cellSz / 2 - 2), cy + DR[d] * (cellSz / 2 - 2));
                ctx.stroke();
              });
              // قلب الأنبوب الداخلي
              ctx.fillStyle = cell.wet ? "#fef08a" : "#94a3b8";
              ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, cellSz * 0.1), 0, Math.PI * 2); ctx.fill();
            }
          }
        }

        function onTapPipe(ev) {
          if (ended || api.isPaused()) return;
          var rect = cv.getBoundingClientRect();
          var x = ((ev.clientX - rect.left) / rect.width) * W;
          var y = ((ev.clientY - rect.top) / rect.height) * H;
          var c = Math.floor((x - pad) / cellSz), r = Math.floor((y - pad) / cellSz);
          if (r < 0 || r >= N || c < 0 || c >= N) return;
          grid[r][c].rot = (grid[r][c].rot + 1) % 4;
          api.playSfx("pop"); api.haptic(10);
          var won = checkFlow();
          drawPipes();
          if (won) {
            ended = true; clearInterval(iv);
            api.playSfx("gold");
            setTimeout(function () {
              api.finish(true, "تدفق زيت الشجرة المباركة بنجاح من المعصرة للزجاجة في الدور " + stage + "! 🔧🏺");
            }, 350);
          }
        }
        cv.addEventListener("pointerdown", onTapPipe);

        checkFlow();
        drawPipes();
        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت قبل إتمام توصيل أنابيب المعصرة!"); }
        }, 100);
        api.setCleanup(function () { ended = true; clearInterval(iv); cv.removeEventListener("pointerdown", onTapPipe); });
      }
    });

    // =========================================================================
    // 4. ⚔️ تقطيع الزيتون الطائر (REAL VECTOR OLIVES + QUOTA PER STAGE!)
    // =========================================================================
    window.ZaitRegisterExtraGame("slice", {
      icon: "⚔️",
      name: "تقطيع الزيتون الطائر",
      desc: "اسحب بسيف ذهبي لتقطيع ثمار الزيتون الحقيقية في الهواء وتفادَ القنابل!",
      cat: "speed",
      hardTag: "نينجا ⚔️",
      launch: function (api) {
        var stage = api.stage;
        var quota = 16 + stage * 6;
        var duration = Math.max(24, (api.baseTime || 30) + Math.min(6, stage));
        var lives = stage >= 5 ? 2 : 3;
        var st = api.createStageShell("تقطيع الزيتون", stage, duration, "قطّع 0/" + quota + " زيتونة", "💻 اسحب بالماوس مع الضغط • 📱 اسحب بإصبعك لتقطيع الزيتون وتجنب القنابل!");
        st.setExtra("❤️".repeat(lives));
        st.host.innerHTML = '<div class="og-canvas-wrap"><canvas id="og-cv-slice"></canvas></div>';

        var cv = document.getElementById("og-cv-slice");
        var g = api.setupHiDpiCanvas(cv, 380, 420);
        var ctx = g.ctx, W = g.w, H = g.h;
        var fruits = [], halves = [], trail = [], sliced = 0, rem = duration, running = false, ended = false, raf = null, lastTs = 0, acc = 0, down = false;
        var waveMs = Math.max(620, 1140 - stage * 58), bombRate = Math.min(0.35, 0.14 + stage * 0.025);

        function ptOf(ev) {
          var r = cv.getBoundingClientRect();
          var cx = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
          var cy = (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;
          return { x: ((cx - r.left) / r.width) * W, y: ((cy - r.top) / r.height) * H };
        }
        function onMove(ev) {
          if (!down || !running || api.isPaused() || ended) return;
          var p = ptOf(ev);
          trail.push({ x: p.x, y: p.y, life: 0.16 });
          if (trail.length > 16) trail.shift();
          for (var i = fruits.length - 1; i >= 0; i--) {
            var f = fruits[i];
            if (Math.hypot(f.x - p.x, f.y - p.y) <= f.r + 12) {
              if (f.kind === "bomb") {
                lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
                api.playSfx("bad"); api.haptic(60); st.shake(); fruits.splice(i, 1);
                if (lives <= 0) { ended = true; api.finish(false, "", "💥 قطّعت القنابل ونفدت محاولاتك!"); return; }
              } else {
                sliced += f.kind === "gold" ? 2 : 1;
                st.setGoal("⚔️ " + sliced + "/" + quota);
                api.playSfx(f.kind === "gold" ? "gold" : "pop"); api.haptic(12);
                var cHex = f.kind === "gold" ? "#facc15" : (f.kind === "black" ? "#581c87" : "#65a30d");
                halves.push({ x: f.x - 6, y: f.y, vx: f.vx - 70, vy: f.vy - 30, col: cHex, r: f.r * 0.72, life: 0.55 });
                halves.push({ x: f.x + 6, y: f.y, vx: f.vx + 70, vy: f.vy - 30, col: cHex, r: f.r * 0.72, life: 0.55 });
                fruits.splice(i, 1);
                if (sliced >= quota) { ended = true; api.finish(true, "قطّعت " + sliced + " ثمرة زيتون سيناوي في الدور " + stage + "! ⚔️🫒"); return; }
              }
            }
          }
        }
        var onDown = function (e) { down = true; onMove(e); };
        var onUp = function () { down = false; };
        cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);

        function loop(ts) {
          if (ended) return;
          raf = requestAnimationFrame(loop);
          if (!running || api.isPaused()) { lastTs = ts; return; }
          var dt = Math.min(0.04, (ts - lastTs) / 1000 || 0.016);
          lastTs = ts; rem -= dt; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; api.finish(false, "", "انتهى الوقت عند " + sliced + "/" + quota + " ثمرة!"); return; }

          acc += dt * 1000;
          if (acc >= waveMs) {
            acc = 0;
            var cnt = 1 + Math.floor(Math.random() * Math.min(4, 2 + Math.floor(stage / 2)));
            for (var k = 0; k < cnt; k++) {
              var r = Math.random();
              var kind = r < bombRate ? "bomb" : (r > 0.82 ? "gold" : (r > 0.62 ? "black" : "green"));
              var sx = 45 + Math.random() * (W - 90);
              fruits.push({ x: sx, y: H + 22, vx: (W / 2 - sx) * (0.45 + Math.random() * 0.6), vy: -(540 + Math.random() * 140), kind: kind, r: kind === "gold" ? 19 : 17 });
            }
          }

          api.OliveArt.drawTreeCanopy(ctx, W, H, stage);
          for (var i = fruits.length - 1; i >= 0; i--) {
            var f = fruits[i]; f.vy += 680 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
            if (f.kind === "bomb") api.OliveArt.drawHazard(ctx, f.x, f.y, f.r, "bomb");
            else api.OliveArt.drawOlive(ctx, f.x, f.y, f.r, f.kind);
            if (f.y > H + 50) fruits.splice(i, 1);
          }
          for (var h = halves.length - 1; h >= 0; h--) {
            var hv = halves[h]; hv.vy += 640 * dt; hv.x += hv.vx * dt; hv.y += hv.vy * dt; hv.life -= dt;
            if (hv.life <= 0) { halves.splice(h, 1); continue; }
            ctx.globalAlpha = Math.max(0, hv.life * 1.7); ctx.fillStyle = hv.col;
            ctx.beginPath(); ctx.arc(hv.x, hv.y, hv.r, 0, Math.PI); ctx.fill(); ctx.globalAlpha = 1;
          }
          for (var t = trail.length - 1; t >= 0; t--) { trail[t].life -= dt; if (trail[t].life <= 0) trail.splice(t, 1); }
          if (trail.length > 1) {
            ctx.strokeStyle = "#fde68a"; ctx.lineCap = "round";
            for (var q = 1; q < trail.length; q++) {
              ctx.lineWidth = (q / trail.length) * 7;
              ctx.beginPath(); ctx.moveTo(trail[q - 1].x, trail[q - 1].y); ctx.lineTo(trail[q].x, trail[q].y); ctx.stroke();
            }
          }
        }

        api.setCleanup(function () {
          ended = true; if (raf) cancelAnimationFrame(raf);
          cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp);
        });
        api.runCountdown(st.host, "الدور " + stage + " — قطّع " + quota + " ثمرة زيتون!", function () { running = true; lastTs = performance.now(); raf = requestAnimationFrame(loop); });
      }
    });

    // =========================================================================
    // 5. 🐍 ثعبان مزرعة سيناء — 5 متاهات تتغير كل دور + زيتون حقيقي!
    // =========================================================================
    window.ZaitRegisterExtraGame("snake", {
      icon: "🐍",
      name: "ثعبان مزرعة سيناء",
      desc: "اجمع محصول الزيتون عبر 5 متاهات مختلفة! يعمل بالأسهم وWASD والسحب!",
      cat: "speed",
      hardTag: "5 متاهات 🐍",
      launch: function (api) {
        var stage = api.stage, mazeIdx = (stage - 1) % 5;
        var mazeNames = ["المزرعة المفتوحة", "صخور الزوايا", "بوابة المعصرة", "الممر المزدوج", "المتاهة السيناوية"];
        var quota = 9 + stage * 3;
        var duration = Math.max(40, (api.baseTime || 55) + stage * 3);
        var st = api.createStageShell("ثعبان سيناء", stage, duration, "0/" + quota + " زيتونة", "💻 الأسهم أو WASD • 📱 اسحب على الشاشة أو استخدم الأزرار");
        st.setExtra("🗺️ " + mazeNames[mazeIdx]);
        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-snake"></canvas></div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,62px);justify-content:center;gap:6px;margin-top:8px;">' +
            '<div></div><button type="button" class="og-btn og-btn-dark" id="sn-u" style="padding:9px;">⬆️</button><div></div>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn-r" style="padding:9px;">➡️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn-d" style="padding:9px;">⬇️</button>' +
            '<button type="button" class="og-btn og-btn-dark" id="sn-l" style="padding:9px;">⬅️</button>' +
          '</div>';

        var cv = document.getElementById("og-cv-snake");
        var g = api.setupHiDpiCanvas(cv, 360, 360);
        var ctx = g.ctx, COLS = 18, CELL = 20;
        var snake = [{ x: 4, y: 9 }, { x: 3, y: 9 }, { x: 2, y: 9 }], dir = { x: 1, y: 0 }, nextDir = { x: 1, y: 0 };
        var rocks = [];

        // 5 خرائط صخور مختلفة تماماً لكل دور
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
        function placeOlive() {
          var fx, fy, t = 0;
          do { fx = Math.floor(Math.random() * COLS); fy = Math.floor(Math.random() * COLS); t++; } while (blocked(fx, fy) && t < 150);
          return { x: fx, y: fy, gold: Math.random() > 0.76 };
        }
        var food = placeOlive(), eaten = 0, rem = duration, running = false, ended = false;
        var tickMs = Math.max(76, 148 - stage * 7);

        function setD(nx, ny) { if (nx === -dir.x && ny === -dir.y) return; nextDir = { x: nx, y: ny }; }
        document.getElementById("sn-u").onclick = function () { setD(0, -1); };
        document.getElementById("sn-d").onclick = function () { setD(0, 1); };
        document.getElementById("sn-l").onclick = function () { setD(-1, 0); };
        document.getElementById("sn-r").onclick = function () { setD(1, 0); };
        var sx = 0, sy = 0;
        cv.addEventListener("pointerdown", function (e) { sx = e.clientX; sy = e.clientY; });
        cv.addEventListener("pointerup", function (e) {
          var dx = e.clientX - sx, dy = e.clientY - sy;
          if (Math.abs(dx) < 16 && Math.abs(dy) < 16) return;
          if (Math.abs(dx) > Math.abs(dy)) setD(dx > 0 ? 1 : -1, 0); else setD(0, dy > 0 ? 1 : -1);
        });
        var onKey = function (e) {
          if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); setD(0, -1); }
          else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); setD(0, 1); }
          else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); setD(-1, 0); }
          else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); setD(1, 0); }
        };
        window.addEventListener("keydown", onKey);

        function draw() {
          ctx.fillStyle = "#0a1f13"; ctx.fillRect(0, 0, 360, 360);
          ctx.strokeStyle = "rgba(255,255,255,0.04)";
          for (var i = 0; i <= COLS; i++) {
            ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 360); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(360, i * CELL); ctx.stroke();
          }
          rocks.forEach(function (rk) { api.OliveArt.drawHazard(ctx, rk.x * CELL + 10, rk.y * CELL + 10, 9, "stone"); });
          api.OliveArt.drawOlive(ctx, food.x * CELL + 10, food.y * CELL + 10, 9, food.gold ? "gold" : "green");
          snake.forEach(function (sg, idx) {
            ctx.fillStyle = idx === 0 ? "#f4cf6d" : (idx % 2 === 0 ? "#22c55e" : "#15803d");
            ctx.fillRect(sg.x * CELL + 1, sg.y * CELL + 1, CELL - 2, CELL - 2);
          });
        }

        var mIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          dir = nextDir;
          var hd = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          if (hd.x < 0 || hd.x >= COLS || hd.y < 0 || hd.y >= COLS || blocked(hd.x, hd.y)) {
            ended = true; clearInterval(mIv); clearInterval(sIv);
            api.playSfx("bad"); api.haptic(60); st.shake();
            api.finish(false, "", "💥 اصطدم الثعبان بالجدار أو الصخور في " + mazeNames[mazeIdx] + "!");
            return;
          }
          snake.unshift(hd);
          if (hd.x === food.x && hd.y === food.y) {
            eaten += food.gold ? 2 : 1;
            st.setGoal("🫒 " + eaten + "/" + quota);
            api.playSfx(food.gold ? "gold" : "pop"); api.haptic(14);
            if (eaten >= quota) { ended = true; clearInterval(mIv); clearInterval(sIv); api.finish(true, "جمعت محصول " + mazeNames[mazeIdx] + " (" + eaten + " ثمرة)! 🐍🫒"); return; }
            food = placeOlive();
          } else snake.pop();
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
    // 6. 🫧 مطابقة قطرات الذهب (مهمة جمع زيتون وقطرات في حركات محددة + جاذبية!)
    // =========================================================================
    window.ZaitRegisterExtraGame("match", {
      icon: "🫧",
      name: "مطابقة قطرات الذهب",
      desc: "أكمل مهمة الدور بجمع الزيتون وقطرات الذهب خلال عدد الحركات المحدد!",
      cat: "brain",
      hardTag: "مهام 🫧",
      launch: function (api) {
        var stage = api.stage;
        var R = 6, C = 6;
        var types = stage >= 4 ? ["🫒", "💧", "🌿", "🍯", "🏺"] : ["🫒", "💧", "🌿", "🍯"];
        var needOlives = 10 + stage * 4, needDrops = 8 + stage * 3;
        var movesLeft = 18 + Math.min(8, stage);
        var duration = Math.max(32, (api.baseTime || 42) + stage * 3);
        var gotO = 0, gotD = 0, rem = duration, ended = false;

        var st = api.createStageShell("مطابقة القطرات", stage, duration, "🫒 0/" + needOlives + " • 💧 0/" + needDrops, "اضغط أي 2+ رموز متجاورة متشابهة — احذر نفاد الحركات!");
        st.setExtra("🎯 الحركات: " + movesLeft);

        var grid = [];
        for (var r = 0; r < R; r++) {
          grid.push([]);
          for (var c = 0; c < C; c++) grid[r].push(types[Math.floor(Math.random() * types.length)]);
        }

        function applyGravity() {
          for (var c = 0; c < C; c++) {
            var colArr = [];
            for (var r = R - 1; r >= 0; r--) if (grid[r][c]) colArr.push(grid[r][c]);
            while (colArr.length < R) colArr.push(types[Math.floor(Math.random() * types.length)]);
            for (var r2 = R - 1, idx = 0; r2 >= 0; r2--, idx++) grid[r2][c] = colArr[idx];
          }
        }

        function renderBoard() {
          var h = '<div class="og-card"><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-width:390px;margin:0 auto;">';
          for (var r = 0; r < R; r++) {
            for (var c = 0; c < C; c++) {
              h += '<button type="button" class="og-m-btn" data-r="' + r + '" data-c="' + c + '" style="aspect-ratio:1/1;border-radius:11px;border:1.5px solid rgba(213,158,42,.38);background:var(--panel-bg,#fff);font-size:1.45rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">' + grid[r][c] + '</button>';
            }
          }
          st.host.innerHTML = h + '</div></div>';
          st.host.querySelectorAll(".og-m-btn").forEach(function (b) {
            b.onclick = function () {
              if (ended || api.isPaused()) return;
              var sr = Number(b.getAttribute("data-r")), sc = Number(b.getAttribute("data-c"));
              var sym = grid[sr][sc], vis = {}, q = [[sr, sc]], grp = [];
              vis[sr + "," + sc] = true;
              while (q.length) {
                var cur = q.shift(); grp.push(cur);
                [[-1,0],[1,0],[0,-1],[0,1]].forEach(function (d) {
                  var nr = cur[0] + d[0], nc = cur[1] + d[1], k = nr + "," + nc;
                  if (nr >= 0 && nr < R && nc >= 0 && nc < C && !vis[k] && grid[nr][nc] === sym) { vis[k] = true; q.push([nr, nc]); }
                });
              }
              if (grp.length < 2) { api.playSfx("bad"); return; }
              movesLeft--;
              if (sym === "🫒") gotO += grp.length;
              if (sym === "💧") gotD += grp.length;
              grp.forEach(function (pt) { grid[pt[0]][pt[1]] = null; });
              applyGravity();
              api.playSfx(grp.length >= 4 ? "gold" : "pop"); api.haptic(14);
              st.setGoal("🫒 " + Math.min(gotO, needOlives) + "/" + needOlives + " • 💧 " + Math.min(gotD, needDrops) + "/" + needDrops);
              st.setExtra("🎯 الحركات: " + movesLeft);
              if (gotO >= needOlives && gotD >= needDrops) {
                ended = true; clearInterval(iv);
                api.finish(true, "أكملت مهمة الدور " + stage + " وتبقّت لك " + movesLeft + " حركة! 🫧🏆");
                return;
              }
              if (movesLeft <= 0) {
                ended = true; clearInterval(iv);
                api.finish(false, "", "نفدت الحركات قبل إكمال المهمة!");
                return;
              }
              renderBoard();
            };
          });
        }

        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت قبل إكمال المهمة!"); }
        }, 100);
        api.setCleanup(function () { ended = true; clearInterval(iv); });
        renderBoard();
      }
    });

    // =========================================================================
    // 7. ⚡ حارس الشجرة السريع (شبكة 3×3 ⬅️ 4×3 + أرقام الكيبورد 1–9 + زيتون حقيقي!)
    // =========================================================================
    window.ZaitRegisterExtraGame("reflex", {
      icon: "⚡",
      name: "حارس الشجرة السريع",
      desc: "التقط ثمار الزيتون الطازجة والذهبية بسرعة البرق قبل اختفائها وتفادَ النيران!",
      cat: "speed",
      hardTag: "ردة فعل ⚡",
      launch: function (api) {
        var stage = api.stage;
        var count = stage >= 4 ? 12 : 9;
        var cols = stage >= 4 ? 4 : 3;
        var quota = 16 + stage * 5;
        var duration = Math.max(20, api.baseTime || 26);
        var lives = stage >= 5 ? 2 : 3;
        var st = api.createStageShell("حارس الشجرة", stage, duration, "0/" + quota + " ثمرة", "💻 الماوس أو أرقام الكيبورد (1 إلى 9) • 📱 اضغط بسرعة على الزيتون!");
        st.setExtra("❤️".repeat(lives));

        var arr = [];
        for (var i = 0; i < count; i++) arr.push(null);
        var cellsHtml = arr.map(function (_, idx) {
          return '<button type="button" class="og-rfx-c" data-i="' + idx + '" style="aspect-ratio:1/1;border-radius:16px;border:2px solid rgba(213,158,42,.45);background:linear-gradient(145deg,#0f2d1d,#1a482f);color:#fff;font-size:2rem;cursor:pointer;position:relative;"><span style="position:absolute;top:4px;right:7px;font-size:.66rem;opacity:.55;">' + (idx < 9 ? (idx + 1) : "") + '</span><span class="og-rfx-v">🌿</span></button>';
        }).join("");
        st.host.innerHTML = '<div class="og-card"><div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:8px;max-width:380px;margin:0 auto;">' + cellsHtml + '</div></div>';

        var btns = Array.prototype.slice.call(st.host.querySelectorAll(".og-rfx-c"));
        var caught = 0, rem = duration, running = false, ended = false;
        var popMs = Math.max(340, 740 - stage * 44), stayMs = Math.max(640, 1280 - stage * 65);
        var hazRate = Math.min(0.38, 0.16 + stage * 0.025);

        function paint(idx) {
          var b = btns[idx], v = arr[idx], sp = b.querySelector(".og-rfx-v");
          if (!v) { sp.textContent = "🌿"; b.style.borderColor = "rgba(213,158,42,.4)"; b.style.background = "linear-gradient(145deg,#0f2d1d,#1a482f)"; }
          else if (v === "olive") { sp.textContent = "🫒"; b.style.borderColor = "#4ade80"; b.style.background = "linear-gradient(145deg,#15803d,#166534)"; }
          else if (v === "gold") { sp.textContent = "✨🫒"; b.style.borderColor = "#facc15"; b.style.background = "linear-gradient(145deg,#d97706,#92400e)"; }
          else { sp.textContent = "🔥"; b.style.borderColor = "#ef4444"; b.style.background = "linear-gradient(145deg,#991b1b,#dc2626)"; }
        }

        function hitCell(idx) {
          if (!running || api.isPaused() || ended || idx < 0 || idx >= count) return;
          var v = arr[idx]; if (!v) return;
          arr[idx] = null; paint(idx);
          if (v === "fire") {
            lives--; st.setExtra("❤️".repeat(Math.max(0, lives)));
            api.playSfx("bad"); api.haptic(55); st.shake();
            if (lives <= 0) { ended = true; api.finish(false, "", "🔥 لمست النيران ونفدت محاولاتك!"); }
          } else {
            caught += v === "gold" ? 2 : 1;
            st.setGoal("⚡ " + caught + "/" + quota);
            api.playSfx(v === "gold" ? "gold" : "pop"); api.haptic(12);
            if (caught >= quota) { ended = true; api.finish(true, "حميت الشجرة والتقطت " + caught + " ثمرة في الدور " + stage + "! ⚡🫒"); }
          }
        }

        btns.forEach(function (b, idx) { b.onclick = function () { hitCell(idx); }; });
        var onKey = function (e) { var n = Number(e.key); if (n >= 1 && n <= 9) hitCell(n - 1); };
        window.addEventListener("keydown", onKey);

        var pIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          var empty = [];
          for (var i = 0; i < count; i++) if (!arr[i]) empty.push(i);
          if (!empty.length) return;
          var pk = empty[Math.floor(Math.random() * empty.length)], r = Math.random();
          arr[pk] = r < hazRate ? "fire" : (r > 0.8 ? "gold" : "olive");
          paint(pk);
          setTimeout(function () { if (!ended && arr[pk]) { arr[pk] = null; paint(pk); } }, stayMs);
        }, popMs);

        var sIv = setInterval(function () {
          if (!running || api.isPaused() || ended) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(pIv); clearInterval(sIv); api.finish(false, "", "انتهى الوقت عند " + caught + "/" + quota + " ثمرة!"); }
        }, 100);

        api.setCleanup(function () { ended = true; clearInterval(pIv); clearInterval(sIv); window.removeEventListener("keydown", onKey); });
        api.runCountdown(st.host, "الدور " + stage + " — التقط " + quota + " ثمرة زيتون!", function () { running = true; });
      }
    });
  }

  bootExtraGames();
})();
