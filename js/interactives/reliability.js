/* ============================================================
   interactives/reliability.js
   A circuit with n independent joints, each failing with probability p,
   works with probability (1 − p)^n.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  GI.INTERACTIVES.reliability = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "The tyranny of numbers",
        note: "Assumes every joint fails independently with the same probability, and that one bad joint stops the circuit. The curve shows the chance the whole circuit works as the component count grows."
      });
      const N = ui.slider(b.controls, { label: "Components in the circuit", min: 10, max: 100000, log: true, value: 1000, fmt: v => Math.round(v).toLocaleString("en-US"), onInput: update });
      const j = ui.slider(b.controls, { label: "Soldered joints per component", min: 2, max: 4, step: 1, value: 2, fmt: v => v, onInput: update });
      const p = ui.slider(b.controls, { label: "Reliability of each joint", min: 1e-7, max: 1e-2, log: true, value: 1e-4,
        fmt: v => `${(100 * (1 - v)).toFixed(Math.min(6, Math.max(1, Math.ceil(-Math.log10(v)) - 2)))}%`, onInput: update });
      // the slider runs from best to worst, so flip it visually
      p.input.style.direction = "rtl";
      const ro = ui.readouts(b.controls, [["n", "Joints in total"], ["w", "Chance the circuit works"], ["bad", "Expected bad joints"]]);

      const pl = ui.plot(b.fig, { w: 640, h: 300, title: "Chance the circuit works versus number of components",
        x: { min: 10, max: 100000, log: true, label: "Components (log scale)", fmt: v => v.toLocaleString("en-US") },
        y: { min: 0, max: 100, label: "Works (%)", ticks: [0, 25, 50, 75, 100] } });

      function update() {
        const n = Math.round(N.get()) * j.get(), q = p.get();
        const works = n2 => 100 * Math.exp(n2 * Math.log1p(-q));
        pl.clear();
        const pts = []; for (let lx = 1; lx <= 5.0001; lx += .02) pts.push([Math.pow(10, lx), works(Math.pow(10, lx) * j.get())]);
        pl.area(pts, 0, "pl-fill"); pl.path(pts);
        const w = works(n);
        pl.dot(N.get(), w, 6);
        pl.text(N.get(), w, `${ui.num(w, 3)}%`, "pl-text strong", N.get() > 20000 ? "end" : "start", N.get() > 20000 ? -10 : 10, -8);
        ro.set("n", n.toLocaleString("en-US"));
        ro.set("w", `${ui.num(w, 3)}%`);
        ro.set("bad", ui.num(n * q, 3));
      }
      update();
    }
  };
})(window.GI);
