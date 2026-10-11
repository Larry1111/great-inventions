/* ============================================================
   interactives/resolution.js
   Light: Abbe diffraction limit d = λ / (2·NA).
   Electrons: relativistic de Broglie wavelength
     λ = h / √(2·m₀·e·V·(1 + e·V / (2·m₀·c²)))
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const h = 6.62607015e-34, m0 = 9.1093837015e-31, e = 1.602176634e-19, c = 2.99792458e8;
  const electronWavelength = V => h / Math.sqrt(2 * m0 * e * V * (1 + e * V / (2 * m0 * c * c)));
  const ATOM = 0.235e-9;   // Si–Si spacing

  GI.INTERACTIVES.resolution = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "Wavelength sets the smallest detail you can see",
        note: "Light uses the Abbe limit d = λ / (2·NA). Electron wavelengths include the relativistic correction. Landmarks are typical sizes: silicon atom spacing 0.235 nm, DNA helix width about 2 nm, an influenza virus about 100 nm, an E. coli bacterium about 2 µm."
      });
      let mode = "light";
      ui.segment(b.controls, { label: "Probe", options: [["light", "Visible light"], ["electron", "Electrons"]], value: mode, onChange: v => { mode = v; show(); update(); } });
      const lam = ui.slider(b.controls, { label: "Wavelength", min: 380, max: 750, step: 1, value: 550, fmt: v => `${v.toFixed(0)} nm`, onInput: update });
      const na  = ui.slider(b.controls, { label: "Numerical aperture (NA)", min: 0.1, max: 1.4, step: 0.01, value: 1.4, fmt: v => v.toFixed(2), onInput: update });
      const kv  = ui.slider(b.controls, { label: "Accelerating voltage", min: 1, max: 300, log: true, value: 100, fmt: v => `${ui.num(v, 3)} kV`, onInput: update });
      const ro = ui.readouts(b.controls, [["w", "Wavelength"], ["d", "Smallest resolvable detail"], ["r", "Compared with atom spacing"]]);
      function show() { lam.row.hidden = na.row.hidden = mode !== "light"; kv.row.hidden = mode === "light"; }

      const p = ui.plot(b.fig, {
        w: 640, h: 230, m: { l: 18, r: 18, t: 18, b: 46 }, title: "Log scale of sizes from picometers to micrometers",
        x: { min: 1e-12, max: 1e-5, log: true, label: "Size (log scale)", fmt: v => ui.si(v, "m", 1) },
        y: { min: 0, max: 1, hide: true }
      });
      const marks = [[ATOM, "Si atom spacing", .16], [2e-9, "DNA width", .34], [100e-9, "Virus", .16], [2e-6, "Bacterium", .34]];

      function update() {
        const L = mode === "light" ? lam.get() * 1e-9 : electronWavelength(kv.get() * 1e3);
        const d = mode === "light" ? L / (2 * na.get()) : null;
        p.clear();
        if (d) {
          p.area([[1e-12, 1], [d, 1]], 0, "pl-fill");
          p.text(Math.sqrt(1e-12 * d), .9, "Too small to resolve", "pl-text muted", "middle");
        }
        marks.forEach(([x, t, y]) => {
          p.path([[x, 0], [x, y + .08]], "pl-line2");
          p.dot(x, 0, 3.5, "pl-pt2");
          p.text(x, y + .1, t, "pl-text muted", "middle", 0, -4);
        });
        p.path([[L, 0], [L, .62]], "pl-line");
        p.dot(L, .62, 5);
        p.text(L, .62, `λ = ${ui.si(L, "m")}`, "pl-text strong", "middle", 0, -10);
        if (d) {
          p.path([[d, 0], [d, .78]], "pl-line dash");
          p.text(d, .78, `limit ${ui.si(d, "m")}`, "pl-text", "middle", 0, -10);
        }
        ro.set("w", ui.si(L, "m"));
        if (mode === "light") {
          ro.set("d", ui.si(d, "m"));
          ro.set("r", `${ui.num(d / ATOM, 3)}× larger than the gap between atoms`);
        } else {
          ro.set("d", "about 0.05 nm in the best aberration-corrected microscopes");
          ro.set("r", `wavelength is ${ui.num(ATOM / L, 3)}× smaller than the gap between atoms`);
        }
      }
      show(); update();
    }
  };
})(window.GI);
