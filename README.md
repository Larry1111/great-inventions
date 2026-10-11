# Great Inventions

Free courses on how great inventions in physics, electrical engineering and computer science work. Each lesson pairs a video with written notes and an interactive model built on the real equations.

Live site: https://larry1111.github.io/great-inventions/

There's no build step and nothing to install. Double-click `index.html` to open it in a browser.

## How the site is organized

```
Field  →  Course  →  Lessons (in order)
Physics
  Seeing the Very Small     1. The diffraction limit   2. Scanning tunneling microscope
  Lasers & Light            1. Stimulated emission     2. The laser cavity
  Weighing Molecules        1. Magnetic sector         2. Orbitrap
Electrical engineering
  How Chips Are Made        1. Integrated circuit  2. Planar process  3. MOSFET  4. CMOS
Computer science
  Secrets in Public         1. One-way functions       2. RSA
  Ranking & Attention       1. PageRank                2. Attention
```

Each lesson page has: learning goals, video (or a "coming soon" panel), an interactive model, step-by-step notes, a key idea, the patent it's built on (for invention lessons), and a "Mark lesson complete" button. Progress is saved in the visitor's browser only.

The blog (`#blog`) is for site updates and announcements.

## Which file do I edit?

| I want to… | Edit this file |
|---|---|
| Change the site name, home headline, About text, email, links | `js/config.js` |
| Add or reorder courses, change course descriptions | `js/data/courses.js` |
| Edit lesson text, add a YouTube video to a lesson | `js/data/lessons-physics.js`, `lessons-electrical.js`, `lessons-computing.js` |
| Write a blog post | `js/data/blog.js` |
| Change field names or descriptions | `js/data/fields.js` |
| Change a lesson's interactive model | `js/interactives/<name>.js` |
| Colors and fonts | `css/tokens.css` |
| Menu, buttons, footer | `css/base.css` |
| Cards, lesson lists, progress bars | `css/components.css` |
| Interactive model look | `css/interactive.css` |
| Layout of a specific page | `css/pages.css` (sections labeled by page) |
| What a page shows | `js/pages/<page>.js` |

`js/core/` holds the engine (page switching, progress, chart helpers). You rarely need to touch it.

## Add a video to a lesson

Find the lesson in `js/data/lessons-<field>.js` and paste the YouTube ID (the part after `watch?v=`) into `youtube: ""`.

## Add a lesson

1. Copy an existing lesson block in the right `js/data/lessons-<field>.js` file and give it a new key (its slug), e.g. `"transistor"`.
2. Add that slug to the course's `lessons` list in `js/data/courses.js`, in the position you want.
3. Set `interactive` to an existing model name, or create a new file in `js/interactives/` and add a `<script>` line for it in `index.html`.

## Add a blog post

Add an entry at the top of `GI.BLOG` in `js/data/blog.js` with `slug`, `date`, `title`, `summary` and `body` paragraphs.

## Addresses

`#home`, `#courses`, `#physics`, `#electrical`, `#computing`, `#course-<slug>`, `#lesson-<slug>`, `#blog`, `#post-<slug>`, `#about`, `#contact`.

## Publishing

The site is hosted on GitHub Pages from the `main` branch of this repository. Any change pushed to `main` goes live in about a minute.

## Notes

- Scripts load in the order listed at the bottom of `index.html`. Keep `js/core/router.js` last.
- Every file adds itself to one shared object, `window.GI`, so the site also works when opened straight from your disk.
- The interactive models use textbook equations. Each one states its assumptions in the note under the model.
- Keep the site about the inventions. Avoid wording that offers patent services or represents anyone.
