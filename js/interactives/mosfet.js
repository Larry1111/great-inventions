/* ============================================================
   interactives/mosfet.js
   Long-channel (square-law) n-channel MOSFET, k = 1 mA/V²:
     cutoff      V_GS ≤ V_th:            I_D = 0
     linear      V_DS < V_GS − V_th:     I_D = k[(V_GS−V_th)V_DS − V_DS²/2]
     saturation  V_DS ≥ V_GS − V_th:     I_D = (k/2)(V_GS−V_th)²
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const K = 1;   // mA/V²
  const id = (vgs, vds, vth) => {
    const ov = vgs - vth;
    if (ov <= 0) return 0;
    return vds < ov ? K * (ov * vds - vds * vds / 2) : K * ov * ov / 2;
  };

  GI.INTERACTIVES.mosfet = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "Drain current of an n-channel MOSFET",
        note: "Classic long-channel model with k = 1 mA/V². It ignores leakage below threshold and the slight rise of current in saturation that real transistors show. Faint curves are other gate voltages; the dashed line divides the linear and saturation regions."
      });
      const vgs = ui.slider(b.controls, { label: "Gate voltage V<sub>GS</sub>", min: 0, max: 3, step: 0.01, value: 1.5, fmt: v => `${v.toFixed(2)} V`, onInput: update });
      const vds = ui.slider(b.controls, { label: "Drain voltage V<sub>DS</sub>", min: 0, max: 3, step: 0.01, value: 1.5, fmt: v => `${v.toFixed(2)} V`, onInput: update });
      const vth = ui.slider(b.controls, { label: "Threshold voltage V<sub>th</sub>", min: 0.3, max: 1, step: 0.01, value: 0.5, fmt: v => `${v.toFixed(2)} V`, onInput: update });
      const ro = ui.readouts(b.controls, [["reg", "Operating region"], ["i", "Drain current I<sub>D</sub>"]]);

      const p = ui.plot(b.fig, { w: 640, h: 320, title: "Drain current versus drain voltage",
        x: { min: 0, max: 3, label: "Drain voltage V_DS (V)" },
        y: { min: 0, max: 4, label: "Drain current (mA)" } });

      function update() {
        const g = vgs.get(), d = vds.get(), t = vth.get();
        p.clear();
        const bound = []; for (let x = 0; x <= 3.001; x += .02) bound.push([x, K * x * x / 2]);
        p.path(bound, "pl-ref dash");
        [1, 1.5, 2, 2.5, 3].forEach(v => {
          const pts = []; for (let x = 0; x <= 3.001; x += .02) pts.push([x, id(v, x, t)]);
          p.path(pts, "pl-line2");
          if (v > t) p.text(3, id(v, 3, t), `${v} V`, "pl-text muted", "end", -4, -5);
        });
        const cur = []; for (let x = 0; x <= 3.001; x += .02) cur.push([x, id(g, x, t)]);
        p.path(cur);
        const I = id(g, d, t);
        p.dot(d, I, 6);
        const reg = g <= t ? "Cutoff: no channel, switch off" : d < g - t ? "Linear: channel acts like a resistor" : "Saturation: channel pinched off near the drain";
        ro.set("reg", reg);
        ro.set("i", `${ui.num(I, 3)} mA`);
      }
      update();
    }
  };
})(window.GI);
