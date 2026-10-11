/* ============================================================
   courses.js: the course catalog.
   Each course belongs to one field and lists its lessons in order.
   Lesson content lives in js/data/lessons-<field>.js, matched by slug.

     slug      page address, becomes #course-<slug>
     field     "ph", "ee" or "cs"
     title     course name
     summary   one or two sentences for cards and the course page
     outcomes  "By the end you'll be able to…" bullet points
     lessons   lesson slugs, in teaching order
   ============================================================ */
window.GI = window.GI || {};

GI.COURSES = [
  // ---------- Physics ----------
  { slug: "seeing-small", field: "ph", title: "Seeing the Very Small",
    summary: "Why ordinary microscopes stop at about 200 nanometers, and how electrons and quantum tunneling let us image single atoms.",
    outcomes: [
      "Explain why a wave can't resolve details much smaller than its wavelength",
      "Calculate the wavelength of an electron from its accelerating voltage",
      "Explain why tunneling current makes a scanning tunneling microscope so sensitive"
    ],
    lessons: ["resolution-limit", "stm"] },

  { slug: "lasers", field: "ph", title: "Lasers & Light",
    summary: "Why ordinary light sources can't amplify light, and how a laser's gain medium and mirrors produce one pure, coherent beam.",
    outcomes: [
      "Explain stimulated emission and why it needs a population inversion",
      "Use the Boltzmann factor to show why heating never creates one",
      "Predict a laser cavity's mode spacing and how many modes lase"
    ],
    lessons: ["thermal-light", "laser-cavity"] },

  { slug: "weighing-molecules", field: "ph", title: "Weighing Molecules",
    summary: "How mass spectrometers weigh single molecules: first by bending ions with a magnet, then by timing their oscillations in an Orbitrap.",
    outcomes: [
      "Explain why mass spectrometers measure mass-to-charge ratio",
      "Calculate an ion's radius in a magnetic field",
      "Explain why longer recording gives sharper Orbitrap peaks"
    ],
    lessons: ["magnetic-sector", "orbitrap"] },

  // ---------- Electrical engineering ----------
  { slug: "chips", field: "ee", title: "How Chips Are Made",
    summary: "From hand-wired parts to billions of transistors: the four ideas that made the modern chip possible.",
    outcomes: [
      "Explain why circuits built from separate parts hit a reliability wall",
      "Estimate the smallest feature a lithography tool can print",
      "Describe how a MOSFET turns on and how much current it carries",
      "Explain why CMOS logic draws almost no power while idle"
    ],
    lessons: ["tyranny-of-numbers", "planar-process", "mosfet", "cmos"] },

  // ---------- Computer science ----------
  { slug: "secrets", field: "cs", title: "Secrets in Public",
    summary: "How two strangers can agree on a secret over a channel anyone can read: one-way functions and the RSA patent.",
    outcomes: [
      "Explain what makes a function one-way",
      "Estimate how fast factoring effort grows with key size",
      "Build, use and break a toy RSA key by hand"
    ],
    lessons: ["one-way", "rsa"] },

  { slug: "ranking-attention", field: "cs", title: "Ranking & Attention",
    summary: "Two ways to decide what matters: PageRank for pages on the web, and attention for words in a sentence.",
    outcomes: [
      "Compute PageRank for a small network of pages",
      "Explain the random-surfer model and the damping factor",
      "Compute attention weights from queries and keys"
    ],
    lessons: ["pagerank", "attention"] }
];
