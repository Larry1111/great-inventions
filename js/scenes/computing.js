/* ============================================================
   scenes/computing.js: a small network graph with signals
   travelling along its edges. Nodes lean toward the pointer.
   ============================================================ */
window.GI = window.GI || {};

GI.SCENES.cs = {
  init(s) {
    const r = s.r;
    s.nodes = Array.from({ length: 17 }, () => ({ x: .08 + r() * .84, y: .1 + r() * .8, p: r() * 6.28, sp: .3 + r() * .5, big: r() < .25 }));
    s.edges = []; const seen = new Set();
    s.nodes.forEach((a, i) => {
      s.nodes.map((b, j) => [j, (a.x - b.x) ** 2 + (a.y - b.y) ** 2]).filter(x => x[0] !== i).sort((p, q) => p[1] - q[1]).slice(0, 2)
        .forEach(([j]) => { const k = i < j ? i + "-" + j : j + "-" + i; if (!seen.has(k)) { seen.add(k); s.edges.push([i, j, r(), r() < .5 ? 1 : -1]); } });
    });
  },
  draw(s, c, w, h, t, dt, A) {
    const C = GI.C;
    const P = s.nodes.map(n => {
      let x = n.x + .025 * Math.sin(t * n.sp + n.p), y = n.y + .025 * Math.cos(t * n.sp * .8 + n.p);
      if (s.px != null) { const dx = s.px - x, dy = s.py - y, f = Math.exp(-(dx * dx + dy * dy) / .04) * .35; x += dx * f; y += dy * f; }
      return [x * w, y * h, n.big];
    });
    c.lineWidth = 1; c.strokeStyle = C.rule;
    s.edges.forEach(([i, j]) => { c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[j][0], P[j][1]); c.stroke(); });
    c.fillStyle = A;
    s.edges.forEach(([i, j, ph, dir]) => {
      let u = (t * .35 + ph) % 1; if (dir < 0) u = 1 - u;
      c.globalAlpha = Math.sin(u * Math.PI); c.beginPath();
      c.arc(P[i][0] + (P[j][0] - P[i][0]) * u, P[i][1] + (P[j][1] - P[i][1]) * u, 2.2, 0, 7); c.fill();
    });
    c.globalAlpha = 1;
    P.forEach(([x, y, big]) => { c.beginPath(); c.arc(x, y, big ? 6 : 3.6, 0, 7); c.fillStyle = big ? A : C.sheet; c.fill(); c.strokeStyle = A; c.lineWidth = 1.5; c.stroke(); });
    s.label("ATTN · 8 heads · d=512", "GRAPH");
  }
};
