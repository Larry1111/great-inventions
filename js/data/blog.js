/* ============================================================
   blog.js: site updates and announcements, newest first.

     slug     page address, becomes #post-<slug>
     date     "YYYY-MM-DD"
     title    post title
     summary  one sentence for the list
     body     paragraphs; may use <em>, <strong>, <a href="...">, <code>
   ============================================================ */
window.GI = window.GI || {};

GI.BLOG = [
  { slug: "interactive-models", date: "2026-10-11",
    title: "How the interactive models work, and what they leave out",
    summary: "Every lesson includes a model built on real equations. Here is what that means and where the simplifications are.",
    body: [
      "Each lesson has a model you can adjust: the tunneling current between a tip and a surface, the modes of a laser cavity, the voltage transfer curve of a CMOS inverter. Each one computes its results from the same equations the lesson explains, live in your browser.",
      "They are textbook models, chosen because they show the mechanism clearly. The MOSFET and CMOS models use the classic long-channel equations, which modern transistors only roughly follow. The laser model assumes every mode above threshold can lase. The Orbitrap model sets its frequency scale to a round number, though every frequency scales correctly with mass. Each model says what it assumes in a note underneath.",
      "If you spot something that looks wrong, please get in touch. Corrections make the lessons better for everyone."
    ] },

  { slug: "welcome", date: "2026-10-11",
    title: "Welcome to Great Inventions",
    summary: "What this site is, how the courses are organized, and how to keep track of your progress.",
    body: [
      "Great Inventions is a set of short, free courses on how important inventions work, in physics, electrical engineering and computer science.",
      "Courses are grouped by field. Each course follows one thread of ideas in order, from the underlying science to the invention built on it. Background lessons cover the science; invention lessons are built around a specific patent and link to it.",
      "Every lesson has written notes and an interactive model, and videos are being added as they are finished. Mark a lesson complete when you're done. Your progress is saved in your browser, so you can pick up where you left off on the same device. Nothing is sent anywhere.",
      "New courses and lessons will be announced here."
    ] }
];
