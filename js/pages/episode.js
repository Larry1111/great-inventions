/* ============================================================
   pages/episode.js: one page per episode (#ep-<slug>).
   Plays the YouTube video when the episode has a youtube ID.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.episode = v => {
  const { esc, FIELDS, VIDEOS } = GI;
  const F = FIELDS[v.f], same = VIDEOS.filter(x => x.f === v.f), idx = same.indexOf(v);
  const prev = same[(idx - 1 + same.length) % same.length], next = same[(idx + 1) % same.length];
  const others = same.filter(x => x !== v);
  const num = v.patent.replace(/[^0-9]/g, "");
  const shortTitle = x => esc(x.pt.replace(/\s*\(.*\)/, ""));

  const player = v.youtube
    ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.youtube)}" title="${esc(v.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
    : `<canvas data-live data-mode="${v.f}" data-seed="${90 + v.i}" aria-hidden="true"></canvas><span class="tag">Video coming soon · episode outline below</span>`;

  return {
    title: v.title, nav: F.slug,
    html: `
    <div class="wrap" data-field="${v.f}">
      ${GI.crumbs([["#home", "Home"], [GI.fieldHref(v.f), F.name], [GI.epHref(v), v.patent]])}
      <section class="ep">
        <div>
          <div class="player">${player}</div>
          <div class="meta mono" style="margin-top:20px"><span class="fdot">${esc(F.name)}</span><span>${esc(v.patent)}</span><span>${v.yr}</span></div>
          <h1>${esc(v.title)}</h1>
          <p class="lede">${esc(v.blurb)}</p>
          <ol class="qs" aria-label="Chain of questions">${v.qs.map(q => `<li>${esc(q)}</li>`).join("")}</ol>
        </div>
        <aside class="aside">
          <div class="biblio">
            <p class="eyebrow">Patent</p>
            <dl class="spec">
              <dt>Number</dt><dd class="mono" style="font-size:.9rem">${esc(v.patent)}</dd>
              <dt>Title</dt><dd>${esc(v.pt)}</dd>
              <dt>Inventors</dt><dd>${esc(v.who)}</dd>
              <dt>Issued</dt><dd>${v.yr}</dd>
              <dt>Field</dt><dd><a href="${GI.fieldHref(v.f)}">${esc(F.name)}</a></dd>
            </dl>
            <div class="ctas" style="margin-top:16px">
              ${v.youtube ? `<a class="btn solid" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.youtube)}" target="_blank" rel="noopener">Watch on YouTube ↗</a>` : ""}
              <a class="btn ghost" href="https://patents.google.com/patent/US${num}" target="_blank" rel="noopener">Read the patent ↗</a>
            </div>
          </div>
          ${same.length > 1 ? `<nav class="pager" aria-label="More ${esc(F.short)} episodes">
            <a href="${GI.epHref(prev)}"><span class="mono muted">← Previous</span><span>${shortTitle(prev)}</span></a>
            <a href="${GI.epHref(next)}"><span class="mono muted">Next →</span><span>${shortTitle(next)}</span></a>
          </nav>` : ""}
        </aside>
      </section>
      ${others.length ? `<section class="sec">
        <div class="sec-head"><div><p class="eyebrow">Keep watching</p><h2>More in ${esc(F.name)}</h2></div><a class="more" href="${GI.fieldHref(v.f)}">All ${esc(F.short.toLowerCase())} <span aria-hidden="true">→</span></a></div>
        <div class="grid">${others.map(GI.cardHTML).join("")}</div>
      </section>` : ""}
    </div>`,

    mount(root, scenes) { GI.mountCanvases(root, scenes); }
  };
};
