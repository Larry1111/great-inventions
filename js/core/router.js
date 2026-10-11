/* ============================================================
   core/router.js: builds the menu, switches pages when the
   address changes, and starts the site. Load this file last.

   Addresses: #home  #courses  #timeline  #physics  #electrical  #computing
              #course-<slug>  #lesson-<slug>  #blog  #post-<slug>
              #about  #contact
   A part after a dot points inside a page:
              #lesson-stm.q3     lesson "stm", note Q3
              #lesson-stm.model  lesson "stm", interactive model
              #timeline.abbe     timeline with event "abbe" highlighted
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const { $, $$, CONFIG, FIELDS, ORDER } = GI;

  // ---------- menu: [address, label, field key for the colored dot] ----------
  const NAV = [
    ["courses", "Courses"],
    ["timeline", "Timeline"],
    ...ORDER.map(k => [FIELDS[k].slug, FIELDS[k].short, k]),
    ["blog", "Blog"],
    ["about", "About"],
    ["contact", "Contact"]
  ];
  const sepBefore = new Set([FIELDS[ORDER[0]].slug, "blog"]);   // thin dividers in the menu
  $("#links").innerHTML = NAV.map(([h, l, f]) =>
    `${sepBefore.has(h) ? '<li class="sep" aria-hidden="true"></li>' : ""}<li><a href="#${h}" data-nav="${h}" ${f ? `data-field="${f}"` : ""}>${f ? "<i></i>" : ""}${l}</a></li>`).join("");
  $("#drawerLinks").innerHTML = [["home", "Home"], ...NAV].map(([h, l, f]) =>
    `<li><a href="#${h}" data-nav="${h}" ${f ? `data-field="${f}"` : ""}>${l}<span class="mono">${f ? GI.coursesIn(f).length + " courses" : ""}</span></a></li>`).join("");

  $$(".js-site").forEach(e => e.textContent = CONFIG.site);
  $$(".js-tagline").forEach(e => e.textContent = CONFIG.tagline);
  $("#yr").textContent = new Date().getFullYear();

  const menuBtn = $("#menuBtn"), drawer = $("#drawer");
  const setMenu = open => { drawer.hidden = !open; menuBtn.setAttribute("aria-expanded", open); menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
  menuBtn.addEventListener("click", () => setMenu(drawer.hidden));

  // ---------- pages ----------
  function resolve(full) {
    const [h, sub] = full.split(".");
    if (!h || h === "home" || h === "top") return GI.PAGES.home();
    if (h === "courses") return GI.PAGES.courses();
    if (h === "timeline") return GI.PAGES.timeline(sub);
    if (GI.fieldBySlug[h]) return GI.PAGES.field(GI.fieldBySlug[h]);
    if (h.startsWith("course-") && GI.courseBySlug[h.slice(7)]) return GI.PAGES.course(GI.courseBySlug[h.slice(7)]);
    if (h.startsWith("lesson-") && GI.lessonBySlug[h.slice(7)]) return GI.PAGES.lesson(GI.lessonBySlug[h.slice(7)], sub);
    if (h === "blog") return GI.PAGES.blog();
    if (h.startsWith("post-") && GI.postBySlug[h.slice(5)]) return GI.PAGES.post(GI.postBySlug[h.slice(5)]);
    if (h === "about") return GI.PAGES.about();
    if (h === "contact") return GI.PAGES.contact();
    return GI.PAGES.notFound();
  }

  const view = $("#view"); let first = true;
  function route() {
    const h = location.hash.slice(1);
    const page = resolve(h);
    view.innerHTML = `<div class="view">${page.html}</div>`;
    if (page.mount) page.mount(view);
    $$("[data-nav]").forEach(a => a.dataset.nav === page.nav ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
    document.title = (page.nav === "home" ? "" : page.title + " · ") + CONFIG.site;
    setMenu(false);
    const target = page.scrollTarget && document.getElementById(page.scrollTarget);
    if (target) {
      // jump to a section inside the page and highlight it briefly
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: GI.reduce || first ? "instant" : "smooth", block: "start" });
        target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash");
        target.focus({ preventScroll: true });
      });
    } else if (!first) { scrollTo({ top: 0, behavior: "instant" }); view.focus({ preventScroll: true }); }
    first = false;
  }

  addEventListener("hashchange", route);
  addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  // reading-progress bar under the menu
  const prog = $("#progress");
  addEventListener("scroll", () => { const d = document.documentElement; prog.style.transform = `scaleX(${d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight)})`; }, { passive: true });

  route();
})(window.GI);
