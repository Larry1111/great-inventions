/* ============================================================
   core/timeline.js: the timeline chart and event list.

   GI.timeline.chart(el, events, opts)
       Lane chart with one lane per field. Click a field's name (or "Branches")
       to split it into lanes for its branches.
       Click an event to select it: the panel beside the chart shows its
       question, a preview of the lesson section that answers it, and the
       events it built on and led to. Those links are drawn on the chart.
       Events are drawn by importance: landmarks are large labeled diamonds,
       major steps filled dots, supporting details small hollow dots.
       Zoom: scroll, pinch, double-click, the +/− buttons or keys, the period
       buttons, or drag across a stretch of years (on the axis, the overview,
       or anywhere while zoomed out). Drag to move once zoomed in.
       opts: fields      fields to show, in order
             branches    branch keys to show when a field is split (default: all)
             minImportance, onShow(level)   the "Show" filter
             state       an object the chart keeps its zoom, split fields and
                         selection in, so they survive leaving the page
       Returns { select(id), setShow(level), update(events, { fields, branches }) }.
   GI.timeline.list(events)                   vertical list (HTML string).
   GI.timeline.href(event)                    address of the linked lesson section, or null.
   GI.timeline.forNote(lessonSlug, n)         events that link to a lesson's note.
   GI.timeline.returnScroll(page)             where to scroll when coming back to a
                                              page from a lesson opened in its timeline.

   The time axis has a break at 1945: the years before it are compressed,
   because most events happen after 1945. The break is drawn on the axis.
   Events that would overlap are stacked; zoom in to spread them out.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const { esc, sv } = GI;
  const tl = GI.timeline = {};

  // ---------- prepare the events ----------
  GI.TIMELINE.sort((a, b) => a.year - b.year || GI.ORDER.indexOf(a.field) - GI.ORDER.indexOf(b.field));
  GI.eventById = {};
  GI.TIMELINE.forEach(e => { GI.eventById[e.id] = e; e.next = []; });
  GI.TIMELINE.forEach(e => {
    e.lesson = e.to ? GI.lessonBySlug[e.to[0]] || null : null;
    if (e.to && !e.lesson) console.warn(`Timeline event "${e.id}" links to lesson "${e.to[0]}", which doesn't exist`);
    if (!GI.BRANCHES[e.branch]) console.warn(`Timeline event "${e.id}" has unknown branch "${e.branch}"`);
    e.importance = [1, 2, 3].includes(e.importance) ? e.importance : 2;
    e.short = e.short || e.title;
    e.after = (e.after || []).filter(id => {
      if (GI.eventById[id]) { GI.eventById[id].next.push(e.id); return true; }
      console.warn(`Timeline event "${e.id}" builds on "${id}", which doesn't exist`);
    });
  });

  // importance levels, and the choices of the chart's "Show" filter
  tl.LEVEL = { 3: "Landmark", 2: "Major step", 1: "Supporting" };
  const SHOW = [[3, "Landmarks"], [2, "Major +"], [1, "All"]];
  tl.branchesOf = k => Object.keys(GI.BRANCHES).filter(b => GI.BRANCHES[b].field === k);

  tl.href = e => e.lesson ? `${GI.lessonHref(e.lesson)}.${e.to[1] === "model" ? "model" : "q" + e.to[1]}` : null;
  tl.target = e => {
    if (!e.lesson) return "";
    if (e.to[1] === "model") return `Lesson ${e.lesson.n} · ${e.lesson.short} · interactive model`;
    const note = e.lesson.notes[e.to[1] - 1];
    return `${e.lesson.short} · Q${e.to[1]}: ${note ? note[0] : ""}`;
  };
  tl.forNote = (slug, n) => GI.TIMELINE.filter(e => e.to && e.to[0] === slug && e.to[1] === n);
  tl.forCourse = c => GI.TIMELINE.filter(e => e.lesson && e.lesson.course === c);

  const impBadge = e => `<span class="tl-imp" data-imp="${e.importance}">${tl.LEVEL[e.importance]}</span>`;
  const where = e => `${esc(GI.FIELDS[e.field].short)} · ${esc(GI.BRANCHES[e.branch] ? GI.BRANCHES[e.branch].name : "")}`;

  // ---------- vertical list ----------
  tl.list = events => `
    <ol class="tl-list">${events.map(e => `
      <li class="tl-item" id="ev-${e.id}" data-field="${e.field}" data-id="${e.id}" data-imp="${e.importance}">
        <span class="tl-year mono">${e.year}</span>
        <div class="tl-body">
          <p class="tl-field mono"><span class="fdot">${where(e)}</span>${impBadge(e)}</p>
          <h3>${esc(e.title)}</h3>
          <p class="tl-q"><span class="eyebrow">The question</span>${esc(e.question)}</p>
          <p class="tl-sum">${esc(e.summary)}</p>
          ${e.lesson ? `<a class="tl-go" href="${tl.href(e)}"><span class="mono">Answered in</span><span>${esc(tl.target(e))}</span><span aria-hidden="true">→</span></a>`
            : `<p class="tl-nolesson mono">No lesson yet</p>`}
        </div>
      </li>`).join("")}
    </ol>`;

  // ---------- coming back from a lesson opened in the timeline ----------
  // Opening a lesson from the chart remembers the page and scroll position, shows a
  // "Back to timeline" button on the pages that follow, and restores the scroll on return.
  const pageOf = h => (h || "").replace(/^#/, "").split(".")[0] || "home";
  let back = null;                                     // { page, scroll }
  const pill = document.createElement("a");
  pill.className = "tl-back"; pill.hidden = true;
  pill.innerHTML = `<span aria-hidden="true">←</span> Back to timeline`;
  document.body.appendChild(pill);
  const syncPill = () => {
    pill.hidden = !back || pageOf(location.hash) === back.page;
    if (back) pill.href = back.page === "home" ? "#home" : "#" + back.page;
  };
  addEventListener("hashchange", syncPill);
  tl.returnScroll = page => {
    if (!back || back.page !== page) return null;
    const y = back.scroll; back = null; syncPill();
    return y;
  };
  function leaveFor(href) {
    back = { page: pageOf(location.hash), scroll: scrollY };
    location.hash = href;
  }

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

  // every event an event built on (up) and led to (down), however many steps away
  function lineage(id) {
    const up = new Set(), down = new Set();
    const walk = (i, key, seen) => GI.eventById[i][key].forEach(j => { if (!seen.has(j)) { seen.add(j); walk(j, key, seen); } });
    walk(id, "after", up); walk(id, "next", down);
    return { up, down };
  }

  tl.chart = (el, events, opts = {}) => {
    const st = opts.state || {};
    let all = events, fields = opts.fields || GI.ORDER.filter(k => all.some(e => e.field === k));
    let branchSel = opts.branches || null;
    let minImp = opts.minImportance || 1;
    const visible = () => all.filter(e => e.importance >= minImp && fields.includes(e.field) && (!branchSel || branchSel.includes(e.branch)));
    const branchesIn = k => tl.branchesOf(k).filter(b => !branchSel || branchSel.includes(b));

    // ----- time domain (from every event, so filtering never shifts the axis) and warp -----
    const years = GI.TIMELINE.concat(all).map(e => e.year);
    if (!years.length) { el.innerHTML = `<p class="empty">No events yet.</p>`; return { select() {}, setShow() {}, update() {} }; }
    const Y0 = Math.min(1865, Math.floor((Math.min(...years) - 8) / 5) * 5);
    const Y1 = Math.max(new Date().getFullYear() + 4, Math.max(...years) + 5);
    const hasBreak = Y0 < BREAK - 20 && Y1 > BREAK + 20;
    const E = hasBreak ? 0.6 * (BREAK - Y0) / (Y1 - Y0) : 0;           // share of width before 1945
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
          <div class="tl-show">
            <button type="button" data-opt="split" title="Split each field into its branches">Branches</button>
            <button type="button" data-opt="links" title="Show which events led to which">Links</button>
          </div>
          <ul class="tl-legend">${[3, 2, 1].map(i => `<li>${legendIcon(i)}${tl.LEVEL[i]}</li>`).join("")}</ul>
        </div>
        <div class="tl-plot"><div class="tl-tip" hidden></div></div>
        <p class="tl-help">${touch ? "Tap an event to select it · tap a field to split it into branches · pinch to zoom · swipe across a period to zoom into it · drag to move once zoomed in"
          : "Click an event to select it · click a field to split it into branches · scroll or double-click to zoom · drag across a period to zoom into it · drag to move once zoomed in · keys: + − ← → 0"}${hasBreak ? ` · years before ${BREAK} are compressed (⫽)` : ""}</p>
      </div>
      <div class="tl-detail" aria-live="polite"></div>`;
    const plot = el.querySelector(".tl-plot"), detail = el.querySelector(".tl-detail"), rangeEl = el.querySelector(".tl-range"), tip = el.querySelector(".tl-tip");
    const svg = sv("svg", { class: "tl-svg", tabindex: 0, role: "group", "aria-label": "Timeline. Press + or − to zoom, the arrow keys to move, 0 to see all years. Tab to an event and press Enter to select it." }, plot);

    // ----- view state (kept in st so it survives leaving the page) -----
    let view = st.view || { a: 0, b: 1 }, hoverId = null, pinnedId = st.pinned || null;
    let expanded = new Set(st.expanded || []), showLinks = !!st.links;
    let geo = null, raf = 0, anim = 0, brush = null;
    const save = () => Object.assign(st, { view, pinned: pinnedId, expanded: [...expanded], links: showLinks });
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
    function setView(a, b) { cancelAnimationFrame(anim); anim = 0; view = fit(a, b); save(); schedule(); }
    // glide to a new window (buttons, periods, double-click, a dragged range, a selected event)
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
        if (!anim) save();
      };
      anim = requestAnimationFrame(step);
    }
    const zoomAt = (factor, uc, smooth) => {
      const span = view.b - view.a, ns = clamp(span * factor, MIN_SPAN, 1), t = (uc - view.a) / span;
      (smooth ? animateTo : setView)(uc - t * ns, uc - t * ns + ns);
    };
    const panBy = (du, smooth) => (smooth ? animateTo : setView)(view.a + du, view.b + du);
    // bring an event into view if it's outside (or right at the edge of) the window
    function reveal(e) {
      const ue = u(e.year), span = view.b - view.a, pad = span * 0.1;
      if (ue < view.a + pad || ue > view.b - pad) animateTo(ue - span / 2, ue + span / 2);
    }

    // ----- drawing -----
    let linksG = null, posById = new Map();
    function render() {
      const W = Math.max(300, plot.clientWidth || 800), narrow = W < 600;
      const left = narrow ? 104 : 136, right = 14, top = 6;
      const laneH = narrow ? 88 : 108, subH = narrow ? 64 : 74, headH = 30;
      const pw = W - left - right, span = view.b - view.a;
      const X = y => left + (u(y) - view.a) / span * pw;
      const Xo = y => left + u(y) * pw;
      const ux = v => left + (v - view.a) / span * pw;
      const SIZE = narrow ? { 3: 10, 2: 7, 1: 5 } : { 3: 11, 2: 8, 1: 5.5 };

      // rows: a field is one lane, or a header followed by one lane per branch
      const rows = [];
      let yy = top;
      fields.forEach(k => {
        const bs = branchesIn(k);
        if (expanded.has(k) && bs.length) {
          rows.push({ kind: "head", field: k, y: yy, h: headH }); yy += headH;
          bs.forEach(b => { rows.push({ kind: "lane", field: k, branch: b, y: yy, h: subH }); yy += subH; });
        } else { rows.push({ kind: "lane", field: k, branch: null, y: yy, h: laneH }); yy += laneH; }
      });
      const lanes = rows.filter(r => r.kind === "lane");
      const laneOf = e => lanes.find(r => r.field === e.field && (!r.branch || r.branch === e.branch));
      const axisY = yy + 4, ovY = axisY + 34, ovH = 26, H = ovY + ovH + 4;

      // keep keyboard focus on the same event or toggle across the redraw
      const act = document.activeElement;
      const focusKey = svg.contains(act) ? (act.dataset && (act.dataset.id ? "d" + act.dataset.id : act.dataset.toggle ? "t" + act.dataset.toggle : "")) || "svg" : null;

      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.setAttribute("height", H);
      svg.innerHTML = "";
      const defs = sv("defs", {}, svg);
      const uid = Math.random().toString(36).slice(2, 8);
      sv("rect", { x: left, y: 0, width: pw, height: axisY }, sv("clipPath", { id: "tlclip" + uid }, defs));
      const clip = `url(#tlclip${uid})`;
      const mk = sv("marker", { id: "tlarr" + uid, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
      sv("path", { d: "M0 1L10 5L0 9Z", class: "tl-arrow" }, mk);

      // lanes and their labels; field names toggle the split into branches
      rows.forEach(r => {
        const b = r.branch && GI.BRANCHES[r.branch];
        if (r.kind === "lane") sv("rect", { x: left, y: r.y + 3, width: pw, height: r.h - 6, rx: 8, class: "tl-lane" + (r.branch ? " tl-sublane" : ""), "data-field": r.field }, svg);
        if (r.kind === "lane" && r.branch) {
          sv("text", { x: left - 12, y: r.y + r.h / 2 + 4, class: "tl-branch-label", "text-anchor": "end", "data-field": r.field }, svg).textContent = b.short;
          return;
        }
        const open = r.kind === "head", nb = branchesIn(r.field).length;
        const g = sv("g", { class: "tl-toggle", role: "button", tabindex: 0, "data-toggle": r.field, "data-field": r.field, "aria-expanded": open,
          "aria-label": `${GI.FIELDS[r.field].name}: ${open ? "join its branches into one lane" : `split into ${nb} branches`}` }, svg);
        sv("rect", { x: 0, y: r.y + 3, width: left - 4, height: r.h - 6, rx: 6, class: "tl-toggle-bg" }, g);
        const cy = open ? r.y + r.h / 2 + 5 : r.y + r.h / 2 - 2;
        const fsz = narrow ? 13.5 : 15;
        sv("text", { x: left - 12, y: cy, class: "tl-lane-label", "text-anchor": "end", "font-size": fsz }, g).textContent = GI.FIELDS[r.field].short;
        const cx = left - 12 - measureW(GI.FIELDS[r.field].short, `600 ${fsz}px`) - 12;
        sv("path", { d: open ? `M${cx - 4} ${cy - 7}L${cx} ${cy - 3}L${cx + 4} ${cy - 7}` : `M${cx - 2} ${cy - 9}L${cx + 2} ${cy - 5}L${cx - 2} ${cy - 1}`, class: "tl-chev" }, g);
        if (!open && nb) sv("text", { x: left - 12, y: cy + 17, class: "tl-lane-sub", "text-anchor": "end" }, g).textContent = `${nb} branch${nb > 1 ? "es" : ""}`;
      });

      // axis and ticks (separate tick spacing on each side of the break)
      const ya = uInv(view.a), yb = uInv(view.b);
      const grid = sv("g", { "clip-path": clip }, svg);
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
          sv("line", { x1: x, x2: x, y1: top + 3, y2: axisY, class: "tl-grid" }, grid);
          sv("line", { x1: x, x2: x, y1: axisY, y2: axisY + 6, class: "tl-axis" }, svg);
          sv("text", { x, y: axisY + 22, class: "tl-tick", "text-anchor": "middle" }, svg).textContent = y;
        }
      });
      if (hasBreak && BREAK > ya && BREAK < yb) {
        const bx = X(BREAK);
        sv("rect", { x: bx - 7, y: axisY - 5, width: 14, height: 10, class: "tl-break-bg" }, svg);
        sv("path", { d: `M${bx - 9} ${axisY + 6}L${bx - 2} ${axisY - 6}M${bx + 2} ${axisY + 6}L${bx + 9} ${axisY - 6}`, class: "tl-axis" }, svg);
      }

      // positions: stacked within a lane when they would overlap. Landmarks are placed
      // first, so they keep the middle of the lane and smaller events move aside.
      // Events outside the window get a position too, so links to them can be drawn.
      const evs = visible();
      linksG = sv("g", { "clip-path": clip, class: "tl-links" }, svg);
      const dotsG = sv("g", { "clip-path": clip }, svg);
      dotEls.clear(); posById = new Map();
      const centers = [];
      lanes.forEach(row => {
        const stack = [];      // stack[i]: markers already in stacking row i
        evs.filter(e => laneOf(e) === row).sort((a, b) => b.importance - a.importance || a.year - b.year).forEach(e => {
          const x = X(e.year), r = SIZE[e.importance], mid = row.y + row.h / 2;
          if (x < left - r || x > W - right + r) { posById.set(e.id, { x, y: mid, r }); return; }
          const offs = [0, -24, 24, -12, 12, -34, 34].filter(o => Math.abs(o) <= row.h / 2 - r - 4);
          let i = stack.findIndex(ms => ms.every(m => Math.abs(x - m.x) >= m.r + r + 4));
          if (i < 0) { i = stack.length; stack.push([]); }
          stack[i].push({ x, r });
          const c = { id: e.id, e, x, y: mid + (offs[i % offs.length] || 0), r, row };
          centers.push(c); posById.set(e.id, c);
        });
      });
      centers.sort((p, q) => p.e.year - q.e.year).forEach(c => {      // in year order, so Tab follows the years
        const e = c.e;
        const g = sv("g", { class: "tl-dot", role: "button", tabindex: 0, "data-field": e.field, "data-id": e.id, "data-imp": e.importance,
          "aria-label": `${e.year}, ${tl.LEVEL[e.importance].toLowerCase()}: ${e.title}` }, dotsG);
        marker(g, e, c.x, c.y, c.r);
        g.addEventListener("focus", () => setHover(e.id));
        g.addEventListener("blur", () => setHover(null));
        dotEls.set(e.id, g);
      });

      // labels: landmarks first, then (when zoomed in far enough) the others, wherever they fit
      const labelsG = sv("g", { "clip-path": clip }, svg);      // above every marker
      lblEls.clear();
      const shownYears = yb - ya, labels = [];
      const boxes = centers.map(c => ({ id: c.id, x0: c.x - c.r - 3, x1: c.x + c.r + 3, y0: c.y - c.r - 3, y1: c.y + c.r + 3 }));
      const clash = b => boxes.some(o => o.id !== b.id && b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0)
        || labels.some(o => b.x0 < o.x1 + 6 && b.x1 + 6 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0);
      const chain = pinnedId && posById.has(pinnedId) ? lineage(pinnedId) : null;
      const rank = c => c.id === pinnedId ? 2 : chain && (chain.up.has(c.id) || chain.down.has(c.id)) ? 1 : 0;
      centers.slice().sort((p, q) => rank(q) - rank(p) || q.e.importance - p.e.importance || p.e.year - q.e.year).forEach(c => {
        const imp = c.e.importance;
        if (!rank(c) && (imp === 2 && shownYears > 70 || imp === 1 && shownYears > 30)) return;
        const fs = imp === 3 ? (narrow ? 11.5 : 12.5) : narrow ? 10.5 : 11.5;
        const w = measureW(c.e.short, `${imp === 3 ? 600 : 500} ${fs}px`), gap = imp === 3 ? 8 : 5;
        // try above, below, right and left of the marker; the label's left edge is x0
        const spots = [[c.x - w / 2, c.y - c.r - gap], [c.x - w / 2, c.y + c.r + fs + gap - 2],
          [c.x + c.r + gap, c.y + fs * 0.35], [c.x - c.r - gap - w, c.y + fs * 0.35]];
        for (const [i, [sx, base]] of spots.entries()) {
          const x0 = clamp(sx, left + 3, W - right - 3 - w);
          if (i > 1 && x0 !== sx) continue;                     // a side label must not be pushed onto its marker
          const b = { id: c.id, x0, x1: x0 + w, y0: base - fs, y1: base + 3 };
          if (b.y0 < c.row.y + 4 || b.y1 > c.row.y + c.row.h - 4 || clash(b)) continue;
          labels.push(b);
          const t = sv("text", { x: x0, y: base, class: `tl-lbl tl-lbl${imp}`, "font-size": fs, "data-field": c.e.field, "aria-hidden": "true" }, labelsG);
          t.textContent = c.e.short;
          lblEls.set(c.id, t);
          break;
        }
      });

      if (!evs.length) sv("text", { x: left + pw / 2, y: (top + axisY) / 2 + 5, class: "tl-empty", "text-anchor": "middle" }, svg).textContent = "No events match these filters";

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
        const li = lanes.indexOf(laneOf(e)); if (li < 0) return;
        sv("circle", { cx: Xo(e.year), cy: ovY + (lanes.length > 1 ? 5 + li * (ovH - 10) / (lanes.length - 1) : ovH / 2), r: { 3: 3.2, 2: 2.3, 1: 1.6 }[e.importance], class: "tl-ov-dot", "data-field": e.field }, svg);
      });
      if (zoomed()) sv("rect", { x: left + view.a * pw, y: ovY - 1, width: Math.max(6, span * pw), height: ovH + 2, rx: 5, class: "tl-ov-win" }, svg);
      if (brush && brush.ov) {
        const x0 = Xo(uInv(Math.min(brush.u0, brush.u1))), x1 = Xo(uInv(Math.max(brush.u0, brush.u1)));
        sv("rect", { x: x0, y: ovY - 1, width: Math.max(1, x1 - x0), height: ovH + 2, rx: 5, class: "tl-ov-win tl-brush" }, svg);
      }
      sv("text", { x: left - 12, y: ovY + ovH / 2 + 4, class: "tl-tick", "text-anchor": "end" }, svg).textContent = "Overview";

      geo = { left, pw, ovY, axisY, centers, labels, rows, arrow: `url(#tlarr${uid})` };
      if (focusKey) {
        const f = focusKey === "svg" ? svg : focusKey[0] === "d" ? dotEls.get(focusKey.slice(1)) : svg.querySelector(`[data-toggle="${focusKey.slice(1)}"]`);
        const target = f || svg;
        if (target !== document.activeElement) target.focus({ preventScroll: true });
      }
      paint(true);

      // controls
      el.querySelector('[data-z="out"]').disabled = !zoomed();
      el.querySelector('[data-z="in"]').disabled = atMax();
      rangeEl.textContent = `${Math.round(ya)}–${Math.round(yb)}`;
      el.querySelectorAll("[data-era]").forEach(btn => {
        const [, , y0, y1] = eras.find(x => x[0] === btn.dataset.era);
        btn.setAttribute("aria-pressed", Math.abs(u(y0) - view.a) < 0.02 && Math.abs(u(y1) - view.b) < 0.02);
      });
      el.querySelectorAll("[data-show]").forEach(btn => btn.setAttribute("aria-pressed", +btn.dataset.show === minImp));
      el.querySelector('[data-opt="split"]').setAttribute("aria-pressed", fields.every(k => expanded.has(k)));
      el.querySelector('[data-opt="links"]').setAttribute("aria-pressed", showLinks);
    }
    function measureW(text, font) {
      measure.font = `${font} ${getComputedStyle(svg).getPropertyValue("--body") || "sans-serif"}`;
      return measure.measureText(text).width;
    }

    // ----- links between events -----
    // All links faintly when "Links" is on; the whole chain of the selected event;
    // the direct links of the event under the pointer.
    function drawLinks() {
      if (!linksG) return;
      linksG.innerHTML = "";
      const edges = new Map();     // "from>to" -> class
      const weight = { all: 0, hover: 1, chain: 2, on: 3 };
      const add = (a, b, cls) => { const k = a + ">" + b; if (!edges.has(k) || weight[cls] > weight[edges.get(k)]) edges.set(k, cls); };
      const shown = new Set(visible().map(e => e.id));
      if (showLinks) shown.forEach(id => GI.eventById[id].after.forEach(p => add(p, id, "all")));
      if (pinnedId) {
        // the selected event's own links bold, the rest of its chain lighter
        const { up, down } = lineage(pinnedId);
        [pinnedId, ...up].forEach(n => GI.eventById[n].after.forEach(p => { if (up.has(p)) add(p, n, n === pinnedId ? "on" : "chain"); }));
        [pinnedId, ...down].forEach(n => GI.eventById[n].next.forEach(c => { if (down.has(c)) add(n, c, n === pinnedId ? "on" : "chain"); }));
      }
      if (hoverId && hoverId !== pinnedId) {
        const e = GI.eventById[hoverId];
        e.after.forEach(p => add(p, hoverId, "hover")); e.next.forEach(c => add(hoverId, c, "hover"));
      }
      edges.forEach((cls, k) => {
        const [a, b] = k.split(">"), p = posById.get(a), q = posById.get(b);
        if (!p || !q) return;                                   // hidden by a filter
        const dx = q.x - p.x, dy = q.y - p.y;
        let d;
        if (Math.abs(dx) < 1) { const s = Math.sign(dy) || 1; d = `M${p.x} ${p.y + s * (p.r + 2)}L${q.x} ${q.y - s * (q.r + 4)}`; }
        else {
          const s = Math.sign(dx), x1 = p.x + s * (p.r + 2), x2 = q.x - s * (q.r + 4), mx = (x1 + x2) / 2;
          d = `M${x1} ${p.y}C${mx} ${p.y} ${mx} ${q.y} ${x2} ${q.y}`;
        }
        sv("path", { d, class: `tl-link tl-link-${cls}`, "marker-end": geo.arrow }, linksG);
      });
    }

    // ----- hover, selection, tooltip and the detail panel -----
    const blank = `<div class="tl-hint"><span class="eyebrow">How to use</span>
      <p>Click an event to see the question behind it, the lesson that answers it, and what it built on and led to.</p>
      <p>Click a field's name, or <b>Branches</b>, to split it into its branches. Diamonds mark the landmark inventions; use <b>Show</b> to hide the smaller steps.</p></div>`;
    const evChip = id => {
      const e = GI.eventById[id];
      return `<button type="button" class="tl-rel" data-sel="${e.id}" data-field="${e.field}"><span class="mono">${e.year}</span>${esc(e.short)}</button>`;
    };
    function show(e) {
      // keep focus on a panel button that gets rebuilt (stepping with ← →)
      const act = document.activeElement, keep = detail.contains(act) && act.dataset.step;
      if (!e) { detail.innerHTML = blank; detail.removeAttribute("data-field"); return; }
      const order = stepList(), i = order.indexOf(e.id);
      const note = e.lesson && e.to[1] !== "model" ? e.lesson.notes[e.to[1] - 1] : null;
      detail.dataset.field = e.field;
      detail.innerHTML = `
        <div class="tl-d-nav">
          <button type="button" data-step="-1" ${i <= 0 ? "disabled" : ""} aria-label="Previous event">←</button>
          <span class="mono">${i >= 0 ? `${i + 1} / ${order.length}` : ""}</span>
          <button type="button" data-step="1" ${i < 0 || i >= order.length - 1 ? "disabled" : ""} aria-label="Next event">→</button>
          <button type="button" data-close aria-label="Close">×</button>
        </div>
        <div class="tl-d-head"><span class="tl-year mono">${e.year}</span>${impBadge(e)}</div>
        <p class="tl-field mono"><span class="fdot">${where(e)}</span></p>
        <h3>${esc(e.title)}</h3>
        <p class="tl-q"><span class="eyebrow">The question</span>${esc(e.question)}</p>
        <p class="tl-sum">${esc(e.summary)}</p>
        ${e.after.length ? `<div class="tl-rels"><span class="eyebrow">Built on</span><div>${e.after.map(evChip).join("")}</div></div>` : ""}
        ${e.next.length ? `<div class="tl-rels"><span class="eyebrow">Led to</span><div>${e.next.map(evChip).join("")}</div></div>` : ""}
        ${e.lesson ? `<div class="tl-answer">
            <span class="eyebrow">The answer, from the lesson</span>
            ${note ? `<p class="tl-answer-q">${esc(note[0])}</p><p class="tl-answer-p">${note[1][0]}</p>` : `<p class="tl-answer-p">${esc(e.lesson.title)}</p>`}
            <a class="tl-go" href="${tl.href(e)}" data-open><span class="mono">Keep reading in</span><span>${esc(tl.target(e))}</span><span aria-hidden="true">→</span></a>
          </div>`
          : `<p class="tl-nolesson mono">No lesson covers this yet</p>`}`;
      if (keep) { const b = detail.querySelector(`[data-step="${keep}"]`); (b && !b.disabled ? b : detail.querySelector("[data-step]:not(:disabled)") || svg).focus({ preventScroll: true }); }
    }
    // events in the order the ← → buttons step through: the ones currently shown, by year
    const stepList = () => visible().map(e => e.id);

    let shownId;
    function paint(redrawn) {
      const sel = pinnedId, chain = sel && posById.has(sel) ? lineage(sel) : null;
      const inChain = id => !chain || id === sel || chain.up.has(id) || chain.down.has(id);
      dotEls.forEach((g, id) => {
        g.classList.toggle("on", id === hoverId || id === sel);
        g.classList.toggle("sel", id === sel);
        g.classList.toggle("dim", !inChain(id));
        g.setAttribute("aria-pressed", id === sel);
      });
      lblEls.forEach((t, id) => { t.classList.toggle("on", id === hoverId || id === sel); t.classList.toggle("dim", !inChain(id)); });
      drawLinks();
      if (sel !== shownId || redrawn === "data") { shownId = sel; show(GI.eventById[sel]); }
      // tooltip for the event under the pointer or keyboard focus
      const c = hoverId && geo && geo.centers.find(c => c.id === hoverId);
      if (c && hoverId !== sel) {
        const e = c.e;
        tip.innerHTML = `<span class="mono">${e.year}</span> ${esc(e.title)}`;
        tip.dataset.field = e.field;
        tip.hidden = false;
        const w = tip.offsetWidth, W = plot.clientWidth;
        tip.style.left = clamp(c.x - w / 2, 4, W - w - 4) + "px";
        tip.style.top = (c.y - c.r - tip.offsetHeight - 10 < 0 ? c.y + c.r + 10 : c.y - c.r - tip.offsetHeight - 10) + "px";
      } else tip.hidden = true;
    }
    function setHover(id) { if (id === hoverId) return; hoverId = id; paint(); }
    function select(id, opts2 = {}) {
      pinnedId = GI.eventById[id] ? id : null;
      save();
      render();
      if (pinnedId && opts2.reveal) reveal(GI.eventById[pinnedId]);
    }

    // panel buttons: step, close, related events, open the lesson
    detail.addEventListener("click", ev => {
      const t = ev.target.closest("button, a"); if (!t) return;
      if (t.dataset.sel) select(t.dataset.sel, { reveal: true });
      else if (t.dataset.step) {
        const order = stepList(), i = order.indexOf(pinnedId) + +t.dataset.step;
        if (order[i]) select(order[i], { reveal: true });
      }
      else if ("close" in t.dataset) select(null);
      else if ("open" in t.dataset && !(ev.metaKey || ev.ctrlKey || ev.shiftKey)) { ev.preventDefault(); leaveFor(t.getAttribute("href")); }
    });

    // event under a point: the closest marker within reach, or a label the point is on
    function nearest(p, reach = 10) {
      if (!geo || p.y > geo.axisY || p.x < geo.left) return null;
      let best = null, bd = reach;
      geo.centers.forEach(c => { const d = Math.hypot(c.x - p.x, c.y - p.y) - c.r; if (d < bd) { bd = d; best = c; } });
      return best || geo.labels.find(b => p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1) || null;
    }
    // field toggle in the left margin under a point
    const toggleAt = p => geo && p.x < geo.left - 2 && p.y < geo.axisY ? (geo.rows.find(r => p.y >= r.y && p.y < r.y + r.h && (r.kind === "head" || !r.branch)) || null) : null;
    function toggleField(k) {
      if (expanded.has(k)) expanded.delete(k); else expanded.add(k);
      save(); render();
    }

    // ----- pointer input: hover, click, drag to pan or to pick a range, pinch to zoom -----
    const pt = e => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const uAt = x => view.a + (x - geo.left) / geo.pw * (view.b - view.a);    // chart position → warped time
    const uOv = x => clamp((x - geo.left) / geo.pw, 0, 1);                     // overview position → warped time
    const inOv = p => p.y >= geo.ovY - 4;
    const pointers = new Map();
    let drag = null, pinch = null;

    const chartBox = el.querySelector(".tl-chart");
    svg.addEventListener("keydown", () => chartBox.setAttribute("data-kb", ""), true);
    svg.addEventListener("pointerdown", e => {
      chartBox.removeAttribute("data-kb");
      if (e.button > 0 || !geo) return;
      const p = pt(e);
      if (p.x < geo.left - 2 && !inOv(p)) { drag = { mode: "margin" }; return; }
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
      if (drag && drag.mode !== "margin" && (e.buttons || e.pointerType !== "mouse")) {
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
        svg.style.cursor = hit || toggleAt(p) ? "pointer" : p.x < geo.left ? "" : inOv(p) ? (zoomed() && uOv(p.x) >= view.a && uOv(p.x) <= view.b ? "grab" : "col-resize")
          : p.y > geo.axisY - 2 || !zoomed() || e.shiftKey ? "col-resize" : "grab";
      }
    });

    svg.addEventListener("pointerup", e => {
      const p = pt(e);
      pointers.delete(e.pointerId);
      if (pinch) { if (pointers.size < 2) pinch = null; drag = null; return; }
      const d = drag; drag = null;
      if (!d) return;
      if (d.mode === "margin") { const r = toggleAt(p); if (r) toggleField(r.field); return; }
      if (d.mode === "ov-move") { svg.style.cursor = "grab"; return; }
      if (d.moved) {
        const b = brush; brush = null;
        if (b) { const lo = Math.min(b.u0, b.u1), hi = Math.max(b.u0, b.u1); hi - lo > 1e-4 ? animateTo(lo, hi) : schedule(); }
        return;
      }
      if (d.mode === "ov-range") { const s = view.b - view.a; animateTo(d.u0 - s / 2, d.u0 + s / 2); return; }   // click on the overview: go there
      const hit = nearest(p, e.pointerType === "mouse" ? 10 : 18);
      select(hit ? hit.id : null);                                   // click an event to select it, empty space to clear
    });
    svg.addEventListener("pointercancel", e => { pointers.delete(e.pointerId); pinch = null; drag = null; if (brush) { brush = null; schedule(); } });
    svg.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && !drag) { setHover(null); svg.style.cursor = ""; } });

    // double-click empty space to zoom in there (Shift + double-click zooms out)
    svg.addEventListener("dblclick", e => {
      if (!geo) return;
      const p = pt(e);
      if (inOv(p) || p.x < geo.left || nearest(p)) return;
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
      const span = view.b - view.a, c = (view.a + view.b) / 2, t = e.target;
      if ((e.key === "Enter" || e.key === " ") && t.dataset && (t.dataset.id || t.dataset.toggle)) {
        if (t.dataset.id) select(t.dataset.id === pinnedId ? null : t.dataset.id); else toggleField(t.dataset.toggle);
      }
      else if (e.key === "Escape" && pinnedId) select(null);
      else if (e.key === "+" || e.key === "=") zoomAt(0.5, c, true);
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
      render(); paint("data");
      if (opts.onShow) opts.onShow(minImp);
    }));
    el.querySelector('[data-opt="split"]').addEventListener("click", () => {
      expanded = fields.every(k => expanded.has(k)) ? new Set() : new Set(fields);
      save(); render();
    });
    el.querySelector('[data-opt="links"]').addEventListener("click", () => { showLinks = !showLinks; save(); render(); });

    // redraw when the space changes size
    let lastW = 0;
    new ResizeObserver(() => { const w = plot.clientWidth; if (w && Math.abs(w - lastW) > 1) { lastW = w; render(); } }).observe(plot);
    render();

    return {
      // select an event (null clears) and bring it into view
      select(id) { select(id, { reveal: true }); },
      // show events of this importance and up (doesn't call onShow)
      setShow(level) { minImp = level; render(); paint("data"); },
      // new set of events, fields or branches, keeping the current zoom and selection
      update(evts, o = {}) {
        all = evts;
        if (o.fields) fields = o.fields;
        if ("branches" in o) branchSel = o.branches;
        render(); paint("data");
      }
    };
  };
})(window.GI);
