/* ============================================================
   pages/timeline.js: the full timeline (#timeline).
   #timeline.<event id> opens the page with that event highlighted.
   Events live in js/data/timeline.js.
   ============================================================ */
window.GI = window.GI || {};

GI.timelineFilter = "all";   // remembered while browsing

GI.PAGES.timeline = focusId => {
  const { esc, FIELDS, ORDER, TIMELINE } = GI;
  const focus = GI.eventById[focusId];
  if (focus) GI.timelineFilter = "all";
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
      <div class="toolbar">
        <div class="chips" role="group" aria-label="Show events from">${chips.map(([k, l]) =>
          `<button type="button" class="chip" data-chip="${k}" ${k !== "all" ? `data-field="${k}"` : ""} aria-pressed="false">${k !== "all" ? "<i></i>" : ""}${esc(l)}</button>`).join("")}</div>
      </div>
      <section class="tl-wrap js-chart"></section>
      <section class="sec"><div class="js-list"></div></section>
    </div>`,

    mount(root) {
      const chartEl = GI.$(".js-chart", root), listEl = GI.$(".js-list", root);
      const render = () => {
        const f = GI.timelineFilter, ev = TIMELINE.filter(e => f === "all" || e.field === f);
        GI.$$(".chip", root).forEach(c => c.setAttribute("aria-pressed", c.dataset.chip === f));
        const chart = GI.timeline.chart(chartEl, ev, { fields: f === "all" ? ORDER : [f] });
        listEl.innerHTML = GI.timeline.list(ev);
        if (focus) { chart.select(focus.id); const li = GI.$(`#ev-${focus.id}`, root); if (li) li.classList.add("flash"); }
      };
      GI.$$(".chip", root).forEach(c => c.addEventListener("click", () => { GI.timelineFilter = c.dataset.chip; render(); }));
      render();
    }
  };
};
