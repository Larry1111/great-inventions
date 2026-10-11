/* ============================================================
   interactives/tunneling.js
   Tunneling current I ∝ V · exp(−2κd), κ = √(2mφ)/ħ = 0.5123·√φ Å⁻¹ (φ in eV).
   Scale: 1 nA at d = 5 Å, V = 0.1 V, φ = 4 eV (illustrative reference).
   Line scan: tip at fixed height over a surface with 0.3 Å corrugation, atoms 2.5 Å apart.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const kappa = phi => 0.5123 * Math.sqrt(phi);                 // 1/Å
  const REF = 2 * kappa(4) * 5;                                // exponent at the reference point
  const current = (V, d, phi) => (V / 0.1) * Math.exp(REF - 2 * kappa(phi) * d);   // nA
  const A = 0.3, a = 2.5;                                      // corrugation (Å), atom spacing (Å)

  GI.INTERACTIVES.tunneling = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "Tunneling current versus gap",
        note: "Current follows I ∝ V·e<sup>−2κd</sup> with κ = √(2mφ)/ħ. The current scale is set to 1 nA at a 5 Å gap, 0.1 V and φ = 4 eV, a typical operating point. The line scan uses an illustrative surface with atoms 2.5 Å apart and 0.3 Å high bumps."
      });
      const d   = ui.slider(b.controls, { label: "Tip–surface gap", min: 3, max: 10, step: 0.1, value: 5, fmt: v => `${v.toFixed(1)} Å`, onInput: update });
      const phi = ui.slider(b.controls, { label: "Work function φ", min: 2, max: 6, step: 0.1, value: 4, fmt: v => `${v.toFixed(1)} eV`, onInput: update });
      const V   = ui.slider(b.controls, { label: "Bias voltage", min: 0.01, max: 1, log: true, value: 0.1, fmt: v => `${ui.num(v, 2)} V`, onInput: update });
      const ro = ui.readouts(b.controls, [["i", "Tunneling current"], ["f", "Change per extra ångström"], ["c", "Atom-to-gap contrast in the scan"]]);

      const p1 = ui.plot(b.fig, { w: 640, h: 250, title: "Current versus gap, log scale",
        x: { min: 3, max: 10, label: "Gap d (Å)" },
        y: { min: 1e-8, max: 1e4, log: true, label: "Current (nA)", fmt: v => `10${ui.sup(Math.round(Math.log10(v)))}` } });
      const p2 = ui.plot(b.fig, { w: 640, h: 190, m: { b: 40 }, title: "Constant-height line scan",
        x: { min: 0, max: 10, label: "Tip position across the surface (Å); shaded bumps are surface atoms" },
        y: { min: 0, max: 1.15, label: "Current (relative)", ticks: [0, .5, 1], fmt: v => v } });

      function update() {
        const dv = d.get(), ph = phi.get(), vv = V.get(), k2 = 2 * kappa(ph);
        const I = current(vv, dv, ph);
        p1.clear();
        const pts = []; for (let x = 3; x <= 10.001; x += .05) pts.push([x, current(vv, x, ph)]);
        p1.path(pts);
        p1.hline(0.1, "pl-ref"); p1.hline(1, "pl-ref");
        p1.text(9.95, 1, "typical setpoints 0.1–1 nA", "pl-text muted", "end", 0, -6);
        p1.dot(dv, I, 6);
        p1.text(dv, I, ui.si(I * 1e-9, "A"), "pl-text strong", dv > 8.5 ? "end" : "start", dv > 8.5 ? -10 : 10, -8);

        // line scan
        p2.clear();
        const surf = [], cur = []; let mx = 0, mn = Infinity;
        for (let x = 0; x <= 10.001; x += .05) {
          const z = A * Math.cos(2 * Math.PI * x / a);
          const ic = Math.exp(-k2 * (dv - z)); cur.push([x, ic]); mx = Math.max(mx, ic); mn = Math.min(mn, ic);
          surf.push([x, 0.12 + 0.12 * Math.cos(2 * Math.PI * x / a)]);
        }
        p2.area(surf, 0, "pl-fill2");
        p2.path(cur.map(([x, y]) => [x, 0.3 + 0.8 * (y - mn) / (mx - mn || 1)]));

        ro.set("i", ui.si(I * 1e-9, "A"));
        ro.set("f", `÷ ${ui.num(Math.exp(k2), 3)}`);
        ro.set("c", `${ui.num(Math.exp(k2 * 2 * A), 3)}× more current over an atom than between atoms`);
      }
      update();
    }
  };
})(window.GI);
