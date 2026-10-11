/* ============================================================
   core/timeline.js: the timeline chart and event list.

   GI.timeline.chart(el, events, { fields })  lane chart: one row per field.
       Hover or focus an event to read its question; click to jump to
       the lesson section that answers it.
   GI.timeline.list(events)                   vertical list (HTML string).
   GI.timeline.href(event)                    address of the linked lesson section.
   GI.timeline.forNote(lessonSlug, n)         events that link to a lesson's note.

   The time axis has a break at 1945: the years before it are compressed,
   because most events happen after 1945. The break is drawn on the axis.
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

  // ---------- lane chart ----------
  const BREAK = 1945, Y0 = 1865, Y1 = 2030, EARLY = 0.32;   // years before 1945 get 32% of the width

  tl.chart = (el, events, opts = {}) => {
    const fields = opts.fields || GI.ORDER.filter(k => events.some(e => e.field === k));
    el.innerHTML = `<div class="tl-chart"></div><div class="tl-detail" aria-live="polite"></div>`;
    const box = el.querySelector(".tl-chart"), detail = el.querySelector(".tl-detail");
    const W = 1000, laneH = 92, top = 10, left = 128, right = 20, axisH = 52;
    const H = top + fields.length * laneH + axisH;
    const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "tl-svg", role: "group", "aria-label": "Timeline of events. Select an event to open the lesson section that answers its question." }, box);
    const xw = W - left - right;
    const X = y => y <= BREAK
      ? left + (y - Y0) / (BREAK - Y0) * xw * EARLY
      : left + xw * EARLY + (y - BREAK) / (Y1 - BREAK) * xw * (1 - EARLY);

    // lanes
    fields.forEach((k, i) => {
      const y = top + i * laneH;
      sv("rect", { x: left, y: y + 4, width: xw, height: laneH - 8, rx: 8, class: "tl-lane", "data-field": k }, s);
      const t = sv("text", { x: left - 14, y: y + laneH / 2 + 4, class: "tl-lane-label", "text-anchor": "end", "data-field": k }, s);
      t.textContent = GI.FIELDS[k].short;
    });
    // axis with a break at 1945
    const ay = top + fields.length * laneH + 6;
    const bx = X(BREAK);
    sv("line", { x1: left, x2: bx - 6, y1: ay, y2: ay, class: "tl-axis" }, s);
    sv("line", { x1: bx + 6, x2: W - right, y1: ay, y2: ay, class: "tl-axis" }, s);
    sv("path", { d: `M${bx - 10} ${ay + 6}L${bx - 2} ${ay - 6}M${bx + 2} ${ay + 6}L${bx + 10} ${ay - 6}`, class: "tl-axis" }, s);
    [1880, 1900, 1920, 1960, 1980, 2000, 2020, 1950, 1970, 1990, 2010].forEach(yr => {
      const major = yr % 20 === 0 || yr < BREAK;
      sv("line", { x1: X(yr), x2: X(yr), y1: ay, y2: ay + (major ? 6 : 4), class: "tl-axis" }, s);
      if (major) sv("text", { x: X(yr), y: ay + 24, class: "tl-tick", "text-anchor": "middle" }, s).textContent = yr;
      sv("line", { x1: X(yr), x2: X(yr), y1: top + 4, y2: ay - 2, class: "tl-grid" }, s);
    });
    sv("text", { x: bx, y: ay + 44, class: "tl-tick small", "text-anchor": "middle" }, s).textContent = "scale changes at 1945";

    // events, stacked so close years don't overlap
    const R = 9, gap = 2 * R + 4, lanes = {};
    const dots = [];
    events.slice().sort((a, b) => a.year - b.year).forEach(e => {
      const i = fields.indexOf(e.field); if (i < 0) return;
      const x = X(e.year), rows = lanes[e.field] = lanes[e.field] || [];
      let r = rows.findIndex(lastX => x - lastX >= gap); if (r < 0) { r = rows.length; rows.push(-1e9); }
      rows[r] = x;
      const offsets = [0, -22, 22, -11, 11];
      const y = top + i * laneH + laneH / 2 + (offsets[r] || 0);
      const a = sv("a", { href: tl.href(e), class: "tl-dot", "data-field": e.field, "data-id": e.id, "aria-label": `${e.year}: ${e.title}. Go to the lesson section that answers: ${e.question}` }, s);
      sv("circle", { cx: x, cy: y, r: R + 8, class: "tl-hit" }, a);
      sv("circle", { cx: x, cy: y, r: R, class: "tl-mark" }, a);
      dots.push(a);
    });

    const blank = `<p class="tl-hint"><span class="eyebrow">How to use</span>Point at an event to see the question behind it. Click or tap it to jump to the lesson section that answers that question. On a phone, swipe the chart sideways to see every year.</p>`;
    const show = e => {
      if (!e) { detail.innerHTML = blank; detail.removeAttribute("data-field"); return; }
      detail.dataset.field = e.field;
      detail.innerHTML = `
        <div class="tl-d-head"><span class="tl-year mono">${e.year}</span><span class="fdot mono">${esc(GI.FIELDS[e.field].short)}</span></div>
        <h3>${esc(e.title)}</h3>
        <p class="tl-q"><span class="eyebrow">The question</span>${esc(e.question)}</p>
        ${e.lesson ? `<a class="tl-go" href="${tl.href(e)}"><span class="mono">Answered in</span><span>${esc(tl.target(e))}</span><span aria-hidden="true">→</span></a>` : ""}`;
    };
    let pinned = null;
    dots.forEach(a => {
      const e = GI.eventById[a.dataset.id];
      a.addEventListener("pointerenter", () => { dots.forEach(d => d.classList.toggle("on", d === a)); show(e); });
      a.addEventListener("focus", () => { dots.forEach(d => d.classList.toggle("on", d === a)); show(e); });
    });
    box.addEventListener("pointerleave", () => { dots.forEach(d => d.classList.toggle("on", d.dataset.id === pinned)); show(GI.eventById[pinned]); });
    const api = {
      select(id) { pinned = id; dots.forEach(d => d.classList.toggle("on", d.dataset.id === id)); show(GI.eventById[id]); }
    };
    show(null);
    return api;
  };
})(window.GI);
