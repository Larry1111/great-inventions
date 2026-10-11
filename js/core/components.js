/* ============================================================
   core/components.js: HTML pieces reused across pages
   (episode card, breadcrumbs) and lookups built from the data.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const { esc, $$ } = GI;

  // lookups
  GI.VIDEOS.forEach((v, i) => v.i = i);
  GI.bySlug = {};      GI.VIDEOS.forEach(v => GI.bySlug[v.slug] = v);
  GI.fieldBySlug = {}; GI.ORDER.forEach(k => GI.fieldBySlug[GI.FIELDS[k].slug] = k);
  GI.counts = { ph: 0, ee: 0, cs: 0 }; GI.VIDEOS.forEach(v => GI.counts[v.f]++);

  GI.fieldHref = k => "#" + GI.FIELDS[k].slug;
  GI.epHref = v => "#ep-" + v.slug;

  // one episode card (used on Home, field pages, Library and episode pages)
  GI.cardHTML = v => `
  <a class="card" href="${GI.epHref(v)}" data-field="${v.f}" data-i="${v.i}">
    <span class="thumb">
      <canvas data-mode="${v.f}" data-seed="${20 + v.i * 7}"></canvas>
      <span class="fign">FIG. 3.${v.i + 1}</span>
      <span class="play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5v11l9.5-5.5z" fill="currentColor"/></svg></span>
    </span>
    <span class="meta mono"><span class="fdot">${esc(GI.FIELDS[v.f].short)}</span><span>${esc(v.patent)}</span><span>${v.yr}</span></span>
    <h3>${esc(v.title)}</h3>
    <span class="sub">${esc(v.pt)} · ${esc(v.who)}</span>
    <span class="mono muted">${v.qs.length} questions</span>
  </a>`;

  // breadcrumbs: items = [[href, label], ...]
  GI.crumbs = items => `<nav class="crumbs mono" aria-label="Breadcrumb">${items.map(([h, l], i) =>
    i < items.length - 1 ? `<a href="${h}">${esc(l)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(l)}</span>`).join("")}</nav>`;

  // start the canvases on a page.
  // card thumbnails animate on hover; canvases marked data-live animate whenever visible.
  GI.mountCanvases = (root, list) => {
    $$(".thumb canvas", root).forEach(cv => {
      const s = new GI.Scene(cv, cv.dataset.mode, +cv.dataset.seed); list.push(s);
      if (GI.reduce) return;
      const card = cv.closest(".card"), on = () => GI.active.add(s), off = () => GI.active.delete(s);
      card.addEventListener("pointerenter", on); card.addEventListener("pointerleave", off);
      card.addEventListener("focus", on); card.addEventListener("blur", off);
    });
    $$("canvas[data-live]", root).forEach(cv => {
      const s = new GI.Scene(cv, cv.dataset.mode, +cv.dataset.seed); list.push(s);
      if (!GI.reduce) GI.active.add(s);
    });
  };

  GI.PAGES = {};
})(window.GI);
