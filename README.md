# Great Inventions

A small website of animated explainers on great inventions in physics, electrical engineering and computer science.

There's no build step and nothing to install. Double-click `index.html` to open it in a browser.

## Which file do I edit?

| I want to change… | Edit this file |
|---|---|
| Site name, home headline, About text, email, links, disclaimer | `js/config.js` |
| Add, remove or reorder episodes, or add a YouTube video | `js/data/videos.js` |
| Field names, descriptions, topic areas | `js/data/fields.js` |
| Colors and fonts | `css/tokens.css` |
| Menu, buttons, footer look | `css/base.css` |
| Episode cards, breadcrumbs, library filters | `css/components.css` |
| The patent-drawing figure's look | `css/figure.css` |
| Layout of a specific page | `css/pages.css` (sections labeled by page) |
| What a page shows | `js/pages/<page>.js` |
| The interactive patent figures | `js/figures/physics.js`, `electrical.js`, `computing.js` |
| The animated card/panel backgrounds | `js/scenes/physics.js`, `electrical.js`, `computing.js` |
| Footer links | `index.html` |

You rarely need to touch `js/core/`. It holds the engine: page switching, animation loop and figure drawing.

## Folder layout

```
index.html            page shell: menu, footer, and the list of files to load
css/
  tokens.css          colors (light + dark) and fonts
  base.css            typography, menu, buttons, footer
  components.css      cards, breadcrumbs, filters
  figure.css          the interactive patent figure
  pages.css           per-page layout
js/
  config.js           your text and settings
  data/fields.js      the three fields
  data/videos.js      the episodes
  core/               engine (utils, scene, figure-sheet, components, router)
  scenes/             canvas animations per field
  figures/            patent figures per field
  pages/              home, field, library, episode, about, contact, not-found
```

## Add an episode

Copy one block in `js/data/videos.js` and change the values:

```js
{ slug:"transistor", f:"ee", title:"How does a tiny switch amplify a signal?",
  patent:"US 2,524,035", pt:"Three-electrode circuit element utilizing semiconductive materials",
  who:"J. Bardeen, W. Brattain", yr:1950, youtube:"",
  blurb:"One or two sentences shown on the episode page.",
  qs:["First question?","Second question?","Third question?"] },
```

- `f` is the field: `"ph"`, `"ee"` or `"cs"`.
- `slug` becomes the page address (`#ep-transistor`). Use letters, numbers and dashes only.
- Once the video is on YouTube, put its ID in `youtube` (the part after `watch?v=`). The episode page will then play it.

## Pages and addresses

`#home`, `#physics`, `#electrical`, `#computing`, `#library`, `#about`, `#contact`, and `#ep-<slug>` for each episode.

## Put it online (free)

Pick any one:

- **Netlify:** go to app.netlify.com/drop and drag this whole folder onto the page.
- **Cloudflare Pages:** create a project, choose "Upload assets", and upload this folder.
- **GitHub Pages:** push this folder to a repository and turn on Pages in its settings.

A custom domain costs about $10–15 a year and can be added in any of them.

## Notes

- Scripts load in the order listed at the bottom of `index.html`. Keep `js/core/router.js` last.
- Every file adds itself to one shared object, `window.GI`. That lets the site work when opened straight from your disk, without a local server.
- Keep the site about the inventions. Avoid wording that offers patent services or represents anyone.
