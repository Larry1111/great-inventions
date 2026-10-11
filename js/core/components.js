/* ============================================================
   core/components.js: links the data together (fields → courses
   → lessons) and holds HTML pieces reused across pages.
   ============================================================ */
window.GI = window.GI || {};

(function (GI) {
  const { esc } = GI;

  // ---------- connect courses and lessons ----------
  GI.courseBySlug = {};
  GI.COURSES.forEach(c => {
    c.lessons = c.lessons.map((slug, i) => {
      const l = GI.LESSONS[slug];
      if (!l) { console.warn(`Course "${c.slug}" lists lesson "${slug}", which isn't in js/data/lessons-*.js`); return null; }
      return Object.assign(l, { slug, course: c, n: i + 1 });
    }).filter(Boolean);
    GI.courseBySlug[c.slug] = c;
  });
  GI.lessonBySlug = {};
  GI.COURSES.forEach(c => c.lessons.forEach(l => GI.lessonBySlug[l.slug] = l));
  GI.coursesIn = k => GI.COURSES.filter(c => c.field === k);
  GI.fieldBySlug = {}; GI.ORDER.forEach(k => GI.fieldBySlug[GI.FIELDS[k].slug] = k);
  GI.postBySlug = {}; GI.BLOG.forEach(p => GI.postBySlug[p.slug] = p);

  // ---------- addresses ----------
  GI.fieldHref  = k => "#" + GI.FIELDS[k].slug;
  GI.courseHref = c => "#course-" + c.slug;
  GI.lessonHref = l => "#lesson-" + l.slug;
  GI.postHref   = p => "#post-" + p.slug;

  // ---------- reusable HTML ----------
  GI.crumbs = items => `<nav class="crumbs mono" aria-label="Breadcrumb">${items.map(([h, l], i) =>
    i < items.length - 1 ? `<a href="${h}">${esc(l)}</a><span aria-hidden="true">/</span>` : `<span aria-current="page">${esc(l)}</span>`).join("")}</nav>`;

  GI.progressBar = c => {
    const done = GI.progress.count(c), n = c.lessons.length;
    return `<div class="pbar-wrap"><span class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${done}" aria-label="Lessons completed"><i style="width:${(100 * done / n).toFixed(0)}%"></i></span><span class="mono muted">${done} of ${n} lessons done</span></div>`;
  };

  GI.lessonKind = l => l.patent ? `${esc(l.patent.number)} · ${esc(l.patent.title)}` : "Background lesson";

  // course card (catalog, home, field pages)
  GI.courseCard = c => {
    const started = GI.progress.count(c) > 0;
    return `
    <a class="ccard" href="${GI.courseHref(c)}" data-field="${c.field}">
      <span class="ccard-top mono"><span class="fdot">${esc(GI.FIELDS[c.field].short)}</span><span>${c.lessons.length} lessons</span></span>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.summary)}</p>
      <ol class="ccard-list">${c.lessons.map(l => `<li class="${GI.progress.isDone(l.slug) ? "done" : ""}">${esc(l.short)}</li>`).join("")}</ol>
      ${started ? GI.progressBar(c) : `<span class="ccard-go">Start course <span aria-hidden="true">→</span></span>`}
    </a>`;
  };

  // one row in a course's lesson list
  GI.lessonRow = l => {
    const done = GI.progress.isDone(l.slug);
    return `
    <li><a class="lrow${done ? " done" : ""}" href="${GI.lessonHref(l)}">
      <span class="lnum mono" aria-hidden="true">${done ? "✓" : l.n}</span>
      <span class="lmain"><span class="ltitle">${esc(l.title)}</span><span class="lsub mono">${GI.lessonKind(l)}</span></span>
      <span class="lstat mono">${done ? "Done" : "Start →"}</span>
    </a></li>`;
  };

  GI.postCard = p => `
    <a class="pcard" href="${GI.postHref(p)}">
      <span class="mono muted">${GI.fmtDate(p.date)}</span>
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.summary)}</p>
    </a>`;

  GI.PAGES = {};
})(window.GI);
