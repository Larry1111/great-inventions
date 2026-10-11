/* ============================================================
   figures/computing.js: FIG. 1C, a self-attention layer.
   Choose which word is asking; the weights show who it listens to.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const TOK  = ["the", "beam", "hits", "wafer"];       // the example sentence
  const TX   = [90, 170, 250, 330];                    // x position of each word
  const W    = [[.55,.25,.1,.1],[.15,.5,.25,.1],[.05,.45,.3,.2],[.05,.35,.25,.35]];   // attention weights per query word
  const NEXT = ["beam", "hits", "the", "."];           // predicted next word per query word
  const CAND = ["beam", "hits", "the", "."];           // words shown in the prediction bars

  GI.FIGS.cs = {
    code: "1C",
    title: "Self-attention layer",
    ctrl: { label: "Query token", min: 0, max: 3, step: 1, val: 1, fmt: v => `“${TOK[v]}”` },
    tryit: [
      "Hover a numeral to identify each part.",
      "Slide the query token to choose which word is asking.",
      "The attention weights (52) show how much it listens to each word; the bars (60) show its guess for the next word."
    ],
    parts: [
      { n:60, l:"Next-token prediction", d:"Scores for what comes next. The tallest bar is the model’s guess.",
        s:[["line",{x1:150,y1:66,x2:270,y2:66}]], num:[436,46], to:[272,52] },
      { n:58, l:"Output states", d:"One vector per position, now informed by the words it attended to.",
        s:TX.map(x => ["circle",{cx:x,cy:100,r:9}]), num:[436,104], to:[340,100] },
      { n:56, l:"Feed-forward block", d:"The same small network applied to every position independently.",
        s:[["rect",{x:62,y:148,width:296,height:30,rx:6}], ...TX.map(x => ["line",{x1:x,y1:148,x2:x,y2:109}])], num:[436,166], to:[359,163] },
      { n:54, l:"Attention heads", d:"Each position asks a question (query) and compares it with every other position’s key.",
        s:TX.map(x => ["circle",{cx:x,cy:224,r:10}]).concat(TX.map(x => ["line",{x1:x,y1:214,x2:x,y2:178}])), num:[436,224], to:[341,224] },
      { n:52, l:"Attention weights", d:"How much each word listens to each other word. Slide the query token to watch them shift.",
        s:TX.flatMap(xi => TX.map(xj => ["line",{x1:xj,y1:317,x2:xi,y2:234,cls:"faint"}])), num:[436,280], to:[330,276] },
      { n:50, l:"Token embeddings", d:"Each input word becomes a vector of numbers.",
        s:TX.map(x => ["rect",{x:x - 32,y:318,width:64,height:28,rx:4}]), num:[34,372], to:[60,346], txt:TX.map((x, i) => [x, 337, TOK[i]]) }
    ],

    build(dyn, sv) {
      return {
        w:    TX.map(() => sv("line",   { class:"dyn-stroke", "stroke-linecap":"round" }, dyn)),
        wt:   TX.map(() => sv("text",   { class:"lbl", "text-anchor":"middle" }, dyn)),
        p:    Array.from({ length:8 }, () => sv("circle", { r:2.6, class:"dyn-acc" }, dyn)),
        up:   Array.from({ length:3 }, () => sv("circle", { r:2.6, class:"dyn-acc" }, dyn)),
        hl:   sv("circle", { r:10, class:"dyn-acc", opacity:.25 }, dyn),
        ol:   sv("circle", { r:9,  class:"dyn-acc", opacity:.25, cy:100 }, dyn),
        bars: CAND.map(() => sv("rect", { width:18, class:"dyn-acc", rx:2 }, dyn)),
        bl:   CAND.map(() => sv("text", { class:"lbl", "text-anchor":"middle" }, dyn)),
        next: sv("text", { x:150, y:26, class:"lbl" }, dyn)
      };
    },

    tick(D, t, st) {
      const set = (el, o) => { for (const a in o) el.setAttribute(a, o[a]); };
      const q = Math.round(st.val), w = W[q];
      D.w.forEach((l, j) => set(l, { x1:TX[j], y1:317, x2:TX[q], y2:234, "stroke-width":1 + w[j] * 9, opacity:.25 + w[j] * 1.2 }));
      D.wt.forEach((tx, j) => { set(tx, { x:TX[j] + (TX[q] - TX[j]) * .12, y:306 }); tx.textContent = w[j].toFixed(2); });
      D.p.forEach((c, i) => { const j = i % 4, u = ((t * .6) + Math.floor(i / 4) * .5 + j * .13) % 1; set(c, { cx:TX[j] + (TX[q] - TX[j]) * u, cy:317 - 83 * u, opacity:(w[j] * 1.6).toFixed(2) }); });
      D.up.forEach((c, i) => { const u = ((t * .5) + i / 3) % 1; set(c, { cx:TX[q], cy:214 - 105 * u }); });
      set(D.hl, { cx:TX[q], cy:224, r:10 + Math.sin(t * 4) * 2 }); D.ol.setAttribute("cx", TX[q]);
      const sc = CAND.map((c, i) => c === NEXT[q] ? .9 : .15 + ((i * 7 + q * 3) % 5) * .06);
      D.bars.forEach((b, i) => { const hh = sc[i] * 34; set(b, { x:151 + i * 30, y:66 - hh, height:hh, opacity:CAND[i] === NEXT[q] ? 1 : .35 }); });
      D.bl.forEach((tx, i) => { set(tx, { x:160 + i * 30, y:80 }); tx.textContent = CAND[i]; });
      D.next.textContent = `after “${TOK[q]}” → “${NEXT[q]}”`;
    }
  };
})(window.GI);
