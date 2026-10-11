/* ============================================================
   core/ui.js: building blocks for the interactive models.
   Sliders, option buttons, readouts, number formatting and a
   small SVG plotting helper with correct linear and log scales.

   Each model lives in js/interactives/<name>.js and registers:
     GI.INTERACTIVES.<name> = { mount(rootElement) { ... } }
   ============================================================ */
window.GI = window.GI || {};
GI.INTERACTIVES = GI.INTERACTIVES || {};

(function (GI) {
  const ui = GI.ui = {};
  const { sv, esc } = GI;
  let uid = 0;
  const nextId = p => `${p}${++uid}`;

  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  ui.el = el;

  /* ---------- number formatting ---------- */
  const SUP = { "-":"⁻", "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  ui.sup = n => String(n).split("").map(c => SUP[c] || c).join("");

  // number with an SI prefix: si(3.7e-12, "m") -> "3.70 pm"
  ui.si = (v, unit = "", sig = 3) => {
    if (!isFinite(v)) return "—";
    if (v === 0) return `0 ${unit}`;
    const P = [[1e12,"T"],[1e9,"G"],[1e6,"M"],[1e3,"k"],[1,""],[1e-3,"m"],[1e-6,"µ"],[1e-9,"n"],[1e-12,"p"],[1e-15,"f"]];
    const a = Math.abs(v);
    const [f, p] = P.find(([f]) => a >= f * 0.9995) || P[P.length - 1];
    return `${ui.num(v / f, sig)} ${p}${unit}`;
  };
  // significant figures without exponent: num(196.4286, 3) -> "196"
  ui.num = (v, sig = 3) => {
    if (v === 0) return "0";
    const d = Math.max(0, sig - 1 - Math.floor(Math.log10(Math.abs(v))));
    return Number(v.toFixed(Math.min(d, 10))).toLocaleString("en-US", { maximumFractionDigits: Math.min(d, 10) });
  };
  // scientific notation from a base-10 logarithm (works far beyond float range)
  ui.sciLog = (lg, sig = 2) => {
    const e = Math.floor(lg), m = Math.pow(10, lg - e);
    if (e >= -3 && e <= 5) return ui.num(Math.pow(10, lg), sig);
    return `${m.toFixed(sig - 1)} × 10${ui.sup(e)}`;
  };
  ui.sci = (v, sig = 2) => v === 0 ? "0" : (v < 0 ? "−" : "") + ui.sciLog(Math.log10(Math.abs(v)), sig);

  /* ---------- the box every model sits in ---------- */
  // returns { controls, fig, note } containers
  ui.box = (root, { title, note }) => {
    root.innerHTML = "";
    const box = el("div", "ix");
    box.innerHTML = `
      <div class="ix-head"><span class="eyebrow">Interactive model</span><h3>${esc(title)}</h3></div>
      <div class="ix-body"><div class="ix-controls"></div><div class="ix-fig"></div></div>
      ${note ? `<p class="ix-note">${note}</p>` : ""}`;
    root.appendChild(box);
    return { box, controls: box.querySelector(".ix-controls"), fig: box.querySelector(".ix-fig"), note: box.querySelector(".ix-note") };
  };

  /* ---------- slider ---------- */
  // o: { label, min, max, step, value, log, fmt, onInput }
  ui.slider = (parent, o) => {
    const id = nextId("ix-s");
    const row = el("div", "ix-row");
    row.innerHTML = `<div class="ix-lab"><label for="${id}">${o.label}</label><output for="${id}"></output></div><input type="range" id="${id}">`;
    parent.appendChild(row);
    const inp = row.querySelector("input"), out = row.querySelector("output");
    const toVal = t => o.log ? o.min * Math.pow(o.max / o.min, t / 1000) : t;
    const toT = v => o.log ? 1000 * Math.log(v / o.min) / Math.log(o.max / o.min) : v;
    const applyRange = () => {
      if (o.log) { inp.min = 0; inp.max = 1000; inp.step = "any"; }
      else { inp.min = o.min; inp.max = o.max; inp.step = o.step || "any"; }
    };
    applyRange();
    const api = {
      row, input: inp,
      get: () => toVal(+inp.value),
      set(v) { inp.value = toT(Math.min(o.max, Math.max(o.min, v))); show(); },
      setRange(min, max) { const v = api.get(); o.min = min; o.max = max; applyRange(); api.set(v); }
    };
    const show = () => out.textContent = o.fmt ? o.fmt(api.get()) : api.get();
    inp.addEventListener("input", () => { show(); if (o.onInput) o.onInput(); });
    api.set(o.value);
    return api;
  };

  /* ---------- option buttons ---------- */
  // o: { label, options: [[value, text], ...], value, onChange }
  ui.segment = (parent, o) => {
    const row = el("div", "ix-row");
    row.innerHTML = `<div class="ix-lab"><span>${o.label}</span></div><div class="ix-seg" role="group" aria-label="${esc(o.label)}">${o.options.map(([v, t]) => `<button type="button" data-v="${esc(v)}">${t}</button>`).join("")}</div>`;
    parent.appendChild(row);
    let val = o.value;
    const btns = [...row.querySelectorAll("button")];
    const paint = () => btns.forEach(b => b.setAttribute("aria-pressed", b.dataset.v === String(val)));
    btns.forEach(b => b.addEventListener("click", () => { val = b.dataset.v; paint(); if (o.onChange) o.onChange(val); }));
    paint();
    return { row, get: () => val, set(v) { val = v; paint(); } };
  };

  /* ---------- dropdown ---------- */
  ui.select = (parent, o) => {
    const id = nextId("ix-sel");
    const row = el("div", "ix-row");
    row.innerHTML = `<div class="ix-lab"><label for="${id}">${o.label}</label></div><select id="${id}" class="ix-select">${o.options.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("")}</select>`;
    parent.appendChild(row);
    const s = row.querySelector("select"); s.value = o.value;
    s.addEventListener("change", () => { if (o.onChange) o.onChange(s.value); });
    return { row, get: () => s.value, set(v) { s.value = v; } };
  };

  /* ---------- readouts ---------- */
  // items: [[key, label], ...]; returns { set(key, html), row(key) }
  ui.readouts = (parent, items) => {
    const dl = el("dl", "ix-ro");
    dl.innerHTML = items.map(([k, l]) => `<div data-k="${k}"><dt>${l}</dt><dd></dd></div>`).join("");
    parent.appendChild(dl);
    return {
      set: (k, html) => { dl.querySelector(`[data-k="${k}"] dd`).innerHTML = html; },
      row: k => dl.querySelector(`[data-k="${k}"]`)
    };
  };

  /* ---------- SVG plot ---------- */
  // o: { w, h, x:{min,max,log,label,fmt,ticks}, y:{...,hide}, m:{l,r,t,b}, title }
  ui.plot = (parent, o) => {
    const W = o.w || 640, H = o.h || 280;
    const m = Object.assign({ l: 62, r: 18, t: 14, b: 46 }, o.m || {});
    if (o.y && o.y.hide) m.l = Math.min(m.l, 18);
    const svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "pl", role: "img", "aria-label": o.title || "Chart" }, parent);
    const clipId = nextId("clip");
    const cp = sv("clipPath", { id: clipId }, sv("defs", {}, svg));
    sv("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }, cp);

    const axes = sv("g", { class: "pl-axes" }, svg);
    const layer = sv("g", { "clip-path": `url(#${clipId})` }, svg);
    const top = sv("g", {}, svg);   // labels that may sit outside the clip

    const api = { svg, layer, top, W, H, m, x0: m.l, x1: W - m.r, y0: H - m.b, y1: m.t };
    const scale = (a, p0, p1) => a.log
      ? v => p0 + (Math.log10(v) - Math.log10(a.min)) / (Math.log10(a.max) - Math.log10(a.min)) * (p1 - p0)
      : v => p0 + (v - a.min) / (a.max - a.min) * (p1 - p0);

    function ticks(a) {
      if (a.ticks) return a.ticks;
      if (a.log) {
        const lo = Math.ceil(Math.log10(a.min) - 1e-9), hi = Math.floor(Math.log10(a.max) + 1e-9);
        const n = hi - lo + 1, every = Math.max(1, Math.ceil(n / 8)), out = [];
        for (let k = lo; k <= hi; k += every) out.push(Math.pow(10, k));
        return out;
      }
      const span = a.max - a.min, raw = span / (a.n || 5), p = Math.pow(10, Math.floor(Math.log10(raw)));
      const step = [1, 2, 2.5, 5, 10].map(f => f * p).find(s => s >= raw);
      const out = []; for (let v = Math.ceil(a.min / step - 1e-9) * step; v <= a.max + step * 1e-9; v += step) out.push(+v.toPrecision(12));
      return out;
    }

    // draw (or redraw) the axes; call again after changing api.x / api.y ranges
    api.axes = (x, y) => {
      api.x = x; api.y = y;
      api.X = scale(x, api.x0, api.x1); api.Y = y.hide ? (() => 0) : scale(y, api.y0, api.y1);
      if (y.hide) api.Y = scale(y, api.y0, api.y1);
      axes.innerHTML = "";
      const fx = x.fmt || (v => ui.num(v, 3)), fy = y.fmt || (v => ui.num(v, 3));
      ticks(x).forEach(v => {
        const px = api.X(v);
        if (!y.hide) sv("line", { x1: px, x2: px, y1: api.y1, y2: api.y0, class: "pl-grid" }, axes);
        sv("line", { x1: px, x2: px, y1: api.y0, y2: api.y0 + 5, class: "pl-axis" }, axes);
        sv("text", { x: px, y: api.y0 + 18, class: "pl-tick", "text-anchor": "middle" }, axes).textContent = fx(v);
      });
      if (!y.hide) ticks(y).forEach(v => {
        const py = api.Y(v);
        sv("line", { x1: api.x0, x2: api.x1, y1: py, y2: py, class: "pl-grid" }, axes);
        sv("text", { x: api.x0 - 8, y: py + 4, class: "pl-tick", "text-anchor": "end" }, axes).textContent = fy(v);
      });
      sv("line", { x1: api.x0, x2: api.x1, y1: api.y0, y2: api.y0, class: "pl-axis" }, axes);
      if (!y.hide) sv("line", { x1: api.x0, x2: api.x0, y1: api.y1, y2: api.y0, class: "pl-axis" }, axes);
      if (x.label) sv("text", { x: (api.x0 + api.x1) / 2, y: H - 6, class: "pl-label", "text-anchor": "middle" }, axes).textContent = x.label;
      if (y.label && !y.hide) sv("text", { x: 14, y: (api.y0 + api.y1) / 2, class: "pl-label", "text-anchor": "middle", transform: `rotate(-90 14 ${(api.y0 + api.y1) / 2})` }, axes).textContent = y.label;
    };
    api.axes(o.x, o.y || { min: 0, max: 1 });

    api.clear = () => { layer.innerHTML = ""; top.innerHTML = ""; };
    // polyline through data points; skips gaps (non-finite values)
    api.path = (pts, cls = "pl-line", g = layer) => {
      let d = "", pen = false;
      pts.forEach(([x, y]) => {
        const px = api.X(x), py = api.Y(y);
        if (!isFinite(px) || !isFinite(py)) { pen = false; return; }
        const cy = Math.max(-1e4, Math.min(1e4, py));
        d += (pen ? "L" : "M") + px.toFixed(1) + " " + cy.toFixed(1); pen = true;
      });
      return sv("path", { d, class: cls }, g);
    };
    api.area = (pts, base, cls = "pl-fill") => {
      const p = pts.filter(([x, y]) => isFinite(api.X(x)) && isFinite(api.Y(y)));
      if (!p.length) return;
      let d = `M${api.X(p[0][0])} ${api.Y(base)}`;
      p.forEach(([x, y]) => d += `L${api.X(x).toFixed(1)} ${api.Y(y).toFixed(1)}`);
      d += `L${api.X(p[p.length - 1][0])} ${api.Y(base)}Z`;
      return sv("path", { d, class: cls }, layer);
    };
    api.dot = (x, y, r = 5, cls = "pl-pt") => sv("circle", { cx: api.X(x), cy: api.Y(y), r, class: cls }, layer);
    api.vline = (x, cls = "pl-ref") => sv("line", { x1: api.X(x), x2: api.X(x), y1: api.y1, y2: api.y0, class: cls }, layer);
    api.hline = (y, cls = "pl-ref") => sv("line", { x1: api.x0, x2: api.x1, y1: api.Y(y), y2: api.Y(y), class: cls }, layer);
    api.text = (x, y, s, cls = "pl-text", anchor = "start", dx = 0, dy = 0) => {
      const t = sv("text", { x: api.X(x) + dx, y: api.Y(y) + dy, class: cls, "text-anchor": anchor }, top); t.textContent = s; return t;
    };
    return api;
  };
})(window.GI);
