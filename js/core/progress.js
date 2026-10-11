/* ============================================================
   core/progress.js: remembers which lessons a visitor finished
   and the last lesson they opened. Saved only in that visitor's
   browser (localStorage); nothing is sent anywhere.
   ============================================================ */
window.GI = window.GI || {};

GI.progress = (function () {
  const KEY = "gi-progress-v1";
  let st = { done: {}, last: null };
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.done) st = s; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  return {
    isDone: slug => !!st.done[slug],
    setDone(slug, on) { if (on) st.done[slug] = Date.now(); else delete st.done[slug]; save(); },
    last: () => st.last,
    setLast(slug) { st.last = slug; save(); },
    count: course => course.lessons.filter(l => st.done[l.slug]).length,
    // first unfinished lesson in a course (or the first lesson if all are done)
    nextIn: course => course.lessons.find(l => !st.done[l.slug]) || course.lessons[0],
    reset() { st = { done: {}, last: null }; save(); }
  };
})();
