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

  // "2026-10-11" -> "October 11, 2026"
  GI.fmtDate = s => new Date(s + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

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
})(window.GI);
