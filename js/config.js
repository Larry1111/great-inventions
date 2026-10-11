/* ============================================================
   config.js: site name, home page text, About and Contact.
   This is the main file to personalize.
   ============================================================ */
window.GI = window.GI || {};

GI.CONFIG = {
  site: "Great Inventions",                       // logo text, browser tab, footer
  tagline: "Free courses on how great inventions in physics, electrical engineering and computer science actually work.",

  // Home page
  heroTitle: "Learn how great inventions actually work.",
  heroLede: "Short courses built around real inventions. Each lesson pairs a video with written notes and an interactive model you can adjust yourself, so you see the physics or the math do its job.",
  featuredLesson: "stm",                          // lesson whose model appears on the home page

  // About page (your name appears only here)
  name: "Larry",
  bio: [
    "I studied physics and later worked as a software engineer. Along the way I got hooked on patents. They are the most detailed public record of how things actually work, and almost nobody reads them.",
    "This site turns that record into courses. Each course follows one thread of ideas, from the basic science to the inventions built on it. It's a personal project, made for anyone who likes knowing how things work."
  ],
  facts: [
    ["Interests",  "Electron beams and lithography · semiconductors · lasers · machine learning · cryptography"],
    ["Background", "B.S. Physics · software engineering"],
    ["Made with",  "Manim and Motion Canvas for animation"],
    ["Languages",  "English · Mandarin Chinese"]
  ],
  method: [
    ["Start from the question", "Every lesson opens with the problem the inventors were stuck on, before showing the answer."],
    ["Explain the mechanism",   "Written notes walk through the idea step by step, with the equations that make it work."],
    ["Let you change it",       "Each lesson has a model built on the real equations. Move the sliders and watch the result change."],
    ["Point to the source",     "Lessons built on an invention link to the original patent so you can read it yourself."]
  ],

  // Contact page. Leave email "" to hide the email box; add links as { label, url }.
  email: "",
  links: [
    // { label: "YouTube", url: "https://www.youtube.com/@your-channel" }
  ],
  disclaimer: "This is a personal, educational project. Nothing here is legal advice, and I can't take on or discuss anyone's patent matters."
};
