/* ============================================================
   fields.js: the three fields. Courses inside each field are
   listed in js/data/courses.js.
   Keys: ph = physics, ee = electrical engineering, cs = computing.
   slug is the page address (#physics). Colors are in css/tokens.css.
   ============================================================ */
window.GI = window.GI || {};

GI.ORDER = ["ph", "ee", "cs"];

GI.FIELDS = {
  ph: {
    slug: "physics", name: "Physics", short: "Physics",
    desc: "Waves, quanta and fields: the physics behind microscopes that see atoms, lasers, and instruments that weigh single molecules."
  },
  ee: {
    slug: "electrical", name: "Electrical engineering", short: "Electrical",
    desc: "How a voltage becomes a bit, and how billions of transistors get printed onto one chip."
  },
  cs: {
    slug: "computing", name: "Computer science", short: "Computing",
    desc: "The algorithms behind secure messages, web search and modern language models."
  }
};
