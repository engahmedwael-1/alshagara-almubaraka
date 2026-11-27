/* ============================================================================
   Zait Store Olive Games Ultra V98 — Pack 3 (6 Google-Play-Grade Brain Games)
   Completes the Full 15-Game Offline & Multi-Device Suite!
   ============================================================================ */
(function () {
  "use strict";
  if (window.__ZAIT_OLIVE_PACK3_V98__) return;
  window.__ZAIT_OLIVE_PACK3_V98__ = true;

  // Inject self-contained crisp styles for Pack 3 puzzles (Dark Mode + Mobile/Desktop)
  function ensurePack3Css() {
    if (document.getElementById("zait-v98-pack3-css")) return;
    var st = document.createElement("style");
    st.id = "zait-v98-pack3-css";
    st.textContent = [
      ".p3-crush-grid{display:grid;gap:4px;max-width:400px;margin:0 auto;padding:8px;background:#0a2114;border:2px solid #d59e2a;border-radius:18px;touch-action:none;user-select:none}",
      ".p3-crush-cell{aspect-ratio:1/1;border-radius:10px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:1.4rem;cursor:pointer;transition:transform .14s,border-color .14s,background .14s;position:relative}",
      ".p3-crush-cell.sel{border-color:#fde047!important;background:rgba(250,204,21,.25)!important;transform:scale(1.1);z-index:2;box-shadow:0 0 12px rgba(250,204,21,.55)}",
      ".p3-crush-cell.bomb{background:radial-gradient(circle,#facc15,#b45309)!important;border-color:#fef08a!important}",
      ".p3-2048-board{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;max-width:360px;margin:0 auto;padding:9px;background:#0d2618;border:2px solid #d59e2a;border-radius:18px;touch-action:none;user-select:none}",
      ".p3-2048-tile{aspect-ratio:1/1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;transition:transform .12s;line-height:1.1}",
      ".p3-quiz-lifelines{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}",
      ".p3-ll-btn{padding:7px 6px;border-radius:11px;border:1.5px solid #d59e2a;background:linear-gradient(135deg,#133622,#1f5134);color:#fde68a;font-size:.73rem;font-weight:900;cursor:pointer;font-family:inherit}",
      ".p3-ll-btn:disabled{opacity:.38;cursor:not-allowed;filter:grayscale(1)}",
      ".p3-quiz-opt{width:100%;text-align:right;padding:12px 14px;border-radius:14px;border:1.5px solid rgba(200,162,75,.42);background:#fff;color:#12251a;font-family:inherit;font-size:.87rem;font-weight:800;cursor:pointer;margin-bottom:8px;transition:.14s;display:block}",
      "body.dark-mode .p3-quiz-opt,[data-theme='dark'] .p3-quiz-opt{background:#122a1e;color:#f0f9f3}",
      ".p3-quiz-opt.correct{background:#16a34a!important;color:#fff!important;border-color:#4ade80!important}",
      ".p3-quiz-opt.wrong{background:#dc2626!important;color:#fff!important;border-color:#fca5a5!important}",
      ".p3-quiz-opt.eliminated{opacity:.22;pointer-events:none;text-decoration:line-through}",
      ".p3-mem-grid{display:grid;gap:7px;max-width:430px;margin:0 auto}",
      ".p3-mem-card{aspect-ratio:1/1;border-radius:13px;border:2px solid #d59e2a;background:linear-gradient(135deg,#10301e,#1e5235);color:#fde68a;font-size:1.45rem;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s,background .2s}",
      ".p3-mem-card.open{background:#fff;color:#111;transform:scale(1.04)}",
      "body.dark-mode .p3-mem-card.open,[data-theme='dark'] .p3-mem-card.open{background:#1f432f;color:#fff}",
      ".p3-mem-card.matched{background:#16a34a!important;border-color:#86efac!important;color:#fff!important}",
      ".p3-rfx-cell{aspect-ratio:1/1;border-radius:16px;border:2px solid rgba(213,158,42,.45);background:linear-gradient(145deg,#0f2d1d,#1a482f);color:#fff;font-size:2rem;cursor:pointer;position:relative;transition:transform .09s}",
      ".p3-rfx-cell:active{transform:scale(.93)}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function registerPack3() {
    if (typeof window.ZaitRegisterExtraGame !== "function") {
      setTimeout(registerPack3, 120);
      return;
    }
    ensurePack3Css();

    // =========================================================================
    // BRAIN GAME 1: 🍬 سحق الزيتون (Olive Crush — True Candy Crush Match-3 Swap!)
    // =========================================================================
    window.ZaitRegisterExtraGame("crush", {
      icon: "🍬",
      grad: "linear-gradient(135deg,#9d174d,#b45309)",
      name: "سحق الزيتون (Candy Crush)",
      desc: "بدّل بين حبتين متجاورتين لمطابقة 3+ متشابهة! مطابقة 4+ تصنع قنبلة تفجير 💣!",
      cat: "brain",
      hardTag: "جديد 🍬",
      launch: function (api) {
        var stage = api.stage;
        var N = stage >= 5 ? 8 : 7;
        var TYPES = stage >= 4 ? ["🫒", "✨", "🏺", "🌿", "🍯", "💧"] : ["🫒", "✨", "🏺", "🌿", "🍯"];
        var needA = 12 + stage * 4, needB = 10 + stage * 3;
        var targetA = "🫒", targetB = "🏺";
        var moves = 20 + Math.min(8, stage);
        var duration = Math.max(55, (api.baseTime || 65) + stage * 5);
        var gotA = 0, gotB = 0, rem = duration, busy = false, ended = false, selected = null;

        var st = api.createStageShell(
          "سحق الزيتون",
          stage,
          duration,
          targetA + " 0/" + needA + " • " + targetB + " 0/" + needB,
          "🍬 اسحب أو اضغط قطعتين متجاورتين للتبديل • مطابقة 4+ تصنع قنبلة تفجير 💣!"
        );
        st.setExtra("🎯 حركات: " + moves);

        var board = [];
        function randCell() { return { sym: TYPES[Math.floor(Math.random() * TYPES.length)], bomb: false }; }

        // Initialize board with zero pre-existing matches
        for (var r = 0; r < N; r++) {
          board.push([]);
          for (var c = 0; c < N; c++) {
            var cell;
            do {
              cell = randCell();
            } while (
              (c >= 2 && board[r][c - 1].sym === cell.sym && board[r][c - 2].sym === cell.sym) ||
              (r >= 2 && board[r - 1][c].sym === cell.sym && board[r - 2][c].sym === cell.sym)
            );
            board[r].push(cell);
          }
        }

        function findMatches() {
          var matched = {}, groups = [];
          // Horizontal
          for (var r = 0; r < N; r++) {
            var c = 0;
            while (c < N) {
              var s = board[r][c] ? board[r][c].sym : null, len = 1;
              while (s && c + len < N && board[r][c + len] && board[r][c + len].sym === s) len++;
              if (s && len >= 3) {
                var grp = [];
                for (var k = 0; k < len; k++) { matched[r + "," + (c + k)] = true; grp.push([r, c + k]); }
                groups.push(grp);
              }
              c += Math.max(1, len);
            }
          }
          // Vertical
          for (var c2 = 0; c2 < N; c2++) {
            var r2 = 0;
            while (r2 < N) {
              var s2 = board[r2][c2] ? board[r2][c2].sym : null, len2 = 1;
              while (s2 && r2 + len2 < N && board[r2 + len2][c2] && board[r2 + len2][c2].sym === s2) len2++;
              if (s2 && len2 >= 3) {
                var grp2 = [];
                for (var k2 = 0; k2 < len2; k2++) { matched[(r2 + k2) + "," + c2] = true; grp2.push([r2 + k2, c2]); }
                groups.push(grp2);
              }
              r2 += Math.max(1, len2);
            }
          }
          return { matched: matched, groups: groups, count: Object.keys(matched).length };
        }

        function hasValidMove() {
          for (var r = 0; r < N; r++) {
            for (var c = 0; c < N; c++) {
              if (c + 1 < N) {
                var t1 = board[r][c]; board[r][c] = board[r][c + 1]; board[r][c + 1] = t1;
                var ok1 = findMatches().count > 0;
                board[r][c + 1] = board[r][c]; board[r][c] = t1;
                if (ok1) return true;
              }
              if (r + 1 < N) {
                var t2 = board[r][c]; board[r][c] = board[r + 1][c]; board[r + 1][c] = t2;
                var ok2 = findMatches().count > 0;
                board[r + 1][c] = board[r][c]; board[r][c] = t2;
                if (ok2) return true;
              }
            }
          }
          return false;
        }

        function reshuffleBoard() {
          for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) board[r][c] = randCell();
        }

        function resolveMatches(depth) {
          var res = findMatches();
          if (res.count === 0) {
            if (!hasValidMove()) reshuffleBoard();
            busy = false;
            renderBoard();
            if (gotA >= needA && gotB >= needB) {
              ended = true; clearInterval(iv);
              api.finish(true, "سحقت مهمة الدور " + stage + " بنجاح وتبقّت لك " + moves + " حركة! 🍬🏆");
              return;
            }
            if (moves <= 0) {
              ended = true; clearInterval(iv);
              api.finish(false, "", "نفدت الحركات قبل إكمال مهمة الدور " + stage + "!");
            }
            return;
          }

          var toClear = Object.assign({}, res.matched);
          var newBombs = [];

          // 4+ match creates a bomb; clearing a bomb blasts 3x3!
          res.groups.forEach(function (grp) {
            if (grp.length >= 4) newBombs.push(grp[1]);
          });
          Object.keys(res.matched).forEach(function (key) {
            var p = key.split(","), rr = Number(p[0]), cc = Number(p[1]);
            if (board[rr][cc] && board[rr][cc].bomb) {
              for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
                var nr = rr + dr, nc = cc + dc;
                if (nr >= 0 && nr < N && nc >= 0 && nc < N) toClear[nr + "," + nc] = true;
              }
              st.shake();
            }
          });

          Object.keys(toClear).forEach(function (key) {
            var p = key.split(","), rr = Number(p[0]), cc = Number(p[1]);
            var cell = board[rr][cc];
            if (cell) {
              if (cell.sym === targetA) gotA++;
              if (cell.sym === targetB) gotB++;
            }
            board[rr][cc] = null;
          });

          newBombs.forEach(function (pt) {
            board[pt[0]][pt[1]] = { sym: TYPES[Math.floor(Math.random() * TYPES.length)], bomb: true };
          });

          // Gravity drop & refill
          for (var c = 0; c < N; c++) {
            var col = [];
            for (var r = N - 1; r >= 0; r--) if (board[r][c]) col.push(board[r][c]);
            while (col.length < N) col.push(randCell());
            for (var r2 = N - 1, i = 0; r2 >= 0; r2--, i++) board[r2][c] = col[i];
          }

          api.playSfx(depth > 1 || newBombs.length ? "gold" : "pop");
          api.haptic(depth > 1 ? 22 : 12);
          st.setGoal(targetA + " " + Math.min(gotA, needA) + "/" + needA + " • " + targetB + " " + Math.min(gotB, needB) + "/" + needB);
          renderBoard();
          setTimeout(function () { if (!ended) resolveMatches(depth + 1); }, 230);
        }

        function attemptSwap(r1, c1, r2, c2) {
          if (busy || ended || api.isPaused()) return;
          if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
          busy = true; selected = null;
          var tmp = board[r1][c1]; board[r1][c1] = board[r2][c2]; board[r2][c2] = tmp;

          // If either swapped tile is a Bomb, trigger immediate 3x3 blast!
          var swappedBomb = (board[r1][c1] && board[r1][c1].bomb) || (board[r2][c2] && board[r2][c2].bomb);
          if (findMatches().count > 0 || swappedBomb) {
            moves--;
            st.setExtra("🎯 حركات: " + moves);
            if (swappedBomb && findMatches().count === 0) {
              var br = board[r1][c1].bomb ? r1 : r2, bc = board[r1][c1].bomb ? c1 : c2;
              for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
                var nr = br + dr, nc = bc + dc;
                if (nr >= 0 && nr < N && nc >= 0 && nc < N && board[nr][nc]) {
                  if (board[nr][nc].sym === targetA) gotA++;
                  if (board[nr][nc].sym === targetB) gotB++;
                  board[nr][nc] = null;
                }
              }
              for (var cc = 0; cc < N; cc++) {
                var col = [];
                for (var rr = N - 1; rr >= 0; rr--) if (board[rr][cc]) col.push(board[rr][cc]);
                while (col.length < N) col.push(randCell());
                for (var rr2 = N - 1, idx = 0; rr2 >= 0; rr2--, idx++) board[rr2][cc] = col[idx];
              }
              api.playSfx("gold"); st.shake();
              st.setGoal(targetA + " " + Math.min(gotA, needA) + "/" + needA + " • " + targetB + " " + Math.min(gotB, needB) + "/" + needB);
              renderBoard();
              setTimeout(function () { if (!ended) resolveMatches(2); }, 230);
            } else {
              renderBoard();
              setTimeout(function () { if (!ended) resolveMatches(1); }, 160);
            }
          } else {
            // Invalid swap -> revert & shake!
            board[r2][c2] = board[r1][c1]; board[r1][c1] = tmp;
            api.playSfx("bad"); st.shake();
            busy = false;
            renderBoard();
          }
        }

        function renderBoard() {
          var h = '<div class="p3-crush-grid" id="p3-crush-grid" style="grid-template-columns:repeat(' + N + ',1fr);">';
          for (var r = 0; r < N; r++) {
            for (var c = 0; c < N; c++) {
              var cell = board[r][c] || { sym: "🫒", bomb: false };
              var isSel = selected && selected[0] === r && selected[1] === c;
              h += '<button type="button" class="p3-crush-cell' + (isSel ? " sel" : "") + (cell.bomb ? " bomb" : "") + '" data-r="' + r + '" data-c="' + c + '">' + (cell.bomb ? "💣" : cell.sym) + '</button>';
            }
          }
          st.host.innerHTML = h + '</div>';

          var dragStart = null;
          st.host.querySelectorAll(".p3-crush-cell").forEach(function (btn) {
            btn.addEventListener("pointerdown", function (e) {
              if (busy || ended || api.isPaused()) return;
              var r = Number(btn.getAttribute("data-r")), c = Number(btn.getAttribute("data-c"));
              dragStart = { r: r, c: c, x: e.clientX, y: e.clientY };
            });
            btn.addEventListener("pointerup", function (e) {
              if (!dragStart || busy || ended) return;
              var dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
              var sr = dragStart.r, sc = dragStart.c;
              dragStart = null;
              if (Math.hypot(dx, dy) > 20) {
                if (Math.abs(dx) > Math.abs(dy)) attemptSwap(sr, sc, sr, sc + (dx > 0 ? 1 : -1));
                else attemptSwap(sr, sc, sr + (dy > 0 ? 1 : -1), sc);
                return;
              }
              if (!selected) { selected = [sr, sc]; api.playSfx("tick"); renderBoard(); }
              else if (selected[0] === sr && selected[1] === sc) { selected = null; renderBoard(); }
              else if (Math.abs(selected[0] - sr) + Math.abs(selected[1] - sc) === 1) { attemptSwap(selected[0], selected[1], sr, sc); }
              else { selected = [sr, sc]; api.playSfx("tick"); renderBoard(); }
            });
          });
        }

        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت قبل إكمال مهمة سحق الزيتون!"); }
        }, 100);

        api.setCleanup(function () { ended = true; clearInterval(iv); });
        renderBoard();
      }
    });

    // =========================================================================
    // BRAIN GAME 2: 🔢 2048 الشجرة المباركة (Olive Harvest 2048 Evolution + Undo!)
    // =========================================================================
    window.ZaitRegisterExtraGame("g2048", {
      icon: "🔢",
      grad: "linear-gradient(135deg,#854d0e,#14532d)",
      name: "2048 الشجرة المباركة",
      desc: "ادمج الأرقام المتشابهة من البذرة حتى الجركن الذهبي 2048 عبر 5 مراحل مع زر تراجع!",
      cat: "brain",
      hardTag: "جديد 🔢",
      launch: function (api) {
        var stage = api.stage;
        var goals = [128, 256, 512, 1024, 2048];
        var goalTile = goals[Math.min(stage - 1, goals.length - 1)];
        var duration = Math.max(120, api.baseTime || 180);

        var TILE_META = {
          2:    { bg: "#ecfccb", fg: "#1a2e05", ic: "🌱" },
          4:    { bg: "#d9f99d", fg: "#1a2e05", ic: "🌿" },
          8:    { bg: "#86efac", fg: "#052e16", ic: "🌳" },
          16:   { bg: "#4ade80", fg: "#052e16", ic: "🫒" },
          32:   { bg: "#22c55e", fg: "#fff",    ic: "🧺" },
          64:   { bg: "#15803d", fg: "#fff",    ic: "❄️" },
          128:  { bg: "#fde047", fg: "#422006", ic: "💧" },
          256:  { bg: "#facc15", fg: "#422006", ic: "🏺" },
          512:  { bg: "#eab308", fg: "#fff",    ic: "🛢️" },
          1024: { bg: "#d97706", fg: "#fff",    ic: "🏆" },
          2048: { bg: "#b45309", fg: "#fef08a", ic: "👑" }
        };

        var st = api.createStageShell("2048 الشجرة", stage, duration, "🎯 اصنع الرقم " + goalTile, "💻 الأسهم أو WASD • 📱 اسحب في أي اتجاه أو استخدم الأزرار");
        st.setExtra("⭐ 0");

        var grid = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        var prevGrid = null, undoLeft = 2, score = 0, rem = duration, ended = false;

        function addRandomTile() {
          var empties = [];
          for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) if (grid[r][c] === 0) empties.push([r, c]);
          if (!empties.length) return;
          var pick = empties[Math.floor(Math.random() * empties.length)];
          grid[pick[0]][pick[1]] = Math.random() < 0.88 ? 2 : 4;
        }

        function slideLine(arr) {
          var filtered = arr.filter(function (v) { return v !== 0; });
          var merged = [], gained = 0;
          for (var i = 0; i < filtered.length; i++) {
            if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
              var nv = filtered[i] * 2;
              merged.push(nv); gained += nv; i++;
            } else merged.push(filtered[i]);
          }
          while (merged.length < 4) merged.push(0);
          return { line: merged, gained: gained };
        }

        function canMoveAny() {
          for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
              if (grid[r][c] === 0) return true;
              if (c + 1 < 4 && grid[r][c] === grid[r][c + 1]) return true;
              if (r + 1 < 4 && grid[r][c] === grid[r + 1][c]) return true;
            }
          }
          return false;
        }

        function move(dir) {
          if (ended || api.isPaused()) return;
          var snap = grid.map(function (row) { return row.slice(); });
          var changed = false, totalGained = 0;

          if (dir === "left" || dir === "right") {
            for (var r = 0; r < 4; r++) {
              var row = dir === "right" ? grid[r].slice().reverse() : grid[r].slice();
              var res = slideLine(row);
              var out = dir === "right" ? res.line.reverse() : res.line;
              if (out.join(",") !== grid[r].join(",")) changed = true;
              grid[r] = out; totalGained += res.gained;
            }
          } else {
            for (var c = 0; c < 4; c++) {
              var col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
              if (dir === "down") col.reverse();
              var res2 = slideLine(col);
              var out2 = dir === "down" ? res2.line.reverse() : res2.line;
              for (var r2 = 0; r2 < 4; r2++) {
                if (grid[r2][c] !== out2[r2]) changed = true;
                grid[r2][c] = out2[r2];
              }
              totalGained += res2.gained;
            }
          }

          if (!changed) { api.playSfx("tick"); return; }
          prevGrid = snap;
          score += totalGained;
          st.setExtra("⭐ " + score);
          addRandomTile();
          api.playSfx(totalGained >= 16 ? "gold" : "pop");
          api.haptic(totalGained >= 16 ? 16 : 8);
          render();

          var maxTile = 0;
          for (var rr = 0; rr < 4; rr++) for (var cc = 0; cc < 4; cc++) if (grid[rr][cc] > maxTile) maxTile = grid[rr][cc];
          if (maxTile >= goalTile) {
            ended = true; clearInterval(iv);
            api.finish(true, "وصلت إلى الرقم " + goalTile + " بنجاح بمجموع " + score + " نقطة! 🔢👑");
            return;
          }
          if (!canMoveAny()) {
            ended = true; clearInterval(iv);
            api.playSfx("bad"); st.shake();
            api.finish(false, "", "امتلأت اللوحة بدون حركات متاحة (أعلى رقم: " + maxTile + ")!");
          }
        }

        function doUndo() {
          if (!prevGrid || undoLeft <= 0 || ended) return;
          grid = prevGrid; prevGrid = null; undoLeft--;
          api.playSfx("pop");
          render();
        }

        function render() {
          var cells = "";
          for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
              var v = grid[r][c];
              var m = TILE_META[v] || { bg: "#713f12", fg: "#fef08a", ic: "👑" };
              cells += v === 0
                ? '<div class="p3-2048-tile" style="background:rgba(255,255,255,.07);"></div>'
                : '<div class="p3-2048-tile" style="background:' + m.bg + ';color:' + m.fg + ';"><span style="font-size:1.15rem;">' + m.ic + '</span><span style="font-size:' + (v >= 1024 ? ".82rem" : "1rem") + ';">' + v + '</span></div>';
            }
          }
          st.host.innerHTML =
            '<div class="p3-2048-board" id="p3-2048-b">' + cells + '</div>' +
            '<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:9px;flex-wrap:wrap;">' +
              '<button type="button" class="og-btn og-btn-dark" id="g2-u" style="padding:8px 13px;">⬆️</button>' +
              '<button type="button" class="og-btn og-btn-dark" id="g2-r" style="padding:8px 13px;">➡️</button>' +
              '<button type="button" class="og-btn og-btn-dark" id="g2-d" style="padding:8px 13px;">⬇️</button>' +
              '<button type="button" class="og-btn og-btn-dark" id="g2-l" style="padding:8px 13px;">⬅️</button>' +
              '<button type="button" class="og-btn og-btn-gold" id="g2-undo" ' + ((!prevGrid || undoLeft <= 0) ? "disabled style='opacity:.4;padding:8px 11px;font-size:.78rem;'" : "style='padding:8px 11px;font-size:.78rem;'") + '>↩️ تراجع (' + undoLeft + ')</button>' +
            '</div>';

          document.getElementById("g2-u").onclick = function () { move("up"); };
          document.getElementById("g2-d").onclick = function () { move("down"); };
          document.getElementById("g2-l").onclick = function () { move("left"); };
          document.getElementById("g2-r").onclick = function () { move("right"); };
          document.getElementById("g2-undo").onclick = doUndo;

          var brd = document.getElementById("p3-2048-b"), sx = 0, sy = 0;
          brd.addEventListener("pointerdown", function (e) { sx = e.clientX; sy = e.clientY; });
          brd.addEventListener("pointerup", function (e) {
            var dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.hypot(dx, dy) < 20) return;
            if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
            else move(dy > 0 ? "down" : "up");
          });
        }

        var onKey = function (e) {
          if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { e.preventDefault(); move("up"); }
          else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { e.preventDefault(); move("down"); }
          else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); move("left"); }
          else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); move("right"); }
        };
        window.addEventListener("keydown", onKey);

        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.2; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت قبل الوصول إلى " + goalTile + "!"); }
        }, 200);

        addRandomTile(); addRandomTile(); render();
        api.setCleanup(function () { ended = true; clearInterval(iv); window.removeEventListener("keydown", onKey); });
      }
    });

    // =========================================================================
    // BRAIN GAME 3: 🔧 توصيل أنابيب المعصرة برو (Guaranteed Solvable + Smart Hint!)
    // =========================================================================
    window.ZaitRegisterExtraGame("pipes", {
      icon: "🔧",
      grad: "linear-gradient(135deg,#0f766e,#153422)",
      name: "توصيل أنابيب المعصرة",
      desc: "دوّر الأنابيب لتوصيل زيت الزيتون الذهبي من المعصرة للزجاجة مع زر تلميح ذكي 💡!",
      cat: "brain",
      hardTag: "ألغاز 🔧",
      launch: function (api) {
        var stage = api.stage;
        var N = stage <= 2 ? 4 : (stage <= 6 ? 5 : 6);
        var duration = Math.max(35, (api.baseTime || 55) + (N - 4) * 14 - stage * 2);
        var hintsLeft = 2;
        var st = api.createStageShell("أنابيب المعصرة", stage, duration, "وصّل 🫒 ⬅️ 🏺", "اضغط على أي أنبوب لتدويره 90° وتوصيل الزيت الذهبي للزجاجة");
        st.setExtra("الشبكة " + N + "×" + N);

        var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1], OPP = [2, 3, 0, 1];
        function makePath() {
          var vis = [], path = [];
          for (var r = 0; r < N; r++) { vis.push([]); for (var c = 0; c < N; c++) vis[r].push(false); }
          function dfs(r, c) {
            vis[r][c] = true; path.push([r, c]);
            if (r === N - 1 && c === N - 1) return true;
            var dirs = [0, 1, 2, 3].sort(function (a, b) { return ((a === 1 || a === 2) ? -0.3 : 0.3) + (Math.random() - 0.5); });
            for (var i = 0; i < dirs.length; i++) {
              var nr = r + DR[dirs[i]], nc = c + DC[dirs[i]];
              if (nr >= 0 && nr < N && nc >= 0 && nc < N && !vis[nr][nc] && dfs(nr, nc)) return true;
            }
            path.pop(); return false;
          }
          dfs(0, 0); return path;
        }

        var sol = makePath(), grid = [];
        for (var r = 0; r < N; r++) {
          grid.push([]);
          for (var c = 0; c < N; c++) {
            var base = Math.random() < 0.4 ? [0, 2] : (Math.random() < 0.85 ? [0, 1] : [0, 1, 2]);
            grid[r].push({ base: base, rot: Math.floor(Math.random() * 4), wet: false, onPath: false, locked: false });
          }
        }
        for (var p = 0; p < sol.length; p++) {
          var cr = sol[p][0], cc = sol[p][1], need = [];
          if (p === 0) need.push(3);
          else { var pr = sol[p - 1][0], pc = sol[p - 1][1]; for (var d1 = 0; d1 < 4; d1++) if (cr + DR[d1] === pr && cc + DC[d1] === pc) need.push(d1); }
          if (p === sol.length - 1) need.push(1);
          else { var nr = sol[p + 1][0], nc = sol[p + 1][1]; for (var d2 = 0; d2 < 4; d2++) if (cr + DR[d2] === nr && cc + DC[d2] === nc) need.push(d2); }
          grid[cr][cc] = { base: need, rot: 1 + Math.floor(Math.random() * 3), wet: false, onPath: true, locked: false };
        }

        function cellDirs(cell) { return cell.base.map(function (d) { return (d + cell.rot) % 4; }); }
        function checkFlow() {
          for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) grid[r][c].wet = false;
          if (cellDirs(grid[0][0]).indexOf(3) === -1) return false;
          var q = [[0, 0]]; grid[0][0].wet = true;
          while (q.length) {
            var cur = q.shift(), rr = cur[0], cc = cur[1];
            cellDirs(grid[rr][cc]).forEach(function (d) {
              var nr = rr + DR[d], nc = cc + DC[d];
              if (nr >= 0 && nr < N && nc >= 0 && nc < N && !grid[nr][nc].wet && cellDirs(grid[nr][nc]).indexOf(OPP[d]) > -1) {
                grid[nr][nc].wet = true; q.push([nr, nc]);
              }
            });
          }
          return grid[N - 1][N - 1].wet && cellDirs(grid[N - 1][N - 1]).indexOf(1) > -1;
        }

        st.host.innerHTML =
          '<div class="og-canvas-wrap"><canvas id="og-cv-pipes3"></canvas></div>' +
          '<div style="text-align:center;margin-top:8px;"><button type="button" id="p3-pipe-hint" class="og-btn og-btn-gold" style="padding:8px 16px;font-size:.8rem;">💡 تلميح ذكي (ضبط أنبوب صحيح — متبقي ' + hintsLeft + ')</button></div>';

        var cv = document.getElementById("og-cv-pipes3");
        var g = api.setupHiDpiCanvas(cv, 380, 380);
        var ctx = g.ctx, W = g.w, H = g.h, pad = 28, sz = (W - pad * 2) / N, rem = duration, ended = false;

        function draw() {
          ctx.fillStyle = "#081c11"; ctx.fillRect(0, 0, W, H);
          ctx.font = "20px sans-serif"; ctx.textAlign = "center";
          ctx.fillText("🫒", 14, pad + sz / 2 + 7);
          ctx.fillText("🏺", W - 14, pad + (N - 0.5) * sz + 7);

          for (var r = 0; r < N; r++) {
            for (var c = 0; c < N; c++) {
              var x = pad + c * sz, y = pad + r * sz, cx = x + sz / 2, cy = y + sz / 2, cell = grid[r][c];
              ctx.fillStyle = cell.locked ? "rgba(34,197,94,0.22)" : (cell.wet ? "rgba(213,158,42,0.16)" : "rgba(255,255,255,0.05)");
              ctx.fillRect(x + 2, y + 2, sz - 4, sz - 4);
              ctx.strokeStyle = cell.locked ? "#4ade80" : (cell.wet ? "#facc15" : "rgba(255,255,255,0.12)");
              ctx.lineWidth = cell.locked ? 2 : 1.3; ctx.strokeRect(x + 2, y + 2, sz - 4, sz - 4);

              ctx.strokeStyle = cell.wet ? "#facc15" : "#64748b";
              ctx.lineWidth = Math.max(9, sz * 0.22); ctx.lineCap = "round";
              cellDirs(cell).forEach(function (d) {
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + DC[d] * (sz / 2 - 2), cy + DR[d] * (sz / 2 - 2)); ctx.stroke();
              });
              ctx.fillStyle = cell.wet ? "#fef08a" : "#94a3b8";
              ctx.beginPath(); ctx.arc(cx, cy, Math.max(4, sz * 0.1), 0, Math.PI * 2); ctx.fill();
            }
          }
        }

        function afterChange() {
          var ok = checkFlow(); draw();
          if (ok) {
            ended = true; clearInterval(iv); api.playSfx("gold");
            setTimeout(function () { api.finish(true, "تدفق زيت الشجرة المباركة بنجاح من المعصرة للزجاجة في الدور " + stage + "! 🔧🏺"); }, 350);
          }
        }

        document.getElementById("p3-pipe-hint").onclick = function () {
          if (ended || hintsLeft <= 0) return;
          for (var i = 0; i < sol.length; i++) {
            var rr = sol[i][0], cc = sol[i][1];
            if (grid[rr][cc].rot !== 0) {
              grid[rr][cc].rot = 0; grid[rr][cc].locked = true;
              hintsLeft--;
              this.textContent = "💡 تلميح ذكي (متبقي " + hintsLeft + ")";
              if (hintsLeft <= 0) this.disabled = true;
              api.playSfx("gold"); api.haptic(16);
              afterChange();
              return;
            }
          }
        };

        var onTap = function (ev) {
          if (ended || api.isPaused()) return;
          var p = api.getPointerPos(ev, cv, W, H);
          var c = Math.floor((p.x - pad) / sz), r = Math.floor((p.y - pad) / sz);
          if (r < 0 || r >= N || c < 0 || c >= N || grid[r][c].locked) return;
          grid[r][c].rot = (grid[r][c].rot + 1) % 4;
          api.playSfx("pop"); api.haptic(10);
          afterChange();
        };
        cv.addEventListener("pointerdown", onTap);

        if (checkFlow()) grid[sol[0][0]][sol[0][1]].rot = 1;
        checkFlow(); draw();
        var iv = setInterval(function () {
          if (ended || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت قبل إتمام توصيل أنابيب المعصرة!"); }
        }, 100);
        api.setCleanup(function () { ended = true; clearInterval(iv); cv.removeEventListener("pointerdown", onTap); });
      }
    });

    // =========================================================================
    // BRAIN GAME 4: 🧠 خبير زيت الزيتون المليونير (+10,800 سؤال + 3 وسائل مساعدة!)
    // =========================================================================
    window.ZaitRegisterExtraGame("quiz", {
      icon: "🧠",
      grad: "linear-gradient(135deg,#1e1b4b,#047857)",
      name: "خبير الزيتون المليونير",
      desc: "+10,800 سؤال بمستويات تصاعدية + 3 وسائل مساعدة (حذف إجابة، وقت إضافي، وتبديل)!",
      cat: "brain",
      hardTag: "+10,800 🧠",
      launch: function (api) {
        var stage = api.stage;
        var diff = stage <= 2 ? "easy" : (stage <= 5 ? "medium" : "hard");
        var totalQ = Math.max(4, Number(api.quizQuestionCount || 7));
        var need = Math.min(totalQ, Math.ceil(totalQ * (stage >= 4 ? 0.82 : 0.7)));
        var secPerQ = Math.max(7, (api.baseTime || 12) - Math.floor(stage / 3));

        function pullQuestions(n) {
          if (window.OliveQuizBank && typeof window.OliveQuizBank.getRoundQuestions === "function") {
            return window.OliveQuizBank.getRoundQuestions(diff, n, []);
          }
          if (window.ZAIT_QUIZ_BANK && typeof window.ZAIT_QUIZ_BANK.getRound === "function") {
            return window.ZAIT_QUIZ_BANK.getRound(diff, n, api.seenQuizIds || []);
          }
          return [
            { q: "ما هي الدرجة القصوى لعصر زيت الزيتون على البارد؟", options: ["أقل من 27 درجة مئوية", "60 درجة مئوية", "100 درجة مئوية"], correct: 0, fact: "العصر تحت 27°م يحفظ الفيتامينات ومضادات الأكسدة 🌿" },
            { q: "ما الحد الأقصى لحموضة زيت الزيتون البكر الممتاز؟", options: ["0.8%", "2.5%", "5%"], correct: 0, fact: "كلما قلت الحموضة زاد نقاء وجودة الزيت البكر 🏅" },
            { q: "أين يُفضّل حفظ زجاجة زيت الزيتون البكر في المنزل؟", options: ["في مكان مظلم وبارد بعيداً عن البوتاجاز", "تحت الشمس المباشرة", "في إناء مكشوف"], correct: 0, fact: "الضوء والحرارة يُسرّعان أكسدة الزيت 🫒" },
            { q: "ما سبب اللذعة الخفيفة المحببة عند تذوق الزيت الأصلي؟", options: ["مركب الأوليوكانثال المضاد للأكسدة", "تلف الزيت", "إضافة ملح"], correct: 0, fact: "اللذعة علامة أصالة ونقاء الزيت البكر الممتاز ✨" }
          ];
        }

        var qs = pullQuestions(totalQ + 2); // +2 extra for Skip lifeline
        var st = api.createStageShell("خبير الزيتون", stage, secPerQ, "✅ 0/" + need, "💻 أرقام الكيبورد (1 إلى 4) أو الماوس واللمس • استخدم وسائل المساعدة بذكاء!");
        var qi = 0, answered = 0, ok = 0, rem = secPerQ, locked = false, ended = false;
        var ll = { fifty: true, time: true, skip: true };

        function getAns(q) { return typeof q.correct === "number" ? q.correct : (typeof q.ans === "number" ? q.ans : Number(q.a || 0)); }

        function pick(idx) {
          if (locked || ended || api.isPaused()) return;
          var btns = st.host.querySelectorAll(".p3-quiz-opt");
          if (!btns[idx] || btns[idx].classList.contains("eliminated")) return;
          locked = true;
          var q = qs[qi], ans = getAns(q);
          if (idx === ans) {
            ok++; btns[idx].classList.add("correct"); api.playSfx("gold"); api.haptic(15);
          } else {
            btns[idx].classList.add("wrong");
            if (btns[ans]) btns[ans].classList.add("correct");
            api.playSfx("bad"); api.haptic(45); st.shake();
          }
          answered++;
          st.setGoal("✅ " + ok + "/" + need);
          if (q.fact) {
            var fBox = document.getElementById("p3-q-fact");
            if (fBox) { fBox.textContent = "💡 " + q.fact; fBox.style.display = "block"; }
          }
          setTimeout(function () { if (!ended) { qi++; renderQ(); } }, 950);
        }

        function renderQ() {
          if (answered >= totalQ || qi >= qs.length) {
            ended = true; clearInterval(iv);
            api.finish(ok >= need, "أجبت على " + ok + " من " + totalQ + " بشكل صحيح في الدور " + stage + "! 🧠🏆", "أجبت على " + ok + " فقط (المطلوب للفوز " + need + ")");
            return;
          }
          locked = false; rem = secPerQ;
          var q = qs[qi], opts = q.options || q.o || [];
          st.setExtra("سؤال " + (answered + 1) + "/" + totalQ);
          st.setTime(rem, secPerQ);

          st.host.innerHTML =
            '<div class="p3-quiz-lifelines">' +
              '<button type="button" class="p3-ll-btn" id="ll-50" ' + (ll.fifty ? "" : "disabled") + '>✂️ حذف إجابة</button>' +
              '<button type="button" class="p3-ll-btn" id="ll-tm" ' + (ll.time ? "" : "disabled") + '>⏱️ +10 ثواني</button>' +
              '<button type="button" class="p3-ll-btn" id="ll-sk" ' + (ll.skip ? "" : "disabled") + '>⏭️ تبديل السؤال</button>' +
            '</div>' +
            '<div class="og-card">' +
              '<h3 style="margin:0 0 12px;font-size:.96rem;line-height:1.58;">' + esc(q.q || q.question) + '</h3>' +
              opts.map(function (op, i) {
                return '<button type="button" class="p3-quiz-opt" data-i="' + i + '"><b>' + (i + 1) + '.</b> ' + esc(op) + '</button>';
              }).join("") +
              '<div id="p3-q-fact" style="display:none;margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(22,163,74,.14);border:1px solid #22c55e;font-size:.78rem;font-weight:800;"></div>' +
            '</div>';

          st.host.querySelectorAll(".p3-quiz-opt").forEach(function (b) {
            b.onclick = function () { pick(Number(b.getAttribute("data-i"))); };
          });

          document.getElementById("ll-50").onclick = function () {
            if (!ll.fifty || locked) return;
            ll.fifty = false; this.disabled = true;
            var ans = getAns(q), wrongs = [];
            for (var i = 0; i < opts.length; i++) if (i !== ans) wrongs.push(i);
            wrongs.sort(function () { return Math.random() - 0.5; });
            var hideCnt = Math.max(1, Math.floor(wrongs.length / 2));
            var btns = st.host.querySelectorAll(".p3-quiz-opt");
            for (var k = 0; k < hideCnt; k++) if (btns[wrongs[k]]) btns[wrongs[k]].classList.add("eliminated");
            api.playSfx("gold");
          };
          document.getElementById("ll-tm").onclick = function () {
            if (!ll.time || locked) return;
            ll.time = false; this.disabled = true;
            rem += 10; st.setTime(rem, secPerQ + 10); api.playSfx("gold");
          };
          document.getElementById("ll-sk").onclick = function () {
            if (!ll.skip || locked) return;
            ll.skip = false; this.disabled = true;
            qi++; api.playSfx("pop"); renderQ();
          };
        }

        var onKey = function (e) { if (["1", "2", "3", "4"].indexOf(e.key) > -1) pick(Number(e.key) - 1); };
        window.addEventListener("keydown", onKey);
        var iv = setInterval(function () {
          if (ended || locked || api.isPaused()) return;
          rem -= 0.1; st.setTime(rem, secPerQ);
          if (rem <= 0) { locked = true; answered++; api.playSfx("bad"); setTimeout(function () { if (!ended) { qi++; renderQ(); } }, 500); }
        }, 100);

        api.setCleanup(function () { ended = true; clearInterval(iv); window.removeEventListener("keydown", onKey); });
        renderQ();
      }
    });

    // =========================================================================
    // BRAIN GAME 5: 🌿 ذاكرة المزرعة 3D برو (Initial Preview + Peek Power + 8->24 Cards!)
    // =========================================================================
    window.ZaitRegisterExtraGame("memory", {
      icon: "🌿",
      grad: "linear-gradient(135deg,#15803d,#0f766e)",
      name: "ذاكرة المزرعة 3D",
      desc: "احفظ أماكن الكروت في النظرة الأولى وطابق جميع الأزواج قبل انتهاء الوقت!",
      cat: "brain",
      hardTag: "3D 🌿",
      launch: function (api) {
        var stage = api.stage;
        var pairs = Math.min(12, 3 + stage); // 4 pairs (8 cards) -> 12 pairs (24 cards)
        var duration = Math.max(18, (api.baseTime || 30) + pairs * 2 - stage * 2);
        var syms = ["🫒", "🏺", "🌿", "🌳", "🧴", "💧", "🌞", "🏜️", "🥗", "🍯", "✨", "🏆"];
        var st = api.createStageShell("ذاكرة المزرعة", stage, duration, "🌿 0/" + pairs, "👀 احفظ الكروت جيداً! لديك نظرة خاطفة إضافية 👁️ أثناء اللعب");
        var peekLeft = 1;
        st.setExtra((pairs * 2) + " كارت");

        var deck = [];
        for (var i = 0; i < pairs; i++) deck.push(syms[i], syms[i]);
        for (var k = deck.length - 1; k > 0; k--) { var r = Math.floor(Math.random() * (k + 1)); var t = deck[k]; deck[k] = deck[r]; deck[r] = t; }
        var cols = pairs >= 10 ? 5 : 4;

        st.host.innerHTML =
          '<div class="og-card">' +
            '<div class="p3-mem-grid" style="grid-template-columns:repeat(' + cols + ',1fr);">' +
              deck.map(function (s, idx) { return '<button type="button" class="p3-mem-card open" data-s="' + s + '" data-i="' + idx + '">' + s + '</button>'; }).join("") +
            '</div>' +
            '<div style="text-align:center;margin-top:9px;"><button type="button" id="p3-mem-peek" class="og-btn og-btn-gold" style="padding:7px 14px;font-size:.78rem;">👁️ نظرة خاطفة (1.2 ثانية)</button></div>' +
          '</div>';

        var cards = Array.prototype.slice.call(st.host.querySelectorAll(".p3-mem-card"));
        var open = [], matched = 0, lock = true, rem = duration, ended = false;

        // Initial 1.7s memory preview!
        var previewTm = setTimeout(function () {
          if (ended) return;
          cards.forEach(function (c) { c.classList.remove("open"); c.textContent = "🫒"; });
          lock = false;
        }, 1700);

        document.getElementById("p3-mem-peek").onclick = function () {
          if (lock || ended || peekLeft <= 0) return;
          peekLeft--; this.disabled = true; this.style.opacity = "0.4";
          lock = true; api.playSfx("gold");
          cards.forEach(function (c) { if (!c.classList.contains("matched")) { c.classList.add("open"); c.textContent = c.getAttribute("data-s"); } });
          setTimeout(function () {
            if (ended) return;
            cards.forEach(function (c) { if (!c.classList.contains("matched")) { c.classList.remove("open"); c.textContent = "🫒"; } });
            open = []; lock = false;
          }, 1200);
        };

        cards.forEach(function (c) {
          c.onclick = function () {
            if (lock || ended || api.isPaused() || c.classList.contains("open") || c.classList.contains("matched")) return;
            c.classList.add("open"); c.textContent = c.getAttribute("data-s"); api.playSfx("pop");
            open.push(c);
            if (open.length === 2) {
              lock = true;
              if (open[0].getAttribute("data-s") === open[1].getAttribute("data-s")) {
                open[0].classList.add("matched"); open[1].classList.add("matched");
                matched++; st.setGoal("🌿 " + matched + "/" + pairs); api.playSfx("gold"); api.haptic(14);
                open = []; lock = false;
                if (matched >= pairs) {
                  ended = true; clearInterval(iv);
                  api.finish(true, "أنهيت مطابقة " + (pairs * 2) + " كارت في الدور " + stage + " بنجاح! 🌿🏆");
                }
              } else {
                setTimeout(function () {
                  open[0].classList.remove("open"); open[1].classList.remove("open");
                  open[0].textContent = "🫒"; open[1].textContent = "🫒";
                  open = []; lock = false;
                }, Math.max(320, 540 - stage * 22));
              }
            }
          };
        });

        var iv = setInterval(function () {
          if (ended || api.isPaused() || lock && matched === 0 && open.length === 0) return;
          rem -= 0.1; st.setTime(rem, duration);
          if (rem <= 0) { ended = true; clearInterval(iv); api.finish(false, "", "انتهى الوقت وتطابق " + matched + " من " + pairs + " أزواج!"); }
        }, 100);
        api.setCleanup(function () { ended = true; clearTimeout(previewTm); clearInterval(iv); });
      }
    });

    // =========================================================================
    // BRAIN GAME 6: ⚡ حارس الشجرة السريع برو (3x3 -> 4x3 + Freeze + Keys 1-9!)
    // =========================================================================
    window.ZaitRegisterExtraGame("reflex", {
      icon: "⚡",
      grad: "linear-gradient(135deg,#ca8a04,#b91c1c)",
      name: "حارس الشجرة السريع",
      desc: "اختبار ردة فعل خاطف! التقط الزيتون الأخضر والذهبي وتجنب النيران بأسرع وقت!",
      cat: "speed",
      hardTag: "ردة فعل ⚡",
      launch: function (api) {
        var stage = api.stage;
        var count = stage >= 4 ? 12 : 9, cols = stage >= 4 ? 4 : 3;
        var quota = 16 + stage * 5, duration = Math.max(20, api.baseTime || 26), lives = stage >= 5 ? 2 : 3;

        var st = api.createStageShell("حارس الشجرة", stage, duration, "⚡ 0/" + quota, "💻 الماوس أو أرقام الكيبورد (1–9) • 📱 المس الزيتون بسرعة • ❄️ يبطّئ الوقت!");
        st.setExtra("❤️".repeat(lives));

        var arr = []; for (var i = 0; i < count; i++) arr.push(null);
        st.host.innerHTML =
          '<div class="og-card"><div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:8px;max-width:380px;margin:0 auto;">' +
            arr.map(function (_, idx) {
              return '<button type="button" class="p3-rfx-cell" data-i="' + idx + '"><span style="position:absolute;top:4px;right:7px;font-size:.65rem;opacity:.55;">' + (idx < 9 ? (idx + 1) : "") + '</span><span class="p3-rfx-v">🌿</span></button>';
            }).join("") +
          '</div></div>';

        var btns = Array.prototype.slice.call(st.host.querySelectorAll(".p3-rfx-cell"));
        var caught = 0, combo = 0, rem = duration, running = false, ended = false, slowUntil = 0;
        var popMs = Math.max(330, 720 - stage * 42), stayMs = Math.max(640, 1260 - stage * 62), hazRate = Math.min(0.36, 0.16 + stage * 0.024);

        function paint(idx) {
          var b = btns[idx], v = arr[idx], sp = b.querySelector(".p3-rfx-v");
          if (!v) { sp.textContent = "🌿"; b.style.borderColor = "rgba(213,158,42,.42)"; b.style.background = "linear-gradient(145deg,#0f2d1d,#1a482f)"; }
          else if (v === "olive") { sp.textContent = "🫒"; b.style.borderColor = "#4ade80"; b.style.background = "linear-gradient(145deg,#15803d,#166534)"; }
          else if (v === "gold") { sp.textContent = "✨🫒"; b.style.borderColor = "#facc15"; b.style.background = "linear-gradient(145deg,#d97706,#92400e)"; }
          else if (v === "freeze") { sp.textContent = "❄️"; b.style.borderColor = "#38bdf8"; b.style.background = "linear-gradient(145deg,#0284c7,#0369a1)"; }
          else { sp.textContent = "🔥"; b.style.borderColor = "#ef4444"; b.style.background = "linear-gradient(145deg,#991b1b,#dc2626)"; }
        }

        function hitCell(idx) {
          if (!running || api.isPaused() || ended || idx < 0 || idx >= count) return;
          var v = arr[idx]; if (!v) return;
          arr[idx] = null; paint(idx);
          if (v === "fire") {
            lives--; combo = 0; st.setExtra("❤️".repeat(Math.max(0, lives)));
            api.playSfx("bad"); api.haptic(55); st.shake();
            if (lives <= 0) { ended = true; api.finish(false, "", "🔥 لمست النيران ونفدت محاولاتك!"); }
          } else if (v === "freeze") {
            slowUntil = Date.now() + 4500; caught += 1;
            st.setGoal("⚡ " + caught + "/" + quota); api.playSfx("gold"); api.haptic(18);
          } else {
            combo++;
            caught += (v === "gold" ? 3 : 1) + (combo >= 5 ? 1 : 0);
            st.setGoal("⚡ " + caught + "/" + quota);
            api.playSfx(v === "gold" || combo >= 5 ? "gold" : "pop"); api.haptic(12);
            if (caught >= quota) { ended = true; api.finish(true, "حميت الشجرة والتقطت " + caught + " ثمرة في الدور " + stage + "! ⚡🏆"); }
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
          arr[pk] = r < 0.05 ? "freeze" : (r < 0.05 + hazRate ? "fire" : (r > 0.82 ? "gold" : "olive"));
          paint(pk);
          var dur = Date.now() < slowUntil ? stayMs * 1.65 : stayMs;
          setTimeout(function () { if (!ended && arr[pk]) { arr[pk] = null; paint(pk); } }, dur);
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

  registerPack3();
})();
