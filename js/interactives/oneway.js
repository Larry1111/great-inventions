/* ============================================================
   interactives/oneway.js
   Effort to multiply two d/2-digit numbers (schoolbook): about (d/2)² digit operations.
   Effort to factor a d-digit semiprime by trial division: about π(√n) ≈ √n / ln √n
   candidate primes. Times assume 10⁹ trial divisions per second.
   The demo factors a real number by trial division in your browser.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const LN10 = Math.LN10, SEC_PER_YEAR = 3.156e7, UNIVERSE_YEARS = 1.38e10;
  const multLog = d => 2 * Math.log10(Math.max(1, d / 2));                   // log10 of (d/2)²
  const trialLog = d => d / 2 - Math.log10((d / 2) * LN10);                  // log10 of √n / ln √n

  GI.INTERACTIVES.oneway = {
    mount(root) {
      const ui = GI.ui, esc = GI.esc;
      const b = ui.box(root, {
        title: "Multiplying versus factoring",
        note: "Trial division is the simplest factoring method. The best known method, the number field sieve, is far faster but still grows faster than any polynomial in the number of digits. Times assume a billion trial divisions per second."
      });
      const d = ui.slider(b.controls, { label: "Digits in the number n", min: 2, max: 620, step: 1, value: 40, fmt: v => `${v} digits`, onInput: update });
      const ro = ui.readouts(b.controls, [["m", "Multiply the two primes"], ["t", "Factor by trial division"], ["y", "Time to factor"]]);

      const p = ui.plot(b.fig, { w: 640, h: 300, title: "Operations needed, in powers of ten",
        x: { min: 0, max: 620, label: "Digits in n", ticks: [0, 100, 200, 300, 400, 500, 600] },
        y: { min: 0, max: 320, label: "Operations (powers of 10)", ticks: [0, 50, 100, 150, 200, 250, 300], fmt: v => `10${ui.sup(v)}` } });

      // live demo
      const demo = ui.el("div", "ix-demo", `
        <label for="ow-n">Try it: factor a number up to 15 digits</label>
        <div class="ix-demo-row"><input id="ow-n" type="text" inputmode="numeric" value="${1000003 * 999999937}"><button type="button" class="btn ghost">Factor it</button></div>
        <p class="ix-demo-out" aria-live="polite">This number is 1,000,003 × 999,999,937. Trial division has to try about half a million divisors to find that.</p>`);
      b.fig.appendChild(demo);
      const inp = demo.querySelector("input"), out = demo.querySelector(".ix-demo-out");
      demo.querySelector("button").addEventListener("click", () => {
        const s = inp.value.replace(/[,\s]/g, "");
        if (!/^\d{1,15}$/.test(s) || +s < 2) { out.textContent = "Enter a whole number from 2 up to 15 digits."; return; }
        let n = Number(s), tries = 0; const f = [], t0 = performance.now();
        while (n % 2 === 0) { f.push(2); n /= 2; tries++; }
        for (let k = 3; k * k <= n; k += 2) { tries++; while (n % k === 0) { f.push(k); n /= k; } }
        if (n > 1) f.push(n);
        const ms = performance.now() - t0;
        out.innerHTML = `${esc(Number(s).toLocaleString("en-US"))} = ${f.map(x => x.toLocaleString("en-US")).join(" × ")}<br><span class="muted">${tries.toLocaleString("en-US")} trial divisions in ${ms.toFixed(0)} ms.${f.length === 1 ? " It's prime." : ""}</span>`;
      });

      function update() {
        const dv = d.get();
        p.clear();
        const m = [], t = []; for (let x = 2; x <= 620; x += 2) { m.push([x, multLog(x)]); t.push([x, trialLog(x)]); }
        const oneSec = 9, universe = Math.log10(1e9 * UNIVERSE_YEARS * SEC_PER_YEAR);
        p.hline(oneSec, "pl-ref"); p.text(615, oneSec, "1 second", "pl-text muted", "end", 0, -6);
        p.hline(universe, "pl-ref warn"); p.text(615, universe, "age of the universe", "pl-text warn", "end", 0, -6);
        p.vline(617, "pl-ref dash"); p.text(612, 300, "RSA-2048 (617 digits)", "pl-text muted", "end", 0, 4);
        p.path(t); p.path(m, "pl-line2");
        p.text(300, trialLog(300), "factoring", "pl-text strong", "start", 8, 0);
        p.text(300, multLog(300), "multiplying", "pl-text muted", "start", 0, -10);
        p.dot(dv, trialLog(dv), 6); p.dot(dv, multLog(dv), 4, "pl-pt2");

        const secLog = trialLog(dv) - 9, yrLog = secLog - Math.log10(SEC_PER_YEAR);
        ro.set("m", `about ${ui.num(Math.pow(10, multLog(dv)), 2)} digit operations, instant`);
        ro.set("t", `about ${ui.sciLog(trialLog(dv), 2)} divisions`);
        ro.set("y", secLog < 0 ? "under a second" : secLog < Math.log10(SEC_PER_YEAR) ? `${ui.num(Math.pow(10, secLog), 2)} seconds` :
          yrLog < Math.log10(UNIVERSE_YEARS) ? `${ui.sciLog(yrLog, 2)} years` : `${ui.sciLog(yrLog, 2)} years, ${ui.sciLog(yrLog - Math.log10(UNIVERSE_YEARS), 2)} times the age of the universe`);
      }
      update();
    }
  };
})(window.GI);
