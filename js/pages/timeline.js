/* ============================================================
   pages/timeline.js: the full timeline (#timeline).
   #timeline.<event id> opens the page with that event selected.
   Filters: branches (grouped by field), importance (the chart's "Show"
   buttons) and a text search. They apply to both the chart and the list.
   Events and branches live in js/data/timeline.js.
   ============================================================ */
window.GI = window.GI || {};

// filters and chart state, remembered while browsing. branches: [] means all.
// The chart starts with every field split into its branches.
GI.timelineFilter = { branches: [], show: 1, q: "", chart: { expanded: GI.ORDER.slice() } };

GI.PAGES.timeline = focusId => {
  const { esc, FIELDS, ORDER, TIMELINE, BRANCHES } = GI;
  const F = GI.timelineFilter;
  const focus = GI.eventById[focusId];
  const returnY = GI.timeline.returnScroll("timeline");
  const words = () => F.q.toLowerCase().split(/\s+/).filter(Boolean);
  const matchesText = e => words().every(w => [e.title, e.short, e.question, e.summary, String(e.year)].some(t => t.toLowerCase().includes(w)));
  const passes = e => (!F.branches.length || F.branches.includes(e.branch)) && e.importance >= F.show && matchesText(e);
  // arriving at an event the filters hide: clear the filters so it shows
  if (focus && !passes(focus)) Object.assign(F, { branches: [], show: 1, q: "" });
  if (focus) F.chart.pinned = focus.id;

  return {
    title: "Timeline", nav: "timeline",
    scrollTarget: focus && returnY == null ? "tl-chart" : null,
    scrollY: returnY,
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#timeline", "Timeline"]])}
      <header class="phead">
        <div><p class="eyebrow">Timeline</p><h1>The questions behind the inventions</h1></div>
        <p class="lede">Every invention started as a question someone couldn't answer yet. Pick an event to see what drove it, what it built on and what it led to, then jump to the lesson section that explains the answer.</p>
      </header>
    </div>
    <div class="tl-stage">
      <div class="tl-filters">
        <div class="tl-filter-row">
          <button type="button" class="chip" data-all aria-pressed="false">All branches</button>
          <input class="tl-search" type="search" placeholder="Search events" aria-label="Search events" value="${esc(F.q)}">
          <p class="tl-count mono" aria-live="polite"></p>
          <button type="button" class="tl-clear">Clear filters</button>
        </div>
        <div class="tl-tree">${ORDER.map(k => `
          <div class="tl-tree-f" data-field="${k}" role="group" aria-label="${esc(FIELDS[k].name)} branches">
            <button type="button" class="tl-tree-head" data-tf="${k}" aria-pressed="false"><i></i>${esc(FIELDS[k].name)}<span class="mono"></span></button>
            <div class="tl-tree-b">${GI.timeline.branchesOf(k).map(b =>
              `<button type="button" data-tb="${b}" aria-pressed="false">${esc(BRANCHES[b].name)}<span class="mono"></span></button>`).join("")}</div>
          </div>`).join("")}
        </div>
      </div>
      <section class="tl-wrap js-chart" id="tl-chart" tabindex="-1"></section>
    </div>
    <div class="wrap">
      <section class="sec"><div class="js-list"></div></section>
    </div>`,

    mount(root) {
      const chartEl = GI.$(".js-chart", root), listEl = GI.$(".js-list", root), search = GI.$(".tl-search", root);
      const allBranches = Object.keys(BRANCHES);
      const lanes = () => ORDER.filter(k => !F.branches.length || GI.timeline.branchesOf(k).some(b => F.branches.includes(b)));

      let chart;
      const render = () => {
        const textOk = TIMELINE.filter(matchesText);
        const shown = textOk.filter(passes);
        const sel = b => F.branches.includes(b);
        // branch picker: pressed state and how many events each would show
        GI.$("[data-all]", root).setAttribute("aria-pressed", !F.branches.length);
        GI.$$("[data-tb]", root).forEach(btn => {
          const b = btn.dataset.tb, n = textOk.filter(e => e.branch === b && e.importance >= F.show).length;
          btn.setAttribute("aria-pressed", sel(b));
          btn.querySelector("span").textContent = n;
          btn.classList.toggle("none", !n);
        });
        GI.$$("[data-tf]", root).forEach(btn => {
          const bs = GI.timeline.branchesOf(btn.dataset.tf);
          btn.setAttribute("aria-pressed", bs.every(sel));
          btn.querySelector("span").textContent = textOk.filter(e => e.field === btn.dataset.tf && e.importance >= F.show).length;
        });
        const forChart = textOk.filter(e => !F.branches.length || F.branches.includes(e.branch));
        const o = { fields: lanes(), branches: F.branches.length ? F.branches : null };
        if (!chart) chart = GI.timeline.chart(chartEl, forChart, { ...o, minImportance: F.show, state: F.chart, onShow: v => { F.show = v; render(); } });
        else chart.update(forChart, o);
        listEl.innerHTML = shown.length ? GI.timeline.list(shown) : `<p class="empty">No events match these filters.</p>`;
        GI.$(".tl-count", root).textContent = `${shown.length} of ${TIMELINE.length} events`;
        GI.$(".tl-clear", root).hidden = !F.branches.length && F.show === 1 && !F.q;
      };

      // picking branches: the first click narrows to that branch (or field), later clicks add or remove
      const setBranches = list => { F.branches = list.length === allBranches.length ? [] : list; render(); };
      GI.$("[data-all]", root).addEventListener("click", () => setBranches([]));
      GI.$$("[data-tb]", root).forEach(btn => btn.addEventListener("click", () => {
        const b = btn.dataset.tb;
        setBranches(F.branches.includes(b) ? F.branches.filter(x => x !== b) : [...F.branches, b]);
      }));
      GI.$$("[data-tf]", root).forEach(btn => btn.addEventListener("click", () => {
        const bs = GI.timeline.branchesOf(btn.dataset.tf);
        const on = bs.every(b => F.branches.includes(b));
        setBranches(on ? F.branches.filter(b => !bs.includes(b)) : [...new Set([...F.branches, ...bs])]);
      }));
      search.addEventListener("input", () => { F.q = search.value.trim(); render(); });
      GI.$(".tl-clear", root).addEventListener("click", () => {
        Object.assign(F, { branches: [], show: 1, q: "" });
        search.value = "";
        chart.setShow(1);
        render();
      });

      render();
      if (focus) chart.select(focus.id);
    }
  };
};
