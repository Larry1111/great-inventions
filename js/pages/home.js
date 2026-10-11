/* ============================================================
   pages/home.js: the Home page (#home).
   Hero with the rotating patent figure, field doors, latest episodes.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.home = () => {
  const { esc, CONFIG, FIELDS, ORDER, VIDEOS } = GI;
  const latest = ORDER.map(k => VIDEOS.find(v => v.f === k)).filter(Boolean);   // first episode of each field

  return {
    title: "Home", nav: "home",
    html: `
    <section class="hero" id="heroSec" data-field="ph"><div class="wrap">
      <div>
        <p class="eyebrow">Physics · Electrical engineering · Computer science</p>
        <h1>${esc(CONFIG.heroTitle)} <span class="swap js-word">${esc(FIELDS.ph.word)}</span></h1>
        <p class="lede">${esc(CONFIG.heroLede)}</p>
        <ul class="badges"><li>${VIDEOS.length} episodes</li><li>3 fields</li><li>Built on publicly issued patents</li></ul>
        <div class="ctas">
          <a class="btn solid" href="#library">Browse all episodes <span aria-hidden="true">→</span></a>
          <a class="btn ghost" href="#physics">Start with physics</a>
        </div>
      </div>
      ${GI.sheetHTML(ORDER)}
    </div></section>

    <section class="sec band"><div class="wrap">
      <div class="sec-head"><div><p class="eyebrow">Choose a field</p><h2>Three fields, one way of explaining.</h2></div></div>
      <div class="doors">${ORDER.map((k, i) => `
        <a class="door" href="${GI.fieldHref(k)}" data-field="${k}">
          <canvas data-live data-mode="${k}" data-seed="${i + 1}" aria-hidden="true"></canvas>
          <span class="door-body">
            <span class="door-top"><h3>${esc(FIELDS[k].name)}</h3><span class="mono count">${GI.counts[k]} episodes</span></span>
            <p>${esc(FIELDS[k].desc)}</p>
            <span class="arrow">Open ${esc(FIELDS[k].short.toLowerCase())} <span aria-hidden="true">→</span></span>
          </span>
        </a>`).join("")}</div>
    </div></section>

    <section class="sec"><div class="wrap">
      <div class="sec-head"><div><p class="eyebrow">Latest episodes</p><h2>One from each field.</h2></div><a class="more" href="#library">See all ${VIDEOS.length} episodes <span aria-hidden="true">→</span></a></div>
      <div class="grid">${latest.map(GI.cardHTML).join("")}</div>
    </div></section>`,

    mount(root, scenes) {
      GI.state.curFig = new GI.FigureSheet(GI.$(".js-sheet", root), ORDER, {
        autoplay: true,
        onChange: k => { GI.$("#heroSec").dataset.field = k; GI.$(".js-word", root).textContent = FIELDS[k].word; }
      });
      GI.mountCanvases(root, scenes);
    }
  };
};
