/* ============================================================
   core/figure-sheet.js: draws an interactive patent-style
   figure (numbered parts, lead lines, slider, crosshair).

   Each figure's content lives in js/figures/<field>.js and registers:
     GI.FIGS.ph = {
       code, title, ctrl:{label,min,max,step,val,fmt}, tryit:[...],
       parts:[{n, l, d, s:[[tag,attrs],...], num:[x,y], to:[x,y], txt?}],
       build(dyn, sv) -> D      // create the moving pieces
       tick(D, t, st)           // move them; st = {val, auto, show(v), chan}
     }
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  GI.FIGS = {};
  const { $, $$, esc, sv } = GI;

  // HTML for one sheet. keys = which figures it can show (tabs appear if more than one).
  GI.sheetHTML = keys => `
  <div class="sheet js-sheet">
    <div class="sheet-head mono"><span>Sheet <span class="js-no">1</span> of 3</span><span class="js-code">FIG.</span></div>
    <div class="figwrap js-figwrap">
      <svg class="fig js-fig" viewBox="0 0 480 400" role="img"></svg>
      <div class="cross" aria-hidden="true"><i class="h"></i><i class="v"></i><span class="xy"></span></div>
    </div>
    <div class="ctrl"><label class="js-label" for="figCtrl">Control</label><input type="range" id="figCtrl" class="js-ctrl"><output class="js-out" for="figCtrl"></output></div>
    <p class="caption js-cap" aria-live="polite"></p>
    ${keys.length > 1 ? `<div class="tabs" role="tablist" aria-label="Figures">${keys.map(k =>
      `<button class="tab" role="tab" data-field="${k}" data-k="${k}" aria-selected="false"><span class="mono">FIG. ${GI.FIGS[k].code}</span><span>${GI.FIELDS[k].short}</span><i class="bar"></i></button>`).join("")}</div>` : ""}
  </div>`;

  class FigureSheet {
    constructor(root, keys, { autoplay = false, onChange = null } = {}) {
      this.root = root; this.keys = keys; this.onChange = onChange; this.visible = true;
      this.fig = $(".js-fig", root); this.inp = $(".js-ctrl", root); this.out = $(".js-out", root); this.cap = $(".js-cap", root);
      this.autoOn = autoplay && !GI.reduce && keys.length > 1; this.AUTO = 11000; this.lastFrame = performance.now();
      root._fig = this; GI.vis.observe(root);

      this.inp.addEventListener("input", e => {
        this.userCtrl = true; this.stopAuto(); this.val = +e.target.value;
        this.out.textContent = GI.FIGS[this.k].ctrl.fmt(this.val);
        if (GI.reduce) this.tick(performance.now() / 1000);
      });
      $$(".tab", root).forEach(b => {
        b.addEventListener("click", () => { this.stopAuto(); this.setTab(b.dataset.k); });
        b.addEventListener("keydown", e => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          const i = keys.indexOf(this.k) + (e.key === "ArrowRight" ? 1 : -1), k = keys[(i + keys.length) % keys.length];
          this.stopAuto(); this.setTab(k); $(`.tab[data-k="${k}"]`, root).focus();
        });
      });
      // crosshair with drawing-sheet coordinates (sheet treated as 170 mm wide)
      const fw = $(".js-figwrap", root), h = $(".cross .h", root), v = $(".cross .v", root), xy = $(".cross .xy", root);
      fw.addEventListener("pointerdown", () => this.stopAuto());
      fw.addEventListener("pointermove", e => {
        const b = fw.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, mm = 170 / b.width;
        h.style.top = y + "px"; v.style.left = x + "px";
        xy.textContent = `x ${(x * mm).toFixed(1)}  y ${(y * mm).toFixed(1)} mm`;
        xy.style.left = Math.min(x + 10, b.width - 130) + "px"; xy.style.top = Math.max(y - 24, 0) + "px";
      });
      this.setTab(keys[0]);
    }
    destroy() { GI.vis.unobserve(this.root); }
    stopAuto() { this.autoOn = false; $$(".tab .bar", this.root).forEach(b => b.style.transform = "scaleX(0)"); }

    setTab(k) {
      $$(".tab", this.root).forEach(b => { const on = b.dataset.k === k; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
      this.root.dataset.field = k;
      $(".js-code", this.root).textContent = "FIG. " + GI.FIGS[k].code;
      $(".js-no", this.root).textContent = GI.ORDER.indexOf(k) + 1;
      this.userCtrl = false; this.build(k, true); this.autoStart = performance.now();
      if (this.onChange) this.onChange(k);
    }

    build(k, animate) {
      this.k = k; this.chan = null;
      const F = GI.FIGS[k], fig = this.fig; fig.innerHTML = "";
      // fill patterns used by drawings: diagonal hatching and dots
      const defs = sv("defs", {}, fig);
      const hp = sv("pattern", { id: "hatch", width: 6, height: 6, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
      sv("line", { x1: 0, y1: 0, x2: 0, y2: 6, class: "hatch-line" }, hp);
      const dp = sv("pattern", { id: "dots", width: 9, height: 9, patternUnits: "userSpaceOnUse" }, defs);
      sv("circle", { cx: 2, cy: 2, r: .9, class: "dot-p" }, dp);
      sv("title", {}, fig).textContent = `FIG. ${F.code}: ${F.title}`;

      let d = 0;
      const partsG = sv("g", {}, fig), dyn = sv("g", {}, fig), numsG = sv("g", {}, fig);
      F.parts.forEach(p => {
        const g = sv("g", { class: "part", "data-n": p.n }, partsG);
        p.s.forEach(([tag, a]) => {
          const at = { ...a }, extra = at.cls || ""; delete at.cls;
          if (at.dash) {   // the one dashed shape that fills in (e.g. a transistor channel)
            delete at.dash;
            Object.assign(at, { class: "ln nodraw", style: "fill:var(--acc);fill-opacity:0;stroke-dasharray:4 4" });
            this.chan = sv(tag, at, g); return;
          }
          const cls = ["ln"]; let style = `--d:${d}s`;
          if (extra === "faint") style += ";opacity:.35"; else if (extra) cls.push(extra);
          if (tag !== "line" && !/hfill|dfill/.test(extra)) cls.push("solidfill");
          at.class = cls.join(" "); at.pathLength = 1; at.style = style; sv(tag, at, g);
        });
        (p.txt || []).forEach(([x, y, t]) => { sv("text", { x, y, class: "lbl", "text-anchor": "middle" }, g).textContent = t; });

        // reference numeral + lead line
        const ng = sv("g", { class: "num", "data-n": p.n, tabindex: 0, role: "button", "aria-label": `${p.n}: ${p.l}` }, numsG);
        const [nx, ny] = p.num, [tx, ty] = p.to, left = nx < 100, below = ny > 370;
        const x1 = below ? nx : left ? nx + 22 : nx - 8, y1 = below ? ny - 14 : ny - 5;
        sv("path", { d: below ? `M${x1} ${y1} L${tx} ${ty}` : `M${x1} ${y1} Q ${(x1 + tx) / 2} ${y1 + (ty - y1) * .15} ${tx} ${ty}`, class: "lead", pathLength: 1, style: `--d:${d + .3}s` }, ng);
        sv("text", { x: nx, y: ny, class: "numtxt", "text-anchor": below ? "middle" : "start", style: `--d:${d + .4}s` }, ng).textContent = p.n;
        sv("rect", { x: below ? nx - 16 : nx - 6, y: ny - 17, width: 34, height: 24 }, ng);
        const on = () => this.focusPart(p.n), off = () => this.focusPart(null);
        [g, ng].forEach(el => { el.addEventListener("pointerenter", on); el.addEventListener("pointerleave", off); });
        ng.addEventListener("focus", on); ng.addEventListener("blur", off); ng.addEventListener("click", on);
        d += .12;
      });

      this.D = F.build(dyn, sv);
      const c = F.ctrl;
      Object.assign(this.inp, { min: c.min, max: c.max, step: c.step });
      this.val = c.val; this.inp.value = c.val;
      $(".js-label", this.root).textContent = c.label; this.out.textContent = c.fmt(+c.val);
      this.focusPart(null);
      if (animate && !GI.reduce) {
        fig.classList.remove("drawing"); void fig.getBBox(); fig.classList.add("drawing");
        clearTimeout(this.tm); this.tm = setTimeout(() => fig.classList.remove("drawing"), (d + 1.4) * 1000);
      }
      this.tick(performance.now() / 1000);
    }

    focusPart(n) {
      const F = GI.FIGS[this.k];
      this.fig.classList.toggle("focus", n != null);
      $$(".part,.num", this.fig).forEach(e => e.classList.toggle("on", +e.dataset.n === n));
      const p = F.parts.find(x => x.n === n);
      this.cap.innerHTML = p
        ? `<b>${p.n}</b><strong>${esc(p.l)}.</strong> ${esc(p.d)}`
        : `<b>FIG. ${F.code}</b><strong>${esc(F.title)}.</strong> Hover or tap a reference numeral to identify the part.`;
    }

    frame(now) {
      if (!this.visible) { if (this.autoOn) this.autoStart += now - this.lastFrame; this.lastFrame = now; return; }
      this.lastFrame = now; this.tick(now / 1000);
      if (this.autoOn) {
        const p = (now - this.autoStart) / this.AUTO, bar = $('.tab[aria-selected="true"] .bar', this.root);
        if (bar) bar.style.transform = `scaleX(${Math.min(1, p)})`;
        if (p >= 1) { if (bar) bar.style.transform = "scaleX(0)"; this.setTab(this.keys[(this.keys.indexOf(this.k) + 1) % this.keys.length]); }
      }
    }

    tick(t) {
      if (!this.D) return;
      const F = GI.FIGS[this.k];
      F.tick(this.D, t, {
        val: this.val,
        auto: !this.userCtrl && !GI.reduce,
        show: v => { this.inp.value = v; this.out.textContent = F.ctrl.fmt(v); },
        chan: this.chan
      });
    }
  }
  GI.FigureSheet = FigureSheet;
})(window.GI);
