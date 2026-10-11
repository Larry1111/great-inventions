/* ============================================================
   interactives/sector.js
   180° magnetic sector: r = √(2·(m/z)·u·V / e) / B.
   The detector slit sits at a fixed radius of 20 cm.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const u = 1.66053906660e-27, e = 1.602176634e-19, RDET = 0.20;
  const radius = (mz, V, B) => Math.sqrt(2 * mz * u * V / e) / B;
  const mzAt = (R, V, B) => (R * B) ** 2 * e / (2 * u * V);

  GI.INTERACTIVES.sector = {
    mount(root) {
      const ui = GI.ui, sv = GI.sv;
      const b = ui.box(root, {
        title: "Bending ions onto a fixed detector",
        note: "Singly charged ions accelerated through V enter a uniform field B and follow a half circle of radius r = √(2·(m/z)·u·V/e)/B. The detector slit is 20 cm from the center of the circle. Dashed paths show ions 20% lighter and 25% heavier."
      });
      const mz = ui.slider(b.controls, { label: "Ion mass-to-charge ratio m/z", min: 10, max: 2000, log: true, value: 100, fmt: v => ui.num(v, 3), onInput: update });
      const V  = ui.slider(b.controls, { label: "Accelerating voltage V", min: 1000, max: 10000, step: 50, value: 5000, fmt: v => `${ui.num(v / 1000, 3)} kV`, onInput: update });
      const B  = ui.slider(b.controls, { label: "Magnetic field B", min: 0.1, max: 1.5, step: 0.005, value: 0.4, fmt: v => `${v.toFixed(3)} T`, onInput: update });
      const ro = ui.readouts(b.controls, [["r", "Radius of this ion's path"], ["hit", "Reaches the detector?"], ["d", "m/z on the detector at these settings"]]);

      // drawing in meters: x from -0.04 to 0.52, y from -0.06 to 0.30
      const W = 640, H = 340, X = x => 30 + (x + 0.02) / 0.54 * (W - 60), Y = y => H - 40 - (y + 0.02) / 0.32 * (H - 70);
      const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "pl", role: "img", "aria-label": "Ion paths in a magnetic sector" }, b.fig);
      const clip = sv("clipPath", { id: "sector-clip" }, sv("defs", {}, s));
      sv("rect", { x: X(-0.02), y: Y(0.30), width: X(0.52) - X(-0.02), height: Y(0) - Y(0.30) }, clip);
      sv("rect", { x: X(-0.02), y: Y(0.30), width: X(0.52) - X(-0.02), height: Y(0) - Y(0.30), class: "pl-fill2" }, s);
      for (let x = 0.0; x <= 0.5; x += 0.05) for (let y = 0.03; y <= 0.29; y += 0.05) {
        const g = sv("g", { class: "pl-sym" }, s);
        sv("circle", { cx: X(x), cy: Y(y), r: 4 }, g);
        sv("path", { d: `M${X(x) - 2.6} ${Y(y) - 2.6}L${X(x) + 2.6} ${Y(y) + 2.6}M${X(x) + 2.6} ${Y(y) - 2.6}L${X(x) - 2.6} ${Y(y) + 2.6}` }, g);
      }
      sv("text", { x: X(0.5), y: Y(0.285), class: "pl-text muted", "text-anchor": "end" }, s).textContent = "field B into the page";
      // axis ruler (cm)
      sv("line", { x1: X(-0.02), x2: X(0.52), y1: Y(0), y2: Y(0), class: "pl-axis" }, s);
      for (let x = 0; x <= 0.5001; x += 0.1) {
        sv("line", { x1: X(x), x2: X(x), y1: Y(0), y2: Y(0) + 5, class: "pl-axis" }, s);
        sv("text", { x: X(x), y: Y(0) + 18, class: "pl-tick", "text-anchor": "middle" }, s).textContent = `${Math.round(x * 100)} cm`;
      }
      // source and detector
      sv("path", { d: `M${X(0)} ${Y(-0.06)}L${X(0)} ${Y(0)}`, class: "pl-line2" }, s);
      sv("text", { x: X(0) + 8, y: Y(-0.045), class: "pl-text muted" }, s).textContent = "ions from source";
      sv("rect", { x: X(2 * RDET) - 9, y: Y(0) + 2, width: 18, height: 14, class: "pl-det" }, s);
      sv("text", { x: X(2 * RDET), y: Y(-0.055), class: "pl-text", "text-anchor": "middle" }, s).textContent = "detector";
      const paths = sv("g", { "clip-path": "url(#sector-clip)" }, s);

      const arc = r => `M${X(0)} ${Y(0)} A ${X(r) - X(0)} ${Y(0) - Y(r)} 0 0 1 ${X(2 * r)} ${Y(0)}`;
      function update() {
        const m = mz.get(), v = V.get(), bb = B.get(), r = radius(m, v, bb);
        paths.innerHTML = "";
        [[m * 0.8, "pl-line2 dash"], [m * 1.25, "pl-line2 dash"], [m, "pl-line"]].forEach(([mm, cls]) =>
          sv("path", { d: arc(radius(mm, v, bb)), class: cls, fill: "none" }, paths));
        const hit = Math.abs(2 * r - 2 * RDET) < 0.004;
        ro.set("r", `${ui.num(r * 100, 3)} cm`);
        ro.set("hit", hit ? "Yes, it lands in the slit" : 2 * r < 2 * RDET ? "No, it curves too tightly. Lower the field." : "No, it swings too wide. Raise the field.");
        ro.set("d", ui.num(mzAt(RDET, v, bb), 4));
      }
      update();
    }
  };
})(window.GI);
