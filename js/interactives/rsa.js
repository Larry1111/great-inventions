/* ============================================================
   interactives/rsa.js
   Textbook RSA with small primes, computed exactly with BigInt:
     n = p·q, φ = (p−1)(q−1), d = e⁻¹ mod φ, c = mᵉ mod n, m = cᵈ mod n
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const PRIMES = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139];
  const EXPS = [3, 5, 7, 11, 13, 17, 19, 23, 65537];
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const modInv = (a, m) => {           // extended Euclid
    let [r0, r1, s0, s1] = [BigInt(a), BigInt(m), 1n, 0n];
    while (r1) { const q = r0 / r1; [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
    return ((s0 % BigInt(m)) + BigInt(m)) % BigInt(m);
  };
  const modPow = (b, e, m) => { let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; };

  GI.INTERACTIVES.rsa = {
    mount(root) {
      const ui = GI.ui;
      const b = ui.box(root, {
        title: "Build an RSA key and use it",
        note: "Exact arithmetic with tiny primes so every step is visible. Real keys use primes over 300 digits long, and real messages are padded with random data before encryption."
      });
      const opts = PRIMES.map(x => [x, String(x)]);
      const P = ui.select(b.controls, { label: "Prime p", options: opts, value: 61, onChange: update });
      const Q = ui.select(b.controls, { label: "Prime q", options: opts, value: 53, onChange: update });
      const E = ui.select(b.controls, { label: "Public exponent e", options: EXPS.map(x => [x, x.toLocaleString("en-US")]), value: 17, onChange: update });
      const row = ui.el("div", "ix-row", `<div class="ix-lab"><label for="rsa-m">Message m (a number below n)</label></div><input id="rsa-m" class="ix-num" type="number" min="0" step="1" value="65">`);
      b.controls.appendChild(row);
      const M = row.querySelector("input");
      M.addEventListener("input", update);

      const steps = ui.el("ol", "ix-steps"); b.fig.appendChild(steps);

      function update() {
        const p = +P.get(), q = +Q.get(), e = +E.get();
        const n = p * q, phi = (p - 1) * (q - 1);
        let html = `<li><b>Multiply the primes</b><span>n = p × q = ${p} × ${q} = <code>${n.toLocaleString("en-US")}</code></span></li>
          <li><b>Compute φ(n)</b><span>φ = (p − 1)(q − 1) = ${p - 1} × ${q - 1} = <code>${phi.toLocaleString("en-US")}</code></span></li>`;
        if (p === q) { steps.innerHTML = html + `<li class="bad"><b>Pick two different primes</b><span>With p = q, n is a perfect square and trivially factored.</span></li>`; return; }
        if (gcd(e, phi) !== 1) { steps.innerHTML = html + `<li class="bad"><b>e doesn't work here</b><span>e = ${e} shares a factor with φ = ${phi}, so no private exponent exists. Choose another e or other primes.</span></li>`; return; }
        const d = modInv(e, phi);
        let m = Math.floor(+M.value);
        if (!(m >= 0)) m = 0;
        const clamped = m >= n; if (clamped) m = n - 1;
        const c = modPow(BigInt(m), BigInt(e), BigInt(n)), back = modPow(c, d, BigInt(n));
        html += `<li><b>Find the private exponent d</b><span>e × d ≡ 1 (mod φ): d = <code>${d.toLocaleString("en-US")}</code>, since ${e} × ${d} = ${(BigInt(e) * d).toLocaleString("en-US")} = ${((BigInt(e) * d) / BigInt(phi)).toLocaleString("en-US")} × ${phi} + 1</span></li>
          <li><b>Publish the public key</b><span>(n, e) = (<code>${n}</code>, <code>${e}</code>). Keep d, p and q secret.</span></li>
          <li><b>Encrypt</b><span>c = m<sup>e</sup> mod n = ${m}<sup>${e}</sup> mod ${n} = <code class="hl">${c}</code>${clamped ? ` <em>(m must be below n, so it was set to ${m})</em>` : ""}</span></li>
          <li><b>Decrypt</b><span>m = c<sup>d</sup> mod n = ${c}<sup>${d}</sup> mod ${n} = <code class="hl">${back}</code> ${back === BigInt(m) ? "✓ the original message" : ""}</span></li>`;
        steps.innerHTML = html;
      }
      update();
    }
  };
})(window.GI);
