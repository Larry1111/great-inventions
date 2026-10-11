/* ============================================================
   interactives/boltzmann.js
   Thermal populations of two levels separated by a photon energy:
     ΔE = hc/λ = 1239.84 eV·nm / λ,   N₂/N₁ = exp(−ΔE / kT)
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const HC = 1239.84193, KB = 8.617333262e-5;   // eV·nm, eV/K
  GI.INTERACTIVES.boltzmann = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "Can heat alone create a population inversion?",
        note: "Two energy levels with equal degeneracy in thermal equilibrium. Light is amplified only when N₂/N₁ is above 1."
      });
      const lam = ui.slider(b.controls, { label: "Transition wavelength", min: 200, max: 20000, log: true, value: 633, fmt: v => v < 1000 ? `${v.toFixed(0)} nm` : `${ui.num(v / 1000, 3)} µm`, onInput: update });
      const T   = ui.slider(b.controls, { label: "Temperature", min: 100, max: 10000, log: true, value: 300, fmt: v => `${ui.num(v, 3)} K`, onInput: update });
      const ro = ui.readouts(b.controls, [["e", "Photon energy ΔE"], ["k", "Thermal energy kT"], ["r", "Upper / lower population N₂/N₁"], ["n", "Net effect on light"]]);

      const p = ui.plot(b.fig, { w: 640, h: 290, title: "Population ratio versus temperature",
        x: { min: 100, max: 10000, log: true, label: "Temperature (K, log scale)", fmt: v => ui.num(v, 2) },
        y: { min: 0, max: 1.1, label: "N₂ / N₁", ticks: [0, .25, .5, .75, 1], fmt: v => v } });

      function update() {
        const dE = HC / lam.get(), kT = KB * T.get(), lg = -dE / kT / Math.LN10;
        p.clear();
        p.hline(1, "pl-ref warn");
        p.text(110, 1, "needed for gain: N₂/N₁ > 1", "pl-text warn", "start", 4, -6);
        const pts = []; for (let lx = 2; lx <= 4.0001; lx += .01) { const t = Math.pow(10, lx); pts.push([t, Math.exp(-dE / (KB * t))]); }
        p.path(pts);
        const r = Math.exp(-dE / kT);
        p.dot(T.get(), r, 6);
        p.text(T.get(), r, `${ui.num(T.get(), 3)} K`, "pl-text strong", T.get() > 4000 ? "end" : "start", T.get() > 4000 ? -10 : 10, -8);

        ro.set("e", `${ui.num(dE, 3)} eV`);
        ro.set("k", `${ui.num(kT, 3)} eV`);
        ro.set("r", lg < -300 ? `below 10${ui.sup(-300)}` : ui.sciLog(lg, 2));
        ro.set("n", `Absorption wins. The lower level holds ${lg < -2 ? "essentially all" : "more of"} the atoms.`);
      }
      update();
    }
  };
})(window.GI);
