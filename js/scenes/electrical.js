/* ============================================================
   scenes/electrical.js: oscilloscope showing a square wave
   and an RC circuit's response. Pointer position sets frequency.
   ============================================================ */
window.GI = window.GI || {};

GI.SCENES.ee = {
  init() {},
  draw(s, c, w, h, t, dt, A) {
    const C = GI.C, cols = 10, rows = 8;
    // graticule
    c.strokeStyle = C["rule-soft"]; c.lineWidth = 1;
    for (let i = 1; i < cols; i++) { c.beginPath(); c.moveTo(i * w / cols, 0); c.lineTo(i * w / cols, h); c.stroke(); }
    for (let j = 1; j < rows; j++) { c.beginPath(); c.moveTo(0, j * h / rows); c.lineTo(w, j * h / rows); c.stroke(); }
    c.strokeStyle = C.rule; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();

    const f = s.px != null ? 1 + s.px * 4 : 2 + .3 * Math.sin(s.seed);
    const hi = h * .26, lo = h * .74, sweep = t * .25;
    const ph = x => ((x / w) * f - sweep) % 1 + 1;

    // input square wave
    c.lineWidth = 1.5; c.strokeStyle = C.muted; c.beginPath();
    for (let x = 0; x <= w; x += 1.5) { const p = ph(x) % 1, y = p < .5 ? hi : lo; x === 0 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke();
    // RC response
    c.lineWidth = 2.2; c.strokeStyle = A; c.beginPath();
    for (let x = 0; x <= w; x += 1.5) {
      const p = ph(x) % 1, u = (p % .5) / .5, v = p < .5 ? 1 - Math.exp(-5 * u) : Math.exp(-5 * u), y = lo - (lo - hi) * v;
      x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
    // sweep line
    const sx = ((t * .4 + s.seed) % 1) * w; c.fillStyle = A; c.globalAlpha = .18; c.fillRect(sx - 1, 0, 2, h); c.globalAlpha = 1;
    s.label(`CH1 1 V/div · CH2 1 V/div · f×${f.toFixed(1)}`, "τ = RC");
  }
};
