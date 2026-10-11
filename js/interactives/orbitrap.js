/* ============================================================
   interactives/orbitrap.js
   Axial frequency f ∝ 1/√(m/z). Scale chosen so m/z 400 → 500 kHz.
   Spectrum of two sinusoids recorded for time T: sum of sinc functions,
   |S(f)| = |sinc((f−f_A)T) + sinc((f−f_B)T)|, sinc(x) = sin(πx)/(πx).
   Peaks separate when Δf exceeds about 1.2/T (main-lobe FWHM ≈ 1.207/T).
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const F0 = 500e3, M0 = 400;
  const freq = mz => F0 * Math.sqrt(M0 / mz);
  const mzOf = f => M0 * (F0 / f) ** 2;
  const sinc = x => x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);

  GI.INTERACTIVES.orbitrap = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "Recording time versus peak sharpness",
        note: "Frequencies scale as 1/√(m/z). The scale is set so m/z 400 oscillates at 500 kHz; real instruments differ, but the scaling holds. Peaks are the Fourier transform of a signal recorded for time T without windowing, so each has width about 1/T in frequency."
      });
      const mA = ui.slider(b.controls, { label: "Ion A, m/z", min: 100, max: 2000, log: true, value: 400, fmt: v => ui.num(v, 4), onInput: update });
      const dm = ui.slider(b.controls, { label: "Ion B is heavier by", min: 0.001, max: 1, log: true, value: 0.01, fmt: v => `${ui.num(v, 2)} m/z`, onInput: update });
      const T  = ui.slider(b.controls, { label: "Recording time T", min: 0.01, max: 2, log: true, value: 0.5, fmt: v => v < 1 ? `${ui.num(v * 1000, 3)} ms` : `${ui.num(v, 3)} s`, onInput: update });
      const ro = ui.readouts(b.controls, [["f", "Axial frequencies"], ["df", "Difference Δf"], ["R", "Resolving power m/Δm"], ["s", "Two peaks separated?"]]);

      const p = ui.plot(b.fig, { w: 640, h: 260, title: "Mass spectrum around the two ions", x: { min: 0, max: 1 }, y: { min: 0, max: 1.1 } });
      const q = ui.plot(b.fig, { w: 640, h: 170, m: { b: 40 }, title: "Envelope of the recorded signal", x: { min: 0, max: 1 }, y: { min: -1.1, max: 1.1 } });

      function update() {
        const a = mA.get(), bm = a + dm.get(), t = T.get();
        const fA = freq(a), fB = freq(bm), df = fA - fB;
        const fwhmF = 1.207 / t, R = fA / (2 * fwhmF), widthM = a / R;
        const span = Math.max(dm.get(), widthM) * 3;
        const lo = a - span, hi = bm + span;
        const prec = Math.max(0, Math.min(4, 1 - Math.floor(Math.log10(hi - lo))));
        p.axes({ min: lo, max: hi, label: "m/z", n: 4, fmt: v => v.toFixed(prec) }, { min: 0, max: 1.1, label: "Signal (relative)", ticks: [0, .5, 1], fmt: v => v });
        p.clear();
        const pts = []; let mx = 0;
        for (let i = 0; i <= 500; i++) {
          const mz = lo + (hi - lo) * i / 500, f = freq(mz);
          const s = Math.abs(sinc((f - fA) * t) + sinc((f - fB) * t)); pts.push([mz, s]); mx = Math.max(mx, s);
        }
        const norm = pts.map(([x, y]) => [x, y / mx]);
        p.area(norm, 0, "pl-fill"); p.path(norm);
        p.vline(a, "pl-ref"); p.vline(bm, "pl-ref");
        p.text(a, 1.06, "A", "pl-text muted", "middle"); p.text(bm, 1.06, "B", "pl-text muted", "middle");

        // envelope of A + B: |cos(π Δf t)|
        q.axes({ min: 0, max: t * 1000, label: "Time (ms)", n: 5 }, { min: -1.1, max: 1.1, label: "Amplitude", ticks: [-1, 0, 1], fmt: v => v });
        q.clear();
        const beats = df * t;
        if (beats > 150) {
          q.area([[0, 1], [t * 1000, 1]], -1, "pl-fill2");
          q.text(t * 500, 0, `${ui.num(beats, 3)} beats: too many to draw`, "pl-text muted", "middle");
        } else {
          const env = [], neg = [];
          for (let i = 0; i <= 600; i++) { const tt = t * i / 600, v = Math.abs(Math.cos(Math.PI * df * tt)); env.push([tt * 1000, v]); neg.push([tt * 1000, -v]); }
          q.path(env); q.path(neg);
        }

        ro.set("f", `A ${ui.num(fA / 1e3, 6)} kHz · B ${ui.num(fB / 1e3, 6)} kHz`);
        ro.set("df", `${ui.si(df, "Hz")} (one beat every ${ui.si(1 / df, "s")})`);
        ro.set("R", ui.num(R, 3));
        ro.set("s", df > 1.2 / t ? "Yes" : "No, record longer or use ions further apart");
      }
      update();
    }
  };
})(window.GI);
