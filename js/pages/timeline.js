/* ============================================================
   pages/timeline.js: the full timeline (#timeline).
   #timeline.<event id> opens the page with that event highlighted.
   Filters: fields (chips), importance (the chart's "Show" buttons)
   and a text search. They apply to both the chart and the list.
   Events live in js/data/timeline.js.
   ============================================================ */
window.GI = window.GI || {};

// filters, remembered while browsing. fields: [] means all fields
GI.timelineFilter = { fields: [], show: 1, q: "" };

GI.PAGES.timeline = focusId => {
  const { esc, FIELDS, ORDER, TIMELINE } = GI;
  const F = GI.timelineFilter;
  const focus = GI.eventById[focusId];
  if (focus) Object.assign(F, { fields: [], show: 1, q: "" });
  const chips = [["all", "All fields"], ...ORDER.map(k => [k, FIELDS[k].name])];

  return {
    title: "Timeline", nav: "timeline",
    scrollTarget: focus ? `ev-${focus.id}` : null,
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#timeline", "Timeline"]])}
      <header class="phead">
        <div><p class="eyebrow">Timeline</p><h1>The questions behind the inventions</h1></div>
        <p class="lede">Every invention started as a question someone couldn't answer yet. Pick an event to see what drove it, then jump straight to the lesson section that explains the answer.</p>
      </header>
      <div class="toolbar tl-filters">
        <div class="chips" role="group" aria-label="Show events from">${chips.map(([k, l]) =>
          `<button type="button" class="chip" data-chip="${k}" ${k !== "all" ? `data-field="${k}"` : ""} aria-pressed="false">${k !== "all" ? "<i></i>" : ""}${esc(l)}</button>`).join("")}</div>
        <input class="tl-search" type="search" placeholder="Search events" aria-label="Search events" value="${esc(F.q)}">
        <p class="tl-count mono" aria-live="polite"></p>
        <button type="button" class="tl-clear">Clear filters</button>
      </div>
      <section class="tl-wrap js-chart"></section>
      <section class="sec"><div class="js-list"></div></section>
    </div>`,

    mount(root) {
      const chartEl = GI.$(".js-chart", root), listEl = GI.$(".js-list", root), search = GI.$(".tl-search", root);
      const lanes = () => F.fields.length ? ORDER.filter(k => F.fields.includes(k)) : ORDER;
      const words = () => F.q.toLowerCase().split(/\s+/).filter(Boolean);
      // events passing the field and search filters (the chart applies importance itself)
      const matching = () => {
        const ws = words(), ls = lanes();
        return TIMELINE.filter(e => ls.includes(e.field) && ws.every(w =>
          [e.title, e.short, e.question, e.summary, String(e.year)].some(t => t.toLowerCase().includes(w))));
      };

      let chart;
      const render = () => {
        GI.$$(".chip", root).forEach(c => c.setAttribute("aria-pressed", c.dataset.chip === "all" ? !F.fields.length : F.fields.includes(c.dataset.chip)));
        const ev = matching(), shown = ev.filter(e => e.importance >= F.show);
        if (!chart) chart = GI.timeline.chart(chartEl, ev, { fields: lanes(), minImportance: F.show, onShow: v => { F.show = v; render(); } });
        else chart.update(ev, { fields: lanes() });
        listEl.innerHTML = shown.length ? GI.timeline.list(shown) : `<p class="empty">No events match these filters.</p>`;
        GI.$(".tl-count", root).textContent = `${shown.length} of ${TIMELINE.length} events`;
        GI.$(".tl-clear", root).hidden = !F.fields.length && F.show === 1 && !F.q;
      };

      // field chips: the first click picks one field, later clicks add or remove fields
      GI.$$(".chip", root).forEach(c => c.addEventListener("click", () => {
        const k = c.dataset.chip;
        F.fields = k === "all" ? [] : F.fields.includes(k) ? F.fields.filter(x => x !== k) : [...F.fields, k];
        if (F.fields.length === ORDER.length) F.fields = [];
        render();
      }));
      search.addEventListener("input", () => { F.q = search.value.trim(); render(); });
      GI.$(".tl-clear", root).addEventListener("click", () => {
        Object.assign(F, { fields: [], show: 1, q: "" });
        search.value = "";
        chart.setShow(1);
        render();
      });

      render();
      if (focus) { chart.select(focus.id); const li = GI.$(`#ev-${focus.id}`, root); if (li) li.classList.add("flash"); }
    }
  };
};
