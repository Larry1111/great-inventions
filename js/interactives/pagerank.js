/* ============================================================
   interactives/pagerank.js
   PR(i) = (1 − d)/N + d · Σ_{j→i} PR(j)/L(j), iterated to convergence.
   Pages with no outgoing links share their rank equally with every page.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const NODES = ["A", "B", "C", "D", "E"];
  const CANDIDATES = [["A","B"],["B","C"],["C","A"],["A","C"],["D","C"],["E","D"],["E","A"],["B","D"],["C","E"],["D","A"]];
  const DEFAULT = new Set(["A>B","B>C","C>A","A>C","D>C","E>D","E>A"]);

  GI.INTERACTIVES.pagerank = {
    mount(root) {
      const ui = GI.ui, sv = GI.sv;
      const b = ui.box(root, {
        title: "PageRank on five pages",
        note: "Ranks are computed by repeating the PageRank update until it stops changing. A page with no outgoing links passes its rank to every page equally. Ranks always add up to 100%."
      });
      const links = new Set(DEFAULT);
      const row = ui.el("div", "ix-row", `<div class="ix-lab"><span>Links (tap to turn on or off)</span></div><div class="ix-chips"></div>`);
      b.controls.appendChild(row);
      const chips = row.querySelector(".ix-chips");
      CANDIDATES.forEach(([a, c]) => {
        const k = `${a}>${c}`, btn = ui.el("button", "ix-chip", `${a} → ${c}`);
        btn.type = "button"; btn.setAttribute("aria-pressed", links.has(k));
        btn.addEventListener("click", () => { links.has(k) ? links.delete(k) : links.add(k); btn.setAttribute("aria-pressed", links.has(k)); update(); });
        chips.appendChild(btn);
      });
      const damp = ui.slider(b.controls, { label: "Damping factor d", min: 0.5, max: 0.95, step: 0.01, value: 0.85, fmt: v => v.toFixed(2), onInput: update });
      const ro = ui.readouts(b.controls, [["it", "Iterations to converge"], ["top", "Highest-ranked page"]]);

      // graph drawing
      const W = 640, H = 330, cx = 320, cy = 170, R = 120;
      const pos = NODES.map((_, i) => [cx + R * Math.sin(2 * Math.PI * i / 5), cy - R * Math.cos(2 * Math.PI * i / 5)]);
      const s = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "pl", role: "img", "aria-label": "Link graph with page ranks" }, b.fig);
      const mk = sv("marker", { id: "pr-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, sv("defs", {}, s));
      sv("path", { d: "M0 0L10 5L0 10z", class: "pl-arrowhead" }, mk);
      const gE = sv("g", {}, s), gN = sv("g", {}, s);
      const bars = ui.el("div", "ix-bars"); b.fig.appendChild(bars);

      function compute(d) {
        const N = NODES.length, out = NODES.map(() => []);
        links.forEach(k => { const [a, c] = k.split(">"); out[NODES.indexOf(a)].push(NODES.indexOf(c)); });
        let pr = Array(N).fill(1 / N), it = 0;
        for (; it < 1000; it++) {
          const nx = Array(N).fill((1 - d) / N);
          for (let j = 0; j < N; j++) {
            if (out[j].length) out[j].forEach(i => nx[i] += d * pr[j] / out[j].length);
            else for (let i = 0; i < N; i++) nx[i] += d * pr[j] / N;
          }
          const diff = nx.reduce((a, v, i) => a + Math.abs(v - pr[i]), 0);
          pr = nx; if (diff < 1e-10) break;
        }
        return { pr, it: it + 1 };
      }

      function update() {
        const { pr, it } = compute(damp.get());
        const rad = pr.map(v => 14 + 70 * Math.sqrt(v / Math.PI));
        gE.innerHTML = ""; gN.innerHTML = "";
        links.forEach(k => {
          const [a, c] = k.split(">").map(x => NODES.indexOf(x));
          const [x1, y1] = pos[a], [x2, y2] = pos[c], L = Math.hypot(x2 - x1, y2 - y1);
          const ux = (x2 - x1) / L, uy = (y2 - y1) / L, off = links.has(`${NODES[c]}>${NODES[a]}`) ? 7 : 0;
          const nx = -uy * off, ny = ux * off;
          sv("line", { x1: x1 + ux * rad[a] + nx, y1: y1 + uy * rad[a] + ny, x2: x2 - ux * (rad[c] + 3) + nx, y2: y2 - uy * (rad[c] + 3) + ny, class: "pl-edge", "marker-end": "url(#pr-arrow)" }, gE);
        });
        const top = pr.indexOf(Math.max(...pr));
        NODES.forEach((n, i) => {
          sv("circle", { cx: pos[i][0], cy: pos[i][1], r: rad[i], class: i === top ? "pl-node top" : "pl-node" }, gN);
          sv("text", { x: pos[i][0], y: pos[i][1] + 5, class: "pl-node-label", "text-anchor": "middle" }, gN).textContent = n;
        });
        bars.innerHTML = NODES.map((n, i) => `<div class="ix-bar${i === top ? " top" : ""}"><span>${n}</span><i style="width:${(pr[i] * 100 / Math.max(...pr) * 0.85).toFixed(1)}%"></i><b>${(pr[i] * 100).toFixed(1)}%</b></div>`).join("");
        ro.set("it", it);
        ro.set("top", `${NODES[top]}, with ${(pr[top] * 100).toFixed(1)}% of the rank`);
      }
      update();
    }
  };
})(window.GI);
