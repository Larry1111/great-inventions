/* ============================================================
   pages/lesson.js: one lesson (#lesson-<slug>).
   Course outline on the side; video, model, notes, patent
   reference and a "mark complete" button in the main column.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.lesson = l => {
  const { esc, FIELDS } = GI;
  const c = l.course, F = FIELDS[c.field];
  const prev = c.lessons[l.n - 2], next = c.lessons[l.n];
  const pnum = l.patent ? l.patent.number.replace(/[^0-9]/g, "") : "";

  const outline = () => `
    <p class="eyebrow">Course</p>
    <a class="outline-title" href="${GI.courseHref(c)}">${esc(c.title)}</a>
    ${GI.progressBar(c)}
    <ol class="outline">${c.lessons.map(x => `
      <li><a href="${GI.lessonHref(x)}" class="${x === l ? "current" : ""} ${GI.progress.isDone(x.slug) ? "done" : ""}" ${x === l ? 'aria-current="page"' : ""}>
        <span class="onum mono" aria-hidden="true">${GI.progress.isDone(x.slug) ? "✓" : x.n}</span><span>${esc(x.short)}</span></a></li>`).join("")}</ol>`;

  const video = l.youtube
    ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(l.youtube)}" title="${esc(l.title)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    : `<div class="video empty-video"><div><span class="eyebrow">Video</span><p>The video for this lesson is in production. The notes and model below cover the full lesson.</p></div></div>`;

  return {
    title: l.title, nav: F.slug,
    html: `
    <div class="wrap lesson" data-field="${c.field}">
      <aside class="lesson-side">
        <details class="outline-mobile"><summary>Lesson ${l.n} of ${c.lessons.length} · Course outline</summary><div class="js-outline">${outline()}</div></details>
        <div class="outline-desk js-outline">${outline()}</div>
      </aside>

      <article class="lesson-main">
        ${GI.crumbs([["#home", "Home"], [GI.fieldHref(c.field), F.name], [GI.courseHref(c), c.title], [GI.lessonHref(l), `Lesson ${l.n}`]])}
        <header class="lhead">
          <p class="eyebrow"><span class="fdot">Lesson ${l.n} of ${c.lessons.length}</span> · ${l.patent ? "Invention" : "Background"}</p>
          <h1>${esc(l.title)}</h1>
          <div class="learn"><p class="eyebrow">In this lesson you'll learn to</p><ul class="ticks">${l.learn.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
        </header>

        ${video}

        <section class="lsec">
          <h2 class="lsec-h"><span class="mono">Try it</span>Interactive model</h2>
          <p class="tryit">${esc(l.tryIt)}</p>
          <div class="js-ix"></div>
        </section>

        <section class="lsec notes">
          <h2 class="lsec-h"><span class="mono">Notes</span>Step by step</h2>
          ${l.notes.map(([q, ps], i) => `<div class="note"><h3><span class="mono">Q${i + 1}</span>${esc(q)}</h3>${ps.map(p => `<p>${p}</p>`).join("")}</div>`).join("")}
          <div class="takeaway"><span class="eyebrow">Key idea</span><p>${esc(l.takeaway)}</p></div>
        </section>

        ${l.patent ? `<section class="lsec">
          <div class="refbox">
            <div><p class="eyebrow">Read the source</p>
              <dl class="spec"><dt>Patent</dt><dd class="mono">${esc(l.patent.number)}</dd><dt>Title</dt><dd>${esc(l.patent.title)}</dd><dt>Inventors</dt><dd>${esc(l.patent.who)}</dd><dt>Issued</dt><dd>${l.patent.year}</dd></dl></div>
            <a class="btn ghost" href="https://patents.google.com/patent/US${pnum}" target="_blank" rel="noopener">Open on Google Patents ↗</a>
          </div>
        </section>` : ""}

        <section class="lsec finish">
          <button type="button" class="btn js-done"></button>
          <nav class="pager" aria-label="Lessons in this course">
            ${prev ? `<a href="${GI.lessonHref(prev)}"><span class="mono muted">← Previous</span><span>${esc(prev.short)}</span></a>` : `<a href="${GI.courseHref(c)}"><span class="mono muted">← Back to</span><span>Course overview</span></a>`}
            ${next ? `<a href="${GI.lessonHref(next)}"><span class="mono muted">Next lesson →</span><span>${esc(next.short)}</span></a>` : `<a href="${GI.fieldHref(c.field)}"><span class="mono muted">Course finished →</span><span>More ${esc(F.short.toLowerCase())} courses</span></a>`}
          </nav>
        </section>
      </article>
    </div>`,

    mount(root) {
      GI.progress.setLast(l.slug);
      const ix = GI.INTERACTIVES[l.interactive];
      if (ix) ix.mount(GI.$(".js-ix", root));
      const btn = GI.$(".js-done", root);
      const paint = () => {
        const d = GI.progress.isDone(l.slug);
        btn.className = `btn ${d ? "ghost done" : "solid"} js-done`;
        btn.innerHTML = d ? "✓ Completed · mark as not done" : "Mark lesson complete";
        btn.setAttribute("aria-pressed", d);
        GI.$$(".js-outline", root).forEach(o => o.innerHTML = outline());
      };
      btn.addEventListener("click", () => { GI.progress.setDone(l.slug, !GI.progress.isDone(l.slug)); paint(); });
      paint();
    }
  };
};
