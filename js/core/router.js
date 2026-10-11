/* ============================================================
   core/router.js: builds the menu, switches pages when the
   address changes (#physics, #library, #ep-rsa ...) and starts the site.
   Load this file last.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const { $, $$, CONFIG, FIELDS, ORDER, VIDEOS } = GI;

  // ---------- menu ----------
  // [address, label, field key (for the colored dot)]
  const NAV = [
    ["home", "Home"],
    ...ORDER.map(k => [FIELDS[k].slug, FIELDS[k].short, k]),
    ["library", "Library"],
    ["about", "About"],
    ["contact", "Contact"]
  ];
  const sepBefore = "library";
  $("#links").innerHTML = NAV.map(([h, l, f]) =>
    `${h === sepBefore ? '<li class="sep" aria-hidden="true"></li>' : ""}<li><a href="#${h}" data-nav="${h}" ${f ? `data-field="${f}"` : ""}>${f ? "<i></i>" : ""}${l}</a></li>`).join("");
  $("#drawerLinks").innerHTML = NAV.map(([h, l, f]) =>
    `<li><a href="#${h}" data-nav="${h}" ${f ? `data-field="${f}"` : ""}>${l}<span class="mono">${f ? GI.counts[f] + " episodes" : h === "library" ? VIDEOS.length + " episodes" : ""}</span></a></li>`).join("");

  $$(".js-site").forEach(e => e.textContent = CONFIG.site);
  $$(".js-tagline").forEach(e => e.textContent = CONFIG.tagline);
  $("#yr").textContent = new Date().getFullYear();

  const menuBtn = $("#menuBtn"), drawer = $("#drawer");
  const setMenu = open => { drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", open); menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
  menuBtn.addEventListener("click", () => setMenu(drawer.hidden));

  // ---------- pages ----------
  function resolve(h) {
    if (!h || h === "home" || h === "top") return GI.PAGES.home();
    if (GI.fieldBySlug[h]) return GI.PAGES.field(GI.fieldBySlug[h]);
    if (h === "library") return GI.PAGES.library();
    if (h === "about") return GI.PAGES.about();
    if (h === "contact") return GI.PAGES.contact();
    if (h.startsWith("ep-") && GI.bySlug[h.slice(3)]) return GI.PAGES.episode(GI.bySlug[h.slice(3)]);
    return GI.PAGES.notFound();
  }

  const view = $("#view"); let scenes = [], first = true;
  function route() {
    const h = location.hash.slice(1);
    if (h.startsWith("episodes-")) return;   // in-page jump on a field page

    // tear down the previous page's animations
    scenes.forEach(s => s.destroy()); scenes = [];
    if (GI.state.curFig) { GI.state.curFig.destroy(); GI.state.curFig = null; }

    const page = resolve(h);
    view.innerHTML = `<div class="view">${page.html}</div>`;
    if (page.mount) page.mount(view, scenes);

    $$("[data-nav]").forEach(a => a.dataset.nav === page.nav ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    document.title = (page.nav === "home" ? "" : page.title + " · ") + CONFIG.site;
    setMenu(false);
    if (!first) { scrollTo({ top: 0, behavior: "instant" }); view.focus({ preventScroll: true }); }
    first = false;
  }

  addEventListener("hashchange", route);
  addEventListener("keydown", e => {
    if (e.key === "/" && $("#q") && document.activeElement.tagName !== "INPUT") { e.preventDefault(); $("#q").focus(); }
    if (e.key === "Escape") setMenu(false);
  });

  // reading-progress bar under the menu
  const prog = $("#progress");
  addEventListener("scroll", () => { const d = document.documentElement; prog.style.transform = `scaleX(${d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight)})`; }, { passive: true });

  // ---------- start ----------
  GI.readColors();
  route();
  GI.allScenes.forEach(s => s.drawStatic());
  GI.startLoop();
})(window.GI);
