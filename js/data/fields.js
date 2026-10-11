/* ============================================================
   fields.js: the three fields of invention.
   Keys: ph = physics, ee = electrical engineering, cs = computing.
   slug is the page address (#physics). Colors are in css/tokens.css.
   ============================================================ */
window.GI = window.GI || {};

GI.ORDER = ["ph", "ee", "cs"];

GI.FIELDS = {
  ph: {
    slug: "physics", name: "Physics", short: "Physics", word: "Beams.",
    head: "Beams, light and the instruments that measure everything.",
    desc: "Charged-particle optics, lithography light sources, spectrometers and lasers: the instruments that make modern chips and measure them.",
    hint: "Pointer height sets magnetic field B",
    topics: [
      ["Charged-particle beams", "Electron and ion columns: sources, lenses, deflectors and detectors."],
      ["EUV lithography",        "Light sources, collectors and masks, and the vibration and contamination problems around them."],
      ["Mass spectrometry",      "Ion sources and analyzers, and how a spectrum becomes an identity."],
      ["Lasers & optics",        "Gain media, cavities and the optics that shape a beam."]
    ]
  },
  ee: {
    slug: "electrical", name: "Electrical engineering", short: "Electrical", word: "Gates.",
    head: "How a voltage on a gate becomes a one or a zero.",
    desc: "Transistors, fabrication and circuits: how a voltage becomes a bit, and how billions of them get printed at once.",
    hint: "Pointer position sets signal frequency",
    topics: [
      ["Semiconductor devices", "Transistors, junctions and the physics that switches them."],
      ["Fabrication",           "Deposition, etching, lithography and ion milling."],
      ["Circuits & power",      "Logic, analog front ends and power delivery."],
      ["Sensors & inspection",  "Turning light, charge and motion into signals."]
    ]
  },
  cs: {
    slug: "computing", name: "Computer science", short: "Computing", word: "Weights.",
    head: "Algorithms explained through the claims that protect them.",
    desc: "Machine learning, cryptography and search, explained through the claims that protect them.",
    hint: "Nodes lean toward your pointer",
    topics: [
      ["Machine learning",   "Neural network architectures, training and inference."],
      ["Cryptography",       "Key exchange, encryption and digital signatures."],
      ["Search & ranking",   "Indexing, ranking and recommendation."],
      ["Systems & software", "Distributed systems, compilers and developer tools."]
    ]
  }
};
