/* ============================================================
   core/timeline.js: the timeline chart and event list.

   GI.timeline.chart(el, events, { fields })  lane chart: one row per field.
       Point at an event to read its question; click to jump to the lesson
       section that answers it. Zoom with the +/− buttons, the period buttons,
       Ctrl/⌘ + scroll or a pinch; drag to move along the timeline.
   GI.timeline.list(events)                   vertical list (HTML string).
   GI.timeline.href(event)                    address of the linked lesson section.
   GI.timeline.forNote(lessonSlug, n)         events that link to a lesson's note.

   The time axis has a break at 1945: the years before it are compressed,
   because most events happen after 1945. The break is drawn on the axis.
   Events that would overlap are stacked; zoom in to spread them out.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const { esc, sv } = GI;
  const tl = GI.timeline = {};

  // link each event to its lesson
  GI.TIMELINE.sort((a, b) => a.year - b.year);
  GI.eventById = {};
  GI.TIMELINE.forEach(e => {
    GI.eventById[e.id] = e;
    e.lesson = GI.lessonBySlug[e.to[0]] || null;
    if (!e.lesson) console.warn(`Timeline event "${e.id}" links to lesson "${e.to[0]}", which doesn't exist`);
  });

  tl.href = e => e.lesson ? `${GI.lessonHref(e.lesson)}.${e.to[1] === "model" ? "model" : "q" + e.to[1]}` : "#timeline";
  tl.target = e => {
    if (!e.lesson) return "";
    if (e.to[1] === "model") return `Lesson ${e.lesson.n} · ${e.lesson.short} · interactive model`;
    const note = e.lesson.notes[e.to[1] - 1];
    return `${e.lesson.short} · Q${e.to[1]}: ${note ? note[0] : ""}`;
  };
  tl.forNote = (slug, n) => GI.TIMELINE.filter(e => e.to[0] === slug && e.to[1] === n);
  tl.forCourse = c => GI.TIMELINE.filter(e => e.lesson && e.lesson.course === c);

  // ---------- vertical list ----------
  tl.list = events => `
    <ol class="tl-list">${events.map(e => `
      <li class="tl-item" id="ev-${e.id}" data-field="${e.field}" data-id="${e.id}">
        <span class="tl-year mono">${e.year}</span>
        <div class="tl-body">
          <p class="tl-field mono"><span class="fdot">${esc(GI.FIELDS[e.field].short)}</span></p>
          <h3>${esc(e.title)}</h3>
          <p class="tl-q"><span class="eyebrow">The question</span>${esc(e.question)}</p>
          <p class="tl-sum">${esc(e.summary)}</p>
          ${e.lesson ? `<a class="tl-go" href="${tl.href(e)}"><span class="mono">Answered in</span><span>${esc(tl.target(e))}</span><span aria-hidden="true">→</span></a>` : ""}
        </div>
      </li>`).join("")}
    </ol>`;

  // ---------- lane chart with zoom ----------
  // Time is first "warped" so years before 1945 take less room (most events are later),
  // then zoomed linearly: the view is a window [a, b] of the warped 0–1 range.
  const BREAK = 1945;

  tl.chart = (el, events, opts = {}) => {
    const fields = opts.fields || GI.ORDER.filter(k => events.some(e => e.field === k));
    if (!events.length) { el.innerHTML = `<p class="empty">No events yet.</p>`; return { select() {} }; }

    // ----- time domain and warp -----
    const years = events.map(e => e.year);
    const Y0 = Math.min(1865, Math.floor((Math.min(...years) - 8) / 5) * 5);
    const Y1 = Math.max(new Date().getFullYear() + 4, Math.max(...years) + 5);
    const hasBreak = Y0 < BREAK - 20 && Y1 > BREAK + 20;
    const E = hasBreak ? 0.65 * (BREAK - Y0) / (Y1 - Y0) : 0;          // share of width before 1945
    const u = y => !hasBreak ? (y - Y0) / (Y1 - Y0)
      : y <= BREAK ? (y - Y0) / (BREAK - Y0) * E : E + (y - BREAK) / (Y1 - BREAK) * (1 - E);
    const uInv = v => !hasBreak ? Y0 + v * (Y1 - Y0)
      : v <= E ? Y0 + v / E * (BREAK - Y0) : BREAK + (v - E) / (1 - E) * (Y1 - BREAK);
    const MIN_SPAN = 5 / (Y1 - (hasBreak ? BREAK : Y0)) * (hasBreak ? 1 - E : 1);   // about 5 years

    // ----- periods for the quick buttons -----
    const thisYear = new Date().getFullYear();
    const eras = [["all", "All years", Y0, Y1]];
    if (hasBreak) eras.push(["early", `Before ${BREAK}`, Y0, BREAK]);
    if (Y1 > 1990 && Y0 < 1990) { eras.push(["mid", `${Math.max(BREAK, Y0)}–1990`, Math.max(BREAK, Y0), 1990]); eras.push(["late", `1990–${thisYear}`, 1990, Y1]); }

    el.innerHTML = `
      <div class="tl-chart">
        <div class="tl-tools">
          <div class="tl-zoom" role="group" aria-label="Zoom">
            <button type="button" data-z="out" aria-label="Zoom out">−</button>
            <button type="button" data-z="in" aria-label="Zoom in">+</button>
          </div>
          <div class="tl-eras" role="group" aria-label="Show a period">${eras.map(([k, l]) => `<button type="button" data-era="${k}">${esc(l)}</button>`).join("")}</div>
        </div>
        <div class="tl-plot"></div>
        <p class="tl-help">Ctrl/⌘ + scroll or pinch to zoom · drag to move · ${hasBreak ? `years before ${BREAK} are compressed (⫽ on the axis)` : "click an event to open its lesson"}</p>
      </div>
      <div class="tl-detail" aria-live="polite"></div>`;
    const plot = el.querySelector(".tl-plot"), detail = el.querySelector(".tl-detail");
    const svg = sv("svg", { class: "tl-svg", role: "group", "aria-label": "Timeline. Tab to an event and press Enter to open the lesson section that answers its question." }, plot);

    // ----- state -----
    let view = { a: 0, b: 1 }, hoverId = null, pinnedId = null, geo = null, raf = 0;
    const dotEls = new Map();
    const zoomed = () => view.b - view.a < 0.999;

    function setView(a, b) {
      let span = Math.min(1, Math.max(MIN_SPAN, b - a));
      const c = (a + b) / 2;
      a = c - span / 2; b = c + span / 2;
      if (a < 0) { b -= a; a = 0; } if (b > 1) { a -= b - 1; b = 1; }
      view = { a: Math.max(0, a), b: Math.min(1, b) };
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); });
    }
    const zoomAt = (factor, uc) => {
      const span = view.b - view.a, ns = Math.min(1, Math.max(MIN_SPAN, span * factor));
      const t = (uc - view.a) / span;
      setView(uc - t * ns, uc - t * ns + ns);
    };
    const panBy = du => setView(view.a + du, view.b + du);

    // ----- drawing -----
    function render() {
      const W = Math.max(300, plot.clientWidth || 800), narrow = W < 600;
      const left = narrow ? 86 : 118, right = 14, top = 6, laneH = narrow ? 76 : 86;
      const axisY = top + fields.length * laneH + 4, ovY = axisY + 34, ovH = 22, H = ovY + ovH + 4;
      const pw = W - left - right;
      const X = y => left + (u(y) - view.a) / (view.b - view.a) * pw;
      const Xo = y => left + u(y) * pw;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("height", H);
      svg.innerHTML = "";
      const defs = sv("defs", {}, svg);
      const clipId = "tlclip" + Math.random().toString(36).slice(2, 8);
      sv("rect", { x: left, y: 0, width: pw, height: axisY }, sv("clipPath", { id: clipId }, defs));

      // lanes
      fields.forEach((k, i) => {
        const y = top + i * laneH;
        sv("rect", { x: left, y: y + 4, width: pw, height: laneH - 8, rx: 8, class: "tl-lane", "data-field": k }, svg);
        sv("text", { x: left - 12, y: y + laneH / 2 + 5, class: "tl-lane-label", "text-anchor": "end", "data-field": k }, svg).textContent = GI.FIELDS[k].short;
      });

      // axis and ticks (separate tick spacing on each side of the break)
      const ya = uInv(view.a), yb = uInv(view.b);
      const grid = sv("g", { "clip-path": `url(#${clipId})` }, svg);
      sv("line", { x1: left, x2: W - right, y1: axisY, y2: axisY, class: "tl-axis" }, svg);
      const segs = hasBreak ? [[ya, Math.min(yb, BREAK)], [Math.max(ya, BREAK), yb]] : [[ya, yb]];
      const minGap = narrow ? 46 : 54;
      segs.forEach(([s0, s1]) => {
        if (s1 - s0 <= 0) return;
        const ppy = (X(s1) - X(s0)) / (s1 - s0);
        const step = [1, 2, 5, 10, 20, 25, 50, 100].find(st => st * ppy >= minGap) || 100;
        for (let y = Math.ceil(s0 / step) * step; y <= s1 + 1e-9; y += step) {
          if (hasBreak && Math.abs(X(y) - X(BREAK)) < 26) continue;
          const x = X(y); if (x < left - 1 || x > W - right + 1) continue;
          sv("line", { x1: x, x2: x, y1: top + 4, y2: axisY, class: "tl-grid" }, grid);
          sv("line", { x1: x, x2: x, y1: axisY, y2: axisY + 6, class: "tl-axis" }, svg);
          sv("text", { x, y: axisY + 22, class: "tl-tick", "text-anchor": "middle" }, svg).textContent = y;
        }
      });
      if (hasBreak && BREAK > ya && BREAK < yb) {
        const bx = X(BREAK);
        sv("rect", { x: bx - 7, y: axisY - 5, width: 14, height: 10, class: "tl-break-bg" }, svg);
        sv("path", { d: `M${bx - 9} ${axisY + 6}L${bx - 2} ${axisY - 6}M${bx + 2} ${axisY + 6}L${bx + 9} ${axisY - 6}`, class: "tl-axis" }, svg);
      }

      // events, stacked within a lane when they would overlap
      const R = narrow ? 8 : 9, gap = 2 * R + 5, offs = [0, -22, 22, -11, 11, -30, 30].filter(o => Math.abs(o) <= laneH / 2 - R - 4);
      const dotsG = sv("g", { "clip-path": `url(#${clipId})` }, svg);
      dotEls.clear();
      const centers = [];
      fields.forEach((k, li) => {
        const rows = [];
        events.filter(e => e.field === k).sort((a, b) => a.year - b.year).forEach(e => {
          const x = X(e.year);
          if (x < left - R || x > W - right + R) return;
          let r = rows.findIndex(lx => x - lx >= gap); if (r < 0) { r = rows.length; rows.push(-1e9); }
          rows[r] = x;
          const y = top + li * laneH + laneH / 2 + (offs[r % offs.length] || 0);
          const a = sv("a", { href: tl.href(e), class: "tl-dot", "data-field": e.field, "data-id": e.id, "aria-label": `${e.year}: ${e.title}. Open the lesson section that answers: ${e.question}` }, dotsG);
          sv("circle", { cx: x, cy: y, r: R, class: "tl-mark" }, a);
          a.addEventListener("focus", () => setHover(e.id));
          a.addEventListener("blur", () => setHover(null));
          dotEls.set(e.id, a);
          centers.push({ id: e.id, x, y });
        });
      });

      // overview strip: every event, plus the window currently shown
      sv("rect", { x: left, y: ovY, width: pw, height: ovH, rx: 5, class: "tl-ov" }, svg);
      events.forEach(e => {
        const li = fields.indexOf(e.field); if (li < 0) return;
        sv("circle", { cx: Xo(e.year), cy: ovY + 5 + li * ((ovH - 10) / Math.max(1, fields.length - 1 || 1)), r: 2.2, class: "tl-ov-dot", "data-field": e.field }, svg);
      });
      if (zoomed()) sv("rect", { x: left + view.a * pw, y: ovY - 1, width: Math.max(6, (view.b - view.a) * pw), height: ovH + 2, rx: 5, class: "tl-ov-win" }, svg);
      sv("text", { x: left - 12, y: ovY + ovH / 2 + 4, class: "tl-tick", "text-anchor": "end" }, svg).textContent = "Overview";

      geo = { left, pw, ovY, ovH, axisY, centers, R };
      paint();
      // buttons
      el.querySelector('[data-z="out"]').disabled = !zoomed();
      el.querySelector('[data-z="in"]').disabled = view.b - view.a <= MIN_SPAN * 1.01;
      el.querySelectorAll("[data-era]").forEach(btn => {
        const [, , y0, y1] = eras.find(x => x[0] === btn.dataset.era);
        btn.setAttribute("aria-pressed", Math.abs(u(y0) - view.a) < 0.02 && Math.abs(u(y1) - view.b) < 0.02);
      });
    }

    // ----- hover, selection and the detail panel -----
    const blank = `<p class="tl-hint"><span class="eyebrow">How to use</span>Point at an event to see the question behind it. Click it to jump to the lesson section that answers that question. On a touch screen, tap once to read and tap again to open.</p>`;
    function show(e) {
      if (!e) { detail.innerHTML = blank; detail.removeAttribute("data-field"); return; }
      detail.dataset.field = e.field;
      detail.innerHTML = `
        <div class="tl-d-head"><span class="tl-year mono">${e.year}</span><span class="fdot mono">${esc(GI.FIELDS[e.field].short)}</span></div>
        <h3>${esc(e.title)}</h3>
        <p class="tl-q"><span class="eyebrow">The question</span>${esc(e.question)}</p>
        ${e.lesson ? `<a class="tl-go" href="${tl.href(e)}"><span class="mono">Answered in</span><span>${esc(tl.target(e))}</span><span aria-hidden="true">→</span></a>` : ""}`;
    }
    let shown;
    function paint() {
      dotEls.forEach((a, id) => a.classList.toggle("on", id === hoverId || (!hoverId && id === pinnedId)));
      const id = hoverId || pinnedId;
      if (id !== shown) { shown = id; show(GI.eventById[id]); }
    }
    function setHover(id) { if (id === hoverId) return; hoverId = id; paint(); }

    // nearest event to a point, within reach
    function nearest(p, reach = 20) {
      if (!geo || p.y > geo.axisY) return null;
      let best = null, bd = reach * reach;
      geo.centers.forEach(c => { const d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2; if (d < bd) { bd = d; best = c; } });
      return best;
    }

    // ----- pointer input: hover, click, drag to pan, pinch to zoom -----
    const pt = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const uAt = x => view.a + (x - geo.left) / geo.pw * (view.b - view.a);
    const pointers = new Map();
    let drag = null, pinch = null;

    svg.addEventListener("pointerdown", e => {
      const p = pt(e);
      pointers.set(e.pointerId, p);
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1 }; drag = null; return;
      }
      if (geo && p.y >= geo.ovY - 4) {            // overview: jump the window there and drag it
        drag = { mode: "ov" };
        const c = (p.x - geo.left) / geo.pw, span = view.b - view.a;
        if (zoomed()) setView(c - span / 2, c + span / 2);
      } else drag = { mode: "pan", x0: p.x, a: view.a, b: view.b, moved: false };
    });

    svg.addEventListener("pointermove", e => {
      const p = pt(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pinch && pointers.size === 2) {
        const [p1, p2] = [...pointers.values()], d = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1;
        zoomAt(pinch.d / d, uAt((p1.x + p2.x) / 2)); pinch.d = d; return;
      }
      if (drag && drag.mode === "ov" && e.buttons) {
        const c = (p.x - geo.left) / geo.pw, span = view.b - view.a;
        setView(c - span / 2, c + span / 2); return;
      }
      if (drag && drag.mode === "pan" && (e.buttons || e.pointerType !== "mouse")) {
        const dx = p.x - drag.x0;
        if (Math.abs(dx) > 5) drag.moved = true;
        if (drag.moved && zoomed()) { const du = -dx / geo.pw * (drag.b - drag.a); setView(drag.a + du, drag.b + du); }
        if (drag.moved) return;
      }
      if (e.pointerType === "mouse") {
        const hit = nearest(p);
        setHover(hit ? hit.id : null);
        svg.style.cursor = hit ? "pointer" : zoomed() ? "grab" : "default";
      }
    });

    svg.addEventListener("pointerup", e => {
      const p = pt(e);
      pointers.delete(e.pointerId);
      if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
      const d = drag; drag = null;
      if (!d || d.mode !== "pan" || d.moved) return;
      const hit = nearest(p, e.pointerType === "mouse" ? 20 : 28);
      if (!hit) { if (e.pointerType !== "mouse") { pinnedId = null; paint(); } return; }
      if (e.pointerType !== "mouse" && pinnedId !== hit.id) { pinnedId = hit.id; paint(); return; }   // first tap: read
      const ev = GI.eventById[hit.id]; if (ev) location.hash = tl.href(ev);                       // click or second tap: open
    });
    svg.addEventListener("pointercancel", e => { pointers.delete(e.pointerId); pinch = null; drag = null; });
    svg.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") { setHover(null); svg.style.cursor = ""; } });

    // ctrl/⌘ + wheel (and trackpad pinch) zooms; sideways scroll pans when zoomed
    svg.addEventListener("wheel", e => {
      if (!geo) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(Math.exp(Math.max(-1, Math.min(1, e.deltaY * 0.01))), Math.min(1, Math.max(0, uAt(pt(e).x))));
      } else if (zoomed() && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault(); panBy(e.deltaX / geo.pw * (view.b - view.a));
      }
    }, { passive: false });

    // buttons
    el.querySelector('[data-z="in"]').addEventListener("click", () => zoomAt(0.5, (view.a + view.b) / 2));
    el.querySelector('[data-z="out"]').addEventListener("click", () => zoomAt(2, (view.a + view.b) / 2));
    el.querySelectorAll("[data-era]").forEach(btn => btn.addEventListener("click", () => {
      const [, , y0, y1] = eras.find(x => x[0] === btn.dataset.era);
      setView(u(y0), u(y1));
    }));

    // redraw when the space changes size
    let lastW = 0;
    new ResizeObserver(() => { const w = plot.clientWidth; if (w && Math.abs(w - lastW) > 1) { lastW = w; render(); } }).observe(plot);
    render();
    show(null);

    return {
      // highlight an event (and bring it into view if it's outside the window)
      select(id) {
        const e = GI.eventById[id]; if (!e) return;
        pinnedId = id;
        const ue = u(e.year);
        if (ue < view.a || ue > view.b) { const span = view.b - view.a; setView(ue - span / 2, ue + span / 2); }
        paint();
      }
    };
  };
})(window.GI);
