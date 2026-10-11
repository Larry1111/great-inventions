/* ============================================================
   interactives/cmos.js
   CMOS inverter with matched square-law transistors (k_n = k_p, |V_tp| = V_tn).
   V_out is found where the n-channel and p-channel currents are equal:
     I_n(V_GS = V_in, V_DS = V_out) = I_p(V_SG = V_DD − V_in, V_SD = V_DD − V_out)
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const I = (ov, ds) => ov <= 0 ? 0 : ds < ov ? ov * ds - ds * ds / 2 : ov * ov / 2;   // relative units

  function solve(vin, vdd, vt) {
    if (vin <= vt) return { vout: vdd, i: 0 };
    if (vin >= vdd - vt) return { vout: 0, i: 0 };
    let lo = 0, hi = vdd;
    for (let k = 0; k < 60; k++) {
      const mid = (lo + hi) / 2, g = I(vin - vt, mid) - I(vdd - vin - vt, vdd - mid);
      if (g > 0) hi = mid; else lo = mid;
    }
    const vout = (lo + hi) / 2;
    return { vout, i: I(vin - vt, vout) };
  }

  GI.INTERACTIVES.cmos = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "A CMOS inverter: output and supply current",
        note: "Matched long-channel transistors. Current is shown relative to its peak. Leakage, which matters in modern tiny transistors, is left out, so the current is exactly zero when either transistor is off. The steep vertical drop at the midpoint comes from the simplified model."
      });
      const vdd = ui.slider(b.controls, { label: "Supply voltage V<sub>DD</sub>", min: 1, max: 3.3, step: 0.05, value: 1.8, fmt: v => `${v.toFixed(2)} V`, onInput: () => { clampVt(); vin.setRange(0, vdd.get()); update(); } });
      const vt  = ui.slider(b.controls, { label: "Threshold voltage V<sub>th</sub>", min: 0.2, max: 0.8, step: 0.01, value: 0.45, fmt: v => `${v.toFixed(2)} V`, onInput: () => { clampVt(); update(); } });
      const vin = ui.slider(b.controls, { label: "Input voltage V<sub>in</sub>", min: 0, max: 1.8, step: 0.01, value: 0.6, fmt: v => `${v.toFixed(2)} V`, onInput: update });
      const ro = ui.readouts(b.controls, [["o", "Output voltage"], ["n", "n-channel (to ground)"], ["p", "p-channel (to supply)"], ["i", "Current from supply to ground"]]);
      function clampVt() { const mx = vdd.get() / 2 - 0.05; if (vt.get() > mx) vt.set(mx); }

      const p1 = ui.plot(b.fig, { w: 640, h: 260, title: "Output voltage versus input voltage",
        x: { min: 0, max: 3.3, label: "Input V_in (V)" }, y: { min: 0, max: 3.3, label: "Output V_out (V)" } });
      const p2 = ui.plot(b.fig, { w: 640, h: 170, m: { b: 40 }, title: "Supply current versus input voltage",
        x: { min: 0, max: 3.3, label: "Input V_in (V)" }, y: { min: 0, max: 1.1, label: "Current (rel.)", ticks: [0, .5, 1], fmt: v => v } });

      function update() {
        const V = vdd.get(), t = vt.get(), x = vin.get();
        const vtc = [], cur = []; let mx = 0;
        for (let i = 0; i <= 400; i++) { const v = V * i / 400, s = solve(v, V, t); vtc.push([v, s.vout]); cur.push([v, s.i]); mx = Math.max(mx, s.i); }
        const s = solve(x, V, t);
        p1.axes({ min: 0, max: V, label: "Input V_in (V)" }, { min: 0, max: V * 1.08, label: "Output V_out (V)" });
        p2.axes({ min: 0, max: V, label: "Input V_in (V)" }, { min: 0, max: 1.1, label: "Current (rel.)", ticks: [0, .5, 1], fmt: v => v });
        p1.clear();
        p1.path([[0, V], [V, V]], "pl-ref"); p1.text(0.05, V, "V_DD", "pl-text muted", "start", 0, -6);
        p1.path(vtc); p1.dot(x, s.vout, 6);
        p2.clear();
        const cn = cur.map(([a, c]) => [a, mx ? c / mx : 0]);
        p2.area(cn, 0, "pl-fill"); p2.path(cn); p2.dot(x, mx ? s.i / mx : 0, 6);

        ro.set("o", `${s.vout.toFixed(2)} V`);
        ro.set("n", x > t ? "on" : "off");
        ro.set("p", x < V - t ? "on" : "off");
        ro.set("i", s.i < 1e-9 ? "zero: one transistor is off" : `${Math.round(100 * s.i / mx)}% of peak: both partly on`);
      }
      update();
    }
  };
})(window.GI);
