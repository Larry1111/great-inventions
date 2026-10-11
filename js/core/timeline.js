/* ============================================================
   core/timeline.js: the timeline chart and event list.

   GI.timeline.chart(el, events, { fields, minImportance, onShow })
       Lane chart: one row per field. Point at an event to read its question;
       click to jump to the lesson section that answers it.
       Events are drawn by importance: landmarks are large labeled diamonds,
       major steps filled dots, supporting details small hollow dots. The
       "Show" buttons hide less important events (onShow(level) is called).
       Zoom: scroll, pinch, double-click, the +/− buttons or keys, the period
       buttons, or drag across a stretch of years (on the axis, the overview,
       or anywhere while zoomed out). Drag to move once zoomed in.
       Returns { select(id), setShow(level), update(events, { fields }) }.
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
    e.importance = [1, 2, 3].includes(e.importance) ? e.importance : 2;
    e.short = e.short || e.title;
  });

  // importance levels, and the choices of the chart's "Show" filter
  tl.LEVEL = { 3: "Landmark", 2: "Major step", 1: "Supporting" };
  const SHOW = [[3, "Landmarks"], [2, "Major +"], [1, "All"]];

  tl.href = e => e.lesson ? `${GI.lessonHref(e.lesson)}.${e.to[1] === "model" ? "model" : "q" + e.to[1]}` : "#timeline";
  tl.target = e => {
    if (!e.lesson) return "";
    if (e.to[1] === "model") return `Lesson ${e.lesson.n} · ${e.lesson.short} · interactive model`;
    const note = e.lesson.notes[e.to[1] - 1];
    return `${e.lesson.short} · Q${e.to[1]}: ${note ? note[0] : ""}`;
  };
  tl.forNote = (slug, n) => GI.TIMELINE.filter(e => e.to[0] === slug && e.to[1] === n);
  tl.forCourse = c => GI.TIMELINE.filter(e => e.lesson && e.lesson.course === c);

  const impBadge = e => `<span class="tl-imp" data-imp="${e.importance}">${tl.LEVEL[e.importance]}</span>`;

  // ---------- vertical list ----------
  tl.list = events => `
    <ol class="tl-list">${events.map(e => `
      <li class="tl-item" id="ev-${e.id}" data-field="${e.field}" data-id="${e.id}" data-imp="${e.importance}">
        <span class="tl-year mono">${e.year}</span>
        <div class="tl-body">
          <p class="tl-field mono"><span class="fdot">${esc(GI.FIELDS[e.field].short)}</span>${impBadge(e)}</p>
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
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const measure = document.createElement("canvas").getContext("2d");

  // When the page has just scrolled, a wheel turn over the chart keeps scrolling the
  // page instead of zooming, so the chart never "catches" someone scrolling past it.
  let lastPageScroll = 0;
  addEventListener("scroll", () => { lastPageScroll = performance.now(); }, { passive: true });

  // event marker: diamond for landmarks, filled dot for major steps, hollow dot for the rest
  function marker(parent, e, x, y, r) {
    sv("circle", { cx: x, cy: y, r: r + 6, class: "tl-ring" }, parent);
    if (e.importance === 3) {
      sv("circle", { cx: x, cy: y, r: r + 5, class: "tl-halo" }, parent);
      sv("path", { d: `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`, class: "tl-mark tl-m3" }, parent);
    } else sv("circle", { cx: x, cy: y, r, class: `tl-mark tl-m${e.importance}` }, parent);
  }
  const legendIcon = imp => {
    const r = { 3: 7, 2: 5.5, 1: 4 }[imp];
    return `<svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true">${imp === 3
      ? `<path class="tl-mark tl-m3" d="M0 ${-r}L${r} 0L0 ${r}L${-r} 0Z"/>`
      : `<circle class="tl-mark tl-m${imp}" r="${r}"/>`}</svg>`;
  };

  tl.chart = (el, events, opts = {}) => {
    let all = events, fields = opts.fields || GI.ORDER.filter(k => all.some(e => e.field === k));
    let minImp = opts.minImportance || 1;
    const visible = () => all.filter(e => e.importance >= minImp && fields.includes(e.field));

    // ----- time domain (from every event, so filtering never shifts the axis) and warp -----
    const years = GI.TIMELINE.concat(all).map(e => e.year);
    if (!years.length) { el.innerHTML = `<p class="empty">No events yet.</p>`; return { select() {}, update() {} }; }
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

    const touch = matchMedia("(pointer: coarse)").matches;
    el.innerHTML = `
      <div class="tl-chart">
        <div class="tl-tools">
          <div class="tl-zoom" role="group" aria-label="Zoom">
            <button type="button" data-z="out" aria-label="Zoom out" title="Zoom out (−)">−</button>
            <button type="button" data-z="in" aria-label="Zoom in" title="Zoom in (+)">+</button>
          </div>
          <span class="tl-range mono"></span>
          <div class="tl-eras" role="group" aria-label="Show a period">${eras.map(([k, l]) => `<button type="button" data-era="${k}">${esc(l)}</button>`).join("")}</div>
        </div>
        <div class="tl-tools">
          <div class="tl-show" role="group" aria-label="Show events by importance"><span class="mono">Show</span>${SHOW.map(([v, l]) =>
            `<button type="button" data-show="${v}">${esc(l)}</button>`).join("")}</div>
          <ul class="tl-legend">${[3, 2, 1].map(i => `<li>${legendIcon(i)}${tl.LEVEL[i]}</li>`).join("")}</ul>
        </div>
        <div class="tl-plot"></div>
        <p class="tl-help">${touch ? "Pinch to zoom · swipe across a period to zoom into it · drag to move once zoomed in"
          : "Scroll or double-click to zoom · drag across a period to zoom into it · drag to move once zoomed in · keys: + − ← → 0"}${hasBreak ? ` · years before ${BREAK} are compressed (⫽ on the axis)` : ""}</p>
      </div>
      <div class="tl-detail" aria-live="polite"></div>`;
    const plot = el.querySelector(".tl-plot"), detail = el.querySelector(".tl-detail"), rangeEl = el.querySelector(".tl-range");
    const svg = sv("svg", { class: "tl-svg", tabindex: 0, role: "group", "aria-label": "Timeline. Press + or − to zoom, the arrow keys to move, 0 to see all years. Tab to an event and press Enter to open the lesson section that answers its question." }, plot);

    // ----- view state -----
    let view = { a: 0, b: 1 }, hoverId = null, pinnedId = null, geo = null, raf = 0, anim = 0, brush = null;
    const dotEls = new Map(), lblEls = new Map();
    const zoomed = () => view.b - view.a < 0.999;
    const atMax = () => view.b - view.a <= MIN_SPAN * 1.01;

    function fit(a, b) {
      const span = clamp(b - a, MIN_SPAN, 1), c = (a + b) / 2;
      a = c - span / 2; b = c + span / 2;
      if (a < 0) { b -= a; a = 0; } if (b > 1) { a -= b - 1; b = 1; }
      return { a: Math.max(0, a), b: Math.min(1, b) };
    }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); };
    function setView(a, b) { cancelAnimationFrame(anim); anim = 0; view = fit(a, b); schedule(); }
    // glide to a new window (buttons, periods, double-click, a dragged range)
    function animateTo(a, b) {
      const to = fit(a, b), from = view;
      if (GI.reduce) return setView(to.a, to.b);
      cancelAnimationFrame(anim);
      const t0 = performance.now();
      const step = now => {
        const t = Math.min(1, (now - t0) / 300), k = 1 - (1 - t) ** 3;
        view = { a: from.a + (to.a - from.a) * k, b: from.b + (to.b - from.b) * k };
        render();
        anim = t < 1 ? requestAnimationFrame(step) : 0;
      };
      anim = requestAnimationFrame(step);
    }
    const zoomAt = (factor, uc, smooth) => {
      const span = view.b - view.a, ns = clamp(span * factor, MIN_SPAN, 1), t = (uc - view.a) / span;
      (smooth ? animateTo : setView)(uc - t * ns, uc - t * ns + ns);
    };
    const panBy = (du, smooth) => (smooth ? animateTo : setView)(view.a + du, view.b + du);

    // ----- drawing -----
    function render() {
      const W = Math.max(300, plot.clientWidth || 800), narrow = W < 600;
      const left = narrow ? 86 : 118, right = 14, top = 6, laneH = narrow ? 88 : 108;
      const axisY = top + fields.length * laneH + 4, ovY = axisY + 34, ovH = 22, H = ovY + ovH + 4;
      const pw = W - left - right, span = view.b - view.a;
      const X = y => left + (u(y) - view.a) / span * pw;
      const Xo = y => left + u(y) * pw;
      const ux = v => left + (v - view.a) / span * pw;
      const SIZE = narrow ? { 3: 10, 2: 7, 1: 5 } : { 3: 11, 2: 8, 1: 5.5 };

      // keep keyboard focus on the same event across the redraw
      const act = document.activeElement, focusId = svg.contains(act) ? (act.closest && act.closest(".tl-dot") || {}).dataset?.id || "svg" : null;

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
      sv("rect", { x: left, y: axisY, width: pw, height: 28, class: "tl-axis-band" }, svg);
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

      // events, stacked within a lane when they would overlap. Landmarks are placed first,
      // so they keep the middle of the lane and the smaller events move aside.
      const evs = visible();
      const dotsG = sv("g", { "clip-path": `url(#${clipId})` }, svg);
      dotEls.clear();
      const centers = [];
      fields.forEach((k, li) => {
        const laneTop = top + li * laneH, rows = [];      // rows[i]: markers already in stacking row i
        evs.filter(e => e.field === k).sort((a, b) => b.importance - a.importance || a.year - b.year).forEach(e => {
          const x = X(e.year), r = SIZE[e.importance];
          if (x < left - r || x > W - right + r) return;
          const offs = [0, -26, 26, -13, 13, -36, 36].filter(o => Math.abs(o) <= laneH / 2 - r - 4);
          let row = rows.findIndex(ms => ms.every(m => Math.abs(x - m.x) >= m.r + r + 4));
          if (row < 0) { row = rows.length; rows.push([]); }
          rows[row].push({ x, r });
          centers.push({ id: e.id, e, x, y: laneTop + laneH / 2 + (offs[row % offs.length] || 0), r, laneTop });
        });
      });
      centers.sort((p, q) => p.e.year - q.e.year).forEach(c => {      // in year order, so Tab follows the years
        const e = c.e;
        const a = sv("a", { href: tl.href(e), class: "tl-dot", "data-field": e.field, "data-id": e.id, "data-imp": e.importance,
          "aria-label": `${e.year}, ${tl.LEVEL[e.importance].toLowerCase()}: ${e.title}. Open the lesson section that answers: ${e.question}` }, dotsG);
        marker(a, e, c.x, c.y, c.r);
        a.addEventListener("focus", () => setHover(e.id));
        a.addEventListener("blur", () => setHover(null));
        dotEls.set(e.id, a);
      });

      // labels: landmarks first, then (when zoomed in far enough) the others, wherever they fit
      const labelsG = sv("g", { "clip-path": `url(#${clipId})` }, svg);      // above every marker
      lblEls.clear();
      const shownYears = yb - ya, labels = [], font = getComputedStyle(svg).getPropertyValue("--body") || "sans-serif";
      const boxes = centers.map(c => ({ id: c.id, x0: c.x - c.r - 3, x1: c.x + c.r + 3, y0: c.y - c.r - 3, y1: c.y + c.r + 3 }));
      const clash = b => boxes.some(o => o.id !== b.id && b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)
        || labels.some(o => b.x0 < o.x1 + 6 && b.x1 + 6 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
      centers.slice().sort((p, q) => q.e.importance - p.e.importance || p.e.year - q.e.year).forEach(c => {
        const imp = c.e.importance;
        if (imp === 2 && shownYears > 80 || imp === 1 && shownYears > 35) return;
        const fs = imp === 3 ? (narrow ? 11.5 : 12.5) : narrow ? 10.5 : 11.5;
        measure.font = `${imp === 3 ? 600 : 500} ${fs}px ${font}`;
        const w = measure.measureText(c.e.short).width, gap = c.e.importance === 3 ? 8 : 5;
        // try above, below, right and left of the marker; the label's left edge is x0
        const spots = [[c.x - w / 2, c.y - c.r - gap], [c.x - w / 2, c.y + c.r + fs + gap - 2],
          [c.x + c.r + gap, c.y + fs * 0.35], [c.x - c.r - gap - w, c.y + fs * 0.35]];
        for (const [i, [sx, base]] of spots.entries()) {
          const x0 = clamp(sx, left + 3, W - right - 3 - w);
          if (i > 1 && x0 !== sx) continue;                     // a side label must not be pushed onto its marker
          const b = { id: c.id, x0, x1: x0 + w, y0: base - fs, y1: base + 3 };
          if (b.y0 < c.laneTop + 5 || b.y1 > c.laneTop + laneH - 5 || clash(b)) continue;
          labels.push(b);
          const t = sv("text", { x: x0, y: base, class: `tl-lbl tl-lbl${imp}`, "font-size": fs, "data-field": c.e.field, "aria-hidden": "true" }, labelsG);
          t.textContent = c.e.short;
          lblEls.set(c.id, t);
          break;
        }
      });

      if (!evs.length) sv("text", { x: left + pw / 2, y: top + fields.length * laneH / 2 + 5, class: "tl-empty", "text-anchor": "middle" }, svg).textContent = "No events match these filters";

      // a range being dragged out on the chart
      if (brush && !brush.ov) {
        const x0 = ux(Math.min(brush.u0, brush.u1)), x1 = ux(Math.max(brush.u0, brush.u1));
        sv("rect", { x: x0, y: top + 2, width: Math.max(1, x1 - x0), height: axisY - top - 2, class: "tl-brush" }, svg);
        const lab = `${Math.round(uInv(Math.min(brush.u0, brush.u1)))}–${Math.round(uInv(Math.max(brush.u0, brush.u1)))}`;
        sv("text", { x: clamp((x0 + x1) / 2, left + 30, W - right - 30), y: top + 18, class: "tl-brush-lbl", "text-anchor": "middle" }, svg).textContent = lab;
      }

      // overview strip: every event, plus the window currently shown
      sv("rect", { x: left, y: ovY, width: pw, height: ovH, rx: 5, class: "tl-ov" }, svg);
      evs.forEach(e => {
        const li = fields.indexOf(e.field);
        sv("circle", { cx: Xo(e.year), cy: ovY + (fields.length > 1 ? 5 + li * (ovH - 10) / (fields.length - 1) : ovH / 2), r: { 3: 3.2, 2: 2.3, 1: 1.6 }[e.importance], class: "tl-ov-dot", "data-field": e.field }, svg);
      });
      if (zoomed()) sv("rect", { x: left + view.a * pw, y: ovY - 1, width: Math.max(6, span * pw), height: ovH + 2, rx: 5, class: "tl-ov-win" }, svg);
      if (brush && brush.ov) {
        const x0 = Xo(uInv(Math.min(brush.u0, brush.u1))), x1 = Xo(uInv(Math.max(brush.u0, brush.u1)));
        sv("rect", { x: x0, y: ovY - 1, width: Math.max(1, x1 - x0), height: ovH + 2, rx: 5, class: "tl-ov-win tl-brush" }, svg);
      }
      sv("text", { x: left - 12, y: ovY + ovH / 2 + 4, class: "tl-tick", "text-anchor": "end" }, svg).textContent = "Overview";

      geo = { left, pw, ovY, axisY, centers, labels };
      const refocus = focusId && (dotEls.get(focusId) || svg);
      if (refocus && refocus !== document.activeElement) refocus.focus({ preventScroll: true });
      paint();

      // controls
      el.querySelector('[data-z="out"]').disabled = !zoomed();
      el.querySelector('[data-z="in"]').disabled = atMax();
      rangeEl.textContent = `${Math.round(ya)}–${Math.round(yb)}`;
      el.querySelectorAll("[data-era]").forEach(btn => {
        const [, , y0, y1] = eras.find(x => x[0] === btn.dataset.era);
        btn.setAttribute("aria-pressed", Math.abs(u(y0) - view.a) < 0.02 && Math.abs(u(y1) - view.b) < 0.02);
      });
      el.querySelectorAll("[data-show]").forEach(btn => btn.setAttribute("aria-pressed", +btn.dataset.show === minImp));
    }

    // ----- hover, selection and the detail panel -----
    const blank = `<p class="tl-hint"><span class="eyebrow">How to use</span>Point at an event to see the question behind it. Click it to jump to the lesson section that answers that question. On a touch screen, tap once to read and tap again to open.<span>Diamonds mark the landmark inventions. Use <b>Show</b> to hide the smaller steps.</span></p>`;
    function show(e) {
      if (!e) { detail.innerHTML = blank; detail.removeAttribute("data-field"); return; }
      detail.dataset.field = e.field;
      detail.innerHTML = `
        <div class="tl-d-head"><span class="tl-year mono">${e.year}</span><span class="fdot mono">${esc(GI.FIELDS[e.field].short)}</span>${impBadge(e)}</div>
        <h3>${esc(e.title)}</h3>
        <p class="tl-q"><span class="eyebrow">The question</span>${esc(e.question)}</p>
        <p class="tl-sum">${esc(e.summary)}</p>
        ${e.lesson ? `<a class="tl-go" href="${tl.href(e)}"><span class="mono">Answered in</span><span>${esc(tl.target(e))}</span><span aria-hidden="true">→</span></a>` : ""}`;
    }
    let shown;
    function paint() {
      const on = id => id === hoverId || (!hoverId && id === pinnedId);
      dotEls.forEach((a, id) => a.classList.toggle("on", on(id)));
      lblEls.forEach((t, id) => t.classList.toggle("on", on(id)));
      const id = hoverId || pinnedId;
      if (id !== shown) { shown = id; show(GI.eventById[id]); }
    }
    function setHover(id) { if (id === hoverId) return; hoverId = id; paint(); }

    // event under a point: the closest marker within reach, or a label the point is on
    function nearest(p, reach = 10) {
      if (!geo || p.y > geo.axisY) return null;
      let best = null, bd = reach;
      geo.centers.forEach(c => { const d = Math.hypot(c.x - p.x, c.y - p.y) - c.r; if (d < bd) { bd = d; best = c; } });
      return best || geo.labels.find(b => p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1) || null;
    }

    // ----- pointer input: hover, click, drag to pan or to pick a range, pinch to zoom -----
    const pt = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const uAt = x => view.a + (x - geo.left) / geo.pw * (view.b - view.a);    // chart position → warped time
    const uOv = x => clamp((x - geo.left) / geo.pw, 0, 1);                     // overview position → warped time
    const inOv = p => p.y >= geo.ovY - 4;
    const pointers = new Map();
    let drag = null, pinch = null;

    svg.addEventListener("pointerdown", e => {
      if (e.button > 0 || !geo) return;
      const p = pt(e);
      pointers.set(e.pointerId, p);
      try { svg.setPointerCapture(e.pointerId); } catch (_) {}
      if (pointers.size === 2) {
        const [p1, p2] = [...pointers.values()];
        pinch = { d: Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1 }; drag = null; brush = null; return;
      }
      if (inOv(p)) {
        const uc = uOv(p.x);
        drag = zoomed() && uc >= view.a && uc <= view.b ? { mode: "ov-move", off: uc - view.a } : { mode: "ov-range", x0: p.x, u0: uc, moved: false };
      } else {
        // on the axis, with Shift, or while showing all years, a drag picks a range to zoom into
        const range = e.shiftKey || !zoomed() || p.y > geo.axisY - 2;
        drag = { mode: range ? "range" : "pan", x0: p.x, a: view.a, b: view.b, u0: clamp(uAt(p.x), view.a, view.b), moved: false };
      }
      if (drag.mode === "ov-move") svg.style.cursor = "grabbing";
    });

    svg.addEventListener("pointermove", e => {
      const p = pt(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pinch && pointers.size === 2) {
        const [p1, p2] = [...pointers.values()], d = Math.hypot(p1.x - p2.x, p1.y - p2.y) || 1;
        zoomAt(pinch.d / d, clamp(uAt((p1.x + p2.x) / 2), 0, 1)); pinch.d = d; return;
      }
      if (drag && (e.buttons || e.pointerType !== "mouse")) {
        if (drag.mode === "ov-move") { const uc = uOv(p.x); setView(uc - drag.off, uc - drag.off + view.b - view.a); return; }
        if (!drag.moved && Math.abs(p.x - drag.x0) > 5) drag.moved = true;
        if (drag.moved) {
          if (drag.mode === "pan") { const du = -(p.x - drag.x0) / geo.pw * (drag.b - drag.a); setView(drag.a + du, drag.b + du); }
          else { brush = drag.mode === "ov-range" ? { ov: true, u0: drag.u0, u1: uOv(p.x) } : { u0: drag.u0, u1: clamp(uAt(p.x), view.a, view.b) }; schedule(); }
          svg.style.cursor = drag.mode === "pan" ? "grabbing" : "col-resize";
          setHover(null);
          return;
        }
      }
      if (e.pointerType === "mouse" && geo) {
        const hit = nearest(p);
        setHover(hit ? hit.id : null);
        svg.style.cursor = hit ? "pointer" : inOv(p) ? (zoomed() && uOv(p.x) >= view.a && uOv(p.x) <= view.b ? "grab" : "col-resize")
          : p.y > geo.axisY - 2 || !zoomed() || e.shiftKey ? "col-resize" : "grab";
      }
    });

    svg.addEventListener("pointerup", e => {
      const p = pt(e);
      pointers.delete(e.pointerId);
      if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
      const d = drag; drag = null;
      if (!d) return;
      if (d.mode === "ov-move") { svg.style.cursor = "grab"; return; }
      if (d.moved) {
        const b = brush; brush = null;
        if (b) { const lo = Math.min(b.u0, b.u1), hi = Math.max(b.u0, b.u1); hi - lo > 1e-4 ? animateTo(lo, hi) : schedule(); }
        return;
      }
      if (d.mode === "ov-range") { const s = view.b - view.a; animateTo(d.u0 - s / 2, d.u0 + s / 2); return; }   // click on the overview: go there
      const hit = nearest(p, e.pointerType === "mouse" ? 10 : 18);
      if (!hit) { if (e.pointerType !== "mouse") { pinnedId = null; paint(); } return; }
      if (e.pointerType !== "mouse" && pinnedId !== hit.id) { pinnedId = hit.id; paint(); return; }   // first tap: read
      const ev = GI.eventById[hit.id]; if (ev) location.hash = tl.href(ev);                       // click or second tap: open
    });
    svg.addEventListener("pointercancel", e => { pointers.delete(e.pointerId); pinch = null; drag = null; if (brush) { brush = null; schedule(); } });
    svg.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !drag) { setHover(null); svg.style.cursor = ""; } });

    // double-click empty space to zoom in there (Shift + double-click zooms out)
    svg.addEventListener("dblclick", e => {
      if (!geo) return;
      const p = pt(e);
      if (inOv(p) || nearest(p)) return;
      e.preventDefault();
      zoomAt(e.shiftKey ? 2 : 0.4, clamp(uAt(p.x), 0, 1), true);
    });

    // scroll wheel / trackpad: up zooms in, down zooms out, sideways moves along the timeline.
    // When the chart can't zoom any further that way, the page scrolls as usual.
    let wheelAt = 0;
    svg.addEventListener("wheel", e => {
      if (!geo) return;
      const now = performance.now(), px = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const dx = e.deltaX * px, dy = e.deltaY * px, span = view.b - view.a;
      if (Math.abs(dx) > Math.abs(dy) || (e.shiftKey && dy)) {
        if (!zoomed()) return;
        e.preventDefault(); wheelAt = now;
        panBy((Math.abs(dx) > Math.abs(dy) ? dx : dy) / geo.pw * span); return;
      }
      if (!dy) return;
      const pinchGesture = e.ctrlKey || e.metaKey;           // trackpad pinch arrives as Ctrl + wheel
      if (!pinchGesture) {
        if (now - lastPageScroll < 350 && now - wheelAt > 350) return;
        if (dy < 0 ? atMax() : !zoomed()) return;
      }
      e.preventDefault(); wheelAt = now;
      const p = pt(e);
      zoomAt(Math.exp(clamp(dy * (pinchGesture ? 0.01 : 0.0025), -0.6, 0.6)), inOv(p) ? uOv(p.x) : clamp(uAt(p.x), 0, 1));
    }, { passive: false });

    // keyboard, while the chart or one of its events has focus
    svg.addEventListener("keydown", e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const span = view.b - view.a, c = (view.a + view.b) / 2;
      if (e.key === "+" || e.key === "=") zoomAt(0.5, c, true);
      else if (e.key === "-" || e.key === "_") zoomAt(2, c, true);
      else if (e.key === "0") animateTo(0, 1);
      else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && zoomed()) panBy((e.key === "ArrowLeft" ? -0.3 : 0.3) * span, true);
      else return;
      e.preventDefault();
    });

    // buttons
    el.querySelector('[data-z="in"]').addEventListener("click", () => zoomAt(0.5, (view.a + view.b) / 2, true));
    el.querySelector('[data-z="out"]').addEventListener("click", () => zoomAt(2, (view.a + view.b) / 2, true));
    el.querySelectorAll("[data-era]").forEach(btn => btn.addEventListener("click", () => {
      const [, , y0, y1] = eras.find(x => x[0] === btn.dataset.era);
      animateTo(u(y0), u(y1));
    }));
    el.querySelectorAll("[data-show]").forEach(btn => btn.addEventListener("click", () => {
      minImp = +btn.dataset.show;
      dropHidden();
      render();
      if (opts.onShow) opts.onShow(minImp);
    }));
    const dropHidden = () => {
      const ids = new Set(visible().map(e => e.id));
      if (!ids.has(pinnedId)) pinnedId = null;
      if (!ids.has(hoverId)) hoverId = null;
    };

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
      },
      // show events of this importance and up (doesn't call onShow)
      setShow(level) { minImp = level; dropHidden(); render(); },
      // new set of events or lanes, keeping the current zoom
      update(evts, o = {}) {
        all = evts;
        if (o.fields) fields = o.fields;
        dropHidden();
        render();
      }
    };
  };
})(window.GI);
