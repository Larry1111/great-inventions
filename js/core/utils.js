/* ============================================================
   core/utils.js: small helpers shared by every other file,
   plus the light/dark theme toggle.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  GI.$  = (s, r = document) => r.querySelector(s);
  GI.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  GI.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // escape text before putting it into HTML
  GI.esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[c]));

  // create an SVG element with attributes
  const NS = "http://www.w3.org/2000/svg";
  GI.sv = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  // repeatable random numbers, so each animation looks the same every visit
  GI.rng = seed => {
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };

  // point at fraction u (0..1) along a polyline
  GI.along = (pts, u) => {
    const L = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i-1][0], pts[i][1] - pts[i-1][1]); L.push(l); tot += l; }
    let s = u * tot;
    for (let i = 0; i < L.length; i++) {
      if (s <= L[i]) { const f = s / L[i]; return [pts[i][0] + (pts[i+1][0] - pts[i][0]) * f, pts[i][1] + (pts[i+1][1] - pts[i][1]) * f]; }
      s -= L[i];
    }
    return pts[pts.length - 1];
  };

  // current theme colors, read from css/tokens.css so canvases match the page
  GI.C = {};
  GI.readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    ["paper","sheet","ink","muted","rule","rule-soft","cs","ee","ph"].forEach(k => GI.C[k] = cs.getPropertyValue("--" + k).trim());
    if (GI.allScenes) GI.allScenes.forEach(s => s.drawStatic());
  };

  // theme toggle (remembered in this browser only)
  const root = document.documentElement;
  let saved = null; try { saved = localStorage.getItem("theme"); } catch (e) {}
  if (saved) root.setAttribute("data-theme", saved);
  GI.$("#themeBtn").addEventListener("click", () => {
    const cur = root.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
  new MutationObserver(() => requestAnimationFrame(GI.readColors)).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => requestAnimationFrame(GI.readColors));
})(window.GI);
