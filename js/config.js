/* ============================================================
   config.js: site name, About page and Contact page text.
   This is the main file to personalize.
   ============================================================ */
window.GI = window.GI || {};

GI.CONFIG = {
  site: "Great Inventions",                       // logo text, browser tab, footer
  tagline: "Animated explainers of great inventions in physics, electrical engineering and computer science.",

  // Home page headline. The last word changes with each field (see js/data/fields.js -> word).
  heroTitle: "Great inventions, drawn one part at a time.",
  heroLede: "Short animated videos that walk through famous inventions the way a patent drawing does: start with the problem, number each part, then show the mechanism move.",

  // About page (your name appears only here)
  name: "Larry",
  bio: [
    "I studied physics and later worked as a software engineer. Along the way I got hooked on patents. They are the most detailed public record of how things actually work, and almost nobody reads them.",
    "This site is my attempt to change that. I pick a great invention, find the question its inventors were stuck on, and animate the answer one numbered part at a time. It's a personal project, made for anyone who likes knowing how things work."
  ],
  facts: [
    ["Interests",  "Electron beams and lithography · semiconductors · lasers · machine learning · cryptography"],
    ["Background", "B.S. Physics · software engineering"],
    ["Made with",  "Manim and Motion Canvas for animation"],
    ["Languages",  "English · Mandarin Chinese"]
  ],
  method: [
    ["Read the claims",       "Claim 1 is the invention. I start from what it actually covers, not from the abstract or the marketing."],
    ["Find the problem",      "Every patent answers a question. I name the question the inventors were stuck on before showing the answer."],
    ["Draw the figure",       "Numbered parts, introduced one at a time, the way FIG. 1 introduces them."],
    ["Animate the mechanism", "Motion shows what text can't: a beam bending, a channel opening, an attention weight shifting."]
  ],

  // Contact page. Leave email "" to hide the email box; add links as { label, url }.
  email: "",
  links: [
    // { label: "YouTube", url: "https://www.youtube.com/@your-channel" }
  ],
  disclaimer: "This is a personal, educational project. Nothing here is legal advice, and I can't take on or discuss anyone's patent matters."
};
