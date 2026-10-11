/* ============================================================
   pages/library.js: all episodes with field filters and search (#library).
   ============================================================ */
window.GI = window.GI || {};

GI.lib = { filter: "all", query: "" };   // remembered while browsing

GI.PAGES.library = () => {
  const { esc, $, $$, FIELDS, ORDER, VIDEOS } = GI;
  const chips = [["all", "All fields"], ...ORDER.map(k => [k, FIELDS[k].name])];

  return {
    title: "Library", nav: "library",
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#library", "Library"]])}
      <header class="phead">
        <div><p class="eyebrow">Explainer library</p><h1>Every episode is a chain of questions.</h1></div>
        <p class="lede">Each video starts with the question the inventors were stuck on and answers it one step at a time, using the patent's own figures and claims.</p>
      </header>
      <div class="toolbar">
        <div class="chips" role="group" aria-label="Filter by field">${chips.map(([k, l]) =>
          `<button class="chip" data-chip="${k}" ${k !== "all" ? `data-field="${k}"` : ""} aria-pressed="false">${k !== "all" ? "<i></i>" : ""}${esc(l)}</button>`).join("")}</div>
        <label class="search" for="q">
          <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M11 11l3.5 3.5" stroke="currentColor" stroke-width="1.5"/></svg>
          <input id="q" type="search" placeholder="Search by topic or patent number" autocomplete="off" aria-label="Search episodes"><kbd>/</kbd>
        </label>
      </div>
      <p class="status mono" aria-live="polite"></p>
      <div class="grid">${VIDEOS.map(GI.cardHTML).join("")}<div class="empty" hidden>No episodes match that search. Try a patent number like 6,285,999 or a word like “laser”.</div></div>
    </div>`,

    mount(root, scenes) {
      GI.mountCanvases(root, scenes);
      const q = $("#q", root); q.value = GI.lib.query;
      const apply = () => {
        const s = GI.lib.query.trim().toLowerCase().replace(/[,\s]/g, ""); let n = 0;
        $$(".chip", root).forEach(c => c.setAttribute("aria-pressed", c.dataset.chip === GI.lib.filter));
        $$(".card", root).forEach(c => {
          const v = VIDEOS[+c.dataset.i];
          const hay = (v.title + v.pt + v.who + v.patent + FIELDS[v.f].name + v.qs.join(" ") + v.blurb).toLowerCase().replace(/[,\s]/g, "");
          const ok = (GI.lib.filter === "all" || v.f === GI.lib.filter) && (!s || hay.includes(s));
          c.hidden = !ok; if (ok) n++;
        });
        $(".empty", root).hidden = n > 0;
        $(".status", root).textContent = `Showing ${n} of ${VIDEOS.length} episodes${GI.lib.filter !== "all" ? " in " + FIELDS[GI.lib.filter].name : ""}${GI.lib.query ? ` matching “${GI.lib.query}”` : ""}`;
      };
      $$(".chip", root).forEach(c => c.addEventListener("click", () => { GI.lib.filter = c.dataset.chip; apply(); }));
      q.addEventListener("input", () => { GI.lib.query = q.value; apply(); });
      apply();
    }
  };
};
