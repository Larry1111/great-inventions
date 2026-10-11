/* ============================================================
   pages/about.js: the About page (#about).
   All text comes from js/config.js (name, bio, facts, method).
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.about = () => {
  const { esc, CONFIG } = GI;
  return {
    title: "About", nav: "about",
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#about", "About"]])}
      <header class="phead">
        <div><p class="eyebrow">About</p><h1>Hi, I'm ${esc(CONFIG.name)}.</h1></div>
        <p class="lede">Why this site exists and how the lessons are made.</p>
      </header>

      <section class="about">
        <div class="bio">
          ${CONFIG.bio.map(p => `<p>${esc(p)}</p>`).join("")}
          <div class="ctas"><a class="btn solid" href="#courses">Browse courses <span aria-hidden="true">→</span></a><a class="btn ghost" href="#contact">Get in touch</a></div>
        </div>
        <dl class="spec">${CONFIG.facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      </section>

      <section class="sec">
        <div class="sec-head"><div><p class="eyebrow">Method</p><h2>How a lesson is built</h2></div></div>
        <ol class="steps">${CONFIG.method.map(([h, p], i) => `<li><span class="mono">Step ${i + 1} of ${CONFIG.method.length}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join("")}</ol>
      </section>

      <section class="sec">
        <div class="box">
          <p class="eyebrow">Your progress</p>
          <p class="muted">Lesson progress is stored only in this browser. Clearing it can't be undone.</p>
          <div class="ctas" style="margin-top:14px"><button type="button" class="btn ghost js-reset">Clear my progress</button><span class="mono muted js-reset-msg" aria-live="polite"></span></div>
        </div>
      </section>
    </div>`,
    mount(root) {
      const btn = GI.$(".js-reset", root), msg = GI.$(".js-reset-msg", root);
      let armed = false;
      btn.addEventListener("click", () => {
        if (!armed) { armed = true; btn.textContent = "Click again to confirm"; msg.textContent = ""; return; }
        GI.progress.reset(); armed = false; btn.textContent = "Clear my progress"; msg.textContent = "Progress cleared.";
      });
    }
  };
};
