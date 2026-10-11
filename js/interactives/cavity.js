/* ============================================================
   interactives/cavity.js
   Longitudinal modes of a two-mirror cavity: Δν = c / (2nL), n = 1.
   Gain curve: Gaussian with the medium's linewidth (FWHM).
   A mode lases if its gain is above the threshold (losses).
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const c = 2.99792458e8;
  const MEDIA = {
    hene:  { label: "Helium-neon, 632.8 nm (gain width 1.5 GHz)", fwhm: 1.5e9 },
    ndyag: { label: "Nd:YAG, 1064 nm (gain width 120 GHz)", fwhm: 120e9 }
  };

  GI.INTERACTIVES.cavity = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "Which cavity modes lase?",
        note: "Mode spacing Δν = c/2L for an air-spaced cavity, with one mode placed at line center. The model assumes every mode above threshold lases. That holds well for helium-neon; in Nd:YAG, competition between modes usually leaves fewer."
      });
      let medium = "hene";
      ui.select(b.controls, { label: "Gain medium", options: Object.entries(MEDIA).map(([k, m]) => [k, m.label]), value: medium, onChange: v => { medium = v; rebuild(); update(); } });
      const L  = ui.slider(b.controls, { label: "Cavity length L", min: 0.001, max: 2, log: true, value: 0.3, fmt: v => v < 0.1 ? `${ui.num(v * 1000, 3)} mm` : `${ui.num(v * 100, 3)} cm`, onInput: update });
      const th = ui.slider(b.controls, { label: "Threshold (loss) level", min: 0.1, max: 0.95, step: 0.01, value: 0.5, fmt: v => `${Math.round(v * 100)}% of peak gain`, onInput: update });
      const ro = ui.readouts(b.controls, [["s", "Mode spacing Δν = c/2L"], ["n", "Modes above threshold"], ["m", "Single-frequency?"]]);

      const p = ui.plot(b.fig, { w: 640, h: 290, title: "Gain curve and cavity modes", x: { min: -1, max: 1 }, y: { min: 0, max: 1.08 } });
      function rebuild() {
        const F = MEDIA[medium].fwhm / 1e9, W = 1.25 * F;
        p.axes({ min: -W, max: W, label: "Frequency offset from line center (GHz)" }, { min: 0, max: 1.08, label: "Gain (relative)", ticks: [0, .25, .5, .75, 1], fmt: v => v });
      }
      function update() {
        const F = MEDIA[medium].fwhm, W = 1.25 * F, dv = c / (2 * L.get()), t = th.get();
        const g = f => Math.exp(-4 * Math.LN2 * f * f / (F * F));
        p.clear();
        const curve = []; for (let i = 0; i <= 300; i++) { const f = -W + 2 * W * i / 300; curve.push([f / 1e9, g(f)]); }
        p.area(curve, 0, "pl-fill");
        p.path(curve);
        p.hline(t, "pl-ref warn");
        p.text(-W / 1e9, t, "threshold", "pl-text warn", "start", 4, -6);
        const kmax = Math.floor(W / dv), total = 2 * kmax + 1;
        let lasing = 0;
        for (let k = -kmax; k <= kmax; k++) if (g(k * dv) > t) lasing++;
        if (total <= 400) {
          for (let k = -kmax; k <= kmax; k++) {
            const f = k * dv, on = g(f) > t;
            p.path([[f / 1e9, 0], [f / 1e9, on ? g(f) : Math.min(g(f), 1.02)]], on ? "pl-mode on" : "pl-mode");
          }
        } else {
          const half = F / 2 * Math.sqrt(Math.log(1 / t) / Math.LN2);
          p.area([[-half / 1e9, 1.04], [half / 1e9, 1.04]], 0, "pl-fill2");
          p.text(0, 1.04, "modes too closely spaced to draw individually", "pl-text muted", "middle", 0, -4);
        }
        ro.set("s", ui.si(dv, "Hz"));
        ro.set("n", lasing.toLocaleString("en-US"));
        ro.set("m", lasing === 1 ? "Yes, one mode" : lasing === 0 ? "No mode reaches threshold" : `No, ${lasing.toLocaleString("en-US")} modes`);
      }
      rebuild(); update();
    }
  };
})(window.GI);
