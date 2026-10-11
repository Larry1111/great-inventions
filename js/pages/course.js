/* ============================================================
   pages/course.js: a course overview (#course-<slug>).
   What you'll learn, progress, and the ordered lesson list.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.course = c => {
  const { esc, FIELDS, COURSES } = GI;
  const F = FIELDS[c.field], next = GI.progress.nextIn(c), done = GI.progress.count(c);
  const same = COURSES.filter(x => x.field === c.field), other = same[(same.indexOf(c) + 1) % same.length];

  return {
    title: c.title, nav: F.slug,
    html: `
    <div class="wrap" data-field="${c.field}">
      ${GI.crumbs([["#home", "Home"], [GI.fieldHref(c.field), F.name], [GI.courseHref(c), c.title]])}
      <header class="phead">
        <div><p class="eyebrow"><span class="fdot">${esc(F.name)} course</span></p><h1>${esc(c.title)}</h1></div>
        <div>
          <p class="lede">${esc(c.summary)}</p>
          <div class="ctas">
            <a class="btn solid" href="${GI.lessonHref(next)}">${done === 0 ? "Start course" : done === c.lessons.length ? "Review from lesson 1" : `Continue with lesson ${next.n}`} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </header>

      <section class="sec course-grid">
        <div>
          <p class="eyebrow">Lessons</p>
          <ol class="llist">${c.lessons.map(GI.lessonRow).join("")}</ol>
        </div>
        <aside class="course-aside">
          <div class="box">
            <p class="eyebrow">Your progress</p>
            ${GI.progressBar(c)}
          </div>
          <div class="box">
            <p class="eyebrow">By the end you'll be able to</p>
            <ul class="ticks">${c.outcomes.map(o => `<li>${esc(o)}</li>`).join("")}</ul>
          </div>
        </aside>
      </section>

      ${other && other !== c ? `<a class="nextfield" href="${GI.courseHref(other)}" data-field="${other.field}"><span><span class="eyebrow">Another ${esc(F.short.toLowerCase())} course</span><h3>${esc(other.title)}</h3></span><span class="arrow" aria-hidden="true">→</span></a>` : ""}
    </div>`
  };
};
