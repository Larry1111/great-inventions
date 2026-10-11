/* ============================================================
   pages/blog.js: the blog list (#blog) and single posts (#post-<slug>).
   Posts live in js/data/blog.js.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.blog = () => ({
  title: "Blog", nav: "blog",
  html: `
  <div class="wrap">
    ${GI.crumbs([["#home", "Home"], ["#blog", "Blog"]])}
    <header class="phead">
      <div><p class="eyebrow">Blog</p><h1>Updates</h1></div>
      <p class="lede">New courses, new lessons and notes on how the site is made.</p>
    </header>
    <section class="sec"><div class="plist">${GI.BLOG.map(GI.postCard).join("") || `<p class="empty">No posts yet.</p>`}</div></section>
  </div>`
});

GI.PAGES.post = p => {
  const i = GI.BLOG.indexOf(p), newer = GI.BLOG[i - 1], older = GI.BLOG[i + 1];
  return {
    title: p.title, nav: "blog",
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#blog", "Blog"], [GI.postHref(p), p.title]])}
      <article class="post">
        <p class="eyebrow">${GI.fmtDate(p.date)}</p>
        <h1>${GI.esc(p.title)}</h1>
        ${p.body.map(x => `<p>${x}</p>`).join("")}
      </article>
      <nav class="pager post-pager" aria-label="More posts">
        ${older ? `<a href="${GI.postHref(older)}"><span class="mono muted">← Older</span><span>${GI.esc(older.title)}</span></a>` : `<a href="#blog"><span class="mono muted">←</span><span>All posts</span></a>`}
        ${newer ? `<a href="${GI.postHref(newer)}"><span class="mono muted">Newer →</span><span>${GI.esc(newer.title)}</span></a>` : `<a href="#courses"><span class="mono muted">→</span><span>Browse courses</span></a>`}
      </nav>
    </div>`
  };
};
