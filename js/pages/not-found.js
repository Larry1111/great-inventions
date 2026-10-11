/* ============================================================
   pages/not-found.js: shown for an address that doesn't exist.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.notFound = () => ({
  title: "Not found", nav: "",
  html: `
  <div class="wrap">
    <header class="phead" style="border:0;padding-top:60px">
      <div><p class="eyebrow">FIG. 404</p><h1>That page isn't on any sheet.</h1></div>
      <p class="lede">Try the <a href="#home">home page</a> or the <a href="#library">full library</a>.</p>
    </header>
  </div>`
});
