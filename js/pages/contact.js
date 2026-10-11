/* ============================================================
   pages/contact.js: the Contact page (#contact).
   Email, links and disclaimer come from js/config.js.
   ============================================================ */
window.GI = window.GI || {};

GI.PAGES.contact = () => {
  const { esc, $, CONFIG } = GI;
  const reasons = [
    ["ph", "Episodes",  "Suggest an invention",     "A patent you think deserves a clear explanation, in any of the three fields."],
    ["ee", "Questions", "Ask what didn't click",    "If a step in an episode lost you, tell me. Good questions become the next link in the chain."],
    ["cs", "Feedback",  "Say what to improve",      "Pacing, visuals, a figure that could be clearer. Every note makes the next episode better."]
  ];

  return {
    title: "Contact", nav: "contact",
    html: `
    <div class="wrap">
      ${GI.crumbs([["#home", "Home"], ["#contact", "Contact"]])}
      <header class="phead">
        <div><p class="eyebrow">Contact</p><h1>Say hello.</h1></div>
        <p class="lede">Questions about an episode, or an invention you'd like to see explained? I read messages in English and Mandarin.</p>
      </header>

      <section class="sec">
        ${CONFIG.email ? `<div class="contact" style="margin-top:0">
          <span class="email js-email">${esc(CONFIG.email)}</span>
          <button class="btn solid js-copy" type="button">Copy email</button>
          <span class="copied js-copied" aria-live="polite"></span>
        </div>` : `<p class="lede" style="margin:0">Contact details are coming soon.</p>`}
        ${CONFIG.links.length ? `<div class="contact">${CONFIG.links.map(l => `<a class="btn ghost" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} <span aria-hidden="true">↗</span></a>`).join("")}</div>` : ""}
      </section>

      <section class="sec">
        <div class="sec-head"><div><p class="eyebrow">Good reasons to write</p><h2>What I'd love to hear about</h2></div></div>
        <div class="reasons">${reasons.map(([f, tag, h, p]) => `<div data-field="${f}"><span class="fdot mono">${tag}</span><h3>${h}</h3><p>${p}</p></div>`).join("")}</div>
        <p class="mono muted" style="margin-top:22px">${esc(CONFIG.disclaimer)}</p>
      </section>
    </div>`,

    mount(root) {
      if (!CONFIG.email) return;
      $(".js-copy", root).addEventListener("click", () => {
        const msg = $(".js-copied", root);
        const done = () => { msg.textContent = "Copied"; setTimeout(() => msg.textContent = "", 1800); };
        const select = () => { const r = document.createRange(); r.selectNodeContents($(".js-email", root)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); msg.textContent = "Selected. Press Ctrl+C to copy"; };
        try { navigator.clipboard.writeText(CONFIG.email).then(done, select); } catch (e) { select(); }
      });
    }
  };
};
