/* ============================================================
   scenes/physics.js: charged particles curling in crossed
   electric and magnetic fields. Pointer height sets field B.
   ============================================================ */
window.GI = window.GI || {};

GI.SCENES.ph = {
  init(s) {
    const r = s.r;
    s.parts = Array.from({ length: 12 }, (_, i) => ({ x: r(), y: .15 + r() * .7, vx: 0, vy: 0, q: i % 3 === 0 ? 1 : -1, m: i % 3 === 0 ? 3 : 1, tr: [] }));
    for (let i = 0; i < 260; i++) this.step(s, 1 / 60);   // warm up so trails exist at rest
  },
  field(s) { return 6 + (1 - (s.py ?? .5)) * 7; },
  step(s, dt) {
    const B = this.field(s), E = 1.2;
    for (const p of s.parts) {
      const k = p.q / p.m;
      p.vx += k * (p.vy * B) * dt; p.vy += k * (E - p.vx * B) * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x > 1.05) { p.x -= 1.1; p.tr = []; }
      if (p.x < -.05) { p.x += 1.1; p.tr = []; }
      if (p.y < .05 || p.y > .95) { p.vy *= -1; p.y = Math.min(.95, Math.max(.05, p.y)); }
      p.tr.push([p.x, p.y]); if (p.tr.length > 70) p.tr.shift();
    }
  },
  draw(s, c, w, h, t, dt, A) {
    const C = GI.C;
    // field-into-page symbols (⊗)
    c.strokeStyle = C.rule; c.lineWidth = 1; const g = Math.max(34, w / 12);
    for (let x = g / 2; x < w; x += g) for (let y = g / 2; y < h; y += g) {
      c.beginPath(); c.arc(x, y, 3.5, 0, 7);
      c.moveTo(x - 2.4, y - 2.4); c.lineTo(x + 2.4, y + 2.4); c.moveTo(x + 2.4, y - 2.4); c.lineTo(x - 2.4, y + 2.4); c.stroke();
    }
    if (dt) this.step(s, Math.min(dt, .033));
    for (const p of s.parts) {
      const col = p.q < 0 ? A : C.muted;
      c.strokeStyle = col; c.lineWidth = 1.4; c.globalAlpha = .75;
      c.beginPath(); p.tr.forEach(([x, y], i) => { i ? c.lineTo(x * w, y * h) : c.moveTo(x * w, y * h); }); c.stroke();
      c.globalAlpha = 1;
      const [x, y] = p.tr[p.tr.length - 1] || [p.x, p.y];
      c.fillStyle = col; c.beginPath(); c.arc(x * w, y * h, p.q < 0 ? 2.6 : 4, 0, 7); c.fill();
    }
    s.label(`B ⊗ ${(this.field(s) * .1).toFixed(2)} T · E ↓`, "e⁻  ion⁺");
  }
};
