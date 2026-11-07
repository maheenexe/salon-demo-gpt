# Bhanu's Photoreal Cinematic Concept

This is a **fictional premium salon concept** created as a client presentation. It does not depict the actual interior of Bhanu's The Hair Studio.

## What changed
- Two original, rendered **photographic-style salon visuals** in `public/assets/photoreal/`, optimized as 1920 × 1080 WebP files (~100 KB each).
- A cinematic scene layer crossfades between the original portal and salon imagery on the existing GSAP ScrollTrigger timeline.
- A subtle dolly, crossfade, and parallax motion produces a continuous scroll-controlled journey.
- Real HTML typography, navigation, and links overlay the artwork, so booking remains interactive.
- The original Three.js portal and service showcase remain in the project. They are **not** presented as physically photorealistic 3D assets.
- Desktop, mobile, and reduced-motion styling are supplied, with graceful fallback to the existing rendered concept asset.

## Important distinctions
The two rendered photos are **not native 4K**: the source artwork is 1672 × 941 and the website WebP plates are 1920 × 1080. They are original visuals prepared for a premium appearance and fast web loading. They are **still images**, animated with GSAP in 2.5D, not a full 4K camera-tracked Blender sequence.

For a truly explorable photorealistic 3D environment or 4K video, future production must create detailed meshes, textures, lighting and multiple matching camera frames.

## Run and review
```bash
git fetch origin
git switch feature/photoreal-luxury-salon
npm ci
npm run dev
```

Open http://localhost:5173/ and scroll through the first section. Use the Skip Intro link if needed. Test desktop, mobile, reverse scrolling, the service sections, and the WhatsApp booking form.

The business phone number `919876543210` and some pricing/hours are sample values and **must be confirmed before public launch**. No AI assistant is included.

## Technical files
- `public/assets/photoreal/portal-to-studio.webp` — first original photoreal plate.
- `public/assets/photoreal/luxury-salon.webp` — second original photoreal plate.
- `src/styles/photoreal.css` — overlays, typography placement and mobile/reduced-motion styles.
- `src/experience/cinematic.js` — image asset readiness and GSAP scene transitions.
- `scripts/preview-smoke.mjs` — verifies asset HTTP responses and scene reveal.

The existing booking and services JavaScript was not replaced.
