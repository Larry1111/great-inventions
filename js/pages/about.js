/* ============================================================
   pages/about.js: the About page (#about).
   All text comes from js/config.js (name, bio, facts, method).
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.about = () => {
  const { esc, CONFIG, VIDEOS, counts } = GI;
  const facts = [...CONFIG.facts, ["Library", `${VIDEOS.length} episodes · ${counts.ph} physics · ${counts.ee} electrical · ${counts.cs} computing`]];

  return {
    title: "About", nav: "about",
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#about", "About"]])}
      <header class="phead">
        <div><p class="eyebrow">About</p><h1>Hi, I'm ${esc(CONFIG.name)}.</h1></div>
        <p class="lede">I like taking inventions apart, one numbered part at a time. Here's why this site exists and how each episode gets made.</p>
      </header>

      <section class="about">
        <div class="bio">
          ${CONFIG.bio.map(p => `<p>${esc(p)}</p>`).join("")}
          <div class="ctas"><a class="btn solid" href="#contact">Get in touch <span aria-hidden="true">→</span></a><a class="btn ghost" href="#library">See the episodes</a></div>
        </div>
        <dl class="spec">${facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
      </section>

      <section class="sec">
        <div class="sec-head"><div><p class="eyebrow">Method</p><h2>How an episode gets made</h2></div><p class="muted" style="max-width:30em">The same order a good patent reads in. Each step depends on the one before it.</p></div>
        <ol class="steps">${CONFIG.method.map(([h, p], i) => `<li><span class="mono">Step ${i + 1} of ${CONFIG.method.length}</span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join("")}</ol>
      </section>
    </div>`
  };
};
