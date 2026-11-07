# Bhanu's cinematic concept demo — implementation handoff

**Status:** Client-presentation prototype. The interactive experience is coded; actual 4K Blender image/video assets are **not bundled**, and real-device visual performance has not been verified.

This branch advances the earlier Phase 2 prototype. No AI or OpenAI API is present. The site is a conceptual artistic proposal, **not** an accurate model of Bhanu's real shop.

## Current experience
- Multi-ring metallic gateway and floating architectural crown in Three.js
- GSAP ScrollTrigger scroll clock with reversible camera journey
- Four editorial acts: form, passage, salon reveal, invitation
- Transition plate between abstract portal and the conceptual 3D studio
- More detailed salon: lighting coves, brass inlays, product shelves and reception console
- Existing service showcase, service tunnel, gallery, bridal section and WhatsApp booking retained
- Adaptive renderer quality, device pixel ratio and shadow budgets
- Reduced-motion and skip-intro support

## Run the feature branch locally

```bash
git fetch origin
git switch feature/cinematic-concept-complete
npm ci
npm run dev
```

Then open http://localhost:5173 and scroll through the hero. Test the reverse-scroll experience as well. Run `npm run build` before showing publicly.

## Optional 4K render pipeline

Blender 4.x and a powerful workstation are needed to produce the production renders; neither Blender nor the rendered image sequences are included in this Git repository.

Still renders (3840×2160):
```bash
blender -b --python scripts/render_4k_concept.py
```

Image sequence (render time and disk usage can be substantial):
```bash
blender -b --python scripts/render_4k_concept.py -- --frames 96 --samples 96
```

Use FFmpeg to optimize the salon still for the website:
```bash
ffmpeg -y -i renders/salon_4k.png -c:v libwebp -quality 86 -compression_level 6 public/assets/salon-concept-4k.webp
```

The site automatically prefers `public/assets/salon-concept-4k.webp` when present, falling back to the original existing salon reference image if absent. This is a still image bridge: the interactive portal and salon scenes remain real-time Three.js.

For editing or review, frames may also be assembled into a non-interactive cinematic video:
```bash
ffmpeg -framerate 24 -i renders/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 19 -movflags +faststart cinematic-reference.mp4
```

**Important:** Video playback is not wired into the live scroll experience; it is only a deliverable for art direction and review. Native 4K real-time rendering is not forced on all devices.

## Review checklist before merge

1. Run `npm ci` and `npm run build` successfully.
2. On desktop, confirm the portal, story captions, photo reveal, Three.js salon, and final CTA are visible.
3. Reverse scroll through every chapter and check that the camera and DOM overlays unwind without a jump.
4. On mobile, test touch scroll, skip-intro, nav links, service tunnel arrows, and booking form.
5. With reduced motion enabled, verify an accessible non-animated path through the content.
6. Test WebGL unavailable / disabled scenarios and verify useful navigation remains.
7. Test `#services` tabs, `#showcase` interactions, `#bridal`, and WhatsApp booking requests.
8. Replace the sample phone number, opening hours and rate card before any live public launch. Confirm use rights for reference photographs.
9. Profile Core Web Vitals, request waterfalls, GPU memory and animation FPS on target hardware.

No automatic merge or deployment should be performed before client approval and device QA.
