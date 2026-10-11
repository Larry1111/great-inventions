/* ============================================================
   interactives/attention.js
   Scaled dot-product attention on toy 2-D vectors:
     scoreⱼ = (q · kⱼ) / √d,  d = 2;   weightⱼ = softmax(score)ⱼ
     output = Σ weightⱼ · vⱼ   (here each value vector equals its key)
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const TOKENS = [
    ["the",   [ 0.95, -0.30]],
    ["beam",  [ 0.25,  0.97]],
    ["hits",  [-0.85,  0.45]],
    ["wafer", [ 0.70,  0.70]]
  ];

  GI.INTERACTIVES.attention = {
    mount(root) {
      const ui = GI.ui, sv = GI.sv;
      const b = ui.box(root, {
        title: "Attention weights from a query and four keys",
        note: "Toy two-dimensional vectors so they can be drawn. Real models learn vectors with hundreds of dimensions and run many attention heads in parallel. Here each word's value vector equals its key, so the output point shows the weighted average directly."
      });
      const ang = ui.slider(b.controls, { label: "Query direction", min: 0, max: 359, step: 1, value: 70, fmt: v => `${v}°`, onInput: update });
      const len = ui.slider(b.controls, { label: "Query length (sharpness)", min: 0.2, max: 6, step: 0.05, value: 1.5, fmt: v => v.toFixed(2), onInput: update });
      const ro = ui.readouts(b.controls, [["top", "Most attended word"]]);

      const W = 640, H = 330, cx = 220, cy = 165, S = 120;
      const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "pl", role: "img", "aria-label": "Query, keys and output vector" }, b.fig);
      const mk = sv("marker", { id: "att-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto" }, sv("defs", {}, s));
      sv("path", { d: "M0 0L10 5L0 10z", class: "pl-arrowhead" }, mk);
      sv("circle", { cx, cy, r: S, class: "pl-grid-c" }, s);
      sv("line", { x1: cx - S - 10, x2: cx + S + 10, y1: cy, y2: cy, class: "pl-grid" }, s);
      sv("line", { x1: cx, x2: cx, y1: cy - S - 10, y2: cy + S + 10, class: "pl-grid" }, s);
      const g = sv("g", {}, s);
      const bars = sv("g", {}, s);

      function update() {
        const a = ang.get() * Math.PI / 180, L = len.get(), q = [L * Math.cos(a), L * Math.sin(a)];
        const scores = TOKENS.map(([, k]) => (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2);
        const mx = Math.max(...scores), ex = scores.map(x => Math.exp(x - mx)), Z = ex.reduce((x, y) => x + y, 0);
        const w = ex.map(x => x / Z);
        const out = TOKENS.reduce((acc, [, k], i) => [acc[0] + w[i] * k[0], acc[1] + w[i] * k[1]], [0, 0]);
        const P = ([x, y]) => [cx + x * S, cy - y * S];

        g.innerHTML = "";
        TOKENS.forEach(([t, k], i) => {
          const [x, y] = P(k);
          sv("line", { x1: cx, y1: cy, x2: x, y2: y, class: "pl-key", "stroke-width": 1.2 + 5 * w[i], "marker-end": "url(#att-arrow)" }, g);
          sv("text", { x: cx + k[0] * (S + 22), y: cy - k[1] * (S + 22) + 4, class: "pl-text", "text-anchor": "middle" }, g).textContent = t;
        });
        const qd = Math.min(L, 1.15) / L, [qx, qy] = P([q[0] * qd, q[1] * qd]);
        sv("line", { x1: cx, y1: cy, x2: qx, y2: qy, class: "pl-query", "marker-end": "url(#att-arrow)" }, g);
        sv("text", { x: qx + (q[0] >= 0 ? 8 : -8), y: qy - 8, class: "pl-text strong", "text-anchor": q[0] >= 0 ? "start" : "end" }, g).textContent = "query";
        const [ox, oy] = P(out);
        sv("circle", { cx: ox, cy: oy, r: 6, class: "pl-pt" }, g);
        sv("text", { x: ox + 9, y: oy + 16, class: "pl-text muted" }, g).textContent = "output";

        // weight bars
        bars.innerHTML = "";
        const bx = 420, bw = 190;
        sv("text", { x: bx, y: 40, class: "pl-label" }, bars).textContent = "Attention weights";
        TOKENS.forEach(([t], i) => {
          const y = 70 + i * 52;
          sv("text", { x: bx, y: y, class: "pl-text" }, bars).textContent = t;
          sv("rect", { x: bx, y: y + 8, width: bw, height: 14, rx: 3, class: "pl-track" }, bars);
          sv("rect", { x: bx, y: y + 8, width: Math.max(1, bw * w[i]), height: 14, rx: 3, class: "pl-barfill" }, bars);
          sv("text", { x: bx + bw, y: y, class: "pl-text strong", "text-anchor": "end" }, bars).textContent = w[i].toFixed(2);
        });
        const top = w.indexOf(Math.max(...w));
        ro.set("top", `“${TOKENS[top][0]}”, weight ${w[top].toFixed(2)}`);
      }
      update();
    }
  };
})(window.GI);
