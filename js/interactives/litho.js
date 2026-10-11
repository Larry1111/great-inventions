/* ============================================================
   interactives/litho.js
   Rayleigh resolution for projection lithography:
     half-pitch = k₁ · λ / NA
   NA ranges are approximate for each generation of tools.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const SOURCES = [
    { k: "g",    name: "g-line mercury lamp",   lam: 436,  na: [0.30, 0.60] },
    { k: "i",    name: "i-line mercury lamp",   lam: 365,  na: [0.30, 0.65] },
    { k: "krf",  name: "KrF excimer laser",     lam: 248,  na: [0.40, 0.93] },
    { k: "arf",  name: "ArF excimer laser",     lam: 193,  na: [0.50, 0.93] },
    { k: "arfi", name: "ArF immersion (water)", lam: 193,  na: [0.93, 1.35] },
    { k: "euv",  name: "Extreme ultraviolet",   lam: 13.5, na: [0.25, 0.55] }
  ];

  GI.INTERACTIVES.litho = {
    mount(root) {
      const ui = GI.ui, sv = GI.sv;
      const b = ui.box(root, {
        title: "How fine can a lithography tool print?",
        note: "Half-pitch = k₁·λ/NA, the single-exposure resolution of a projection system. NA ranges are approximate for each tool generation; 0.33 and 0.55 are the two EUV generations. Chips today print below these limits by splitting one layer into several exposures."
      });
      let src = SOURCES[5];
      ui.select(b.controls, { label: "Light source", options: SOURCES.map(s => [s.k, `${s.name}, ${s.lam} nm`]), value: src.k,
        onChange: v => { src = SOURCES.find(s => s.k === v); na.setRange(src.na[0], src.na[1]); na.set(src.na[1]); update(); } });
      const na = ui.slider(b.controls, { label: "Numerical aperture NA", min: src.na[0], max: src.na[1], step: 0.01, value: 0.33, fmt: v => v.toFixed(2), onInput: update });
      const k1 = ui.slider(b.controls, { label: "Process factor k₁", min: 0.25, max: 0.8, step: 0.01, value: 0.4, fmt: v => v.toFixed(2), onInput: update });
      const ro = ui.readouts(b.controls, [["hp", "Smallest half-pitch"], ["p", "Line pitch"]]);

      // pattern drawing
      const W = 640, H = 150;
      const pat = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "pl", role: "img", "aria-label": "Printed lines at this resolution" }, b.fig);
      // comparison chart
      const pl = ui.plot(b.fig, { w: 640, h: 250, m: { l: 150 }, title: "Smallest half-pitch for each light source at its highest NA",
        x: { min: 5, max: 1000, log: true, label: "Half-pitch at the source's highest NA (nm, log scale)", fmt: v => ui.num(v, 1) },
        y: { min: 0, max: SOURCES.length, ticks: [] } });

      function update() {
        const hp = k1.get() * src.lam / na.get();
        // pattern: 6 lines across a window scaled to 12 half-pitches
        pat.innerHTML = "";
        const win = 12 * hp, px = (W - 40) / win, x0 = 20;
        for (let i = 0; i < 6; i++) sv("rect", { x: x0 + (2 * i + 0.5) * hp * px, y: 18, width: hp * px, height: 80, class: "pl-litho" }, pat);
        const bar = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000].find(v => v >= win / 4);
        sv("line", { x1: x0, x2: x0 + bar * px, y1: 122, y2: 122, class: "pl-scale" }, pat);
        sv("text", { x: x0, y: 142, class: "pl-tick" }, pat).textContent = `${bar} nm`;
        sv("text", { x: W - 20, y: 142, class: "pl-tick", "text-anchor": "end" }, pat).textContent = `lines and spaces ${ui.num(hp, 3)} nm wide`;

        pl.clear();
        SOURCES.forEach((s, i) => {
          const y = SOURCES.length - i - 0.5, v = k1.get() * s.lam / s.na[1], on = s === src;
          pl.path([[5, y], [v, y]], on ? "pl-bar on" : "pl-bar");
          pl.text(5, y, `${s.name}`, on ? "pl-text strong" : "pl-text muted", "end", -10, 4);
          pl.text(v, y, `${ui.num(v, 3)} nm`, on ? "pl-text strong" : "pl-text muted", "start", 8, 4);
        });
        ro.set("hp", `${ui.num(hp, 3)} nm`);
        ro.set("p", `${ui.num(2 * hp, 3)} nm`);
      }
      update();
    }
  };
})(window.GI);
