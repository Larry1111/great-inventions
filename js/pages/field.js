/* ============================================================
   pages/field.js: one page per field (#physics, #electrical, #computing).
   Text comes from js/data/fields.js; the figure from js/figures/.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.field = k => {
  const { esc, FIELDS, ORDER, VIDEOS, FIGS } = GI;
  const F = FIELDS[k], eps = VIDEOS.filter(v => v.f === k), i = ORDER.indexOf(k), nk = ORDER[(i + 1) % ORDER.length];

  return {
    title: F.name, nav: F.slug,
    html: `
    <div class="wrap" data-field="${k}">
      ${GI.crumbs([["#home", "Home"], [GI.fieldHref(k), F.name]])}

      <section class="fhero">
        <div>
          <p class="eyebrow">Field ${i + 1} of ${ORDER.length}</p>
          <h1>${esc(F.name)}<span>.</span></h1>
          <p class="lede">${esc(F.head)} ${esc(F.desc)}</p>
          <div class="stats">
            <div><b>${eps.length}</b><span>Episodes</span></div>
            <div><b>${F.topics.length}</b><span>Topic areas</span></div>
            <div><b>${eps.reduce((a, v) => a + v.qs.length, 0)}</b><span>Questions answered</span></div>
          </div>
          <div class="ctas"><a class="btn solid" href="#episodes-${F.slug}" data-jump>Watch ${esc(F.short.toLowerCase())} episodes <span aria-hidden="true">↓</span></a></div>
        </div>
        <div class="panel"><canvas data-live data-mode="${k}" data-seed="${i + 1}" aria-label="Interactive ${esc(F.name)} animation"></canvas><span class="hint">${esc(F.hint)}</span></div>
      </section>

      <section class="sec">
        <div class="sec-head"><div><p class="eyebrow">What's covered</p><h2>Topic areas</h2></div></div>
        <ul class="topics">${F.topics.map(([t, d], j) => `<li><span class="mono">${String.fromCharCode(65 + j)}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></li>`).join("")}</ul>
      </section>

      <section class="sec figrow">
        <div>
          <p class="eyebrow">Interactive figure</p><h2>Play with FIG. ${FIGS[k].code}</h2>
          <p class="lede" style="margin-top:14px">Every episode is built around a figure like this one. Try it:</p>
          <ol>${FIGS[k].tryit.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        </div>
        ${GI.sheetHTML([k])}
      </section>

      <section class="sec" id="episodes-${F.slug}">
        <div class="sec-head"><div><p class="eyebrow">Episodes</p><h2>${esc(F.name)} episodes</h2></div><a class="more" href="#library" data-filter>Open in library <span aria-hidden="true">→</span></a></div>
        <div class="grid">${eps.map(GI.cardHTML).join("") || `<div class="empty">Episodes for this field are coming soon.</div>`}</div>
      </section>

      <a class="nextfield" href="${GI.fieldHref(nk)}" data-field="${nk}"><span><span class="eyebrow">Next field</span><h3>${esc(FIELDS[nk].name)}</h3></span><span class="arrow" aria-hidden="true">→</span></a>
    </div>`,

    mount(root, scenes) {
      GI.state.curFig = new GI.FigureSheet(GI.$(".js-sheet", root), [k]);
      GI.mountCanvases(root, scenes);
      GI.$("[data-jump]", root).addEventListener("click", e => { e.preventDefault(); GI.$("#episodes-" + F.slug).scrollIntoView({ behavior: GI.reduce ? "auto" : "smooth" }); });
      GI.$("[data-filter]", root).addEventListener("click", () => { GI.lib.filter = k; GI.lib.query = ""; });
    }
  };
};
