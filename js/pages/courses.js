/* ============================================================
   pages/courses.js: the full course catalog (#courses).
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.courses = () => {
  const { esc, FIELDS, ORDER } = GI;
  return {
    title: "Courses", nav: "courses",
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#courses", "Courses"]])}
      <header class="phead">
        <div><p class="eyebrow">Course catalog</p><h1>All courses</h1></div>
        <p class="lede">Each course follows one thread of ideas in order, from the underlying science to the inventions built on it. Take them in any order.</p>
      </header>
      ${ORDER.map(k => `
      <section class="sec" data-field="${k}">
        <div class="sec-head">
          <div><p class="eyebrow"><span class="fdot">${esc(FIELDS[k].name)}</span></p><h2>${esc(FIELDS[k].name)}</h2></div>
          <a class="more" href="${GI.fieldHref(k)}">About this field <span aria-hidden="true">→</span></a>
        </div>
        <div class="cgrid">${GI.coursesIn(k).map(GI.courseCard).join("")}</div>
      </section>`).join("")}
    </div>`
  };
};
