# Matrix Salon — Website Project

Static website for **Matrix Salon, Indore**, structured like a normal Vite project.

## Run it

Node.js LTS required (https://nodejs.org).

```bash
npm install     # first time only
npm run dev     # → http://localhost:5173
npm run build   # production build into dist/
npm run preview # preview the production build on :5173
```

No Live Server needed — `npm run dev` is the way to run it locally.

## Structure

```
matrix-salon/
├── index.html            # entry point (portal intro → shutter → 3D tour → wall → tunnel → booking)
├── package.json          # scripts: dev (port 5173), build, preview
├── vite.config.js        # Vite config (port 5173, relative base for any host)
├── jsconfig.json         # VS Code JS settings
├── public/               # files served/copied as-is
│   ├── favicon.svg
│   ├── assets/           # salon renders & photos (img-01…06.jpg)
│   └── js/               # classic scripts, loaded in this order
│       ├── vendor-three.js   # bundled Three.js library (do not edit)
│       ├── core.js           # error box, tabs, reveal-on-scroll, booking form
│       ├── tour.js           # portal intro, shutter lift, mirror chips, scroll tour
│       ├── scene.js          # Three.js salon: room, stations, gold dust, camera path
│       ├── showcase.js       # 3D Showcase wall (self-contained)
│       └── tunnel.js         # service tunnel carousel (self-contained)
└── src/
    └── styles/           # CSS, bundled by Vite — keep this <link> order in index.html
        ├── base.css          # fonts, 3D canvas, nav
        ├── hero.css          # scroll tour / hero, shutter, portal, mirror menu
        ├── sections.css      # content sections, services, cards, bridal, gallery, booking
        ├── tunnel.css        # service tunnel
        └── showcase.css      # 3D showcase wall
```

Why `public/js` and `src/styles`? The site uses classic (non-module) scripts, which
Vite serves as-is from `public/`; the stylesheets are bundled from `src/styles/`.
Keep the `<script>` order in `index.html` — the files share globals in that order.

## Deploy

- **Vercel:** import this folder; build command `npm run build`, output `dist`.
- **Netlify:** `npm run build`, upload `dist/` (or drag the folder, build `npm run build`).
- **Any static host:** upload the contents of `dist/` after `npm run build`.

## Notes

- Prices, phone number and opening hours are placeholders — search for
  "placeholder" in `index.html` and `public/js/*.js` and replace with the real ones.
- Booking sends the visitor to WhatsApp (wa.me link) with a pre-filled message.


## Cinematic client-demo branch

The `feature/cinematic-concept-complete` branch contains a scroll-directed luxury salon concept, updated Three.js portal and studio architecture, GSAP storytelling, responsive polish, and adaptive rendering. See [CINEMATIC_HANDOFF.md](CINEMATIC_HANDOFF.md) for how to preview it, generate optional 4K Blender assets, and test before merging. This is a **concept visualization**, not verified photography or a model of the actual studio. No AI features are included.
