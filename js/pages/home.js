/* ============================================================
   pages/home.js: the Home page (#home).
   Hero, continue-learning card, a live model from one lesson,
   the course catalog by field, and the latest blog posts.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.home = () => {
  const { esc, CONFIG, FIELDS, ORDER, COURSES, BLOG } = GI;
  const first = COURSES[0].lessons[0];
  const last = GI.lessonBySlug[GI.progress.last()];
  const resume = last ? (GI.progress.isDone(last.slug) ? GI.progress.nextIn(last.course) : last) : null;
  const feat = GI.lessonBySlug[CONFIG.featuredLesson] || first;

  const side = resume ? `
    <div class="hcard" data-field="${resume.course.field}">
      <p class="eyebrow">Continue learning</p>
      <h3>${esc(resume.course.title)}</h3>
      <p class="muted">Lesson ${resume.n}: ${esc(resume.title)}</p>
      ${GI.progressBar(resume.course)}
      <a class="btn solid" href="${GI.lessonHref(resume)}">Resume <span aria-hidden="true">→</span></a>
    </div>` : `
    <div class="hcard">
      <p class="eyebrow">How each lesson works</p>
      <ol class="hsteps">
        <li><b>Start from the question</b><span>the problem the inventors were stuck on</span></li>
        <li><b>Watch and read</b><span>a short video and step-by-step notes</span></li>
        <li><b>Change the model</b><span>sliders driven by the real equations</span></li>
        <li><b>Check it off</b><span>progress is saved in your browser</span></li>
      </ol>
    </div>`;

  return {
    title: "Home", nav: "home",
    html: `
    <section class="hero"><div class="wrap">
      <div>
        <p class="eyebrow">Free courses · Physics · Electrical engineering · Computer science</p>
        <h1>${esc(CONFIG.heroTitle)}</h1>
        <p class="lede">${esc(CONFIG.heroLede)}</p>
        <div class="ctas">
          <a class="btn solid" href="#courses">Browse courses <span aria-hidden="true">→</span></a>
          <a class="btn ghost" href="${GI.lessonHref(resume || first)}">${resume ? "Resume your last lesson" : "Start the first lesson"}</a>
        </div>
      </div>
      ${side}
    </div></section>

    <section class="sec band"><div class="wrap">
      <div class="sec-head">
        <div><p class="eyebrow">Try a lesson's model</p><h2>${esc(feat.title)}</h2></div>
        <a class="more" href="${GI.lessonHref(feat)}" data-field="${feat.course.field}">Open the full lesson <span aria-hidden="true">→</span></a>
      </div>
      <div class="js-feature" data-field="${feat.course.field}"></div>
    </div></section>

    <section class="sec"><div class="wrap">
      <div class="sec-head"><div><p class="eyebrow">Courses</p><h2>Pick a field, then a course.</h2></div><a class="more" href="#courses">All courses <span aria-hidden="true">→</span></a></div>
      <div class="fieldcols">${ORDER.map(k => `
        <div class="fieldcol" data-field="${k}">
          <a class="fieldcol-head" href="${GI.fieldHref(k)}"><span class="fdot mono">${esc(FIELDS[k].name)}</span><span aria-hidden="true">→</span></a>
          <p class="muted">${esc(FIELDS[k].desc)}</p>
          <div class="stack">${GI.coursesIn(k).map(GI.courseCard).join("")}</div>
        </div>`).join("")}</div>
    </div></section>

    ${BLOG.length ? `<section class="sec"><div class="wrap">
      <div class="sec-head"><div><p class="eyebrow">Blog</p><h2>Latest updates</h2></div><a class="more" href="#blog">All posts <span aria-hidden="true">→</span></a></div>
      <div class="pgrid">${BLOG.slice(0, 2).map(GI.postCard).join("")}</div>
    </div></section>` : ""}`,

    mount(root) {
      const ix = GI.INTERACTIVES[feat.interactive];
      if (ix) ix.mount(GI.$(".js-feature", root));
    }
  };
};
