# Phase 2: Cinematic hybrid concept demo

This branch prototypes an abstract gold portal transforming into a conceptual luxury salon for Bhanu's The Hair Studio. The real salon's actual architecture has **not** been verified. This is a proposal, not a factual reconstruction or a final 4K Blender render.

## Changes
- Adds sculptural gold architectural arcs to the existing Three.js portal.
- Adds a GSAP + ScrollTrigger timeline that drives the existing Three.js camera progress via `window.applyTourProgress`.
- Adds a cinematic image plate from the existing `public/assets/img-01.jpg` to hide the heaviest portal-to-salon reveal.
- Adds chapter labels, a scroll progress bar, a skip-intro link, and reduced-motion CSS.
- Keeps the current Three.js scene, six-service showcase, tunnel, and existing WhatsApp booking form unchanged functionally.
- The AI feature pull request is not part of this branch.

## Try it locally
```bash
npm ci
npm run dev
npm run build
```

Check the hero at 0%, 12%, 27%, 48%, 66%, 88%, and 100% scroll progress, then reverse-scroll all the way to the top. Check `#showcase`, `#services`, `#book`, WhatsApp submit behavior and mobile layout. Test reduced motion and WebGL-disabled behavior.

## Next steps before merging
- Run a production build and real browser tests (not possible from the repository connector alone).
- Validate GSAP installation / lockfile, refine load timings and asset sizing.
- Replace the conceptual image plate with licensed production renders from Blender.
- Profile desktop and mobile FPS. Add adaptive render quality and a poster fallback where needed.
- Confirm the salon's phone number before live launch (current booking number is a placeholder).
