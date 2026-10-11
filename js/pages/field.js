/* ============================================================
   pages/field.js: one page per field (#physics, #electrical, #computing),
   showing each course with its full lesson list.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.field = k => {
  const { esc, FIELDS, ORDER } = GI;
  const F = FIELDS[k], courses = GI.coursesIn(k), nk = ORDER[(ORDER.indexOf(k) + 1) % ORDER.length];

  return {
    title: F.name, nav: F.slug,
    html: `
    <div class="wrap" data-field="${k}">
      ${GI.crumbs([["#home", "Home"], ["#courses", "Courses"], [GI.fieldHref(k), F.name]])}
      <header class="phead">
        <div><p class="eyebrow"><span class="fdot">Field</span></p><h1>${esc(F.name)}</h1></div>
        <p class="lede">${esc(F.desc)}</p>
      </header>

      ${courses.map(c => {
        const next = GI.progress.nextIn(c), started = GI.progress.count(c) > 0;
        return `
      <section class="sec cblock">
        <div class="cblock-info">
          <p class="eyebrow">Course</p>
          <h2><a href="${GI.courseHref(c)}">${esc(c.title)}</a></h2>
          <p class="muted">${esc(c.summary)}</p>
          ${started ? GI.progressBar(c) : ""}
          <div class="ctas">
            <a class="btn solid" href="${GI.lessonHref(next)}">${started ? "Continue" : "Start course"} <span aria-hidden="true">→</span></a>
            <a class="btn ghost" href="${GI.courseHref(c)}">Course overview</a>
          </div>
        </div>
        <ol class="llist">${c.lessons.map(GI.lessonRow).join("")}</ol>
      </section>`;
      }).join("") || `<p class="empty">Courses for this field are coming soon.</p>`}

      <a class="nextfield" href="${GI.fieldHref(nk)}" data-field="${nk}"><span><span class="eyebrow">Next field</span><h3>${esc(FIELDS[nk].name)}</h3></span><span class="arrow" aria-hidden="true">→</span></a>
    </div>`
  };
};
